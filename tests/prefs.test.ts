import assert from "node:assert/strict";
import { test } from "node:test";
import { isSearch, searchLoginHref } from "../src/lib/prefs";

test("filtro na URL é busca; lista pura e tipo de comida não", () => {
  assert.equal(isSearch({}), false);
  assert.equal(isSearch({ c: "japonesa" }), false);
  assert.equal(isSearch({ b: "2" }), true);
  assert.equal(isSearch({ nc: "1" }), true);
  assert.equal(isSearch({ lat: "-20.4", lng: "-54.6" }), true);
});

test("login da busca volta para os resultados", () => {
  assert.equal(searchLoginHref("/o/date?b=2"), "/entrar?motivo=busca&next=%2Fo%2Fdate%3Fb%3D2");
});
