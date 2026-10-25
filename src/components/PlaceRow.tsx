import Link from "next/link";
import { cuisineLabel } from "@/lib/cuisines";
import type { Place } from "@/lib/types";
import { PlaceImage } from "./PlaceImage";

/** Linha compacta de lugar (listas do perfil, painel). */
export function PlaceRow({ place, href, right }: { place: Place; href?: string; right?: React.ReactNode }) {
  const body = (
    <div className="flex items-center gap-3 rounded-2xl bg-surface p-2.5">
      <PlaceImage
        placeId={place.id}
        name={place.name}
        coverUrl={place.coverUrl}
        hasGoogle={!!place.googlePlaceId}
        color="#151413"
        className="size-16 shrink-0 rounded-xl"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold">{place.name}</p>
        <p className="truncate text-sm text-muted">
          {[place.cuisines.map(cuisineLabel).join(", ") || place.category, place.neighborhood]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>
      {right}
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}
