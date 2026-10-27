import assert from "node:assert/strict";
import { test } from "node:test";
import { parseRequest } from "../src/lib/nlq";

const BAIRROS = ["Centro", "Jardim dos Estados", "Chácara Cachoeira"];

test("frase de encontro vira ocasião, pessoas, orçamento, silêncio e bairro", () => {
  const r = parseRequest("Jantar a dois tranquilo até R$ 100 no Jardim dos Estados", BAIRROS);
  assert.equal(r.occasion, "encontro");
  assert.equal(r.party, "2");
  assert.equal(r.budget, "2");
  assert.equal(r.quiet, true);
  assert.equal(r.neighborhood, "Jardim dos Estados");
});

test("acentos e maiúsculas não atrapalham", () => {
  const r = parseRequest("ANIVERSÁRIO com 8 amigos, sem couvert, com música ao vivo", BAIRROS);
  assert.equal(r.occasion, "aniversario");
  assert.equal(r.party, "6+");
  assert.equal(r.noCover, true);
  assert.deepEqual(r.tags, ["musica-ao-vivo"]);
});

test("tipo de comida e etiquetas", () => {
  const r = parseRequest("sushi barato perto de mim com estacionamento e que aceite pet");
  assert.equal(r.cuisine, "japonesa");
  assert.equal(r.budget, "1");
  assert.equal(r.near, true);
  assert.deepEqual(r.tags.sort(), ["estacionamento", "pet"]);
});

test("palavra curta não casa dentro de outra", () => {
  const r = parseRequest("petiscos e chopp com a galera");
  assert.equal(r.cuisine, "petiscos");
  assert.ok(!r.tags.includes("pet"));
  assert.ok(r.tags.includes("chopp"));
  // galera já vira 6 ou mais; não precisa exigir "bom pra grupos" também.
  assert.equal(r.party, "6+");
  assert.ok(!r.tags.includes("grupos"));
});

test("valor por pessoa escolhe a faixa", () => {
  assert.equal(parseRequest("até 40 reais").budget, "1");
  assert.equal(parseRequest("uns 150 reais por pessoa").budget, "3");
  assert.equal(parseRequest("lugar chique").budget, "3");
});

test("frase sem nada conhecido não inventa filtro", () => {
  const r = parseRequest("me surpreenda");
  assert.deepEqual(r.understood, []);
  assert.equal(r.occasion, undefined);
});
