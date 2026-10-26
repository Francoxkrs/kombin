import Link from "next/link";
import { ViewTransition } from "react";
import { posterNameSize, type PlaceScreen } from "@/lib/screen";
import { Photo } from "./ui/Photo";
import { SaveButton } from "./ui/SaveButton";

/** Cartaz de lugar: foto de ponta a ponta, nome grande embaixo. A foto passa para a página do lugar. */
export function PlacePoster({
  place,
  href,
  target,
  saved,
  loggedIn,
  eager,
}: {
  place: PlaceScreen;
  href: string;
  /** Fim da frase "92% combina com ...". */
  target: string;
  saved: boolean;
  loggedIn: boolean;
  eager?: boolean;
}) {
  return (
    <article className="relative">
      <Link href={href} transitionTypes={["nav-forward"]} className="relative block aspect-[4/5]">
        <ViewTransition name={`photo-${place.id}`} share="morph" default="none">
          <Photo src={place.photos[0] ?? null} fallbacks={place.photos.slice(1)} blurhash={place.blurhash} alt="" className="absolute inset-0" eager={eager} />
        </ViewTransition>
        <div className="scrim-bottom absolute inset-x-0 bottom-0 h-3/4" />
        <div className="absolute inset-x-0 bottom-0 px-5 pb-5">
          <p className="text-[15px] font-medium">
            <span className="text-ipe">{place.compat}%</span> combina com {target}
          </p>
          <h3 className={`title mt-1.5 break-words ${posterNameSize(place.name, "poster")}`}>
            {place.name}
          </h3>
          <p className="mt-2 max-w-[36ch] text-[15px] leading-snug text-foreground/90">
            {place.about} {place.why}
          </p>
        </div>
      </Link>
      <span className="absolute top-4 right-4">
        <SaveButton placeId={place.id} saved={saved} loggedIn={loggedIn} back={href} />
      </span>
    </article>
  );
}

/** Linha da lista, do sétimo lugar em diante. */
export function PlaceLine({ place, href }: { place: PlaceScreen; href: string }) {
  return (
    <Link href={href} transitionTypes={["nav-forward"]} className="press flex items-center gap-4 px-5 py-3">
      <ViewTransition name={`photo-${place.id}`} share="morph" default="none">
        <Photo src={place.photos[0] ?? null} fallbacks={place.photos.slice(1)} alt="" className="size-[72px] shrink-0" />
      </ViewTransition>
      <span className="min-w-0 flex-1">
        <span className="title block text-[22px] leading-none">{place.name}</span>
        <span className="mt-1.5 block truncate text-[14px] text-muted">{place.about}</span>
      </span>
      <span className="shrink-0 text-[20px] font-semibold text-ipe tabular-nums">{place.compat}%</span>
    </Link>
  );
}

/** Quadro da grade (listas do perfil): foto em pé com o nome por cima. */
export function PlaceFrame({
  id,
  name,
  photos,
  saved,
  loggedIn,
  eager,
}: {
  id: string;
  name: string;
  photos: string[];
  saved: boolean;
  loggedIn: boolean;
  eager?: boolean;
}) {
  const href = `/l/${id}`;
  return (
    <div className="relative">
      <Link href={href} transitionTypes={["nav-forward"]} className="relative block aspect-[3/4]">
        <ViewTransition name={`photo-${id}`} share="morph" default="none">
          <Photo src={photos[0] ?? null} fallbacks={photos.slice(1)} alt="" className="absolute inset-0" eager={eager} />
        </ViewTransition>
        <div className="scrim-bottom absolute inset-x-0 bottom-0 h-1/2" />
        <span className="title absolute inset-x-3 bottom-3 text-[22px] leading-none break-words">{name}</span>
      </Link>
      <span className="absolute top-2 right-2">
        <SaveButton placeId={id} saved={saved} loggedIn={loggedIn} back={href} />
      </span>
    </div>
  );
}
