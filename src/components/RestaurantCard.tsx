import { Check } from "lucide-react";
import Link from "next/link";
import { ViewTransition } from "react";
import { cuisineLabel } from "@/lib/cuisines";
import type { MatchResult } from "@/lib/match";
import { spendTypical } from "@/lib/occasions";
import { photoSrc } from "@/lib/photos";
import { getTag } from "@/lib/tags";
import type { Place } from "@/lib/types";
import { CompatPill } from "./ui/CompatNumber";
import { Photo } from "./ui/Photo";
import { SaveButton } from "./ui/SaveButton";

/**
 * Card de restaurante: foto 16:10, selo de compatibilidade, nome e preço,
 * bairro e categoria, e até 3 motivos ("Por que combina com você?") em selos.
 */
export function RestaurantCard({
  place,
  compat,
  badges,
  spend,
  saved,
  loggedIn,
  href,
  index = 0,
  morph = true,
}: {
  place: Place;
  compat?: number;
  badges: string[];
  spend: number | null;
  saved: boolean;
  loggedIn: boolean;
  href?: string;
  index?: number;
  /** Liga a transição da foto para a página do lugar (só um card por lugar na tela). */
  morph?: boolean;
}) {
  const link = href ?? `/l/${place.id}`;
  const price = spendTypical(spend);
  const kind = place.category ?? place.cuisines.map(cuisineLabel)[0];
  const shown = badges.length ? badges : place.tags.map((t) => getTag(t)?.label).filter((l): l is string => !!l).slice(0, 3);
  const photo = (
    <Photo
      src={photoSrc(place)}
      alt={`Foto de ${place.name}`}
      name={place.name}
      className="aspect-[16/10] w-full"
      imgClassName="transition-[scale] duration-700 ease-out group-hover:scale-105"
      eager={index < 2}
    />
  );

  return (
    <article
      className="rise group relative overflow-hidden rounded-3xl border border-line bg-surface shadow-sm"
      style={{ "--i": index } as React.CSSProperties}
    >
      <Link href={link} transitionTypes={["nav-forward"]} className="block">
        {morph ? (
          <ViewTransition name={`photo-${place.id}`} share="morph" default="none">
            {photo}
          </ViewTransition>
        ) : (
          photo
        )}
        <div className="p-4">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="min-w-0 truncate text-lg font-bold tracking-[-0.02em] text-foreground">{place.name}</h3>
            {price && (
              <span className="shrink-0 text-sm font-semibold text-foreground">
                ~{price}
                <span className="font-normal text-muted">/pessoa</span>
              </span>
            )}
          </div>
          <p className="mb-3 truncate text-xs text-muted">{[place.neighborhood, kind].filter(Boolean).join(" · ")}</p>
          {shown.length > 0 && (
            <ul className="flex flex-wrap gap-1.5" aria-label="Por que combina com você">
              {shown.map((b) => (
                <li
                  key={b}
                  className="flex items-center gap-1 rounded-lg bg-soft px-2.5 py-1 text-[11px] font-medium text-foreground"
                >
                  <Check className="size-3 text-match" strokeWidth={2} /> {b}
                </li>
              ))}
            </ul>
          )}
        </div>
      </Link>
      <div className="pointer-events-none absolute inset-x-3 top-3 flex items-start justify-between">
        {compat != null ? <CompatPill value={compat} /> : <span />}
        <span className="pointer-events-auto">
          <SaveButton placeId={place.id} saved={saved} loggedIn={loggedIn} back={link} variant="dark" />
        </span>
      </div>
    </article>
  );
}

/** Linha compacta do ranking (do 7º lugar em diante). */
export function RestaurantRow({ result, href, index }: { result: MatchResult; href: string; index: number }) {
  const { place } = result;
  return (
    <Link
      href={href}
      transitionTypes={["nav-forward"]}
      className="press rise flex items-center gap-3.5 py-3"
      style={{ "--i": index } as React.CSSProperties}
    >
      <ViewTransition name={`photo-${place.id}`} share="morph" default="none">
        <Photo src={photoSrc(place)} alt="" name={place.name} className="size-16 shrink-0 rounded-2xl" />
      </ViewTransition>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold tracking-[-0.01em]">{place.name}</p>
        <p className="truncate text-xs text-muted">{[place.neighborhood, place.category].filter(Boolean).join(" · ")}</p>
        {result.badges[0] && (
          <p className="mt-1 flex items-center gap-1 truncate text-[11px] font-medium text-ink-2">
            <Check className="size-3 text-match" strokeWidth={2} /> {result.badges[0]}
          </p>
        )}
      </div>
      <span className="shrink-0 text-sm font-bold text-match">{result.compat}%</span>
    </Link>
  );
}
