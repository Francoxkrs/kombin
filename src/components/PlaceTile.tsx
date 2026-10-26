import Link from "next/link";
import { ViewTransition } from "react";
import { cuisineLabel } from "@/lib/cuisines";
import { spendTypical } from "@/lib/occasions";
import { photoSrc } from "@/lib/photos";
import { getTag } from "@/lib/tags";
import type { Place } from "@/lib/types";
import { Photo } from "./ui/Photo";
import { SaveButton } from "./ui/SaveButton";

/** Card de grade (Descobrir, listas): foto alta, nome, tipo e gasto por pessoa. */
export function PlaceTile({
  place,
  spend,
  compat,
  saved,
  loggedIn,
  index = 0,
  href,
  morph = true,
}: {
  place: Place;
  spend: number | null;
  compat?: number;
  saved: boolean;
  loggedIn: boolean;
  index?: number;
  href?: string;
  /** Liga a transição da foto para a página do lugar (só um card por lugar na tela). */
  morph?: boolean;
}) {
  const link = href ?? `/l/${place.id}`;
  const vibeTag = place.tags.map((t) => getTag(t)?.label).find(Boolean);
  const photo = (
    <Photo
      src={photoSrc(place)}
      alt={`Foto de ${place.name}`}
      name={place.name}
      className="aspect-[4/5] w-full rounded-[1.35rem]"
      eager={index < 2}
    />
  );

  return (
    <div className="rise relative" style={{ "--i": index } as React.CSSProperties}>
      <Link href={link} transitionTypes={["nav-forward"]} className="press block">
        {morph ? (
          <ViewTransition name={`photo-${place.id}`} share="morph" default="none">
            {photo}
          </ViewTransition>
        ) : (
          photo
        )}
        <h3 className="mt-2.5 truncate text-[1.06rem] leading-tight font-extrabold tracking-[-0.02em]">
          {place.name}
        </h3>
        <p className="mt-0.5 truncate text-[13px] text-muted">
          {[place.cuisines.map(cuisineLabel)[0] ?? place.category, vibeTag].filter(Boolean).join(" · ")}
        </p>
        {spendTypical(spend) && (
          <p className="mt-1.5 text-[12px] leading-tight text-muted">
            Estimativa por pessoa
            <span className="block text-[15px] font-extrabold text-foreground">{spendTypical(spend)}</span>
          </p>
        )}
      </Link>
      <div className="pointer-events-none absolute top-2.5 right-2.5 left-2.5 flex items-start justify-between gap-2">
        {place.featured ? (
          <span className="rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold shadow-sm">Destaque</span>
        ) : compat != null ? (
          <span className="rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-extrabold text-match shadow-sm">
            {compat}%
          </span>
        ) : (
          <span />
        )}
        <span className="pointer-events-auto">
          <SaveButton placeId={place.id} saved={saved} loggedIn={loggedIn} back={link} variant="glass" />
        </span>
      </div>
    </div>
  );
}
