/**
 * Contas dos painéis (admin e restaurante), sem banco: recebem linhas e devolvem o que a tela mostra.
 * Ficam aqui para serem testadas sem Supabase.
 */

import { NOISE_LABELS, SPEND_LABELS } from "./occasions";

/** Campo Grande é UTC-4 o ano todo (MS não tem horário de verão). */
const CG_OFFSET_MS = -4 * 3_600_000;

/** "2026-10-27" no fuso de Campo Grande. */
export function cgDay(t: number | string | Date): string {
  const ms = typeof t === "number" ? t : new Date(t).getTime();
  return new Date(ms + CG_OFFSET_MS).toISOString().slice(0, 10);
}

/** Os últimos `days` dias, do mais antigo para hoje. */
export function lastDays(days: number, now = Date.now()): string[] {
  return Array.from({ length: days }, (_, i) => cgDay(now - (days - 1 - i) * 86_400_000));
}

export interface DayCount {
  day: string;
  count: number;
}

/** Conta eventos por dia nos últimos `days` dias; dias sem nada aparecem com zero. */
export function countByDay(times: string[], days: number, now = Date.now()): DayCount[] {
  const counts = new Map(lastDays(days, now).map((d) => [d, 0]));
  for (const t of times) {
    const d = cgDay(t);
    if (counts.has(d)) counts.set(d, counts.get(d)! + 1);
  }
  return [...counts].map(([day, count]) => ({ day, count }));
}

/** "27/10" a partir de "2026-10-27". */
export const shortDay = (day: string) => `${day.slice(8, 10)}/${day.slice(5, 7)}`;

/** Variação em % entre dois períodos; null quando não há base para comparar. */
export function change(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

export interface ReviewRow {
  spend: number;
  cover: boolean;
  noise: number;
  occasion: string | null;
  verified: boolean;
  createdAt: string;
}

export interface ReviewSummary {
  total: number;
  verified: number;
  /** Quantas avaliações em cada faixa de gasto (1 a 4). */
  spend: { band: number; label: string; count: number }[];
  /** Fração que disse que cobram couvert (0 a 1), ou null sem avaliações. */
  coverShare: number | null;
  /** Quantas avaliações em cada nível de barulho (1 a 3). */
  noise: { level: number; label: string; count: number }[];
}

export function summarizeReviews(rows: ReviewRow[]): ReviewSummary {
  const spend = [1, 2, 3, 4].map((band) => ({
    band,
    label: SPEND_LABELS[band],
    count: rows.filter((r) => r.spend === band).length,
  }));
  const noise = [1, 2, 3].map((level) => ({
    level,
    label: NOISE_LABELS[level],
    count: rows.filter((r) => r.noise === level).length,
  }));
  return {
    total: rows.length,
    verified: rows.filter((r) => r.verified).length,
    spend,
    coverShare: rows.length ? rows.filter((r) => r.cover).length / rows.length : null,
    noise,
  };
}

/**
 * Dicas para o dono a partir do que os clientes contaram. Só aparecem com pelo menos
 * 3 avaliações, para uma pessoa só não mudar o recado da casa.
 */
export function ownerTips(
  s: ReviewSummary,
  place: { about: string | null; whatsapp: string | null; menuCount: number },
  clicks: { whatsapp: number; directions: number },
): string[] {
  const tips: string[] = [];
  if (!place.whatsapp && clicks.directions > 0) {
    tips.push(
      `${clicks.directions} pessoas pediram rota, mas a casa não tem WhatsApp. Com ele, o cliente reserva antes de sair.`,
    );
  }
  if (place.menuCount === 0) {
    tips.push("Sem cardápio, o cliente não sabe o preço antes de ir. Fotografe as páginas do cardápio.");
  }
  if (s.total < 3) return tips;
  const loud = s.noise.find((n) => n.level === 3)!.count / s.total;
  const quiet = s.noise.find((n) => n.level === 1)!.count / s.total;
  if (loud >= 0.5) {
    tips.push(
      "Metade ou mais disse que o som é alto. Você aparece menos em “A dois” e “Café”. Um horário mais calmo no recado da casa ajuda.",
    );
  } else if (quiet >= 0.6) {
    tips.push("Os clientes dizem que dá pra conversar. Diga isso no recado da casa: é o que pesa em “A dois”.");
  }
  if (s.coverShare != null && s.coverShare >= 0.5 && !/couvert/i.test(place.about ?? "")) {
    tips.push(
      "A maioria disse que paga couvert. Avise o valor e os dias no recado da casa, para ninguém se surpreender na conta.",
    );
  }
  const top = [...s.spend].sort((a, b) => b.count - a.count)[0];
  if (top.count / s.total >= 0.5) {
    tips.push(`O gasto mais comum é ${top.label} por pessoa. É esse valor que aparece em “Antes de ir”.`);
  }
  return tips;
}

/** Quantos eventos caem nos últimos `days` dias e quantos nos `days` antes deles. */
export function splitPeriods(times: string[], days: number, now = Date.now()) {
  const cut = now - days * 86_400_000;
  const start = cut - days * 86_400_000;
  let current = 0;
  let previous = 0;
  for (const t of times) {
    const ms = new Date(t).getTime();
    if (ms >= cut) current++;
    else if (ms >= start) previous++;
  }
  return { current, previous };
}

/** Os valores mais frequentes, do maior para o menor. */
export function topCounts(values: string[], limit = 5): { key: string; count: number }[] {
  const m = new Map<string, number>();
  for (const v of values) m.set(v, (m.get(v) ?? 0) + 1);
  return [...m]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key))
    .slice(0, limit);
}

/** true se `t` caiu nos últimos `days` dias. */
export const withinDays = (t: string, days: number, now = Date.now()) =>
  new Date(t).getTime() >= now - days * 86_400_000;
