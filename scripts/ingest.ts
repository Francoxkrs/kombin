/**
 * Importação pelo terminal (a mesma do /admin > Importar do Google, em lote).
 *
 *   1. Busca restaurantes em Campo Grande no Google Places (uma busca por tipo de comida/ocasião).
 *   2. Filtra: aberto, de comer/beber, com foto, nota >= 4,2 e 150+ avaliações (ajustável).
 *   3. Dá notas por ocasião por regra, a partir dos atributos do Google (música ao vivo, grupos...).
 *   4. Com --vision, manda 3 fotos para a IA de visão e refina as notas pelo ambiente.
 *   5. Grava no Supabase como aprovado (com --vision, ambiente feio volta para revisão).
 *
 * Uso:
 *   npm run ingest -- --dry-run              # não grava nada, salva scripts/out/ingest-*.json
 *   npm run ingest -- --limit 40             # no máximo 40 lugares novos nesta rodada
 *   npm run ingest -- --vision               # também roda o vibe-check (GEMINI_API_KEY)
 *   npm run ingest -- --vision --provider anthropic
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { passesFilter, photoBytes, QUERIES, textSearch, type GPlace } from "../src/lib/ingest/google";
import { placeRowFromGoogle } from "../src/lib/ingest/heuristic";
import { vibeCheck, visionModelName, type VisionImage, type VisionProvider } from "../src/lib/ingest/vision";
import { supabaseSecretKey, supabaseUrl as envSupabaseUrl } from "../src/lib/supabase/env";

config({ path: ".env.local" });
config();

const args = process.argv.slice(2);
const flag = (name: string) => args.includes(`--${name}`);
const opt = (name: string, def: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : def;
};

const DRY_RUN = flag("dry-run");
const VISION = flag("vision");
const LIMIT = Number(opt("limit", "80"));
const PROOF = { minRating: Number(opt("min-rating", "4.2")), minReviews: Number(opt("min-reviews", "150")) };
const PROVIDER = opt("provider", "gemini") as VisionProvider;
const DELAY_MS = Number(opt("delay-ms", PROVIDER === "gemini" ? "6500" : "300"));

const GOOGLE_KEY = process.env.GOOGLE_MAPS_API_KEY;
if (!GOOGLE_KEY) {
  console.error("Defina GOOGLE_MAPS_API_KEY no .env.local");
  process.exit(1);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function photosFor(p: GPlace): Promise<VisionImage[]> {
  const list = await Promise.all((p.photos ?? []).slice(0, 3).map((ph) => photoBytes(GOOGLE_KEY!, ph.name, 800)));
  return list
    .filter((x) => !!x)
    .map((x) => ({ mimeType: x.mimeType, base64: Buffer.from(x.bytes).toString("base64") }));
}

async function main() {
  const url = envSupabaseUrl();
  const key = supabaseSecretKey();
  if (!DRY_RUN && (!url || !key)) {
    console.error("Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SECRET_KEY, ou rode com --dry-run");
    process.exit(1);
  }
  const db = url && key ? createClient(url, key) : null;

  const found = new Map<string, GPlace>();
  for (const q of QUERIES) {
    const results = await textSearch(GOOGLE_KEY!, q.q, 1);
    for (const p of results) found.set(p.id, p);
    console.log(`busca "${q.label}": ${results.length} (total único: ${found.size})`);
  }

  const known = new Set<string>();
  if (db) {
    const { data, error } = await db.from("places").select("google_place_id").not("google_place_id", "is", null);
    if (error) throw error;
    for (const r of data) known.add(r.google_place_id as string);
  }
  const candidates = [...found.values()]
    .filter((p) => passesFilter(p, PROOF) && !known.has(p.id))
    .sort((a, b) => (b.userRatingCount ?? 0) - (a.userRatingCount ?? 0))
    .slice(0, LIMIT);
  console.log(`\n${found.size} encontrados · ${known.size} já no banco · ${candidates.length} novos (limite ${LIMIT})\n`);

  const rows: object[] = [];
  for (const [i, p] of candidates.entries()) {
    const name = p.displayName?.text ?? "?";
    try {
      const row: Record<string, unknown> = { ...placeRowFromGoogle(p), status: "approved", imported_at: new Date().toISOString() };
      if (VISION) {
        const images = await photosFor(p);
        if (images.length > 0) {
          const v = await vibeCheck(PROVIDER, name, p.primaryTypeDisplayName?.text ?? "", images);
          Object.assign(row, {
            vibe: v.occasions,
            seed_noise: v.noise,
            seed_spend: v.spend ?? row.seed_spend,
            ai_summary: v.summary || row.ai_summary,
            ai_aesthetic: v.aesthetic,
            ai_model: visionModelName(PROVIDER),
            status: v.aesthetic < 4 ? "pending" : "approved",
          });
        }
        await sleep(DELAY_MS);
      }
      console.log(`[${i + 1}/${candidates.length}] ${String(row.status).padEnd(8)} ${name}`);
      rows.push(row);
      if (db && !DRY_RUN) {
        const { error } = await db.from("places").upsert(row, { onConflict: "google_place_id" });
        if (error) throw error;
      }
    } catch (e) {
      console.error(`[${i + 1}] erro em ${name}:`, e instanceof Error ? e.message : e);
    }
  }

  mkdirSync("scripts/out", { recursive: true });
  const file = `scripts/out/ingest-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  writeFileSync(file, JSON.stringify(rows, null, 2));
  console.log(`\n${rows.length} lugares. Resultado em ${file}${DRY_RUN ? " (dry-run: nada gravado)" : ""}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
