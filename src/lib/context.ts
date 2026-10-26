import "server-only";
import { unstable_cache } from "next/cache";
import { cookies } from "next/headers";
import { cache } from "react";
import { DEVICE_COOKIE } from "./device-cookie";
import type { MatchPrefs } from "./match";
import { getRepo } from "./repo";
import { buildTaste, MIN_TASTE, type Taste } from "./taste";
import type { Place } from "./types";
import { CAMPO_GRANDE, parseOpenMeteo, type Weather, weatherMode, weatherNotice } from "./weather";

const OPEN_METEO =
  "https://api.open-meteo.com/v1/forecast?" +
  new URLSearchParams({
    latitude: String(CAMPO_GRANDE.lat),
    longitude: String(CAMPO_GRANDE.lng),
    current: "temperature_2m,precipitation,weather_code,is_day",
    timezone: "America/Campo_Grande",
  });

/** Clima de agora em Campo Grande, guardado por 15 minutos. Se a Open-Meteo falhar, o índice segue sem clima. */
export const getWeather = cache(async (): Promise<Weather | null> => {
  try {
    const res = await fetch(OPEN_METEO, { next: { revalidate: 900 }, signal: AbortSignal.timeout(2000) });
    return res.ok ? parseOpenMeteo(await res.json()) : null;
  } catch (e) {
    console.warn("clima indisponível", e);
    return null;
  }
});

/** Id anônimo do aparelho (o proxy cria na primeira visita). */
export const getDeviceId = async () => (await cookies()).get(DEVICE_COOKIE)?.value ?? null;

/** Gosto aprendido (null enquanto a pessoa ainda não usou o bastante). */
export async function getTaste(userId: string | null, places: Map<string, Place>): Promise<Taste | null> {
  const device = await getDeviceId();
  if (!userId && !device) return null;
  try {
    const events = await unstable_cache(() => getRepo().tasteEvents(userId, device), ["taste", userId ?? "", device ?? ""], {
      revalidate: 60,
    })();
    const taste = buildTaste(events.searches, events.choices, places);
    return taste.n >= MIN_TASTE ? taste : null;
  } catch (e) {
    console.warn("gosto não carregado (rodou a migração 0006?)", e);
    return null;
  }
}

/** Clima + gosto, prontos para entrar no rankPlaces/computeMatch. */
export async function getMatchContext(
  userId: string | null,
  places: Map<string, Place>,
): Promise<Pick<MatchPrefs, "weather" | "taste">> {
  const [weather, taste] = await Promise.all([getWeather(), getTaste(userId, places)]);
  return { weather, taste };
}

export type ContextNoteKind = "rain" | "cold" | "warm-night" | "taste";
export interface ContextNote {
  kind: ContextNoteKind;
  text: string;
}

/** Avisos do topo da lista: por que a ordem mudou agora. */
export function contextNotes(ctx: Pick<MatchPrefs, "weather" | "taste">): ContextNote[] {
  const notes: ContextNote[] = [];
  const mode = weatherMode(ctx.weather);
  const w = weatherNotice(ctx.weather);
  if (mode && w) notes.push({ kind: mode, text: w });
  if (ctx.taste) {
    // MIN_TASTE garante pelo menos duas buscas ou uma escolha + uma busca.
    notes.push({ kind: "taste", text: `No seu estilo · aprendido com ${ctx.taste.events} buscas e escolhas suas` });
  }
  return notes;
}

/**
 * Guarda a busca (sem localização) para aprender o gosto e medir o uso. Falha em silêncio.
 * Roda dentro de after(), onde cookies() não pode ser lido: o aparelho vem de fora.
 */
export async function logSearch(userId: string | null, device: string | null, occasion: string, prefs: MatchPrefs): Promise<void> {
  if (!device) return;
  await getRepo()
    .logSearch({
      userId,
      deviceId: device,
      occasion,
      cuisine: prefs.cuisine ?? null,
      budget: prefs.budget ?? null,
      party: prefs.party ?? null,
      neighborhood: prefs.neighborhood ?? null,
      tags: prefs.tags ?? [],
      quiet: !!prefs.quiet,
      noCover: !!prefs.noCover,
    })
    .catch((e) => console.warn("busca não registrada (rodou a migração 0006?)", e));
}
