"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { CATALOG_TAG } from "@/lib/catalog";
import { CUISINES } from "@/lib/cuisines";
import { OCCASIONS } from "@/lib/occasions";
import { getRepo } from "@/lib/repo";
import { TAGS } from "@/lib/tags";
import type { PlacePatch } from "@/lib/repo/supabase";
import type { Noise, PlaceStatus, SpendBand } from "@/lib/types";
import { normalizeWhatsapp } from "@/lib/whatsapp";

/** Apaga os 12 lugares fictícios do seed, caso tenham ido parar no banco de produção. */
export async function removeDemoPlaces() {
  await requireAdmin();
  await getRepo().deleteDemoPlaces();
  updateTag(CATALOG_TAG);
  revalidatePath("/admin");
}

export async function setStatus(formData: FormData) {
  await requireAdmin();
  const status = String(formData.get("status")) as PlaceStatus;
  if (!["pending", "approved", "rejected"].includes(status)) return;
  await getRepo().updatePlace(String(formData.get("id")), { status });
  updateTag(CATALOG_TAG);
  revalidatePath("/admin");
}

const text = (v: FormDataEntryValue | null) => String(v ?? "").trim() || null;
const intOrNull = (v: FormDataEntryValue | null) => (v ? Number(v) : null);

/** Lê o formulário completo de lugar (usado para editar e para cadastrar à mão). */
function readPlaceForm(formData: FormData): PlacePatch {
  const vibe: Record<string, number> = {};
  for (const o of OCCASIONS) {
    const raw = String(formData.get(`vibe_${o.slug}`) ?? "").replace(",", ".");
    const n = Number(raw);
    if (raw !== "" && Number.isFinite(n)) vibe[o.slug] = Math.min(10, Math.max(0, n));
  }
  const cover = String(formData.get("seedCover") ?? "");
  return {
    name: text(formData.get("name")) ?? undefined,
    category: text(formData.get("category")),
    neighborhood: text(formData.get("neighborhood")),
    address: text(formData.get("address")),
    googlePlaceId: text(formData.get("googlePlaceId")),
    whatsapp: normalizeWhatsapp(formData.get("whatsapp")),
    coverUrl: text(formData.get("coverUrl")),
    cuisines: formData
      .getAll("cuisines")
      .map(String)
      .filter((c) => CUISINES.some((x) => x.slug === c)),
    seedSpend: intOrNull(formData.get("seedSpend")) as SpendBand | null,
    seedNoise: intOrNull(formData.get("seedNoise")) as Noise | null,
    seedCover: cover === "" ? null : cover === "1",
    vibe,
    tags: formData
      .getAll("tags")
      .map(String)
      .filter((t) => TAGS.some((x) => x.slug === t)),
    featured: formData.get("featured") === "1",
  };
}

export async function saveDetails(formData: FormData) {
  await requireAdmin();
  const repo = getRepo();
  const id = String(formData.get("id"));
  const patch = readPlaceForm(formData);
  // Foto trocada à mão: a prévia desfocada da antiga não vale mais.
  const before = await repo.getPlace(id);
  if (before && patch.coverUrl !== before.coverUrl) patch.coverBlurhash = null;
  await repo.updatePlace(id, patch);
  updateTag(CATALOG_TAG);
  revalidatePath("/admin");
}

/** Cadastro manual: para lugares que o pipeline não pegou (ou antes de ter chave do Google). */
export async function createPlace(formData: FormData) {
  await requireAdmin();
  const patch = readPlaceForm(formData);
  if (!patch.name) return;
  await getRepo().createPlace({ ...patch, name: patch.name, status: "approved" });
  updateTag(CATALOG_TAG);
  revalidatePath("/admin");
  redirect("/admin?s=approved");
}

export async function resolveClaim(formData: FormData) {
  await requireAdmin();
  await getRepo().resolveClaim(Number(formData.get("id")), formData.get("approve") === "1");
  revalidatePath("/admin");
}
