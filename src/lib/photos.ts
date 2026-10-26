import type { Place } from "./types";

type PhotoPlace = Pick<Place, "id" | "coverUrl" | "googlePlaceId">;

/**
 * Foto `index` do lugar: primeiro a própria (time ou dono), depois as do Google,
 * servidas pelo nosso proxy com cache (a chave da API não vai para o navegador).
 */
export function photoSrc(place: PhotoPlace, index = 0): string | null {
  let i = index;
  if (place.coverUrl) {
    if (i === 0) return place.coverUrl;
    i -= 1;
  }
  return place.googlePlaceId ? `/api/photo/${place.id}?i=${i}` : null;
}

/** Quantas fotos a galeria do lugar mostra. */
export function photoCount(place: PhotoPlace): number {
  return (place.coverUrl ? 1 : 0) + (place.googlePlaceId ? 3 : 0);
}
