import type { MatchPrefs } from "./match";
import { PARTY_OPTIONS, type Party } from "./occasions";
import { getTag } from "./tags";
import type { SpendBand } from "./types";

type SP = Record<string, string | string[] | undefined>;

/** Lê os filtros da URL (?b=2&p=6%2B&n=Centro&t=grupos,criancas&nc=1&q=1&lat=..&lng=..). */
export function parsePrefs(sp: SP): MatchPrefs {
  const one = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  const b = Number(one("b"));
  const lat = Number(one("lat"));
  const lng = Number(one("lng"));
  const party = one("p");
  const tags = (one("t") ?? "")
    .split(",")
    .filter((t) => getTag(t));
  return {
    cuisine: one("c") || undefined,
    budget: b >= 1 && b <= 4 ? (b as SpendBand) : undefined,
    noCover: one("nc") === "1",
    quiet: one("q") === "1",
    origin: one("lat") && Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : undefined,
    party: PARTY_OPTIONS.some((o) => o.value === party) ? (party as Party) : undefined,
    neighborhood: one("n") || undefined,
    tags: tags.length ? tags : undefined,
  };
}

/** Filtros de busca na URL (tudo menos o tipo de comida, que é link compartilhável). Busca exige login. */
const SEARCH_KEYS = ["b", "p", "n", "t", "nc", "q", "lat"];

export function isSearch(sp: SP): boolean {
  return SEARCH_KEYS.some((k) => typeof sp[k] === "string" && sp[k] !== "");
}

/** Login antes da busca, voltando para os resultados depois. */
export const searchLoginHref = (next: string) => `/entrar?motivo=busca&next=${encodeURIComponent(next)}`;
