"use client";

import { Loader2, LocateFixed, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useOptimistic, useState, useTransition } from "react";

const BUDGETS = [
  { label: "Econômico", value: "1" },
  { label: "Médio", value: "2" },
  { label: "Caprichado", value: "3" },
];

/** Ajustes rápidos em chips: cada toque já refaz o ranking, sem formulário. */
export function QuickPrefs({
  color,
  cuisines,
  occasion,
}: {
  color: string;
  /** Tipos de comida que existem nesta ocasião, com quantos lugares. */
  cuisines: { slug: string; label: string; emoji: string; count: number }[];
  occasion: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [optimistic, setOptimistic] = useOptimistic(params.toString());
  const [pending, startTransition] = useTransition();
  const [locating, setLocating] = useState(false);
  const current = new URLSearchParams(optimistic);
  const accent = occasion === "tudo" ? "#0b0b0c" : color;

  function update(changes: Record<string, string | null>) {
    const next = new URLSearchParams(optimistic);
    for (const [k, v] of Object.entries(changes)) {
      if (v == null) next.delete(k);
      else next.set(k, v);
    }
    startTransition(() => {
      setOptimistic(next.toString());
      router.replace(`${pathname}?${next}`, { scroll: false });
    });
  }

  function toggleNear() {
    if (current.has("lat")) return update({ lat: null, lng: null });
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        update({ lat: pos.coords.latitude.toFixed(4), lng: pos.coords.longitude.toFixed(4) });
      },
      () => setLocating(false),
      { timeout: 8000, maximumAge: 600_000 },
    );
  }

  const chip = (active: boolean) =>
    `press flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2.5 text-sm font-semibold transition-colors duration-200 ${
      active ? "border-transparent text-white" : "border-line bg-white text-foreground"
    }`;
  const style = (active: boolean) => (active ? { background: accent } : undefined);

  const budget = current.get("b");
  const cuisine = current.get("c");
  const noCover = current.get("nc") === "1";
  const near = current.has("lat");
  const extra = ["p", "n", "t"].filter((k) => current.has(k)).length;
  const filterHref = `/buscar?${new URLSearchParams({ ...Object.fromEntries(current), o: occasion })}`;

  return (
    <div className="relative space-y-2.5" aria-busy={pending}>
      {cuisines.length > 1 && (
        <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5" aria-label="Tipo de comida">
          <button className={chip(!cuisine)} style={style(!cuisine)} aria-pressed={!cuisine} onClick={() => update({ c: null })}>
            Qualquer comida
          </button>
          {cuisines.map((c) => (
            <button
              key={c.slug}
              className={chip(cuisine === c.slug)}
              style={style(cuisine === c.slug)}
              aria-pressed={cuisine === c.slug}
              onClick={() => update({ c: cuisine === c.slug ? null : c.slug })}
            >
              <span aria-hidden>{c.emoji}</span> {c.label}
            </button>
          ))}
        </div>
      )}
      <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5">
        <Link href={filterHref} transitionTypes={["nav-forward"]} className={chip(extra > 0)} style={style(extra > 0)}>
          <SlidersHorizontal className="size-4" strokeWidth={2.4} /> Filtros{extra > 0 ? ` · ${extra}` : ""}
        </Link>
        {BUDGETS.map((b) => (
          <button
            key={b.value}
            className={chip(budget === b.value)}
            style={style(budget === b.value)}
            aria-pressed={budget === b.value}
            onClick={() => update({ b: budget === b.value ? null : b.value })}
          >
            {b.label}
          </button>
        ))}
        <button className={chip(noCover)} style={style(noCover)} aria-pressed={noCover} onClick={() => update({ nc: noCover ? null : "1" })}>
          Sem couvert
        </button>
        <button className={chip(near)} style={style(near)} aria-pressed={near} onClick={toggleNear}>
          {locating ? <Loader2 className="size-4 animate-spin" /> : <LocateFixed className="size-4" strokeWidth={2.4} />}
          Perto de mim
        </button>
      </div>
      {pending && (
        <span className="absolute -bottom-7 left-0 flex items-center gap-1.5 text-xs font-semibold text-muted">
          <Loader2 className="size-3.5 animate-spin" /> Recalculando…
        </span>
      )}
    </div>
  );
}
