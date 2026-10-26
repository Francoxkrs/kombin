import Link from "next/link";
import { photoSrc } from "@/lib/photos";
import { placeKind } from "@/lib/screen";
import type { Place } from "@/lib/types";
import { Photo } from "./ui/Photo";

/** Linha compacta de lugar (painel, pedidos de dono). */
export function PlaceRow({ place, href, right }: { place: Place; href?: string; right?: React.ReactNode }) {
  const body = (
    <div className="flex items-center gap-4 bg-surface pr-4">
      <Photo src={photoSrc(place)} alt="" name={place.name} className="size-[72px] shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[18px] font-semibold">{place.name}</p>
        <p className="truncate text-[14px] text-muted">{[placeKind(place), place.neighborhood].filter(Boolean).join(", ")}</p>
      </div>
      {right}
    </div>
  );
  return href ? (
    <Link href={href} className="press block">
      {body}
    </Link>
  ) : (
    body
  );
}
