/**
 * Busca de restaurantes no Google Places (API New), usada pela importação do /admin
 * e pelo `npm run ingest`. Sem "server-only" porque os scripts também importam.
 *
 * Custo (cotas grátis mensais, out/2026): a busca pede campos de "Atmosphere"
 * (música ao vivo, bom pra grupos...), então cai no SKU Text Search Enterprise + Atmosphere,
 * com 1.000 chamadas grátis por mês. Cada busca traz até 20 lugares.
 */

const API = process.env.GOOGLE_PLACES_API_BASE || "https://places.googleapis.com/v1";

/** Buscas da importação. O foco é restaurante: a maioria é por tipo de comida. */
export const QUERIES: { q: string; label: string }[] = [
  { q: "restaurante", label: "restaurantes" },
  { q: "pizzaria", label: "pizzarias" },
  { q: "restaurante japonês sushi", label: "japoneses" },
  { q: "hamburgueria", label: "hamburguerias" },
  { q: "restaurante italiano", label: "italianos" },
  { q: "churrascaria", label: "churrascarias" },
  { q: "comida regional pantaneira", label: "regionais" },
  { q: "restaurante romântico", label: "lugares a dois" },
  { q: "restaurante para família com espaço kids", label: "lugares pra família" },
  { q: "bar com petiscos e música ao vivo", label: "bares com música" },
  { q: "choperia happy hour", label: "choperias" },
  { q: "restaurante de frutos do mar", label: "frutos do mar" },
  { q: "restaurante árabe", label: "árabes" },
  { q: "restaurante mexicano", label: "mexicanos" },
  { q: "bistrô", label: "bistrôs" },
  { q: "cafeteria", label: "cafeterias" },
];

/**
 * Casas conhecidas de Campo Grande que o app precisa ter desde o primeiro dia.
 * Entram pelo nome, sem o filtro de nota, mas só se o Google achar a casa certa.
 */
export const ESSENTIALS: string[] = [
  "Enoteca Decanter",
  "Turista Sushi",
  "Mr. VIP",
  "Território do Vinho",
  "Vermelho Grill",
  "Café Mostarda",
  "Lupland Biergarten",
];

/** Palavras que não identificam uma casa sozinhas ("Café", "Grill"). */
const GENERIC_WORDS = new Set(["restaurante", "cafe", "bar", "grill", "sushi", "vinho", "pizzaria", "do", "da", "de", "mr"]);

const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ");

/** O resultado da busca é mesmo a casa pedida? Exige uma palavra própria do nome ("Decanter", "Mostarda"). */
export function sameVenue(wanted: string, found: string): boolean {
  const words = new Set(normalize(found).split(/\s+/));
  return normalize(wanted)
    .split(/\s+/)
    .some((w) => w.length >= 3 && !GENERIC_WORDS.has(w) && words.has(w));
}

/** Só entra lugar de comer e beber. */
const FOOD_TYPES = ["restaurant", "food", "bar", "cafe", "bakery", "meal_takeaway", "pub", "coffee_shop"];

/** Retângulo em volta da área urbana de Campo Grande. */
export const CAMPO_GRANDE = {
  rectangle: {
    low: { latitude: -20.58, longitude: -54.74 },
    high: { latitude: -20.37, longitude: -54.5 },
  },
};

export interface GMoney {
  currencyCode?: string;
  units?: string;
}

export interface GPlace {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  location?: { latitude: number; longitude: number };
  rating?: number;
  userRatingCount?: number;
  primaryType?: string;
  types?: string[];
  primaryTypeDisplayName?: { text: string };
  businessStatus?: string;
  addressComponents?: { longText: string; types: string[] }[];
  photos?: { name: string }[];
  priceLevel?: string;
  priceRange?: { startPrice?: GMoney; endPrice?: GMoney };
  liveMusic?: boolean;
  goodForGroups?: boolean;
  goodForChildren?: boolean;
  menuForChildren?: boolean;
  outdoorSeating?: boolean;
  reservable?: boolean;
  servesBeer?: boolean;
  servesWine?: boolean;
  servesCocktails?: boolean;
  servesCoffee?: boolean;
  servesDessert?: boolean;
  servesVegetarianFood?: boolean;
  allowsDogs?: boolean;
  parkingOptions?: Record<string, boolean>;
  accessibilityOptions?: { wheelchairAccessibleEntrance?: boolean };
  internationalPhoneNumber?: string;
  websiteUri?: string;
}

const PLACE_FIELDS = [
  "id",
  "displayName",
  "formattedAddress",
  "location",
  "rating",
  "userRatingCount",
  "primaryType",
  "types",
  "primaryTypeDisplayName",
  "businessStatus",
  "addressComponents",
  "photos",
  "priceLevel",
  "priceRange",
  "liveMusic",
  "goodForGroups",
  "goodForChildren",
  "menuForChildren",
  "outdoorSeating",
  "reservable",
  "servesBeer",
  "servesWine",
  "servesCocktails",
  "servesCoffee",
  "servesDessert",
  "servesVegetarianFood",
  "allowsDogs",
  "parkingOptions",
  "accessibilityOptions",
];

