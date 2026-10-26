/**
 * Notas por ocasião SEM IA: regras a partir dos atributos que o Google já informa
 * (música ao vivo, bom pra grupos, cardápio infantil, faixa de preço...).
 * É o que a importação usa sempre. Se houver chave do Gemini, o vibe-check por foto
 * refina essas notas depois.
 */
import { cuisinesFromGoogleTypes } from "../cuisines";
import { getTag } from "../tags";
import type { Noise, SpendBand } from "../types";
import { type GPlace, neighborhoodOf } from "./google";

const BAR_TYPES = ["bar", "pub", "bar_and_grill", "wine_bar", "cocktail_bar", "night_club", "beer_garden"];
const CAFE_TYPES = ["cafe", "coffee_shop", "bakery", "dessert_shop", "tea_house", "confectionery", "ice_cream_shop"];
const FAST_TYPES = ["fast_food_restaurant", "meal_takeaway", "sandwich_shop", "food_court"];

export function tagsFromGoogle(p: GPlace): string[] {
  const t: string[] = [];
  if (p.liveMusic) t.push("musica-ao-vivo");
  if (p.goodForGroups) t.push("grupos");
  if (p.goodForChildren || p.menuForChildren) t.push("criancas");
  if (p.outdoorSeating) t.push("area-externa");
  if (p.reservable) t.push("reserva");
  if (p.servesCocktails) t.push("drinks");
  if (p.servesBeer) t.push("chopp");
  if (p.servesWine) t.push("vinhos");
  if (p.servesDessert) t.push("sobremesa");
  if (p.servesCoffee) t.push("cafe");
  if (p.servesVegetarianFood) t.push("vegetariano");
  if (p.allowsDogs) t.push("pet");
  if (p.parkingOptions && Object.entries(p.parkingOptions).some(([k, v]) => v && k !== "freeStreetParking" && k !== "paidStreetParking"))
    t.push("estacionamento");
  if (p.accessibilityOptions?.wheelchairAccessibleEntrance) t.push("acessivel");
  return t;
}

const PRICE_LEVEL: Record<string, SpendBand> = {
  PRICE_LEVEL_INEXPENSIVE: 1,
  PRICE_LEVEL_MODERATE: 2,
  PRICE_LEVEL_EXPENSIVE: 3,
  PRICE_LEVEL_VERY_EXPENSIVE: 4,
};

/** Faixa de gasto por pessoa a partir de priceRange (R$) ou priceLevel. */
export function spendFromGoogle(p: GPlace): SpendBand | null {
  const start = Number(p.priceRange?.startPrice?.units);
  const end = Number(p.priceRange?.endPrice?.units);
  if (Number.isFinite(start) && start > 0) {
    const mid = Number.isFinite(end) && end > 0 ? (start + end) / 2 : start * 1.2;
    return mid < 40 ? 1 : mid < 80 ? 2 : mid < 150 ? 3 : 4;
  }
  return (p.priceLevel && PRICE_LEVEL[p.priceLevel]) || null;
}

const clamp = (n: number) => Math.round(Math.max(0, Math.min(10, n)) * 10) / 10;

export interface HeuristicResult {
  vibe: Record<string, number>;
  noise: Noise;
  spend: SpendBand | null;
  tags: string[];
  cuisines: string[];
  summary: string;
}

