/**
 * Os termos do Google só deixam guardar latitude/longitude por 30 dias.
 * Este script renova as coordenadas com mais de 25 dias (Place Details Essentials,
 * 10.000 grátis por mês). Rode uma vez por semana: `npm run refresh`.
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });
config();

async function main() {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SECRET_KEY;
  if (!key || !url || !service) {
    console.error("Defina GOOGLE_MAPS_API_KEY, NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SECRET_KEY");
    process.exit(1);
  }
  const db = createClient(url, service);
  const cutoff = new Date(Date.now() - 25 * 86_400_000).toISOString();
  const { data, error } = await db
    .from("places")
    .select("id, google_place_id")
    .not("google_place_id", "is", null)
    .or(`coords_refreshed_at.is.null,coords_refreshed_at.lt.${cutoff}`);
  if (error) throw error;

  let ok = 0;
  for (const p of data) {
    const res = await fetch(`https://places.googleapis.com/v1/places/${p.google_place_id}`, {
      headers: { "X-Goog-Api-Key": key, "X-Goog-FieldMask": "location" },
    });
    if (!res.ok) {
      // Sem resposta, apagamos as coordenadas para não passar dos 30 dias.
      await db.from("places").update({ lat: null, lng: null, coords_refreshed_at: null }).eq("id", p.id);
      continue;
    }
    const { location } = (await res.json()) as { location?: { latitude: number; longitude: number } };
    await db
      .from("places")
      .update({
        lat: location?.latitude ?? null,
        lng: location?.longitude ?? null,
        coords_refreshed_at: new Date().toISOString(),
      })
      .eq("id", p.id);
    ok++;
  }
  console.log(`${ok} de ${data.length} coordenadas renovadas.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
