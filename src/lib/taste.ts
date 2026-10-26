/**
 * Gosto da pessoa, aprendido com o que ela busca e escolhe. Sem IA: contagem com
 * memória curta (o que foi feito há um mês vale metade de hoje).
 *
 *   - cada busca soma os filtros escolhidos (etiquetas, comida, orçamento, "dá pra conversar");
 *   - cada lugar escolhido (Como chegar, WhatsApp, salvo, avaliado) soma as etiquetas,
 *     a comida, o gasto e o barulho dele, com peso maior: escolher diz mais que filtrar.
 *
 * O índice usa isso como mais um critério ("Seu estilo"), que ganha força com o uso.
 */
import { cuisineLabel } from "./cuisines";
import { getTag } from "./tags";
import type { Place } from "./types";

export interface SearchEvent {
  at: number;
  occasion: string;
  cuisine: string | null;
  budget: number | null;
  tags: string[];
  quiet: boolean;
}

export interface ChoiceEvent {
  at: number;
  placeId: string;
}

export interface Taste {
  /** Quanto já aprendeu, em "buscas equivalentes" (já com o desconto do tempo). */
  n: number;
  /** Quantas buscas e escolhas entraram, para o aviso ("aprendido com 12 buscas"). */
  events: number;
  /** Afinidade 0-1 por etiqueta e por tipo de comida (1 = a favorita). */
  tags: Record<string, number>;
  cuisines: Record<string, number>;
  /** Faixa de gasto típica (1-4) ou null. */
  budget: number | null;
  /** 0-1: quanto a pessoa prefere lugar calmo. */
  quiet: number;
}

/** Em quantos dias um sinal perde metade do peso. */
const HALF_LIFE_DAYS = 30;
/** Escolher um lugar vale tanto quanto este número de buscas. */
const CHOICE_WEIGHT = 2;
/** Abaixo disso o gosto ainda não entra no índice. */
export const MIN_TASTE = 3;

const decay = (at: number, now: number) => 0.5 ** (Math.max(0, now - at) / (HALF_LIFE_DAYS * 86_400_000));

function normalize(m: Map<string, number>): Record<string, number> {
  const max = Math.max(0, ...m.values());
  if (max === 0) return {};
  return Object.fromEntries([...m].map(([k, v]) => [k, v / max]));
}

export function buildTaste(
  searches: SearchEvent[],
  choices: ChoiceEvent[],
  places: Map<string, Place>,
  now = Date.now(),
): Taste {
  const tags = new Map<string, number>();
  const cuisines = new Map<string, number>();
  const add = (m: Map<string, number>, k: string, w: number) => m.set(k, (m.get(k) ?? 0) + w);
  let n = 0;
  let events = 0;
  let budgetSum = 0;
  let budgetW = 0;
  let quietSum = 0;
  let quietW = 0;

  for (const s of searches) {
    const w = decay(s.at, now);
    n += w;
    events++;
    for (const t of s.tags) add(tags, t, w);
    if (s.cuisine) add(cuisines, s.cuisine, w);
    if (s.budget) {
      budgetSum += s.budget * w;
      budgetW += w;
    }
    // Só conta quem marcou "dá pra conversar"; não marcar não quer dizer que gosta de barulho.
    if (s.quiet) {
      quietSum += w;
      quietW += w;
    }
  }

  for (const c of choices) {
    const p = places.get(c.placeId);
    if (!p) continue;
    const w = decay(c.at, now) * CHOICE_WEIGHT;
    n += w;
    events++;
    // Lugar com muitas etiquetas não deve pesar mais que um com poucas.
    const per = w / Math.max(1, Math.sqrt(p.tags.length));
    for (const t of p.tags) add(tags, t, per);
    for (const k of p.cuisines) add(cuisines, k, w / Math.max(1, p.cuisines.length));
    if (p.seedSpend) {
      budgetSum += p.seedSpend * w;
      budgetW += w;
    }
    if (p.seedNoise) {
      quietSum += (p.seedNoise === 1 ? 1 : 0) * w;
      quietW += w;
    }
  }

  return {
    n,
    events,
    tags: normalize(tags),
    cuisines: normalize(cuisines),
    budget: budgetW > 0 ? budgetSum / budgetW : null,
    quiet: quietW > 0 ? quietSum / quietW : 0,
  };
}

/**
 * Quanto um lugar tem a cara da pessoa (0-1) e o nome da etiqueta ou comida que mais pesou.
 * null quando ainda não há o que comparar.
 */
export function tasteFit(place: Place, taste: Taste): { fit: number; why: string | null } | null {
  const parts: { v: number; w: number }[] = [];

  const tagAff = place.tags.map((t) => [t, taste.tags[t] ?? 0] as const).sort((a, b) => b[1] - a[1]);
  const cuisineAff = place.cuisines.map((c) => [c, taste.cuisines[c] ?? 0] as const).sort((a, b) => b[1] - a[1]);
  if (Object.keys(taste.tags).length > 0) {
    // Média das duas etiquetas que mais batem: uma só coincidência não decide.
    const top = tagAff.slice(0, 2);
    parts.push({ v: top.length ? top.reduce((s, [, v]) => s + v, 0) / 2 : 0, w: 2 });
  }
  if (Object.keys(taste.cuisines).length > 0) parts.push({ v: cuisineAff[0]?.[1] ?? 0, w: 2 });
  if (taste.budget != null && place.seedSpend != null) {
    parts.push({ v: Math.max(0, 1 - Math.abs(place.seedSpend - taste.budget) / 2), w: 1 });
  }
  if (taste.quiet >= 0.5 && place.seedNoise != null) parts.push({ v: (3 - place.seedNoise) / 2, w: 1 });
  if (parts.length === 0) return null;

  const fit = parts.reduce((s, p) => s + p.v * p.w, 0) / parts.reduce((s, p) => s + p.w, 0);
  const bestTag = tagAff[0]?.[1] ? tagAff[0] : null;
  const bestCuisine = cuisineAff[0]?.[1] ? cuisineAff[0] : null;
  const why =
    bestCuisine && (!bestTag || bestCuisine[1] >= bestTag[1])
      ? cuisineLabel(bestCuisine[0])
      : bestTag
        ? (getTag(bestTag[0])?.label ?? null)
        : null;
  return { fit, why };
}