export function heuristicVibe(p: GPlace): HeuristicResult {
  const types = [p.primaryType ?? "", ...(p.types ?? [])];
  const has = (list: string[]) => list.some((x) => types.includes(x));
  const tags = tagsFromGoogle(p);
  const tag = (s: string) => tags.includes(s);
  const cuisines = cuisinesFromGoogleTypes(types);
  const spend = spendFromGoogle(p);
  const isBar = has(BAR_TYPES) && !types.some((x) => x.endsWith("_restaurant") && x !== "bar_and_grill");
  const isCafe = has(CAFE_TYPES) && !types.includes("restaurant");
  const isFast = has(FAST_TYPES);
  const fine = (spend ?? 2) >= 3;

  const noise: Noise = tag("musica-ao-vivo") || isBar ? 3 : isCafe || (fine && !tag("musica-ao-vivo")) ? 1 : 2;

  const encontro =
    5 +
    (tag("vinhos") ? 2 : 0) +
    (tag("drinks") ? 0.5 : 0) +
    (tag("reserva") ? 1 : 0) +
    (fine ? 1 : 0) +
    (has(["italian_restaurant", "japanese_restaurant", "wine_bar", "french_restaurant", "sushi_restaurant"]) ? 1 : 0) -
    (tag("musica-ao-vivo") ? 1.5 : 0) -
    (isFast ? 3 : 0) -
    (has(["pub", "night_club"]) ? 1.5 : 0) -
    (isCafe ? 1 : 0);

  const pagode =
    3 +
    (tag("musica-ao-vivo") ? 3 : 0) +
    (tag("chopp") ? 1.5 : 0) +
    (tag("grupos") ? 1 : 0) +
    (tag("area-externa") ? 1 : 0) +
    (isBar ? 1.5 : 0) -
    ((spend ?? 2) >= 4 ? 2 : 0) -
    (isCafe ? 3 : 0);

  const familia =
    4 +
    (tag("criancas") ? 3 : 0) +
    (tag("grupos") ? 1 : 0) +
    (tag("estacionamento") ? 0.5 : 0) +
    (tag("area-externa") ? 0.5 : 0) +
    (has(["pizza_restaurant", "brazilian_restaurant", "steak_house", "barbecue_restaurant"]) ? 1 : 0) -
    (isBar ? 3 : 0) -
    (tag("musica-ao-vivo") ? 0.5 : 0);

  const happyHour =
    3 +
    (tag("chopp") ? 2 : 0) +
    (tag("drinks") ? 1 : 0) +
    (tag("grupos") ? 1 : 0) +
    (tag("area-externa") ? 0.5 : 0) +
    (isBar ? 2 : 0) -
    ((spend ?? 2) >= 4 ? 1.5 : 0) -
    (isCafe ? 3 : 0);

  const aniversario =
    4 +
    (tag("grupos") ? 2 : 0) +
    (tag("reserva") ? 1 : 0) +
    (tag("drinks") || tag("chopp") ? 1 : 0) +
    (tag("musica-ao-vivo") ? 0.5 : 0) +
    (has(["pizza_restaurant", "japanese_restaurant", "sushi_restaurant", "steak_house", "barbecue_restaurant"]) ? 1 : 0) -
    (isCafe ? 2.5 : 0) -
    (isFast ? 1 : 0);

  const cafe =
    1 +
    (isCafe ? 6 : 0) +
    (tag("cafe") ? 1 : 0) +
    (tag("sobremesa") ? 0.5 : 0) -
    (isBar ? 2 : 0) -
    (tag("musica-ao-vivo") ? 2 : 0);

  // Prova social forte puxa um pouco para cima.
  const bonus = (p.rating ?? 0) >= 4.6 && (p.userRatingCount ?? 0) >= 500 ? 0.5 : 0;

  const vibe = {
    encontro: clamp(encontro + bonus),
    pagode: clamp(pagode + bonus),
    familia: clamp(familia + bonus),
    "happy-hour": clamp(happyHour + bonus),
    aniversario: clamp(aniversario + bonus),
    cafe: clamp(cafe + bonus),
  };

  const highlights = tags
    .filter((t) => ["musica-ao-vivo", "grupos", "criancas", "area-externa", "drinks", "vinhos", "reserva", "chopp"].includes(t))
    .slice(0, 3)
    .map((t) => getTag(t)!.label.toLowerCase());
  const summary = highlights.length
    ? `${p.primaryTypeDisplayName?.text ?? "Restaurante"} com ${highlights.join(", ").replace(/, ([^,]*)$/, " e $1")}.`
    : "";

  return { vibe, noise, spend, tags, cuisines, summary };
}

/** Linha da tabela places a partir de um lugar do Google (sem IA). */
export function placeRowFromGoogle(p: GPlace) {
  const h = heuristicVibe(p);
  return {
    google_place_id: p.id,
    name: p.displayName?.text ?? "Sem nome",
    category: p.primaryTypeDisplayName?.text ?? null,
    cuisines: h.cuisines,
    tags: h.tags,
    neighborhood: neighborhoodOf(p),
    address: p.formattedAddress ?? null,
    lat: p.location?.latitude ?? null,
    lng: p.location?.longitude ?? null,
    coords_refreshed_at: new Date().toISOString(),
    vibe: h.vibe,
    seed_noise: h.noise,
    seed_spend: h.spend,
    ai_summary: h.summary || null,
  };
}
