import { cuisineLabel } from "./cuisines";
import type { MatchResult } from "./match";
import { spendTypical } from "./occasions";
import { photoCount, photoSrc } from "./photos";
import type { Place } from "./types";

/** O que uma tela do Descobrir (ou um cartaz da lista) mostra de um lugar. Serializável para o client. */
export interface PlaceScreen {
  id: string;
  name: string;
  /** "Restaurante italiano, Jardim dos Estados. R$ 120 por pessoa." */
  about: string;
  /** "Sem couvert e dá pra conversar." */
  why: string | null;
  compat: number;
  photos: string[];
}

export function placeKind(place: Place): string | null {
  return place.category ?? (place.cuisines[0] ? cuisineLabel(place.cuisines[0]) : null);
}

export function placePhotos(place: Place): string[] {
  return Array.from({ length: photoCount(place) }, (_, i) => photoSrc(place, i)).filter((s): s is string => !!s);
}

const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

/** "Sem couvert, dá pra conversar e bom pra grupos." */
export function sentence(items: string[]): string | null {
  if (items.length === 0) return null;
  const [first, ...rest] = items;
  const tail = rest.map(lowerFirst);
  const body = tail.length === 0 ? first : `${[first, ...tail.slice(0, -1)].join(", ")} e ${tail[tail.length - 1]}`;
  return `${body}.`;
}

export function aboutLine(place: Place, spend: number | null): string {
  const where = [placeKind(place), place.neighborhood].filter(Boolean).join(", ");
  const price = spendTypical(spend);
  return [where && `${where}.`, price && `${price.replace(" ", " ")} por pessoa.`].filter(Boolean).join(" ");
}

export function toScreen(r: MatchResult): PlaceScreen {
  return {
    id: r.place.id,
    name: r.place.name,
    about: aboutLine(r.place, r.spend),
    why: sentence(r.badges.slice(0, 2)),
    compat: r.compat,
    photos: placePhotos(r.place),
  };
}

/** Tamanho do nome: nome curto vem grande, nome longo não passa de três linhas. Classes literais para o Tailwind achar. */
const NAME_SIZES = {
  screen: ["text-[60px]", "text-[48px]", "text-[40px]", "text-[34px]"],
  poster: ["text-[46px]", "text-[38px]", "text-[32px]", "text-[28px]"],
} as const;

export function posterNameSize(name: string, scale: keyof typeof NAME_SIZES = "screen"): string {
  const step = name.length <= 12 ? 0 : name.length <= 20 ? 1 : name.length <= 30 ? 2 : 3;
  return NAME_SIZES[scale][step];
}
