import assert from "node:assert/strict";
import { test } from "node:test";
import { safeNext } from "../src/lib/safe-next";
import { readImageUpload, sniffImageType, stripImageMetadata } from "../src/lib/upload";
import { claimForm, decisionForm, microReviewBody, ownerForm, voteBody } from "../src/lib/validation";

const bytes = (...parts: (number[] | string)[]) =>
  new Uint8Array(parts.flatMap((p) => (typeof p === "string" ? [...Buffer.from(p, "latin1")] : p)));
const has = (b: Uint8Array, s: string) => Buffer.from(b).includes(Buffer.from(s, "latin1"));
const u32be = (n: number) => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];
const u32le = (n: number) => [n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255];

test("safeNext só aceita caminho interno", () => {
  assert.equal(safeNext("/perfil?x=1#a"), "/perfil?x=1#a");
  for (const bad of ["//evil.com", "/\\evil.com", "/\\/evil.com", "/\tevil.com", "https://evil.com", "evil.com", "", null]) {
    assert.equal(safeNext(bad, "/"), "/", String(bad));
  }
});

const GPS = "Exif\0\0GPS-SECRETO";
const jpeg = bytes(
  [0xff, 0xd8],
  [0xff, 0xe0, 0x00, 0x07], "JFIF\0",
  [0xff, 0xe1, 0x00, GPS.length + 2], GPS,
  [0xff, 0xfe, 0x00, 0x06], "nota",
  [0xff, 0xda, 0x00, 0x02, 0x11, 0x22, 0xff, 0xd9],
);

test("JPEG: reconhece pelos bytes e tira EXIF e comentário", () => {
  assert.equal(sniffImageType(jpeg), "image/jpeg");
  const clean = stripImageMetadata(jpeg, "image/jpeg");
  assert.ok(!has(clean, "GPS-SECRETO"));
  assert.ok(!has(clean, "nota"));
  assert.ok(has(clean, "JFIF"));
  assert.deepEqual([...clean.slice(-4)], [0x11, 0x22, 0xff, 0xd9]);
});

test("PNG: tira blocos de texto e EXIF", () => {
  const chunk = (type: string, data: string) => [...u32be(data.length), ...Buffer.from(type + data, "latin1"), 0, 0, 0, 0];
  const png = bytes([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], chunk("IHDR", "x".repeat(13)), chunk("tEXt", "GPS-SECRETO"), chunk("eXIf", "GPS"), chunk("IDAT", "dd"), chunk("IEND", ""));
  assert.equal(sniffImageType(png), "image/png");
  const clean = stripImageMetadata(png, "image/png");
  assert.ok(!has(clean, "GPS"));
  assert.ok(has(clean, "IDAT") && has(clean, "IEND"));
});

test("WebP: tira EXIF/XMP, desliga as flags e corrige o tamanho", () => {
  const chunk = (type: string, data: number[]) => [...Buffer.from(type, "latin1"), ...u32le(data.length), ...data, ...(data.length % 2 ? [0] : [])];
  const body = [
    ...chunk("VP8X", [0x0c, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
    ...chunk("VP8 ", [1, 2, 3, 4]),
    ...chunk("EXIF", [...Buffer.from("GPS-SECRETO")]),
    ...chunk("XMP ", [...Buffer.from("<x/>")]),
  ];
  const webp = bytes("RIFF", u32le(body.length + 4), "WEBP", body);
  assert.equal(sniffImageType(webp), "image/webp");
  const clean = stripImageMetadata(webp, "image/webp");
  assert.ok(!has(clean, "GPS") && !has(clean, "XMP "));
  assert.equal(clean[20] & 0x0c, 0);
  assert.equal(Buffer.from(clean).readUInt32LE(4), clean.length - 8);
});

test("upload recusa SVG/HTML disfarçado de imagem e arquivo grande", async () => {
  const svg = new File(["<svg onload=alert(1)>"], "a.png", { type: "image/png" });
  await assert.rejects(readImageUpload(svg), /JPG, PNG ou WebP/);
  const big = new File([new Uint8Array(2 * 1024 * 1024 + 1)], "a.jpg", { type: "image/jpeg" });
  await assert.rejects(readImageUpload(big), /2 MB/);
  const ok = await readImageUpload(new File([jpeg], "x.gif", { type: "image/gif" }));
  assert.equal(ok.type, "image/jpeg");
  assert.equal(ok.ext, "jpg");
});

const ID = "4f9c0b5e-2d7a-4c1e-9a3b-8e6f1d2c3b4a";

test("avaliação: só valores permitidos", () => {
  assert.ok(microReviewBody.safeParse({ placeId: ID, occasion: "encontro", spend: 2, cover: false, noise: 1 }).success);
  assert.ok(microReviewBody.safeParse({ placeId: ID, occasion: null, spend: 4, cover: true, noise: 3 }).success);
  for (const bad of [
    { placeId: ID, occasion: "x".repeat(5000), spend: 2, cover: false, noise: 1 },
    { placeId: ID, occasion: null, spend: 5, cover: false, noise: 1 },
    { placeId: ID, occasion: null, spend: 2, cover: "sim", noise: 1 },
    { placeId: "'; drop table places;--", occasion: null, spend: 2, cover: false, noise: 1 },
    { placeId: ID, occasion: null, spend: 2, cover: false, noise: 1, userId: ID },
  ]) {
    assert.equal(microReviewBody.safeParse(bad).success, false, JSON.stringify(bad).slice(0, 80));
  }
});

test("votação, voto, reivindicação e painel do dono", () => {
  assert.ok(decisionForm.safeParse({ occasion: "encontro", placeIds: [ID, ID.replace("4a", "4b")] }).success);
  assert.equal(decisionForm.safeParse({ occasion: "encontro", placeIds: [ID, ID] }).success, false);
  assert.equal(decisionForm.safeParse({ occasion: "encontro", placeIds: [ID] }).success, false);
  assert.equal(voteBody.parse({ placeId: ID, name: "  Ana\u0000 " }).name, "Ana");
  assert.equal(voteBody.safeParse({ placeId: ID, name: "x".repeat(31) }).success, false);
  assert.equal(claimForm.parse({ placeId: ID, contact: "67 99999-9999", message: "" }).message, null);
  const owner = ownerForm.parse({ placeId: ID, instagram: "@casa.boa", menuUrl: "", cuisines: ["pizza"], about: "", tags: [] });
  assert.deepEqual([owner.instagram, owner.menuUrl], ["casa.boa", null]);
  assert.equal(ownerForm.safeParse({ placeId: ID, instagram: "", menuUrl: "javascript:alert(1)", cuisines: [], about: "", tags: [] }).success, false);
  assert.equal(ownerForm.safeParse({ placeId: ID, instagram: "", menuUrl: "", cuisines: ["nao-existe"], about: "", tags: [] }).success, false);
});
