"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { CATALOG_TAG } from "@/lib/catalog";
import { allow, LIMITS } from "@/lib/rate-limit";
import { getRepo } from "@/lib/repo";
import { readImageUpload, UploadError } from "@/lib/upload";
import { claimForm, formObject, ownerForm, placeId as placeIdSchema } from "@/lib/validation";
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

/** Dados que o dono pode editar. Avaliações e tags da galera ficam fora do alcance dele. */
export async function saveOwnerDetails(formData: FormData) {
  const user = await requireUser("/painel");
  const form = ownerForm.safeParse(formObject(formData, ["cuisines"]));
  if (!form.success) throw new Error("Confira o Instagram e o link do cardápio");
  const { placeId, instagram, menuUrl, cuisines } = form.data;
  const repo = getRepo();
  // IDOR: o placeId vem do formulário, então a posse é conferida no servidor.
  if (!(await repo.isOwner(user.id, placeId)) && !user.isAdmin) throw new Error("Sem permissão");

  let coverUrl: string | undefined;
  const cover = formData.get("cover");
  if (cover instanceof File && cover.size > 0) {
    try {
      coverUrl = await repo.uploadCover(placeId, await readImageUpload(cover));
    } catch (e) {
      if (e instanceof UploadError) throw new Error(e.message);
      throw e;
    }
  }

  await repo.updatePlace(placeId, {
    whatsapp: normalizeWhatsapp(formData.get("whatsapp")),
    instagram,
    menuUrl,
    cuisines,
    ...(coverUrl ? { coverUrl } : {}),
  });
  updateTag(CATALOG_TAG);
  revalidatePath("/painel");
}
