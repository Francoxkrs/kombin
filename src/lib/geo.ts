/** Distância em km entre dois pontos (fórmula de Haversine). Roda igual no servidor e no navegador. */
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

/** Raio do check-in: perto o bastante da porta, com folga para o GPS do celular. */
export const CHECKIN_RADIUS_M = 250;

/** A pessoa está no lugar? Desconta até 150 m de imprecisão informada pelo GPS. */
export function isWithinCheckin(km: number, accuracyM: number): boolean {
  return km * 1000 <= CHECKIN_RADIUS_M + Math.min(Math.max(accuracyM, 0), 150);
}
