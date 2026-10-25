import assert from "node:assert/strict";
import { test } from "node:test";
import { DEMO_PLACES } from "./fixtures";
import { computeMatch, rankPlaces } from "../src/lib/match";
import { getOccasion } from "../src/lib/occasions";
import type { Place, PlaceSignals } from "../src/lib/types";

const none: PlaceSignals = { reviews: 0, spendAvg: null, noiseAvg: null, coverRatio: null };
const encontro = getOccasion("encontro")!;
const pagode = getOccasion("pagode")!;
const byId = (id: string) => DEMO_PLACES.find((p) => p.id === id)!;

test("encontro prefere o bistrô calmo e tira o bar de samba", () => {
  const ranked = rankPlaces(DEMO_PLACES, new Map(), encontro);
  assert.equal(ranked[0].place.id, "demo-adega");
  assert.ok(!ranked.some((r) => r.place.id === "demo-varanda"), "vibe 3 < 4 elimina");
});

test("pagode inverte o ranking", () => {
  const ranked = rankPlaces(DEMO_PLACES, new Map(), pagode);
  assert.equal(ranked[0].place.id, "demo-varanda");
});

test("sem couvert elimina quem cobra", () => {
  const ranked = rankPlaces(DEMO_PLACES, new Map(), pagode, { noCover: true });
  assert.ok(!ranked.some((r) => r.place.id === "demo-varanda"));
});

test("orçamento econômico elimina o omakase caro", () => {
  const ranked = rankPlaces(DEMO_PLACES, new Map(), encontro, { budget: 1 });
  assert.ok(!ranked.some((r) => r.place.id === "demo-omakase"));
});

test("nunca passa de 99% e explica o porquê", () => {
  const r = computeMatch(byId("demo-adega"), none, encontro)!;
  assert.ok(r.compat <= 99 && r.compat >= 80, `compat ${r.compat}`);
  assert.ok(r.reasons.includes("Dá pra conversar"));
  assert.ok(r.reasons.includes("Sem couvert"));
});

test("micro-reviews da galera vencem a estimativa inicial", () => {
  const adega = byId("demo-adega");
  const barulhento: PlaceSignals = { reviews: 8, spendAvg: 3, noiseAvg: 3, coverRatio: 1 };
  const antes = computeMatch(adega, none, encontro)!;
  const depois = computeMatch(adega, barulhento, encontro)!;
  assert.ok(depois.compat < antes.compat - 15, `${antes.compat} -> ${depois.compat}`);
  assert.equal(depois.warning, "Pode ser barulhento");
});

test("lugar sem nota de vibe para a ocasião não aparece", () => {
  assert.equal(computeMatch({ ...byId("demo-adega"), vibe: {} }, none, encontro), null);
});

test("lugar com vibe mediana e sem outros dados fica em 50%", () => {
  const vazio: Place = {
    ...byId("demo-adega"),
    vibe: { encontro: 5 },
    seedNoise: null,
    seedCover: null,
    seedSpend: null,
  };
  const r = computeMatch(vazio, none, encontro)!;
  assert.equal(r.compat, 50);
  assert.deepEqual(r.reasons, []);
});

test("lugar pendente não aparece", () => {
  assert.equal(computeMatch({ ...byId("demo-adega"), status: "pending" }, none, encontro), null);
});

test("aniversário com pizza mostra só pizzaria", () => {
  const aniversario = getOccasion("aniversario")!;
  const ranked = rankPlaces(DEMO_PLACES, new Map(), aniversario, { cuisine: "pizza" });
  assert.ok(ranked.length >= 2);
  assert.ok(ranked.every((r) => r.place.cuisines.includes("pizza")));
  assert.equal(ranked[0].place.id, "demo-forno");
});
