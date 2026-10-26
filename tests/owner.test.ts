import assert from "node:assert/strict";
import { test } from "node:test";
import { encode } from "blurhash";
import { blurhash, menuPageMeta, ownerForm } from "../src/lib/validation";

const id = "6f1c2a3e-1111-4222-8333-444455556666";

test("BlurHash de verdade passa; texto qualquer não", () => {
  const pixels = new Uint8ClampedArray(8 * 8 * 4).fill(180);
  const hash = encode(pixels, 8, 8, 4, 3);
  assert.ok(blurhash.safeParse(hash).success);
  assert.ok(!blurhash.safeParse("<script>").success);
  assert.ok(!blurhash.safeParse("x".repeat(200)).success);
});

test("medidas da página do cardápio precisam ser inteiras e razoáveis", () => {
  assert.ok(menuPageMeta.safeParse({ blurhash: null, w: 900, h: 1200 }).success);
  assert.ok(!menuPageMeta.safeParse({ blurhash: null, w: 0, h: 1200 }).success);
  assert.ok(!menuPageMeta.safeParse({ blurhash: null, w: 90000, h: 1200 }).success);
});

test("painel do dono: recado limpo e etiquetas só da lista", () => {
  const base = { placeId: id, instagram: "", menuUrl: "", cuisines: [] };
  const ok = ownerForm.parse({ ...base, about: "  Jazz na sexta\u0007 ", tags: ["musica-ao-vivo"] });
  assert.equal(ok.about, "Jazz na sexta");
  assert.deepEqual(ok.tags, ["musica-ao-vivo"]);
  assert.equal(ownerForm.parse({ ...base, about: "", tags: [] }).about, null);
  assert.ok(!ownerForm.safeParse({ ...base, about: "a".repeat(281), tags: [] }).success);
  assert.ok(!ownerForm.safeParse({ ...base, about: "", tags: ["inventada"] }).success);
});
