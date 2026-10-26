"use client";

import { Loader2, LocateFixed, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useOptimistic, useState, useTransition } from "react";
import { BUDGET_OPTIONS } from "@/lib/occasions";

/** Ajustes rápidos em chips: cada toque já refaz o ranking, sem formulário. */
export function QuickPrefs({ occasion }: { occasion: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [optimistic, setOptimistic] = useOptimistic(params.toString());
  const [pending, startTransition] = useTransition();
  const [locating, setLocating] = useState(false);
  const current = new URLSearchParams(optimistic);

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
    `press flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-medium transition-colors duration-200 ${
      active ? "border-foreground bg-foreground text-background" : "border-line bg-surface text-foreground"
    }`;

  const budget = current.get("b");
  const noCover = current.get("nc") === "1";
  const quiet = current.get("q") === "1";
  const near = current.has("lat");
  const extra = ["p", "n", "t"].filter((k) => current.has(k)).length;
  const filterHref = `/buscar?${new URLSearchParams({ ...Object.fromEntries(current), o: occasion })}`;

  return (
    <div className="relative" aria-busy={pending}>
      <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5">
        <Link href={filterHref} transitionTypes={["nav-forward"]} className={chip(extra > 0)}>
          <SlidersHorizontal className="size-3.5" strokeWidth={1.5} /> Filtros{extra > 0 ? ` · ${extra}` : ""}
        </Link>
        {BUDGET_OPTIONS.map((b) => (
          <button
            key={b.value}
            className={chip(budget === b.value)}
            aria-pressed={budget === b.value}
            onClick={() => update({ b: budget === b.value ? null : b.value })}
          >
            {b.label}
          </button>
        ))}
        <button className={chip(noCover)} aria-pressed={noCover} onClick={() => update({ nc: noCover ? null : "1" })}>
          Sem couvert
        </button>
        <button className={chip(quiet)} aria-pressed={quiet} onClick={() => update({ q: quiet ? null : "1" })}>
          Dá pra conversar
        </button>
        <button className={chip(near)} aria-pressed={near} onClick={toggleNear}>
          {locating ? <Loader2 className="size-3.5 animate-spin" /> : <LocateFixed className="size-3.5" strokeWidth={1.5} />}
          Perto de mim
        </button>
      </div>
      {pending && (
        <span className="absolute -bottom-6 left-0 flex items-center gap-1.5 text-xs font-medium text-muted">
          <Loader2 className="size-3.5 animate-spin" /> Recalculando…
        </span>
      )}
    </div>
  );
}
