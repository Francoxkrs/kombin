import assert from "node:assert/strict";
import { test } from "node:test";
import { DEMO_PLACES } from "./fixtures";
import { isWithinCheckin } from "../src/lib/geo";
import { computeMatch, rankPlaces } from "../src/lib/match";
import { getOccasion } from "../src/lib/occasions";
import { buildTaste } from "../src/lib/taste";
import type { Place, PlaceSignals } from "../src/lib/types";
import { parseOpenMeteo, weatherMode, weatherNotice, type Weather } from "../src/lib/weather";

const none: PlaceSignals = { reviews: 0, spendAvg: null, noiseAvg: null, coverRatio: null };
const happy = getOccasion("happy-hour")!;
const encontro = getOccasion("encontro")!;
const byId = (id: string) => DEMO_PLACES.find((p) => p.id === id)!;
const places = new Map(DEMO_PLACES.map((p) => [p.id, p]));

const chuva: Weather = { raining: true, tempC: 22, isDay: false };
const frio: Weather = { raining: false, tempC: 14, isDay: false };
const noiteQuente: Weather = { raining: false, tempC: 29, isDay: false };
const tardeAmena: Weather = { raining: false, tempC: 25, isDay: true };

// ---------- Clima ----------

test("lê a resposta da Open-Meteo", () => {
  const w = parseOpenMeteo({ current: { temperature_2m: 17.4, precipitation: 0, weather_code: 63, is_day: 0 } });
  assert.deepEqual(w, { raining: true, tempC: 17.4, isDay: false });
  assert.equal(parseOpenMeteo({ erro: true }), null);
  assert.equal(parseOpenMeteo(null), null);
});

test("chuva, frio, noite quente e dia comum", () => {
  assert.equal(weatherMode(chuva), "rain");
  assert.equal(weatherMode(frio), "cold");
  assert.equal(weatherMode(noiteQuente), "warm-night");
  assert.equal(weatherMode(tardeAmena), null);
  assert.equal(weatherNotice(chuva), "Chovendo agora em CG · Priorizando lugares cobertos");
  assert.equal(weatherNotice(frio), "14 °C agora em CG · Priorizando lugares cobertos");
  assert.equal(weatherNotice(tardeAmena), null);
});

test("com chuva, área aberta desce e coberto sobe", () => {
  const rooftop = byId("demo-rooftop");
  const coberto: Place = { ...byId("demo-chopperia"), tags: [...byId("demo-chopperia").tags, "coberto"] };
  const seco = computeMatch(rooftop, none, happy)!;
  const molhado = computeMatch(rooftop, none, happy, { weather: chuva })!;
  assert.ok(molhado.compat < seco.compat - 5, `${seco.compat} -> ${molhado.compat}`);
  assert.equal(molhado.warning, "Área aberta, ruim com chuva");

  const antes = computeMatch(coberto, none, happy)!;
  const depois = computeMatch(coberto, none, happy, { weather: chuva })!;
  assert.ok(depois.compat > antes.compat, `${antes.compat} -> ${depois.compat}`);
  assert.ok(depois.checks.includes("Coberto, bom pra dia de chuva"));
});

test("lugar sem etiqueta de área aberta ou coberta não muda com o clima", () => {
  const adega = byId("demo-adega");
  assert.equal(computeMatch(adega, none, encontro, { weather: chuva })!.compat, computeMatch(adega, none, encontro)!.compat);
});

test("noite quente favorece área externa; dia comum não mexe em nada", () => {
  const rooftop = byId("demo-rooftop");
  const base = computeMatch(rooftop, none, happy)!.compat;
  assert.ok(computeMatch(rooftop, none, happy, { weather: noiteQuente })!.compat > base);
  assert.equal(computeMatch(rooftop, none, happy, { weather: tardeAmena })!.compat, base);
});

// ---------- Visita confirmada ----------

