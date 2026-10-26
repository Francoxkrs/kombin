import { z } from "zod";
import { CUISINES } from "./cuisines";
import { OCCASIONS } from "./occasions";
import { TAGS } from "./tags";

/**
 * Esquemas de tudo que chega do navegador (rotas e server actions). O que não
 * passar aqui é recusado antes de chegar ao banco.
 */

/** UUID das tabelas (z.guid aceita qualquer versão; z.uuid exigiria v1-v8). */
export const placeId = z.guid();

/** Remove caracteres de controle e espaços das pontas. */
const cleanText = (max: number) =>
  z
    .string()
    .transform((s) => s.replace(/[\u0000-\u001f\u007f]/g, " ").trim())
    .pipe(z.string().max(max));

const slugs = <T extends { slug: string }>(list: T[]) => list.map((x) => x.slug) as [string, ...string[]];

export const occasionSlug = z.enum(slugs(OCCASIONS));
export const cuisineSlug = z.enum(slugs(CUISINES));
export const tagSlug = z.enum(slugs(TAGS));
export const spendBand = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]);
export const noiseLevel = z.union([z.literal(1), z.literal(2), z.literal(3)]);

/** Código da votação (src/lib/code.ts): 6 letras e números sem os ambíguos. */
export const decisionCode = z.string().regex(/^[23456789a-hjkmnp-z]{6}$/);

export const microReviewBody = z.strictObject({
  placeId,
  occasion: occasionSlug.nullable(),
  spend: spendBand,
  cover: z.boolean(),
  noise: noiseLevel,
});

export const voteBody = z.strictObject({
  placeId,
  name: cleanText(30).optional(),
});

export const decisionForm = z.object({
  occasion: occasionSlug,
  placeIds: z
    .array(placeId)
    .min(2)
    .max(3)
    .refine((ids) => new Set(ids).size === ids.length, "lugar repetido"),
});

export const saveToggle = z.object({
  placeId,
  list: z.enum(["want", "been"]),
  saved: z.boolean(),
});

export const profileName = cleanText(40).pipe(z.string().min(1));

export const claimForm = z.object({
  placeId,
  contact: cleanText(80).pipe(z.string().min(8)),
  message: cleanText(500).transform((s) => s || null),
});

const httpUrl = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .refine((s) => /^https?:\/\//i.test(s) && URL.canParse(s), "link inválido");

/** Campo opcional de link: vazio vira null, link sem http(s) é recusado. */
const optionalUrl = (max: number) =>
  z.union([z.literal("").transform(() => null), httpUrl(max)]);

export const ownerForm = z.object({
  placeId,
  instagram: z
    .string()
    .trim()
    .transform((s) => s.replace(/^@/, ""))
    .pipe(z.union([z.literal(""), z.string().regex(/^[A-Za-z0-9._]{1,30}$/)]))
    .transform((s) => s || null),
  menuUrl: optionalUrl(300),
  cuisines: z.array(cuisineSlug).max(CUISINES.length),
  about: cleanText(280).transform((s) => s || null),
  tags: z.array(tagSlug).max(TAGS.length),
});

/** Prévia desfocada gerada no navegador: só o alfabeto do BlurHash, tamanho de 4x3 componentes. */
export const blurhash = z.string().regex(/^[0-9A-Za-z#$%*+,\-.:;=?@[\]^_{|}~]{6,60}$/);

/** Medidas de uma página do cardápio, lidas no navegador depois de reduzir a foto. */
export const menuPageMeta = z.object({
  blurhash: blurhash.nullable(),
  w: z.number().int().min(1).max(4000),
  h: z.number().int().min(1).max(4000),
});

/** Máximo de páginas de cardápio por lugar (12 x ~260 KB = ~3 MB por restaurante). */
export const MAX_MENU_PAGES = 12;

export const adminId = placeId;
export const adminCoverUrl = optionalUrl(500);
export const adminTags = z.array(tagSlug).max(TAGS.length);

/** Lê um formulário com campos repetidos (checkbox) como lista. */
export function formObject(formData: FormData, lists: string[] = []): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  for (const key of new Set(formData.keys())) {
    obj[key] = lists.includes(key) ? formData.getAll(key).map(String) : formData.get(key);
  }
  for (const key of lists) obj[key] ??= [];
  return obj;
}
