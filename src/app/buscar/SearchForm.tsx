"use client";

import { animate, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { BTN_IPE, BTN_QUIET, chip } from "@/components/ui/styles";
import { rankPlaces } from "@/lib/match";
import { searchLoginHref } from "@/lib/prefs";
import { CUISINES } from "@/lib/cuisines";
import { parseRequest } from "@/lib/nlq";
import { ANY_OCCASION, BUDGET_OPTIONS, getOccasion, OCCASIONS, PARTY_OPTIONS, type Party } from "@/lib/occasions";
import { TAGS } from "@/lib/tags";
import type { Place, PlaceSignals, SpendBand } from "@/lib/types";

interface State {
  o: string;
  b: string;
  p: string;
  n: string;
  /** Etiquetas obrigatórias (o "Espaço kids" é a etiqueta "criancas"). */
  t: string[];
  nc: boolean;
  q: boolean;
  /** Tipo de comida (slug de cuisines.ts). */
  c: string;
  /** "Perto de mim": posição só para ordenar, nunca gravada. */
  geo: { lat: number; lng: number } | null;
}

const EMPTY: State = { o: "", b: "", p: "", n: "", t: [], nc: false, q: false, c: "", geo: null };

/** Etiquetas que já têm interruptor próprio não se repetem em "Mais filtros". */
const MORE_TAGS = TAGS.filter((t) => t.slug !== "criancas");

function Count({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const last = useRef(value);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const c = animate(last.current, value, { duration: 0.4, onUpdate: (v) => (el.textContent = String(Math.round(v))) });
    last.current = value;
    return () => c.stop();
  }, [value]);
  return <span ref={ref}>{value}</span>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="pt-9">
      <h2 className="title mb-4 text-[28px]">{title}</h2>
      {children}
    </section>
  );
}

