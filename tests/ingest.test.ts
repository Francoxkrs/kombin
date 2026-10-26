import assert from "node:assert/strict";
import { test } from "node:test";
import { type GPlace, neighborhoodOf, passesFilter } from "../src/lib/ingest/google";
import { heuristicVibe, placeRowFromGoogle, spendFromGoogle, tagsFromGoogle } from "../src/lib/ingest/heuristic";

const base: GPlace = {
  id: "g1",
  displayName: { text: "Lugar" },
  rating: 4.6,
  userRatingCount: 800,
  businessStatus: "OPERATIONAL",
  types: ["restaurant", "food"],
  photos: [{ name: "places/g1/photos/a" }],
};

const pagodeBar: GPlace = {
  ...base,
  primaryType: "bar",
  types: ["bar", "food"],
  primaryTypeDisplayName: { text: "Bar" },
  liveMusic: true,
  servesBeer: true,
  goodForGroups: true,
  outdoorSeating: true,
  priceLevel: "PRICE_LEVEL_MODERATE",
};

const wineBistro: GPlace = {
  ...base,
  primaryType: "italian_restaurant",
  types: ["italian_restaurant", "restaurant", "food"],
  primaryTypeDisplayName: { text: "Restaurante italiano" },
  servesWine: true,
  reservable: true,
  priceRange: { startPrice: { units: "100" }, endPrice: { units: "160" } },
};

const kidsPizza: GPlace = {
  ...base,
  primaryType: "pizza_restaurant",
  types: ["pizza_restaurant", "restaurant", "food"],
  menuForChildren: true,
  goodForGroups: true,
  parkingOptions: { freeParkingLot: true },
};

test("filtro: só lugar aberto, de comida, com foto e prova social", () => {
  assert.equal(passesFilter(base), true);
  assert.equal(passesFilter({ ...base, rating: 4.1 }), false);
  assert.equal(passesFilter({ ...base, userRatingCount: 90 }), false);
  assert.equal(passesFilter({ ...base, photos: [] }), false);
  assert.equal(passesFilter({ ...base, businessStatus: "CLOSED_PERMANENTLY" }), false);
  assert.equal(passesFilter({ ...base, types: ["gym", "point_of_interest"] }), false);
  assert.equal(passesFilter({ ...base, rating: 4.0 }, { minRating: 4, minReviews: 50 }), true);
});

test("atributos do Google viram etiquetas", () => {
  assert.deepEqual(tagsFromGoogle(pagodeBar).sort(), ["area-externa", "chopp", "grupos", "musica-ao-vivo"]);
  assert.ok(tagsFromGoogle(kidsPizza).includes("criancas"));
  assert.ok(tagsFromGoogle(kidsPizza).includes("estacionamento"));
  // Estacionamento só de rua não conta.
  assert.ok(!tagsFromGoogle({ ...base, parkingOptions: { freeStreetParking: true } }).includes("estacionamento"));
});

test("faixa de gasto vem do preço em reais ou do priceLevel", () => {
  assert.equal(spendFromGoogle(wineBistro), 3);
  assert.equal(spendFromGoogle({ ...base, priceRange: { startPrice: { units: "20" }, endPrice: { units: "40" } } }), 1);
  assert.equal(spendFromGoogle(pagodeBar), 2);
  assert.equal(spendFromGoogle(base), null);
});

test("cada tipo de lugar puxa a ocasião certa", () => {
  const bar = heuristicVibe(pagodeBar);
  assert.ok(bar.vibe.pagode >= 9, `pagode ${bar.vibe.pagode}`);
  assert.ok(bar.vibe.pagode > bar.vibe.encontro);
  assert.ok(bar.vibe.familia < 5);
  assert.equal(bar.noise, 3);

  const bistro = heuristicVibe(wineBistro);
  assert.ok(bistro.vibe.encontro > bistro.vibe.pagode);
  assert.ok(bistro.vibe.encontro >= 8, `encontro ${bistro.vibe.encontro}`);
  assert.equal(bistro.noise, 1);

  const pizza = heuristicVibe(kidsPizza);
  assert.ok(pizza.vibe.familia >= 8, `familia ${pizza.vibe.familia}`);
  assert.ok(pizza.cuisines.includes("pizza"));

  for (const h of [bar, bistro, pizza]) {
    for (const v of Object.values(h.vibe)) assert.ok(v >= 0 && v <= 10);
  }
});

test("linha da importação tem bairro, notas e resumo", () => {
  const row = placeRowFromGoogle({
    ...pagodeBar,
    formattedAddress: "Rua X, 10 - Centro, Campo Grande - MS",
    addressComponents: [{ longText: "Centro", types: ["sublocality_level_1", "sublocality"] }],
    location: { latitude: -20.46, longitude: -54.61 },
  });
  assert.equal(row.google_place_id, "g1");
  assert.equal(row.neighborhood, "Centro");
  assert.equal(row.seed_spend, 2);
  assert.match(row.ai_summary ?? "", /^Bar com música ao vivo/);
  assert.equal(neighborhoodOf(base), null);
});
