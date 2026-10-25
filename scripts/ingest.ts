/**
 * Ingestão automática com filtro estético (Pipeline V2).
 *
 *   1. Busca lugares em Campo Grande no Google Places (Text Search).
 *   2. Filtra por prova social: nota >= 4.2 e 200+ avaliações (ajustável).
 *   3. Baixa até 3 fotos de cada candidato.
 *   4. Vibe-check com IA de visão: nota estética e nota por ocasião.
 *   5. Grava no Supabase: aprovado (>= 7), para revisão (5 a 7) ou rejeitado.
 *
 * Uso:
 *   npm run ingest -- --dry-run            # não grava nada, salva scripts/out/ingest-*.json
 *   npm run ingest -- --limit 40           # no máximo 40 lugares vão para a IA nesta rodada
 *   npm run ingest -- --provider anthropic # usa Claude Haiku em vez do Gemini
 *
 * Custo: cada candidato gasta 3 fotos do Google (1.000 grátis/mês) e 1 chamada de IA.
 * Lugares que já estão no banco são pulados, então dá para rodar em várias levas.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { vibeCheck, visionModelName, type VisionImage, type VisionProvider } from "./lib/vision";

config({ path: ".env.local" });
config();

const args = process.argv.slice(2);
const flag = (name: string) => args.includes(`--${name}`);
const opt = (name: string, def: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : def;
};

const DRY_RUN = flag("dry-run");
const LIMIT = Number(opt("limit", "60"));
const MIN_RATING = Number(opt("min-rating", "4.2"));
const MIN_REVIEWS = Number(opt("min-reviews", "200"));
const PHOTOS = Number(opt("photos", "3"));
const PROVIDER = opt("provider", "gemini") as VisionProvider;
const DELAY_MS = Number(opt("delay-ms", PROVIDER === "gemini" ? "6500" : "300"));
const APPROVE_AT = 7;
const REVIEW_AT = 5;

const QUERIES = [
  "restaurante",
  "restaurante romântico",
  "bistrô",
  "bar",
  "bar com música ao vivo",
  "choperia",
  "pizzaria",
  "restaurante japonês",
  "hamburgueria",
  "cafeteria",
  "rooftop drinks",
  "restaurante para família",
  "comida regional pantaneira",
  "churrascaria",
];

// Retângulo em volta da área urbana de Campo Grande.
const CAMPO_GRANDE = {
  rectangle: {
    low: { latitude: -20.58, longitude: -54.74 },
    high: { latitude: -20.37, longitude: -54.5 },
  },
};

const GOOGLE_KEY = process.env.GOOGLE_MAPS_API_KEY;
if (!GOOGLE_KEY) {
  console.error("Defina GOOGLE_MAPS_API_KEY no .env.local");
  process.exit(1);
}

interface GPlace {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  location?: { latitude: number; longitude: number };
  rating?: number;
  userRatingCount?: number;
  primaryTypeDisplayName?: { text: string };
  businessStatus?: string;
  addressComponents?: { longText: string; types: string[] }[];
  photos?: { name: string }[];
}

const FIELDS = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.location",
  "places.rating",
  "places.userRatingCount",
  "places.primaryTypeDisplayName",
  "places.businessStatus",
  "places.addressComponents",
  "places.photos",
  "nextPageToken",
].join(",");

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function textSearch(query: string): Promise<GPlace[]> {
  const out: GPlace[] = [];
  let pageToken: string | undefined;
  for (let page = 0; page < 3; page++) {
    const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_KEY!,
        "X-Goog-FieldMask": FIELDS,
      },
      body: JSON.stringify({
        textQuery: `${query} em Campo Grande MS`,
        languageCode: "pt-BR",
        regionCode: "BR",
        pageSize: 20,
        locationRestriction: CAMPO_GRANDE,
        pageToken,
      }),
    });
    if (!res.ok) throw new Error(`Text Search ${res.status}: ${await res.text()}`);
    const data = (await res.json()) as { places?: GPlace[]; nextPageToken?: string };
    out.push(...(data.places ?? []));
    pageToken = data.nextPageToken;
    if (!pageToken) break;
    await sleep(1500);
  }
  return out;
}

async function fetchPhoto(name: string): Promise<VisionImage | null> {
  const res = await fetch(
    `https://places.googleapis.com/v1/${name}/media?maxWidthPx=800&key=${GOOGLE_KEY}`,
  );
  if (!res.ok) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  return { mimeType: res.headers.get("content-type") ?? "image/jpeg", base64: buf.toString("base64") };
}

function neighborhood(p: GPlace): string | null {
  const c = p.addressComponents?.find(
    (a) => a.types.includes("sublocality_level_1") || a.types.includes("sublocality"),
  );
  return c?.longText ?? null;
}

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!DRY_RUN && (!supabaseUrl || !supabaseKey)) {
    console.error("Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY, ou rode com --dry-run");
    process.exit(1);
  }
  const db = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

  // 1. Busca
  const found = new Map<string, GPlace>();
  for (const q of QUERIES) {
    const results = await textSearch(q);
    for (const p of results) found.set(p.id, p);
    console.log(`busca "${q}": ${results.length} (total único: ${found.size})`);
  }

  // 2. Prova social
  const known = new Set<string>();
  if (db) {
    const { data, error } = await db.from("places").select("google_place_id").not("google_place_id", "is", null);
    if (error) throw error;
    for (const r of data) known.add(r.google_place_id as string);
  }
  const candidates = [...found.values()]
    .filter(
      (p) =>
        p.businessStatus !== "CLOSED_PERMANENTLY" &&
        (p.rating ?? 0) >= MIN_RATING &&
        (p.userRatingCount ?? 0) >= MIN_REVIEWS &&
        (p.photos?.length ?? 0) > 0 &&
        !known.has(p.id),
    )
    .sort((a, b) => (b.userRatingCount ?? 0) - (a.userRatingCount ?? 0))
    .slice(0, LIMIT);
  console.log(
    `\n${found.size} encontrados · ${known.size} já no banco · ${candidates.length} vão para o vibe-check (limite ${LIMIT})\n`,
  );

  // 3 e 4. Fotos + vibe-check
  const results: object[] = [];
  let approved = 0;
  for (const [i, p] of candidates.entries()) {
    const name = p.displayName?.text ?? "?";
    try {
      const images = (
        await Promise.all((p.photos ?? []).slice(0, PHOTOS).map((ph) => fetchPhoto(ph.name)))
      ).filter((x): x is VisionImage => !!x);
      if (images.length === 0) continue;

      const v = await vibeCheck(PROVIDER, name, p.primaryTypeDisplayName?.text ?? "", images);
      const best = Math.max(0, ...Object.values(v.occasions));
      const status =
        best >= APPROVE_AT && v.aesthetic >= REVIEW_AT
          ? "approved"
          : best >= REVIEW_AT
            ? "pending"
            : "rejected";
      if (status === "approved") approved++;
      console.log(
        `[${i + 1}/${candidates.length}] ${status.padEnd(8)} estética ${v.aesthetic} · melhor ocasião ${best} · ${name}`,
      );

      // 5. Grava. Do Google guardamos só o place_id, nome, endereço e coordenadas
      // (renovadas a cada 30 dias por `npm run refresh`). Nota e fotos são buscadas ao vivo.
      const row = {
        google_place_id: p.id,
        name,
        category: p.primaryTypeDisplayName?.text ?? null,
        neighborhood: neighborhood(p),
        address: p.formattedAddress ?? null,
        lat: p.location?.latitude ?? null,
        lng: p.location?.longitude ?? null,
        coords_refreshed_at: new Date().toISOString(),
        status,
        vibe: v.occasions,
        seed_noise: v.noise,
        seed_spend: v.spend,
        ai_summary: v.summary || null,
        ai_aesthetic: v.aesthetic,
        ai_model: visionModelName(PROVIDER),
      };
      results.push(row);
      if (db && !DRY_RUN) {
        const { error } = await db.from("places").upsert(row, { onConflict: "google_place_id" });
        if (error) throw error;
      }
    } catch (e) {
      console.error(`[${i + 1}] erro em ${name}:`, e instanceof Error ? e.message : e);
    }
    await sleep(DELAY_MS);
  }

  mkdirSync("scripts/out", { recursive: true });
  const file = `scripts/out/ingest-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  writeFileSync(file, JSON.stringify(results, null, 2));
  console.log(`\n${approved} aprovados de ${candidates.length}. Resultado em ${file}${DRY_RUN ? " (dry-run: nada gravado)" : ""}`);
  console.log("Revise os 'pending' em /admin.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
