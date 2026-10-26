"use client";

import { ArrowRight, Baby, MessagesSquare, RotateCcw, Ticket } from "lucide-react";
import { animate, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Glyph } from "@/components/ui/Glyph";
import { rankPlaces } from "@/lib/match";
import { ANY_OCCASION, BUDGET_OPTIONS, getOccasion, OCCASIONS, PARTY_OPTIONS, type Party } from "@/lib/occasions";
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
}

const EMPTY: State = { o: "", b: "", p: "", n: "", t: [], nc: false, q: false };

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

function Section({ title, accent, children }: { title: string; accent?: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-line py-6">
      <h2 className="mb-3 text-[0.95rem] font-semibold tracking-[-0.01em]">
        {title} {accent && <span className="accent text-[1.15em]">{accent}</span>}
      </h2>
      {children}
    </section>
  );
}

/** Seletor em trilho (uma opção por vez, com a pílula que desliza). */
function Segmented({
  id,
  options,
  value,
  onChange,
}: {
  id: string;
  options: readonly { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="grid gap-1 rounded-2xl border border-line bg-soft p-1" style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}>
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(value === o.value ? "" : o.value)}
          aria-pressed={value === o.value}
          className="relative rounded-xl px-1 py-3 text-xs font-medium"
        >
          {value === o.value && (
            <motion.span
              layoutId={id}
              className="absolute inset-0 rounded-xl bg-foreground shadow-sm"
              transition={{ type: "spring", stiffness: 500, damping: 40 }}
            />
          )}
          <span className={`relative transition-colors ${value === o.value ? "text-background" : "text-foreground"}`}>{o.label}</span>
        </button>
      ))}
    </div>
  );
}

function Toggle({
  icon,
  label,
  hint,
  on,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  hint: string;
  on: boolean;
  onChange: () => void;
}) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={onChange}
      className="press flex w-full items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3.5 text-left"
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-soft text-foreground">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{label}</span>
        <span className="block text-xs text-muted">{hint}</span>
      </span>
      <span className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${on ? "bg-foreground" : "bg-line"}`}>
        <motion.span
          className="absolute top-1 left-1 size-5 rounded-full bg-surface shadow"
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
  initial,
}: {
  places: Place[];
  signals: [string, PlaceSignals][];
  neighborhoods: string[];
  initial: State;
}) {
  const router = useRouter();
  const [s, setS] = useState<State>(initial);
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
      }),
    [places, signalMap, occasion, s],
  );
  const filled = [s.o, s.b, s.p, s.n].filter(Boolean).length + s.t.length + (s.nc ? 1 : 0) + (s.q ? 1 : 0);

  function submit() {
    const q = new URLSearchParams();
    if (s.b) q.set("b", s.b);
    if (s.p) q.set("p", s.p);
    if (s.n) q.set("n", s.n);
    if (s.t.length) q.set("t", s.t.join(","));
    if (s.nc) q.set("nc", "1");
    if (s.q) q.set("q", "1");
    router.push(`/o/${occasion.slug}${q.size ? `?${q}` : ""}`, { transitionTypes: ["nav-forward"] });
  }

  const chip = (active: boolean) =>
    `press flex items-center gap-2 rounded-full border px-4 py-2.5 text-xs font-medium transition-colors duration-200 ${
      active ? "border-foreground bg-foreground text-background" : "border-line bg-surface text-foreground"
    }`;

  return (
    <>
      <main className="flex-1 px-5 pb-36">
        <h1 className="rise mt-3 text-4xl leading-[1.05] font-bold tracking-tight">
          O que <span className="accent text-[1.12em]">combina</span> com você hoje?
        </h1>
        <p className="rise mt-2 mb-5 text-sm text-muted" style={{ "--i": 1 } as React.CSSProperties}>
          Preencha só o que importa. O resto a gente calcula.
        </p>

        <Section title="Qual é o" accent="momento?">
          <div className="flex flex-wrap gap-2">
            {OCCASIONS.map((o) => (
              <button
                key={o.slug}
                className={chip(s.o === o.slug)}
                aria-pressed={s.o === o.slug}
                onClick={() => set({ o: s.o === o.slug ? "" : o.slug })}
              >
                <Glyph name={o.icon} className="size-4" /> {o.short}
              </button>
            ))}
          </div>
        </Section>

        <Section title="Com quem você" accent="vai?">
          <Segmented id="party" options={PARTY_OPTIONS} value={s.p} onChange={(p) => set({ p })} />
        </Section>

        <Section title="Orçamento por" accent="pessoa">
          <Segmented id="budget" options={BUDGET_OPTIONS} value={s.b} onChange={(b) => set({ b })} />
        </Section>

        <Section title="O que não pode" accent="faltar">
          <div className="space-y-2">
            <Toggle
              icon={<Ticket className="size-[18px]" strokeWidth={1.5} />}
              label="Sem couvert artístico"
              hint="Só lugares que não cobram couvert"
              on={s.nc}
              onChange={() => set({ nc: !s.nc })}
            />
            <Toggle
              icon={<MessagesSquare className="size-[18px]" strokeWidth={1.5} />}
              label="Música ambiente · dá pra conversar"
              hint="Tira os lugares barulhentos"
              on={s.q}
              onChange={() => set({ q: !s.q })}
            />
            <Toggle
              icon={<Baby className="size-[18px]" strokeWidth={1.5} />}
              label="Espaço kids"
              hint="Bom pra ir com criança"
              on={kids}
              onChange={() => set({ t: kids ? s.t.filter((t) => t !== "criancas") : [...s.t, "criancas"] })}
            />
          </div>
        </Section>

        {neighborhoods.length > 1 && (
          <Section title="Região ou" accent="bairro">
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

      <div aria-hidden className="dock-scrim" />
      <div
        className="fixed left-1/2 z-40 w-[calc(100%-2.5rem)] max-w-[24rem] -translate-x-1/2"
        style={{ bottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
      >
        <div className="flex items-center gap-2">
          {filled > 0 && (
            <button
              onClick={() => setS(EMPTY)}
              aria-label={`Limpar ${filled} filtros`}
              className="press grid size-14 shrink-0 place-items-center rounded-full border border-line bg-surface shadow-lg"
            >
              <RotateCcw className="size-5" strokeWidth={1.5} />
            </button>
          )}
          <button
            onClick={submit}
            disabled={results.length === 0}
            className="press flex h-14 flex-1 items-center justify-center gap-2 rounded-full border border-white/10 bg-[#111111]/95 text-sm font-semibold text-white shadow-2xl backdrop-blur-xl disabled:opacity-50"
          >
            {results.length === 0 ? (
              "Nenhum lugar com tudo isso"
            ) : (
              <>
                <span>
                  Ver <Count value={results.length} /> {results.length === 1 ? "lugar" : "lugares"}
                </span>
                <ArrowRight className="size-[18px]" strokeWidth={1.5} />
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
