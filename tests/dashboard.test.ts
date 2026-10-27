import assert from "node:assert/strict";
import { test } from "node:test";
import {
  cgDay,
  change,
  countByDay,
  lastDays,
  ownerTips,
  splitPeriods,
  summarizeReviews,
  topCounts,
  type ReviewRow,
} from "../src/lib/dashboard";

// 27/10/2026 às 15h em Campo Grande (19h UTC).
const NOW = Date.parse("2026-10-27T19:00:00Z");

test("cgDay usa o fuso de Campo Grande", () => {
  // 02h UTC do dia 27 ainda é 22h do dia 26 em Campo Grande.
  assert.equal(cgDay("2026-10-27T02:00:00Z"), "2026-10-26");
  assert.equal(cgDay("2026-10-27T05:00:00Z"), "2026-10-27");
});

test("lastDays termina hoje e countByDay preenche dias vazios", () => {
  const days = lastDays(3, NOW);
  assert.deepEqual(days, ["2026-10-25", "2026-10-26", "2026-10-27"]);
  const counts = countByDay(["2026-10-27T12:00:00Z", "2026-10-27T13:00:00Z", "2026-10-25T12:00:00Z", "2026-09-01T12:00:00Z"], 3, NOW);
  assert.deepEqual(
    counts.map((c) => c.count),
    [1, 0, 2],
  );
});

test("change não inventa porcentagem sem base", () => {
  assert.equal(change(10, 0), null);
  assert.equal(change(15, 10), 50);
  assert.equal(change(5, 10), -50);
});

test("splitPeriods separa os dois períodos", () => {
  const day = 86_400_000;
  const t = (d: number) => new Date(NOW - d * day).toISOString();
  assert.deepEqual(splitPeriods([t(1), t(29), t(31), t(59), t(61)], 30, NOW), { current: 2, previous: 2 });
});

test("topCounts ordena pelo mais frequente", () => {
  assert.deepEqual(topCounts(["a", "b", "b", "c", "b", "a"], 2), [
    { key: "b", count: 3 },
    { key: "a", count: 2 },
  ]);
});

const review = (r: Partial<ReviewRow>): ReviewRow => ({
  spend: 2,
  cover: false,
  noise: 2,
  occasion: null,
  verified: false,
  createdAt: "2026-10-20T20:00:00Z",
  ...r,
});

test("summarizeReviews conta faixas e couvert", () => {
  const s = summarizeReviews([review({ spend: 1, cover: true }), review({ spend: 1, verified: true }), review({ noise: 3 })]);
  assert.equal(s.total, 3);
  assert.equal(s.verified, 1);
  assert.equal(s.spend.find((x) => x.band === 1)!.count, 2);
  assert.equal(s.noise.find((x) => x.level === 3)!.count, 1);
  assert.equal(s.coverShare, 1 / 3);
  assert.equal(summarizeReviews([]).coverShare, null);
});

test("ownerTips só fala do que os clientes disseram com 3 avaliações ou mais", () => {
  const place = { about: null, whatsapp: "5567999999999", menuCount: 1 };
  const loud = [review({ noise: 3, cover: true }), review({ noise: 3, cover: true })];
  assert.deepEqual(ownerTips(summarizeReviews(loud), place, { whatsapp: 0, directions: 0 }), []);

  const tips = ownerTips(summarizeReviews([...loud, review({ noise: 3 })]), place, { whatsapp: 0, directions: 0 });
  assert.ok(tips.some((t) => t.includes("som é alto")));
  assert.ok(tips.some((t) => t.includes("couvert")));

  // Recado que já fala de couvert não recebe a dica de novo.
  const told = ownerTips(summarizeReviews([...loud, review({ noise: 3 })]), { ...place, about: "Couvert de R$ 15 na sexta" }, { whatsapp: 0, directions: 0 });
  assert.ok(!told.some((t) => t.includes("paga couvert")));
});

test("ownerTips pede WhatsApp e cardápio quando faltam", () => {
  const tips = ownerTips(summarizeReviews([]), { about: null, whatsapp: null, menuCount: 0 }, { whatsapp: 0, directions: 4 });
  assert.equal(tips.length, 2);
  assert.ok(tips[0].startsWith("4 pessoas pediram rota"));
});
