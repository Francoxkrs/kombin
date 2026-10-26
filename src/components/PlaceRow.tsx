import Link from "next/link";
import { cuisineLabel } from "@/lib/cuisines";
import { photoSrc } from "@/lib/photos";
import type { Place } from "@/lib/types";
import { Photo } from "./ui/Photo";

/** Linha compacta de lugar (painel, pedidos de dono). */
export function PlaceRow({ place, href, right }: { place: Place; href?: string; right?: React.ReactNode }) {
  const body = (
    <div className="flex items-center gap-3 rounded-[1.3rem] border border-line bg-white p-2.5">
      <Photo src={photoSrc(place)} alt="" name={place.name} className="size-16 shrink-0 rounded-xl" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold tracking-[-0.02em]">{place.name}</p>
        <p className="truncate text-sm text-muted">
          {[place.cuisines.map(cuisineLabel).join(", ") || place.category, place.neighborhood].filter(Boolean).join(" · ")}
        </p>
      </div>
      {right}
    </div>
  );
  return href ? <Link href={href} className="press block">{body}</Link> : body;
}
