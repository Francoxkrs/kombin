import "server-only";

/**
 * Dados do Google buscados AO VIVO (os termos não deixam guardar nota, fotos e reviews).
 * Sem GOOGLE_MAPS_API_KEY, tudo aqui devolve null e o app segue sem esses dados.
 *
 * Custos (cotas grátis mensais em out/2026; confira em developers.google.com/maps/billing-and-pricing/pricing):
 *  - liveInfo: Place Details Enterprise, 1.000 grátis/mês, depois US$ 20 por mil
 *  - fotos: veja src/app/api/photo/[id]/route.ts
 */

const API = "https://places.googleapis.com/v1";

function key(): string | null {
  return process.env.GOOGLE_MAPS_API_KEY || null;
}

async function details<T>(placeId: string, fieldMask: string): Promise<T | null> {
  const k = key();
  if (!k) return null;
  const res = await fetch(`${API}/places/${encodeURIComponent(placeId)}?languageCode=pt-BR`, {
    headers: { "X-Goog-Api-Key": k, "X-Goog-FieldMask": fieldMask },
    cache: "no-store",
  });
  if (!res.ok) {
    console.error("Google Places", res.status, await res.text().catch(() => ""));
    return null;
  }
  return (await res.json()) as T;
}

export interface LiveInfo {
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
  nationalPhoneNumber?: string;
  regularOpeningHours?: { openNow?: boolean; weekdayDescriptions?: string[] };
}

export function liveInfo(placeId: string) {
  return details<LiveInfo>(
    placeId,
    "rating,userRatingCount,googleMapsUri,nationalPhoneNumber,regularOpeningHours.openNow,regularOpeningHours.weekdayDescriptions",
  );
}
