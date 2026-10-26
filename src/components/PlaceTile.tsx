import Link from "next/link";
import { ViewTransition } from "react";
import { spendTypical } from "@/lib/occasions";
import { photoSrc } from "@/lib/photos";
import type { Place } from "@/lib/types";
import { Photo } from "./ui/Photo";
import { SaveButton } from "./ui/SaveButton";

/** Card de grade compacto (listas do perfil): foto, nome, bairro e gasto por pessoa. */
export function PlaceTile({
  place,
  spend,
  saved,
  loggedIn,
  index = 0,
}: {
  place: Place;
  spend: number | null;
  saved: boolean;
  loggedIn: boolean;
  index?: number;
}) {
  const link = `/l/${place.id}`;
  const price = spendTypical(spend);

  return (
    <div className="rise group relative" style={{ "--i": index } as React.CSSProperties}>
      <Link href={link} transitionTypes={["nav-forward"]} className="press block">
        <ViewTransition name={`photo-${place.id}`} share="morph" default="none">
          <Photo
            src={photoSrc(place)}
            alt={`Foto de ${place.name}`}
            name={place.name}
            className="aspect-[4/5] w-full rounded-2xl"
            imgClassName="transition-[scale] duration-700 ease-out group-hover:scale-105"
            eager={index < 2}
          />
        </ViewTransition>
        <h3 className="mt-2.5 truncate font-semibold tracking-[-0.01em]">{place.name}</h3>
        <p className="truncate text-xs text-muted">{[place.neighborhood, place.category].filter(Boolean).join(" · ")}</p>
        {price && (
          <p className="mt-1 text-xs font-semibold">
            ~{price}
            <span className="font-normal text-muted">/pessoa</span>
          </p>
        )}
      </Link>
      <span className="absolute top-2.5 right-2.5">
        <SaveButton placeId={place.id} saved={saved} loggedIn={loggedIn} back={link} variant="dark" />
      </span>
    </div>
  );
}
