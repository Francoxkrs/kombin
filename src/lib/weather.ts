/**
 * Clima de agora em Campo Grande (Open-Meteo, grátis, sem chave). Muda o índice:
 * com chuva ou frio, lugar coberto sobe e área aberta desce; em noite quente e seca,
 * área externa ganha um empurrão.
 */

/** Centro de Campo Grande-MS. */
export const CAMPO_GRANDE = { lat: -20.4697, lng: -54.6201 };

/** Abaixo disso, ficar ao ar livre deixa de ser programa. */
export const COLD_BELOW_C = 18;
/** A partir disso, à noite e sem chuva, área externa vira vantagem. */
export const WARM_FROM_C = 24;

export interface Weather {
  raining: boolean;
  tempC: number;
  isDay: boolean;
}

export type WeatherMode = "rain" | "cold" | "warm-night";

/** Códigos WMO de chuva, garoa, pancada e trovoada. */
const RAIN_CODES = new Set([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99]);

/** Lê a resposta de /v1/forecast?current=temperature_2m,precipitation,weather_code,is_day. */
export function parseOpenMeteo(json: unknown): Weather | null {
  const c = (json as { current?: Record<string, unknown> } | null)?.current;
  if (!c || typeof c.temperature_2m !== "number") return null;
  const precipitation = typeof c.precipitation === "number" ? c.precipitation : 0;
  const code = typeof c.weather_code === "number" ? c.weather_code : 0;
  return {
    raining: precipitation >= 0.2 || RAIN_CODES.has(code),
    tempC: c.temperature_2m,
    isDay: c.is_day !== 0,
  };
}

export function weatherMode(w: Weather | null | undefined): WeatherMode | null {
  if (!w) return null;
  if (w.raining) return "rain";
  if (w.tempC < COLD_BELOW_C) return "cold";
  if (!w.isDay && w.tempC >= WARM_FROM_C) return "warm-night";
  return null;
}

/** Aviso do topo da lista: "Chovendo agora em CG · Priorizando lugares cobertos". */
export function weatherNotice(w: Weather | null | undefined): string | null {
  const mode = weatherMode(w);
  if (!mode || !w) return null;
  const temp = `${Math.round(w.tempC)} °C`;
  if (mode === "rain") return "Chovendo agora em CG · Priorizando lugares cobertos";
  if (mode === "cold") return `${temp} agora em CG · Priorizando lugares cobertos`;
  return `Noite quente em CG (${temp}) · Área externa em alta`;
}
