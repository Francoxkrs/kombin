"use server";

import { updateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { CATALOG_TAG } from "@/lib/catalog";
import { DEFAULT_PROOF, GoogleError, passesFilter, photoBytes, photoNames, placeDetails, QUERIES, textSearch } from "@/lib/ingest/google";
import { placeRowFromGoogle } from "@/lib/ingest/heuristic";
import { vibeCheck, visionModelName, type VisionImage, type VisionProvider } from "@/lib/ingest/vision";
import { getRepo } from "@/lib/repo";

export type ImportResult =
  | { ok: true; label: string; found: number; added: string[]; skipped: number }
  | { ok: false; error: string };

function googleKey(): string {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) throw new Error("Falta a variável GOOGLE_MAPS_API_KEY na Vercel.");
  return key;
}

function explain(e: unknown): string {
  if (e instanceof GoogleError && (e.status === 403 || e.status === 400)) {
    return `${e.message}. Confira se a "Places API (New)" está ativada no Google Cloud e se a chave não tem restrição de site.`;
  }
  const msg = e instanceof Error ? e.message : String(e);
  if (/column .*(tags|featured|imported_at)/.test(msg)) {
    return "Falta criar as colunas novas: rode supabase/migrations/0003_tags_destaque.sql no SQL Editor do Supabase e tente de novo.";
  }
  return msg;
}

/**
 * Uma busca da lista (ex.: "pizzarias"): traz até 20 lugares de Campo Grande,
 * filtra por nota e avaliações e grava os novos já aprovados, com notas por regra.
 * O admin chama uma busca por vez, então nenhuma requisição passa do limite da Vercel.
 */
export async function importQuery(index: number): Promise<ImportResult> {
  await requireAdmin();
  const query = QUERIES[index];
  if (!query) return { ok: false, error: "Busca inválida" };
  try {
    const key = googleKey();
    const repo = getRepo();
    const [found, known] = await Promise.all([textSearch(key, query.q, 1), repo.knownGoogleIds()]);
    const fresh = found.filter((p) => !known.has(p.id) && passesFilter(p, DEFAULT_PROOF));
    const added: string[] = [];
    for (const p of fresh) {
      await repo.upsertImported({ ...placeRowFromGoogle(p), status: "approved" });
      added.push(p.displayName?.text ?? "?");
    }
    if (added.length) updateTag(CATALOG_TAG);
    return { ok: true, label: query.label, found: found.length, added, skipped: found.length - fresh.length };
  } catch (e) {
    return { ok: false, error: explain(e) };
  }
}

export interface GoogleHit {
  id: string;
  name: string;
  address: string | null;
  rating: number | null;
  reviews: number | null;
  known: boolean;
}

/** Busca livre ("Coco Bambu") para adicionar um lugar específico. */
export async function searchGoogle(text: string): Promise<{ ok: true; hits: GoogleHit[] } | { ok: false; error: string }> {
  await requireAdmin();
  const q = text.trim().slice(0, 80);
  if (q.length < 2) return { ok: true, hits: [] };
  try {
    const [found, known] = await Promise.all([textSearch(googleKey(), q, 1), getRepo().knownGoogleIds()]);
    return {
      ok: true,
      hits: found.slice(0, 8).map((p) => ({
        id: p.id,
        name: p.displayName?.text ?? "?",
        address: p.formattedAddress ?? null,
        rating: p.rating ?? null,
        reviews: p.userRatingCount ?? null,
        known: known.has(p.id),
      })),
    };
  } catch (e) {
    return { ok: false, error: explain(e) };
  }
}

/** Adiciona (ou atualiza) um lugar escolhido na busca livre, já aprovado. */
export async function importGooglePlace(googleId: string): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  await requireAdmin();
  try {
    const p = await placeDetails(googleKey(), googleId);
    const id = await getRepo().upsertImported({ ...placeRowFromGoogle(p), status: "approved" });
    updateTag(CATALOG_TAG);
    return { ok: true, id };
  } catch (e) {
    return { ok: false, error: explain(e) };
  }
}

function visionProvider(): VisionProvider | null {
  if (process.env.GEMINI_API_KEY) return "gemini";
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  return null;
}

/**
 * Vibe-check por foto do próximo lugar que ainda não passou pela IA.
 * Ambiente feio (nota estética abaixo de 4) volta para revisão.
 */
export async function visionNext(): Promise<
  { ok: true; name: string | null; aesthetic?: number; remaining: number } | { ok: false; error: string }
> {
  await requireAdmin();
  const provider = visionProvider();
  if (!provider) return { ok: false, error: "Falta GEMINI_API_KEY (grátis em aistudio.google.com) na Vercel." };
  const repo = getRepo();
  const queue = await repo.placesWithoutVision();
  const next = queue[0];
  if (!next) return { ok: true, name: null, remaining: 0 };
  try {
    const key = googleKey();
    const names = (await photoNames(key, next.googlePlaceId)).slice(0, 3);
    const images = (await Promise.all(names.map((n) => photoBytes(key, n.name, 800))))
      .filter((x) => !!x)
      .map((x): VisionImage => ({ mimeType: x.mimeType, base64: Buffer.from(x.bytes).toString("base64") }));
    if (images.length === 0) {
      await repo.setVision(next.id, { ai_model: "sem-foto" });
      return { ok: true, name: next.name, remaining: queue.length - 1 };
    }
    const v = await vibeCheck(provider, next.name, next.category ?? "", images);
    await repo.setVision(next.id, {
      vibe: v.occasions,
      seed_noise: v.noise,
      seed_spend: v.spend,
      ai_summary: v.summary || null,
      ai_aesthetic: v.aesthetic,
      ai_model: visionModelName(provider),
      ...(v.aesthetic < 4 ? { status: "pending" } : {}),
    });
    updateTag(CATALOG_TAG);
    return { ok: true, name: next.name, aesthetic: v.aesthetic, remaining: queue.length - 1 };
  } catch (e) {
    return { ok: false, error: explain(e) };
  }
}
