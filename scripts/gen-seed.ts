/** Gera supabase/seed.sql (só para o banco LOCAL) a partir de tests/fixtures.ts. */
import { writeFileSync } from "node:fs";
import { DEMO_PLACES } from "../tests/fixtures";

const q = (v: unknown) =>
  v == null ? "null" : typeof v === "string" ? `'${v.replace(/'/g, "''")}'` : String(v);

const rows = DEMO_PLACES.map(
  (p) =>
    `  (md5(${q(p.id)})::uuid, ${q(p.name)}, ${q(p.category)}, ${q(p.neighborhood)}, ${p.lat}, ${p.lng}, now(), ${q(p.whatsapp)}, 'approved', ${q(p.seedSpend)}, ${q(p.seedNoise)}, ${q(p.seedCover)}, ${q(JSON.stringify(p.vibe))}::jsonb, ${q(p.aiSummary)}, array[${p.cuisines.map(q).join(", ")}]::text[], array[${p.tags.map(q).join(", ")}]::text[], ${q(p.coverUrl)}, ${p.featured})`,
);

writeFileSync(
  "supabase/seed.sql",
  `-- Lugares FICTÍCIOS para desenvolvimento local (\`npx supabase db reset\`).
-- Este arquivo não roda no projeto de produção. Gerado por scripts/gen-seed.ts.
insert into places (id, name, category, neighborhood, lat, lng, coords_refreshed_at, whatsapp, status, seed_spend, seed_noise, seed_cover, vibe, ai_summary, cuisines, tags, cover_url, featured) values
${rows.join(",\n")};
`,
);
console.log(`supabase/seed.sql: ${rows.length} lugares`);
