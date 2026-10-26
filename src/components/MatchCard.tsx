import { Check, ChevronRight, MapPin, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { ViewTransition } from "react";
import { cuisineLabel } from "@/lib/cuisines";
import type { MatchResult } from "@/lib/match";
import { type Occasion, spendTypical } from "@/lib/occasions";
import { photoSrc } from "@/lib/photos";
import { getTag } from "@/lib/tags";
import { CompatBadge } from "./ui/CompatNumber";
import { Photo } from "./ui/Photo";
import { SaveButton } from "./ui/SaveButton";

/** Card do ranking ("Para o seu momento"): foto, índice, motivos e o que bate com os filtros. */
export function MatchCard({
  result,
  occasion,
  rank,
  saved,
  loggedIn,
}: {
  result: MatchResult;
  occasion: Occasion;
  rank: number;
  saved: boolean;
  loggedIn: boolean;
}) {
  const { place } = result;
  const href = `/l/${place.id}?o=${occasion.slug}`;
  const spend = spendTypical(result.spend);
  const tag = place.tags.map((t) => getTag(t)?.label).find(Boolean);

  return (
    <article
      className="rise relative overflow-hidden rounded-[1.75rem] bg-white shadow-[0_0_0_1px_var(--line),0_24px_48px_-32px_rgba(0,0,0,0.35)]"
      style={{ "--i": rank } as React.CSSProperties}
    >
      <Link href={href} transitionTypes={["nav-forward"]} className="relative block">
        <div>
          <ViewTransition name={`photo-${place.id}`} share="morph" default="none">
            <Photo
              src={photoSrc(place)}
              alt={`Foto de ${place.name}`}
              name={place.name}
              color={occasion.color}
              className="aspect-[4/3] w-full"
              eager={rank === 0}
            />
          </ViewTransition>
          <div className="absolute top-3 right-3 left-3 flex items-start justify-between">
            {rank === 0 ? (
              <span className="rounded-full bg-white px-3 py-1.5 text-xs font-extrabold shadow-sm">Top match</span>
            ) : place.featured ? (
              <span className="rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold shadow-sm">Destaque</span>
            ) : (
              <span className="rounded-full bg-black/55 px-3 py-1.5 text-xs font-bold text-white backdrop-blur">
                #{rank + 1}
              </span>
            )}
          </div>
        </div>

        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="display text-[1.75rem]">{place.name}</h3>
              {place.category && <p className="mt-1 truncate text-[1.05rem] text-muted">{place.category}</p>}
            </div>
            <CompatBadge value={result.compat} />
          </div>

          <div className="mt-3 space-y-1 text-[0.95rem] text-ink-2">
            <p className="truncate">
              {[place.cuisines.map(cuisineLabel).join(", "), tag].filter(Boolean).join(" · ")}
            </p>
            {place.neighborhood && (
              <p className="flex items-center gap-1.5">
                <MapPin className="size-4 shrink-0" strokeWidth={2.2} /> {place.neighborhood}
              </p>
            )}
            <p className="text-muted">
              Estimativa por pessoa: <b className="text-foreground">{spend ?? "não informado"}</b>
            </p>
          </div>

          {result.checks.length > 0 && (
            <div className="mt-4 border-t border-line pt-4">
              <p className="text-[0.95rem] font-bold">
                {result.filtersMatched > 0
                  ? `Atende ${result.filtersMatched === 1 ? "ao filtro escolhido" : `aos ${result.filtersMatched} filtros escolhidos`}`
                  : `Por que combina com ${occasion.slug === "tudo" ? "você" : occasion.short.toLowerCase()}`}
              </p>
              <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[0.9rem] text-ink-2">
                {result.checks.slice(0, 4).map((c) => (
                  <li key={c} className="flex items-start gap-1.5">
                    <Check className="mt-0.5 size-4 shrink-0 text-match" strokeWidth={3} />
                    <span className="min-w-0">{c}</span>
                  </li>
                ))}
              </ul>
              {result.warning && (
                <p className="mt-2 flex items-center gap-1.5 text-[0.85rem] text-amber-700">
                  <TriangleAlert className="size-4 shrink-0" strokeWidth={2.2} /> {result.warning}
                </p>
              )}
            </div>
          )}

          <p className="mt-4 flex items-center justify-end gap-0.5 text-[0.95rem] font-bold">
            Ver detalhes <ChevronRight className="size-4" strokeWidth={2.6} />
          </p>
        </div>
      </Link>
      <div className="absolute top-3 right-3">
        <SaveButton placeId={place.id} saved={saved} loggedIn={loggedIn} back={href} />
      </div>
    </article>
  );
}

/** Linha compacta (do 4º lugar em diante). */
export function MatchRow({ result, occasion, index }: { result: MatchResult; occasion: Occasion; index: number }) {
  const { place } = result;
  return (
    <Link
      href={`/l/${place.id}?o=${occasion.slug}`}
      transitionTypes={["nav-forward"]}
      className="press rise flex items-center gap-3.5 py-3"
      style={{ "--i": index } as React.CSSProperties}
    >
      <ViewTransition name={`photo-${place.id}`} share="morph" default="none">
        <Photo src={photoSrc(place)} alt="" name={place.name} color={occasion.color} className="size-[4.5rem] shrink-0 rounded-2xl" />
      </ViewTransition>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[1.05rem] font-extrabold tracking-[-0.02em]">{place.name}</p>
        <p className="truncate text-sm text-muted">
          {[place.cuisines.map(cuisineLabel)[0] ?? place.category, place.neighborhood].filter(Boolean).join(" · ")}
        </p>
        {result.reasons[0] && <p className="mt-0.5 truncate text-[13px] text-ink-2">✓ {result.reasons[0]}</p>}
      </div>
      <span className="display text-xl text-match">{result.compat}%</span>
    </Link>
  );
}
