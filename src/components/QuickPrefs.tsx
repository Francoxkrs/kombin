"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

const BUDGETS = [
  { label: "Econômico", value: "1" },
  { label: "Médio", value: "2" },
  { label: "Caprichado", value: "3" },
];

/** Ajustes opcionais em chips, sem formulário: cada toque já refaz o ranking. */
export function QuickPrefs({
  color,
  cuisines,
}: {
  color: string;
  /** Tipos de comida que existem nesta ocasião, com quantos lugares. */
  cuisines: { slug: string; label: string; count: number }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [locating, setLocating] = useState(false);

  function update(changes: Record<string, string | null>) {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(changes)) {
      if (v == null) next.delete(k);
      else next.set(k, v);
    }
    startTransition(() => router.replace(`${pathname}?${next}`, { scroll: false }));
  }

  function toggleNear() {
    if (params.has("lat")) return update({ lat: null, lng: null });
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
    `shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition active:scale-95 ${
      active ? "text-white" : "border-line bg-surface"
    }`;
  const activeStyle = (active: boolean) => (active ? { background: color, borderColor: color } : undefined);

  const budget = params.get("b");
  const cuisine = params.get("c");
  const noCover = params.get("nc") === "1";
  const near = params.has("lat");

  return (
    <div className={`space-y-2 ${pending ? "opacity-60" : ""}`} aria-busy={pending}>
      {cuisines.length > 1 && (
        <div
          className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none]"
          aria-label="Tipo de comida"
        >
          <button
            className={chip(!cuisine)}
            style={activeStyle(!cuisine)}
            aria-pressed={!cuisine}
            onClick={() => update({ c: null })}
          >
            Qualquer comida
          </button>
          {cuisines.map((c) => (
            <button
              key={c.slug}
              className={chip(cuisine === c.slug)}
              style={activeStyle(cuisine === c.slug)}
              aria-pressed={cuisine === c.slug}
              onClick={() => update({ c: cuisine === c.slug ? null : c.slug })}
            >
              {c.label}
            </button>
          ))}
        </div>
      )}
      <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none]">
        {BUDGETS.map((b) => (
          <button
            key={b.value}
            className={chip(budget === b.value)}
            style={activeStyle(budget === b.value)}
            aria-pressed={budget === b.value}
            onClick={() => update({ b: budget === b.value ? null : b.value })}
          >
            {b.label}
          </button>
        ))}
        <button
          className={chip(noCover)}
          style={activeStyle(noCover)}
          aria-pressed={noCover}
          onClick={() => update({ nc: noCover ? null : "1" })}
        >
          Sem couvert
        </button>
        <button className={chip(near)} style={activeStyle(near)} aria-pressed={near} onClick={toggleNear}>
          {locating ? "Localizando…" : "Perto de mim"}
        </button>
      </div>
    </div>
  );
}
