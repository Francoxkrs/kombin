"use client";

import { ArrowRight, Check } from "lucide-react";
import { animate, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { rankPlaces } from "@/lib/match";
import { ANY_OCCASION, getOccasion, OCCASIONS, PARTY_OPTIONS, type Party } from "@/lib/occasions";
import type { Tag } from "@/lib/tags";
import type { Place, PlaceSignals, SpendBand } from "@/lib/types";

interface State {
  o: string;
  c: string;
  b: string;
  p: string;
  n: string;
  t: string[];
  nc: boolean;
}

const BUDGETS = [
  { value: "1", label: "até R$ 40" },
  { value: "2", label: "R$ 40–80" },
  { value: "3", label: "R$ 80–150" },
  { value: "4", label: "R$ 150+" },
];

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

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-line py-6">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-[1.08rem] font-extrabold tracking-[-0.02em]">{title}</h2>
        {hint && <span className="text-xs text-muted">{hint}</span>}
      </div>
      {children}
    </section>
  );
}

/** Busca completa (o "formulário" dos protótipos), em chips de um toque com contagem ao vivo. */
export function SearchForm({
  places,
  signals,
  neighborhoods,
  cuisines,
  tags,
  initial,
}: {
  places: Place[];
  signals: [string, PlaceSignals][];
  neighborhoods: string[];
  cuisines: { slug: string; label: string; emoji: string }[];
  tags: Tag[];
  initial: State;
}) {
  const router = useRouter();
  const [s, setS] = useState<State>(initial);
  const signalMap = useMemo(() => new Map(signals), [signals]);
  const set = (patch: Partial<State>) => setS((prev) => ({ ...prev, ...patch }));
  const toggle = (k: "o" | "c" | "b" | "p" | "n", v: string) => set({ [k]: s[k] === v ? "" : v });

  const occasion = getOccasion(s.o) ?? ANY_OCCASION;
  const results = useMemo(
    () =>
      rankPlaces(places, signalMap, occasion, {
        cuisine: s.c || undefined,
        budget: s.b ? (Number(s.b) as SpendBand) : undefined,
        party: (s.p || undefined) as Party | undefined,
        neighborhood: s.n || undefined,
        tags: s.t.length ? s.t : undefined,
        noCover: s.nc,
      }),
    [places, signalMap, occasion, s],
  );
  const filled = [s.o, s.c, s.b, s.p, s.n].filter(Boolean).length + s.t.length + (s.nc ? 1 : 0);

  function submit() {
    const q = new URLSearchParams();
    if (s.c) q.set("c", s.c);
    if (s.b) q.set("b", s.b);
    if (s.p) q.set("p", s.p);
    if (s.n) q.set("n", s.n);
    if (s.t.length) q.set("t", s.t.join(","));
    if (s.nc) q.set("nc", "1");
    router.push(`/o/${occasion.slug}${q.size ? `?${q}` : ""}`, { transitionTypes: ["nav-forward"] });
  }

  const chip = (active: boolean) =>
    `press flex items-center gap-1.5 rounded-full border px-4 py-2.5 text-[0.92rem] font-semibold transition-colors duration-200 ${
      active ? "border-foreground bg-foreground text-white" : "border-line bg-white"
    }`;

  return (
    <>
      <main className="flex-1 px-5 pb-48">
        <h1 className="rise display mt-3 text-[2.6rem]">O que combina com você hoje?</h1>
        <p className="rise mt-2 text-[1.05rem] text-muted" style={{ "--i": 1 } as React.CSSProperties}>
          Preencha só o que importa pra você.
        </p>
        <p className="rise mt-1 mb-4 text-sm text-muted" style={{ "--i": 2 } as React.CSSProperties}>
          Campo Grande, MS
        </p>

        <Section title="Ocasião">
          <div className="flex flex-wrap gap-2">
            {OCCASIONS.map((o) => (
              <button
                key={o.slug}
                className={chip(s.o === o.slug)}
                style={s.o === o.slug ? { background: o.color, borderColor: o.color } : undefined}
                aria-pressed={s.o === o.slug}
                onClick={() => toggle("o", o.slug)}
              >
                <span aria-hidden>{o.emoji}</span> {o.short}
              </button>
            ))}
          </div>
        </Section>

        {cuisines.length > 0 && (
          <Section title="Culinária">
            <div className="grid grid-cols-3 gap-2">
              {cuisines.map((c) => {
                const on = s.c === c.slug;
                return (
                  <button
                    key={c.slug}
                    onClick={() => toggle("c", c.slug)}
                    aria-pressed={on}
                    className={`press relative flex flex-col items-center gap-1 rounded-2xl border px-2 py-3 text-center text-[13px] leading-tight font-semibold transition-colors ${
                      on ? "border-foreground bg-foreground text-white" : "border-line bg-white"
                    }`}
                  >
                    <span className="text-[1.7rem]" aria-hidden>
                      {c.emoji}
                    </span>
                    {c.label}
                  </button>
                );
              })}
            </div>
          </Section>
        )}

        <Section title="Quantas pessoas">
          <div className="grid grid-cols-3 gap-1 rounded-2xl bg-soft p-1">
            {PARTY_OPTIONS.map((o) => (
              <button
                key={o.value}
                onClick={() => toggle("p", o.value)}
                aria-pressed={s.p === o.value}
                className="relative rounded-xl py-3 text-[0.92rem] font-bold"
              >
                {s.p === o.value && (
                  <motion.span layoutId="party" className="absolute inset-0 rounded-xl bg-white shadow-sm" transition={{ type: "spring", stiffness: 500, damping: 40 }} />
                )}
                <span className="relative">{o.label}</span>
              </button>
            ))}
          </div>
        </Section>

        <Section title="Orçamento por pessoa">
          <div className="grid grid-cols-2 gap-1 rounded-2xl bg-soft p-1">
            {BUDGETS.map((o) => (
              <button
                key={o.value}
                onClick={() => toggle("b", o.value)}
                aria-pressed={s.b === o.value}
                className="relative rounded-xl py-3 text-[0.92rem] font-bold"
              >
                {s.b === o.value && (
                  <motion.span layoutId="budget" className="absolute inset-0 rounded-xl bg-white shadow-sm" transition={{ type: "spring", stiffness: 500, damping: 40 }} />
                )}
                <span className="relative">{o.label}</span>
              </button>
            ))}
          </div>
          <label className="mt-3 flex items-center justify-between rounded-2xl border border-line px-4 py-3.5">
            <span className="font-semibold">Sem couvert</span>
            <button
              role="switch"
              aria-checked={s.nc}
              onClick={() => set({ nc: !s.nc })}
              className={`relative h-7 w-12 rounded-full transition-colors ${s.nc ? "bg-match" : "bg-line"}`}
            >
              <motion.span
                className="absolute top-1 left-1 size-5 rounded-full bg-white shadow"
                animate={{ x: s.nc ? 20 : 0 }}
                transition={{ type: "spring", stiffness: 600, damping: 35 }}
              />
            </button>
          </label>
        </Section>

        {neighborhoods.length > 1 && (
          <Section title="Região / bairro">
            <div className="flex flex-wrap gap-2">
              {neighborhoods.slice(0, 14).map((n) => (
                <button key={n} className={chip(s.n === n)} aria-pressed={s.n === n} onClick={() => toggle("n", n)}>
                  {n}
                </button>
              ))}
            </div>
          </Section>
        )}

        {tags.length > 0 && (
          <Section title="Ambiente e estrutura" hint="pode marcar vários">
            <div className="flex flex-wrap gap-2">
              {tags.map((t) => {
                const on = s.t.includes(t.slug);
                return (
                  <button
                    key={t.slug}
                    className={chip(on)}
                    aria-pressed={on}
                    onClick={() => set({ t: on ? s.t.filter((x) => x !== t.slug) : [...s.t, t.slug] })}
                  >
                    {on ? <Check className="size-4" strokeWidth={3} /> : <span aria-hidden>{t.emoji}</span>} {t.label}
                  </button>
                );
              })}
            </div>
          </Section>
        )}
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md bg-gradient-to-t from-white via-white/95 to-transparent px-5 pt-10 pb-[max(5.6rem,calc(env(safe-area-inset-bottom)+5rem))]">
        <button
          onClick={submit}
          disabled={results.length === 0}
          className="press flex w-full items-center justify-center gap-2 rounded-[1.2rem] bg-foreground py-4 text-[1.02rem] font-bold text-white shadow-[0_18px_40px_-18px_rgba(0,0,0,0.7)] disabled:opacity-40"
        >
          {results.length === 0 ? (
            "Nenhum lugar com tudo isso"
          ) : (
            <>
              <span>
                Ver <Count value={results.length} /> {results.length === 1 ? "lugar" : "lugares"}
              </span>
              <ArrowRight className="size-5" strokeWidth={2.6} />
            </>
          )}
        </button>
        <p className="mt-2 flex items-center justify-center gap-3 text-xs text-muted">
          Somente os filtros preenchidos entram na busca.
          {filled > 0 && (
            <button onClick={() => setS({ o: "", c: "", b: "", p: "", n: "", t: [], nc: false })} className="font-bold text-foreground underline">
              Limpar ({filled})
            </button>
          )}
        </p>
      </div>
    </>
  );
}
