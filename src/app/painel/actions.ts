"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { CATALOG_TAG } from "@/lib/catalog";
import { allow, LIMITS } from "@/lib/rate-limit";
import { getRepo } from "@/lib/repo";
import { readImageUpload, UploadError } from "@/lib/upload";
import {
  blurhash,
  claimForm,
  formObject,
  MAX_MENU_PAGES,
  menuPageMeta,
  ownerForm,
  placeId as placeIdSchema,
} from "@/lib/validation";
import { normalizeWhatsapp } from "@/lib/whatsapp";

export async function claimPlace(formData: FormData) {
  const id = placeIdSchema.safeParse(formData.get("placeId"));
  if (!id.success) return;
  const user = await requireUser(`/painel/reivindicar/${id.data}`);
  const form = claimForm.safeParse({ ...formObject(formData), message: formData.get("message") ?? "" });
  if (!form.success) return;
  const { placeId, contact, message } = form.data;
  const repo = getRepo();
  const place = await repo.getPlace(placeId);
  if (!place || place.status !== "approved") return;
  if (!(await allow(`claim:user:${user.id}`, LIMITS.claim))) return;
  await repo.createClaim(placeId, user.id, contact, message);
  redirect(`/painel/reivindicar/${placeId}?enviado=1`);
}

/** Confere no servidor que quem chama é dono do lugar (ou admin). O placeId vem do navegador. */
async function requireOwner(rawPlaceId: unknown) {
  const id = placeIdSchema.safeParse(rawPlaceId);
  if (!id.success) throw new Error("Lugar inválido");
  const user = await requireUser("/painel");
  const repo = getRepo();
  if (!(await repo.isOwner(user.id, id.data)) && !user.isAdmin) throw new Error("Sem permissão");
  const place = await repo.getPlace(id.data);
  if (!place) throw new Error("Lugar não encontrado");
  return { user, repo, place };
}

function refresh(placeId: string) {
  updateTag(CATALOG_TAG);
  revalidatePath("/painel");
  revalidatePath("/admin");
  revalidatePath(`/l/${placeId}`);
}

/** Resposta das ações de foto: o client mostra a mensagem (erro lançado chega genérico em produção). */
export type PhotoResult = { ok: true } | { ok: false; error: string };

const fail = (e: unknown): PhotoResult => ({
  ok: false,
  error: e instanceof UploadError ? e.message : "Não deu para salvar a foto. Tente de novo.",
});

/** Dados que o dono pode editar. Avaliações e gasto/couvert/som da galera ficam fora do alcance dele. */
export async function saveOwnerDetails(formData: FormData) {
  const form = ownerForm.safeParse(formObject(formData, ["cuisines", "tags"]));
  if (!form.success) throw new Error("Confira o Instagram e o link do cardápio");
  const { placeId, instagram, menuUrl, cuisines, about, tags } = form.data;
  const { repo } = await requireOwner(placeId);

  await repo.updatePlace(placeId, {
    whatsapp: normalizeWhatsapp(formData.get("whatsapp")),
    instagram,
    menuUrl,
    cuisines,
    about,
    tags,
  });
  refresh(placeId);
}

/** Foto de capa, já reduzida no navegador (src/lib/image-client.ts). O servidor confere de novo. */
export async function saveCover(formData: FormData): Promise<PhotoResult> {
  try {
    const { user, repo, place } = await requireOwner(formData.get("placeId"));
    const file = formData.get("cover");
    if (!(file instanceof File)) return { ok: false, error: "Escolha uma foto." };
    if (!(await allow(`upload:user:${user.id}`, LIMITS.upload))) return { ok: false, error: "Muitas fotos de uma vez. Espere um pouco." };
    const hash = blurhash.safeParse(formData.get("blurhash"));
    const coverUrl = await repo.uploadImage(place.id, await readImageUpload(file), "capa");
    await repo.updatePlace(place.id, { coverUrl, coverBlurhash: hash.success ? hash.data : null });
    if (place.coverUrl) await repo.deleteImage(place.id, place.coverUrl).catch(() => {});
    refresh(place.id);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/** Uma página nova do cardápio, no fim da lista. O client manda uma por vez, para mostrar o progresso. */
export async function addMenuPage(formData: FormData): Promise<PhotoResult> {
  try {
    const { user, repo, place } = await requireOwner(formData.get("placeId"));
    if (place.menuPhotos.length >= MAX_MENU_PAGES) {
      return { ok: false, error: `O cardápio pode ter até ${MAX_MENU_PAGES} páginas.` };
    }
    const file = formData.get("page");
    if (!(file instanceof File)) return { ok: false, error: "Escolha uma foto." };
    let meta;
    try {
      meta = menuPageMeta.parse(JSON.parse(String(formData.get("meta"))));
    } catch {
      return { ok: false, error: "Foto sem as medidas. Tente de novo." };
    }
    if (!(await allow(`upload:user:${user.id}`, LIMITS.upload))) return { ok: false, error: "Muitas fotos de uma vez. Espere um pouco." };
    const url = await repo.uploadImage(place.id, await readImageUpload(file), "cardapio");
    // Relê para não perder uma página enviada em paralelo por outra aba.
    const fresh = (await repo.getPlace(place.id)) ?? place;
    await repo.updatePlace(place.id, { menuPhotos: [...fresh.menuPhotos, { url, ...meta }].slice(0, MAX_MENU_PAGES) });
    refresh(place.id);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/** Tira uma página do cardápio (e o arquivo do Storage) ou muda a ordem. */
export async function editMenuPage(placeId: string, url: string, op: "remove" | "up" | "down"): Promise<PhotoResult> {
  try {
    const { repo, place } = await requireOwner(placeId);
    const pages = [...place.menuPhotos];
    const i = pages.findIndex((p) => p.url === url);
    if (i < 0) return { ok: true };
    if (op === "remove") {
      pages.splice(i, 1);
      await repo.deleteImage(place.id, url).catch(() => {});
    } else {
      const j = op === "up" ? i - 1 : i + 1;
      if (j < 0 || j >= pages.length) return { ok: true };
      [pages[i], pages[j]] = [pages[j], pages[i]];
    }
    await repo.updatePlace(place.id, { menuPhotos: pages });
    refresh(place.id);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}
