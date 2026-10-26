"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { CATALOG_TAG } from "@/lib/catalog";
import { CUISINES } from "@/lib/cuisines";
import { getRepo } from "@/lib/repo";
import { normalizeWhatsapp } from "@/lib/whatsapp";

const MAX_COVER_BYTES = 4 * 1024 * 1024;

export async function claimPlace(formData: FormData) {
  const placeId = String(formData.get("placeId"));
  const user = await requireUser(`/painel/reivindicar/${placeId}`);
  const contact = String(formData.get("contact") ?? "").trim().slice(0, 80);
  const message = String(formData.get("message") ?? "").trim().slice(0, 500) || null;
  const repo = getRepo();
  if (!contact || !(await repo.getPlace(placeId))) return;
  await repo.createClaim(placeId, user.id, contact, message);
  redirect(`/painel/reivindicar/${placeId}?enviado=1`);
}

const cleanUrl = (v: FormDataEntryValue | null) => {
  const s = String(v ?? "").trim();
  return /^https?:\/\//.test(s) ? s.slice(0, 300) : null;
};

/** Dados que o dono pode editar. Avaliações e tags da galera ficam fora do alcance dele. */
export async function saveOwnerDetails(formData: FormData) {
  const placeId = String(formData.get("placeId"));
  const user = await requireUser("/painel");
  const repo = getRepo();
  if (!(await repo.isOwner(user.id, placeId)) && !user.isAdmin) throw new Error("Sem permissão");

  const instagram = String(formData.get("instagram") ?? "").trim().replace(/^@/, "").slice(0, 60);
  const cuisines = formData
    .getAll("cuisines")
    .map(String)
    .filter((c) => CUISINES.some((x) => x.slug === c));

  let coverUrl: string | undefined;
  const cover = formData.get("cover");
  if (cover instanceof File && cover.size > 0) {
    if (!cover.type.startsWith("image/") || cover.size > MAX_COVER_BYTES) {
      throw new Error("A foto precisa ser uma imagem de até 4 MB");
    }
    coverUrl = await repo.uploadCover(placeId, cover);
  }

  await repo.updatePlace(placeId, {
    whatsapp: normalizeWhatsapp(formData.get("whatsapp")),
    instagram: instagram || null,
    menuUrl: cleanUrl(formData.get("menuUrl")),
    cuisines,
    ...(coverUrl ? { coverUrl } : {}),
  });
  updateTag(CATALOG_TAG);
  revalidatePath("/painel");
}
