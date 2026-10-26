import "server-only";
import { headers } from "next/headers";
import { getRepo } from "./repo";

/**
 * Limite de requisições guardado no Postgres (função hit_rate_limit da migração 0004),
 * para valer entre todas as instâncias da Vercel sem pagar Redis.
 * Se a migração ainda não rodou, deixa passar e avisa no log (o app não cai).
 */

export interface Limit {
  /** Quantas vezes na janela. */
  max: number;
  /** Tamanho da janela em segundos. */
  window: number;
}

export const LIMITS = {
  /** Avaliações relâmpago por IP. */
  reviewIp: { max: 20, window: 3600 },
  /** Avaliações por conta. */
  reviewUser: { max: 30, window: 3600 },
  /** Votos (inclui trocar o voto) por IP. */
  vote: { max: 60, window: 600 },
  /** Votações novas por IP. */
  decision: { max: 20, window: 3600 },
  /** Cliques de WhatsApp/mapa que contam no painel do restaurante: 1 por aparelho, lugar e tipo a cada 30 min. */
  lead: { max: 1, window: 1800 },
  /** Pedidos de reivindicação por conta. */
  claim: { max: 5, window: 86400 },
  /** Fotos do painel do restaurante (capa e cardápio), por conta. */
  upload: { max: 60, window: 3600 },
  /** Salvar/tirar das listas e trocar o nome, por conta. */
  account: { max: 120, window: 600 },
  /** Chamadas que podem cair no Google (fotos e horários) por IP. */
  googleIp: { max: 300, window: 600 },
} satisfies Record<string, Limit>;

/** Teto diário de chamadas pagas ao Google feitas pelas rotas públicas (fotos e horários). */
export function googleDailyLimit(): Limit {
  const max = Number(process.env.GOOGLE_DAILY_LIMIT) || 500;
  return { max, window: 86400 };
}

let warned = false;

/** true = pode seguir; false = passou do limite. */
export async function allow(key: string, limit: Limit): Promise<boolean> {
  try {
    const { data, error } = await getRepo().db.rpc("hit_rate_limit", {
      p_key: key,
      p_max: limit.max,
      p_window_seconds: limit.window,
    });
    if (error) throw error;
    return data !== false;
  } catch (e) {
    if (!warned) {
      warned = true;
      console.warn("Kombin: limite de requisições desligado. Rode supabase/migrations/0004_seguranca.sql.", e);
    }
    return true;
  }
}

/**
 * IP de quem chamou. Na Vercel, x-real-ip e x-forwarded-for são escritos pela
 * própria plataforma (o valor mandado pelo cliente é substituído).
 */
export function ipFrom(h: Headers): string {
  return (h.get("x-real-ip") || h.get("x-forwarded-for")?.split(",")[0] || "local").trim().slice(0, 64);
}

/** IP dentro de uma server action. */
export async function currentIp(): Promise<string> {
  return ipFrom(await headers());
}

/** Resposta padrão de limite estourado. */
export function tooMany() {
  return Response.json({ error: "muitas tentativas, tente de novo daqui a pouco" }, { status: 429 });
}