export class GoogleError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function call<T>(key: string, path: string, init: RequestInit & { fieldMask: string }): Promise<T> {
  const { fieldMask, ...rest } = init;
  const res = await fetch(`${API}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask": fieldMask,
      ...(rest.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    let msg = body;
    try {
      msg = (JSON.parse(body) as { error?: { message?: string } }).error?.message ?? body;
    } catch {}
    throw new GoogleError(res.status, `Google Places ${res.status}: ${msg.slice(0, 300)}`);
  }
  return (await res.json()) as T;
}

/** Text Search restrita a Campo Grande. `pages` = quantas páginas de 20 buscar. */
export async function textSearch(key: string, query: string, pages = 1): Promise<GPlace[]> {
  const out: GPlace[] = [];
  let pageToken: string | undefined;
  for (let page = 0; page < pages; page++) {
    const data = await call<{ places?: GPlace[]; nextPageToken?: string }>(key, "/places:searchText", {
      method: "POST",
      fieldMask: [...PLACE_FIELDS.map((f) => `places.${f}`), "nextPageToken"].join(","),
      body: JSON.stringify({
        textQuery: `${query} em Campo Grande MS`,
        languageCode: "pt-BR",
        regionCode: "BR",
        pageSize: 20,
        locationRestriction: CAMPO_GRANDE,
        pageToken,
      }),
    });
    out.push(...(data.places ?? []));
    pageToken = data.nextPageToken;
    if (!pageToken) break;
    await new Promise((r) => setTimeout(r, 1500));
  }
  return out;
}

/** Detalhes de um lugar, com os mesmos campos da busca. */
export function placeDetails(key: string, placeId: string): Promise<GPlace> {
  return call<GPlace>(key, `/places/${encodeURIComponent(placeId)}?languageCode=pt-BR&regionCode=BR`, {
    fieldMask: PLACE_FIELDS.join(","),
  });
}

/**
 * Nomes das fotos de um lugar. Primeiro o Place Details só com "photos"; se vier vazio
 * (em produção ele devolve `{}` para todos os lugares, com ou sem os outros campos),
 * busca o lugar pelo nome no Text Search, que é o mesmo caminho da importação e traz fotos.
 */
export async function photoNames(
  key: string,
  placeId: string,
  placeName?: string,
): Promise<{ name: string; author: string | null }[]> {
  const d = await call<{ photos?: GPhoto[] }>(key, `/places/${encodeURIComponent(placeId)}`, { fieldMask: "photos" });
  if (d.photos?.length) return d.photos.map(photoRef);
  if (!placeName) return [];
  const hits = await call<{ places?: { id: string; photos?: GPhoto[] }[] }>(key, "/places:searchText", {
    method: "POST",
    fieldMask: "places.id,places.photos",
    body: JSON.stringify({
      textQuery: `${placeName} em Campo Grande MS`,
      languageCode: "pt-BR",
      regionCode: "BR",
      pageSize: 5,
      locationRestriction: CAMPO_GRANDE,
    }),
  });
  const hit = hits.places?.find((p) => p.id === placeId);
  console.warn(
    "Google: Place Details sem fotos; Text Search",
    placeId,
    hit ? `achou ${hit.photos?.length ?? 0} fotos` : `não achou o lugar entre ${hits.places?.length ?? 0} resultados`,
  );
  return (hit?.photos ?? []).map(photoRef);
}

type GPhoto = { name: string; authorAttributions?: { displayName?: string }[] };
const photoRef = (p: GPhoto) => ({ name: p.name, author: p.authorAttributions?.[0]?.displayName ?? null });

/** Baixa uma foto (Place Photos). */
export async function photoBytes(
  key: string,
  photoName: string,
  maxWidth = 900,
): Promise<{ bytes: ArrayBuffer; mimeType: string } | null> {
  const res = await fetch(`${API}/${photoName}/media?maxWidthPx=${maxWidth}&key=${key}`, { cache: "no-store" });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`Google Place Photos ${res.status}:`, body.slice(0, 300));
    return null;
  }
  return { bytes: await res.arrayBuffer(), mimeType: res.headers.get("content-type") ?? "image/jpeg" };
}

export function isFoodPlace(p: GPlace): boolean {
  return (p.types ?? []).some((t) => FOOD_TYPES.some((f) => t === f || t.endsWith(`_${f}`) || t.endsWith("_restaurant")));
}

export interface SocialProof {
  minRating: number;
  minReviews: number;
}

export const DEFAULT_PROOF: SocialProof = { minRating: 4.2, minReviews: 150 };

/** Por que o lugar fica de fora (null = entra). */
export function filterReason(p: GPlace, proof: SocialProof = DEFAULT_PROOF): string | null {
  if (p.businessStatus === "CLOSED_PERMANENTLY" || p.businessStatus === "CLOSED_TEMPORARILY") return "fechado";
  if (!isFoodPlace(p)) return "não é de comer";
  if ((p.rating ?? 0) < proof.minRating) return `nota abaixo de ${String(proof.minRating).replace(".", ",")}`;
  if ((p.userRatingCount ?? 0) < proof.minReviews) return `menos de ${proof.minReviews} avaliações`;
  return null;
}

/** Aberto, de comer/beber e com nota e volume de avaliações mínimos. */
export function passesFilter(p: GPlace, proof: SocialProof = DEFAULT_PROOF): boolean {
  return filterReason(p, proof) === null;
}

export function neighborhoodOf(p: GPlace): string | null {
  const c = p.addressComponents?.find(
    (a) => a.types.includes("sublocality_level_1") || a.types.includes("sublocality"),
  );
  return c?.longText ?? null;
}