test("avaliação com visita confirmada pesa mais que a sem", () => {
  const adega = byId("demo-adega");
  const barulho = { reviews: 2, spendAvg: 3, noiseAvg: 3, coverRatio: 0 };
  const semConfirmar = computeMatch(adega, { ...barulho, verified: 0, weight: 2 }, encontro)!;
  const confirmadas = computeMatch(adega, { ...barulho, verified: 2, weight: 4 }, encontro)!;
  assert.ok(confirmadas.compat < semConfirmar.compat, `${semConfirmar.compat} -> ${confirmadas.compat}`);
  // Sem a migração (sem weight), vale a contagem como antes.
  assert.equal(computeMatch(adega, barulho, encontro)!.compat, semConfirmar.compat);
});

test("check-in: dentro do raio, com folga do GPS limitada", () => {
  assert.ok(isWithinCheckin(0.1, 20));
  assert.ok(isWithinCheckin(0.35, 120));
  assert.ok(!isWithinCheckin(0.45, 2000), "GPS ruim não estica o raio além de 150 m");
  assert.ok(!isWithinCheckin(3, 10));
});

// ---------- Gosto aprendido ----------

const now = Date.UTC(2026, 9, 26);
const day = 86_400_000;

test("sem uso, não há gosto; com buscas, aprende etiquetas e orçamento", () => {
  assert.equal(buildTaste([], [], places, now).n, 0);
  const t = buildTaste(
    [1, 2, 3].map((i) => ({ at: now - i * day, occasion: "encontro", cuisine: "japonesa", budget: 4, tags: ["drinks"], quiet: true })),
    [],
    places,
    now,
  );
  assert.ok(t.n > 2.8 && t.n < 3);
  assert.equal(t.cuisines.japonesa, 1);
  assert.equal(t.tags.drinks, 1);
  assert.equal(t.budget, 4);
  assert.equal(t.quiet, 1);
});

test("busca antiga vale menos que a de hoje", () => {
  const velha = buildTaste([{ at: now - 60 * day, occasion: "encontro", cuisine: null, budget: null, tags: [], quiet: false }], [], places, now);
  assert.ok(Math.abs(velha.n - 0.25) < 0.01);
});

test("quem sempre escolhe japonês e drinks vê o omakase subir", () => {
  const taste = buildTaste(
    [{ at: now, occasion: "encontro", cuisine: "japonesa", budget: 4, tags: ["drinks"], quiet: true }],
    [
      { at: now - day, placeId: "demo-omakase" },
      { at: now - 2 * day, placeId: "demo-omakase" },
    ],
    places,
    now,
  );
  // No happy hour o omakase está lá embaixo; o gosto puxa ele pra cima.
  const omakase = byId("demo-omakase");
  const antes = computeMatch(omakase, none, happy)!;
  const depois = computeMatch(omakase, none, happy, { taste })!;
  assert.ok(depois.compat > antes.compat, `${antes.compat} -> ${depois.compat}`);
  assert.ok(depois.checks.includes("Seu estilo: japonesa"), depois.checks.join(", "));

  // No encontro, desempata a favor do japonês, sem tirar ninguém da lista nem criar aviso.
  const semGosto = rankPlaces(DEMO_PLACES, new Map(), encontro);
  const comGosto = rankPlaces(DEMO_PLACES, new Map(), encontro, { taste });
  assert.equal(semGosto[0].place.id, "demo-adega");
  assert.equal(comGosto[0].place.id, "demo-omakase");
  assert.equal(comGosto.length, semGosto.length);
  assert.deepEqual(
    comGosto.map((r) => r.warning).filter((w) => w?.includes("estilo")),
    [],
  );
});

test("pouco uso ainda não mexe no índice", () => {
  const pouco = buildTaste([{ at: now, occasion: "encontro", cuisine: "japonesa", budget: 4, tags: [], quiet: false }], [], places, now);
  const omakase = byId("demo-omakase");
  assert.equal(computeMatch(omakase, none, encontro, { taste: pouco })!.compat, computeMatch(omakase, none, encontro)!.compat);
});
