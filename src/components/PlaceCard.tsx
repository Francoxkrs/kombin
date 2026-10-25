import Link from "next/link";
import type { MatchResult } from "@/lib/match";
import type { Occasion } from "@/lib/occasions";
import { SPEND_LABELS } from "@/lib/occasions";
import { PlaceImage } from "./PlaceImage";

export function MatchBadge({ compat, size = "md" }: { compat: number; size?: "md" | "lg" }) {
  return (
    <div className="text-right leading-none">
      <div className={`font-bold tracking-tight text-match ${size === "lg" ? "text-4xl" : "text-2xl"}`}>
        {compat}%
      </div>
      <div className="mt-1 text-[11px] font-semibold tracking-wide text-match uppercase">combina</div>
    </div>
  );
}

export function Reasons({ reasons, warning }: { reasons: string[]; warning: string | null }) {
  return (
    <ul className="space-y-1.5 text-sm">
      {reasons.map((r) => (
        <li key={r} className="flex gap-2">
          <span className="font-bold text-match" aria-hidden>
            ✓
          </span>
          {r}
        </li>
      ))}
      {warning && (
        <li className="flex gap-2 text-muted">
          <span aria-hidden>!</span>
          {warning}
        </li>
      )}
    </ul>
  );
}

export function PlaceCard({
  result,
  occasion,
  rank,
}: {
  result: MatchResult;
  occasion: Occasion;
  rank: number;
}) {
  const { place } = result;
  const spend = result.spend ? SPEND_LABELS[Math.round(result.spend)] : null;
  return (
    <Link
      href={`/l/${place.id}?o=${occasion.slug}`}
      className="animate-rise block overflow-hidden rounded-3xl bg-surface shadow-[0_1px_0_var(--line),0_12px_32px_-18px_rgba(0,0,0,0.35)]"
      style={{ animationDelay: `${rank * 70}ms` }}
    >
      <div className="relative">
        <PlaceImage
          placeId={place.id}
          name={place.name}
          coverUrl={place.coverUrl}
          hasGoogle={!!place.googlePlaceId}
          color={occasion.color}
          className="aspect-[4/3] w-full"
        />
        {rank === 0 && (
          <span className="absolute top-3 left-3 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold">
            Top match
          </span>
        )}
      </div>
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-xl font-bold tracking-tight">{place.name}</h3>
            <p className="truncate text-sm text-muted">
              {[place.category, place.neighborhood, spend].filter(Boolean).join(" · ")}
            </p>
          </div>
          <MatchBadge compat={result.compat} />
        </div>
        <Reasons reasons={result.reasons} warning={result.warning} />
      </div>
    </Link>
  );
}
