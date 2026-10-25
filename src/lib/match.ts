/**
 * Índice de compatibilidade do Kombin (análise combinatória, sem IA em tempo real).
 *
 * Cada critério produz um "encaixe" de 0 a 1 e uma confiança de 0 a 1.
 * A nota é a média dos encaixes, ponderada por peso da ocasião × confiança,
 * puxada levemente para 50% (neutro) quando há pouca informação:
 *
 *   compat = 100 × (Σ wᵢ·cᵢ·encaixeᵢ + K·0,5) / (Σ wᵢ·cᵢ + K)
 *
 * Lugar sem nenhum dado fica em 50%. Cada micro-review aumenta a confiança.
 */
import type { Occasion } from "./occasions";
import { SPEND_LABELS } from "./occasions";
import type { Place, PlaceSignals, SpendBand } from "./types";

export interface MatchPrefs {
  /** Tipo de comida escolhido (filtro duro): "aniversário + pizza". */
  cuisine?: string;
  budget?: SpendBand;
  noCover?: boolean;
  origin?: { lat: number; lng: number };
}

export interface MatchResult {
  place: Place;
  compat: number;
  reasons: string[];
  warning: string | null;
  spend: number | null;
  reviews: number;
}

type CriterionKey = "vibe" | "noise" | "cover" | "price" | "distance";

interface Criterion {
  key: CriterionKey;
  w: number;
  fit: number;
  conf: number;
  good: string;
  bad: string;
}

/** Peso de uma estimativa de curadoria/IA, em "visitas equivalentes". */
const SEED_WEIGHT = 1;
/** Confiança dada à nota de vibe da IA/admin. */
const VIBE_CONF = 0.85;
/** Abaixo disso, o lugar não aparece na ocasião. */
const MIN_VIBE = 4;
/** Quanto a nota é puxada para 50% quando há pouca informação. */
const SHRINK = 1;
/** Confiança mínima para um critério virar motivo, aviso ou filtro. */
const MIN_CONF = 0.3;

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

/** Junta a estimativa inicial com as micro-reviews em uma média e uma confiança. */
function blend(
  seed: number | null,
  avg: number | null,
  n: number,
): { value: number | null; conf: number } {
  const seedW = seed == null ? 0 : SEED_WEIGHT;
  const reviewW = avg == null ? 0 : n;
  const total = seedW + reviewW;
  if (total === 0) return { value: null, conf: 0 };
  const value = ((seed ?? 0) * seedW + (avg ?? 0) * reviewW) / total;
  return { value, conf: total / (total + 2) };
}

export function distanceKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function computeMatch(
  place: Place,
  signals: PlaceSignals,
  occasion: Occasion,
  prefs: MatchPrefs = {},
): MatchResult | null {
  if (place.status !== "approved") return null;
  if (prefs.cuisine && !place.cuisines.includes(prefs.cuisine)) return null;
  const w = occasion.weights;
  const criteria: Criterion[] = [];

  // Sem nota de vibe para a ocasião, o lugar não foi avaliado para ela: fica de fora.
  const vibe = place.vibe[occasion.slug];
  if (vibe == null || vibe < MIN_VIBE) return null;
  criteria.push({
    key: "vibe",
    w: w.vibe,
    fit: clamp01(vibe / 10),
    conf: VIBE_CONF,
    good: `Clima nota ${String(Math.round(vibe * 10) / 10).replace(".", ",")}/10 pra essa ocasião`,
    bad: "O clima não é o forte pra essa ocasião",
  });

  const noise = blend(place.seedNoise, signals.noiseAvg, signals.reviews);
  if (w.noise) {
    const quiet = noise.value == null ? 0.5 : (3 - noise.value) / 2;
    const quietWanted = w.noise.want === "quiet";
    criteria.push({
      key: "noise",
      w: w.noise.w,
      fit: quietWanted ? quiet : 1 - quiet,
      conf: noise.conf,
      good: quietWanted ? "Dá pra conversar" : "Ambiente animado",
      bad: quietWanted ? "Pode ser barulhento" : "Costuma ser mais calmo",
    });
  }

  const cover = blend(
    place.seedCover == null ? null : place.seedCover ? 1 : 0,
    signals.coverRatio,
    signals.reviews,
  );
  if (prefs.noCover && cover.value != null && cover.value >= 0.5 && cover.conf >= MIN_CONF) {
    return null;
  }
  if (w.cover || prefs.noCover) {
    const wantCover = prefs.noCover ? false : (w.cover?.want ?? false);
    const p = cover.value ?? 0.5;
    criteria.push({
      key: "cover",
      w: Math.max(w.cover?.w ?? 0, prefs.noCover ? 3 : 0),
      fit: wantCover ? p : 1 - p,
      conf: cover.conf,
      good: wantCover ? "Costuma ter música ao vivo" : "Sem couvert",
      bad: wantCover ? "Raramente tem música ao vivo" : "Costuma cobrar couvert",
    });
  }

  const spend = blend(place.seedSpend, signals.spendAvg, signals.reviews);
  if (prefs.budget) {
    const diff = spend.value == null ? 0 : spend.value - prefs.budget;
    if (diff >= 1.5 && spend.conf >= MIN_CONF) return null;
    criteria.push({
      key: "price",
      w: w.price,
      fit: spend.value == null ? 0.5 : diff <= 0.25 ? 1 : diff <= 1 ? 0.4 : 0,
      conf: spend.conf,
      good: `Cabe no orçamento (${SPEND_LABELS[prefs.budget]})`,
      bad: "Pode passar do orçamento",
    });
  }

  if (prefs.origin && place.lat != null && place.lng != null) {
    const km = distanceKm(prefs.origin, { lat: place.lat, lng: place.lng });
    criteria.push({
      key: "distance",
      w: w.distance,
      fit: clamp01(1 - km / 12),
      conf: 1,
      good: `A ${km.toFixed(1).replace(".", ",")} km de você`,
      bad: `Fica a ${km.toFixed(0)} km de você`,
    });
  }

  const evidence = criteria.reduce((s, c) => s + c.w * c.conf, 0);
  const score =
    (criteria.reduce((s, c) => s + c.w * c.conf * c.fit, 0) + SHRINK * 0.5) / (evidence + SHRINK);

  const known = criteria.filter((c) => c.conf >= MIN_CONF);
  const reasons = known
    .filter((c) => c.fit >= 0.7)
    .sort((a, b) => b.w * b.fit * b.conf - a.w * a.fit * a.conf)
    .slice(0, 3)
    .map((c) => c.good);
  const worst = known
    .filter((c) => c.fit <= 0.35)
    .sort((a, b) => b.w * (1 - b.fit) - a.w * (1 - a.fit))[0];

  return {
    place,
    compat: Math.min(99, Math.max(0, Math.round(score * 100))),
    reasons,
    warning: worst?.bad ?? null,
    spend: spend.value,
    reviews: signals.reviews,
  };
}

export function rankPlaces(
  places: Place[],
  signals: Map<string, PlaceSignals>,
  occasion: Occasion,
  prefs: MatchPrefs = {},
): MatchResult[] {
  const empty: PlaceSignals = { reviews: 0, spendAvg: null, noiseAvg: null, coverRatio: null };
  return places
    .map((p) => computeMatch(p, signals.get(p.id) ?? empty, occasion, prefs))
    .filter((r): r is MatchResult => r !== null)
    .sort((a, b) => b.compat - a.compat || b.reviews - a.reviews);
}