/** Uma opção por vez, em pílulas do mesmo tamanho. */
function Segmented({
  options,
  value,
  onChange,
}: {
  options: readonly { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}>
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(value === o.value ? "" : o.value)}
          aria-pressed={value === o.value}
          className={`press flex min-h-11 items-center justify-center rounded-full px-2 text-center text-[15px] leading-tight transition-colors duration-200 ${
            value === o.value ? "bg-foreground font-semibold text-background" : "bg-surface text-foreground"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Toggle({ label, hint, on, onChange }: { label: string; hint: string; on: boolean; onChange: () => void }) {
  return (
    <button role="switch" aria-checked={on} onClick={onChange} className="press flex w-full items-center gap-4 py-3 text-left">
      <span className="min-w-0 flex-1">
        <span className="block text-[17px] font-medium">{label}</span>
        <span className="block text-[15px] text-muted">{hint}</span>
      </span>
      <span className={`relative h-8 w-[52px] shrink-0 rounded-full transition-colors ${on ? "bg-ipe" : "bg-soft"}`}>
        <motion.span
          className={`absolute top-1 left-1 size-6 rounded-full ${on ? "bg-on-ipe" : "bg-muted"}`}
          animate={{ x: on ? 20 : 0 }}
          transition={{ type: "spring", stiffness: 600, damping: 35 }}
        />
      </span>
    </button>
  );
}

/** Filtros: momento, companhia, orçamento e o que decide. A contagem atualiza a cada toque. */
export function SearchForm({
  places,
  signals,
  neighborhoods,
  loggedIn,
  initial,
}: {
  places: Place[];
  signals: [string, PlaceSignals][];
  neighborhoods: string[];
  loggedIn: boolean;
  initial: Omit<State, "geo">;
}) {
  const router = useRouter();
  const [s, setS] = useState<State>({ ...initial, geo: null });
  const [phrase, setPhrase] = useState("");
  const [understood, setUnderstood] = useState<string[] | null>(null);
  const [geoError, setGeoError] = useState("");
  const [more, setMore] = useState(initial.c !== "" || initial.t.some((t) => t !== "criancas"));
  const signalMap = useMemo(() => new Map(signals), [signals]);
  const set = (patch: Partial<State>) => setS((prev) => ({ ...prev, ...patch }));
  const kids = s.t.includes("criancas");

  const occasion = getOccasion(s.o) ?? ANY_OCCASION;
  const results = useMemo(
    () =>
      rankPlaces(places, signalMap, occasion, {
        budget: s.b ? (Number(s.b) as SpendBand) : undefined,
        party: (s.p || undefined) as Party | undefined,
        neighborhood: s.n || undefined,
        tags: s.t.length ? s.t : undefined,
        noCover: s.nc,
        quiet: s.q,
        cuisine: s.c || undefined,
        origin: s.geo ?? undefined,
      }),
    [places, signalMap, occasion, s],
  );
  const filled =
    [s.o, s.b, s.p, s.n, s.c].filter(Boolean).length + s.t.length + (s.nc ? 1 : 0) + (s.q ? 1 : 0) + (s.geo ? 1 : 0);

  const toggleTag = (slug: string) => set({ t: s.t.includes(slug) ? s.t.filter((t) => t !== slug) : [...s.t, slug] });

  function locate() {
    if (s.geo) {
      set({ geo: null });
      return;
    }
    if (!navigator.geolocation) {
      setGeoError("Este navegador não informa a localização.");
      return;
    }
    setGeoError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        set({ geo: { lat: pos.coords.latitude, lng: pos.coords.longitude } });
      },
      () => setGeoError("Sem permissão de localização. Escolha um bairro no lugar."),
      { maximumAge: 300_000, timeout: 10_000 },
    );
  }

  /** Lê a frase e liga os filtros que ela pede, sem apagar o que já estava escolhido. */
  function applyPhrase(e: React.FormEvent) {
    e.preventDefault();
    const r = parseRequest(phrase, neighborhoods);
    setUnderstood(r.understood);
    setS((prev) => ({
      ...prev,
      o: r.occasion ?? prev.o,
      p: r.party ?? prev.p,
      b: r.budget ?? prev.b,
      n: r.neighborhood ?? prev.n,
      c: r.cuisine ?? prev.c,
      t: [...new Set([...prev.t, ...r.tags])],
      nc: prev.nc || r.noCover,
      q: prev.q || r.quiet,
    }));
    if (r.cuisine || r.tags.some((t) => t !== "criancas")) setMore(true);
    if (r.near && !s.geo) locate();
  }

  function submit() {
    const q = new URLSearchParams();
    if (s.b) q.set("b", s.b);
    if (s.p) q.set("p", s.p);
    if (s.n) q.set("n", s.n);
    if (s.t.length) q.set("t", s.t.join(","));
    if (s.nc) q.set("nc", "1");
    if (s.q) q.set("q", "1");
    if (s.c) q.set("c", s.c);
    if (s.geo) {
      q.set("lat", s.geo.lat.toFixed(4));
      q.set("lng", s.geo.lng.toFixed(4));
    }
    const to = `/o/${occasion.slug}${q.size ? `?${q}` : ""}`;
    // Monta os filtros à vontade; o login vem ao pedir os resultados, que voltam prontos depois.
    router.push(loggedIn ? to : searchLoginHref(to), { transitionTypes: ["nav-forward"] });
  }

  return (
    <>
      <main className="flex-1 px-5 pb-32">
        <h1 className="title mt-4 text-[48px]">O que vai ser hoje?</h1>
        <p className="mt-3 text-[17px] text-muted">Preencha só o que importa. O resto a gente calcula.</p>

        <form onSubmit={applyPhrase} className="mt-7">
          <label htmlFor="frase" className="text-[17px] font-medium">
            Fala do seu jeito
          </label>
          <div className="mt-2 flex gap-2">
            <input
              id="frase"
              value={phrase}
              onChange={(e) => setPhrase(e.target.value)}
              maxLength={200}
              enterKeyHint="search"
              placeholder="Ex.: jantar a dois tranquilo até 100 reais"
              className="h-14 min-w-0 flex-1 rounded-2xl bg-surface px-4 text-[16px] outline-none placeholder:text-muted focus:bg-soft focus:ring-2 focus:ring-ipe"
            />
            <button disabled={!phrase.trim()} className={BTN_QUIET}>
              Usar
            </button>
          </div>
          {understood && (
            <p className="mt-3 text-[15px] leading-snug text-muted" aria-live="polite">
              {understood.length === 0 ? (
                "Não entendi essa. Tente falar a ocasião, quanto quer gastar, o bairro ou o tipo de comida."
              ) : (
                <>
                  Entendi:{" "}
                  {understood.map((u, i) => (
                    <span key={u} className="text-foreground">
                      {u}
                      {i < understood.length - 1 ? ", " : "."}
                    </span>
                  ))}{" "}
                  Ajuste abaixo se precisar.
                </>
              )}
            </p>
          )}
        </form>

        <Section title="Ocasião">
          <div className="flex flex-wrap gap-2">
            {OCCASIONS.map((o) => (
              <button
                key={o.slug}
                className={chip(s.o === o.slug)}
                aria-pressed={s.o === o.slug}
                onClick={() => set({ o: s.o === o.slug ? "" : o.slug })}
              >
                {o.short}
              </button>
            ))}
          </div>
        </Section>

        <Section title="Quantas pessoas">
          <Segmented options={PARTY_OPTIONS} value={s.p} onChange={(p) => set({ p })} />
        </Section>

        <Section title="Quanto por pessoa">
          <Segmented options={BUDGET_OPTIONS} value={s.b} onChange={(b) => set({ b })} />
        </Section>

        <Section title="Não pode faltar">
          <Toggle label="Sem couvert" hint="Só lugares que não cobram couvert artístico" on={s.nc} onChange={() => set({ nc: !s.nc })} />
          <Toggle label="Dá pra conversar" hint="Tira os lugares barulhentos" on={s.q} onChange={() => set({ q: !s.q })} />
          <Toggle
            label="Espaço pra criança"
            hint="Bom pra ir com os pequenos"
            on={kids}
            onChange={() => toggleTag("criancas")}
          />
          <Toggle label="Perto de mim" hint="Os mais perto sobem na lista. Sua posição não é guardada." on={!!s.geo} onChange={() => locate()} />
          {geoError && <p className="pb-2 text-[14px] text-danger">{geoError}</p>}
        </Section>

        <section className="pt-9">
          <button
            onClick={() => setMore(!more)}
            aria-expanded={more}
            className="press flex h-11 w-full items-center justify-between text-left"
          >
            <span className="title text-[28px]">Mais filtros</span>
            <span className="text-[15px] text-muted">{more ? "Fechar" : "Comida, estrutura, pet..."}</span>
          </button>
          {more && (
            <div className="mt-4 space-y-6">
              <div>
                <h3 className="mb-3 text-[17px] font-medium">Tipo de comida</h3>
                <div className="flex flex-wrap gap-2">
                  {CUISINES.map((c) => (
                    <button key={c.slug} className={chip(s.c === c.slug)} aria-pressed={s.c === c.slug} onClick={() => set({ c: s.c === c.slug ? "" : c.slug })}>
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="mb-3 text-[17px] font-medium">A casa precisa ter</h3>
                <div className="flex flex-wrap gap-2">
                  {MORE_TAGS.map((t) => (
                    <button key={t.slug} className={chip(s.t.includes(t.slug))} aria-pressed={s.t.includes(t.slug)} onClick={() => toggleTag(t.slug)}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>

        {neighborhoods.length > 1 && (
          <Section title="Bairro">
            <div className="flex flex-wrap gap-2">
              {neighborhoods.slice(0, 14).map((n) => (
                <button key={n} className={chip(s.n === n)} aria-pressed={s.n === n} onClick={() => set({ n: s.n === n ? "" : n })}>
                  {n}
                </button>
              ))}
            </div>
          </Section>
        )}
      </main>

      <div className="fixed bottom-0 left-1/2 z-40 flex w-full max-w-md -translate-x-1/2 gap-2 bg-background px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {filled > 0 && (
          <button onClick={() => setS(EMPTY)} className={BTN_QUIET}>
            Limpar
          </button>
        )}
        <button onClick={submit} disabled={results.length === 0} className={`${BTN_IPE} flex-1`}>
          {results.length === 0 ? (
            "Nenhum lugar com tudo isso"
          ) : (
            <span>
              Ver <Count value={results.length} /> {results.length === 1 ? "lugar" : "lugares"}
            </span>
          )}
        </button>
      </div>
    </>
  );
}
