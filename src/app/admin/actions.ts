"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { profileTag, requireAdmin, type CurrentUser } from "@/lib/auth";
import { CATALOG_TAG } from "@/lib/catalog";
import { CUISINES } from "@/lib/cuisines";
import { OCCASIONS } from "@/lib/occasions";
import { getRepo } from "@/lib/repo";
import { TAGS } from "@/lib/tags";
import type { PlacePatch } from "@/lib/repo/supabase";
import type { Noise, PlaceStatus, SpendBand } from "@/lib/types";
import { adminCoverUrl, adminId } from "@/lib/validation";
import { normalizeWhatsapp } from "@/lib/whatsapp";

/** id do lugar vindo do formulário; recusa o que não for UUID. */
function idFrom(formData: FormData): string {
  const id = adminId.safeParse(formData.get("id"));
  if (!id.success) throw new Error("Lugar inválido");
  return id.data;
}

/** Toda mudança feita aqui entra no histórico (/admin/historico). */
function log(admin: CurrentUser, action: string, target?: string, detail?: string) {
  return getRepo().logAdmin({ actorId: admin.id, actorName: admin.name, action, target, detail });
}

/** As telas do admin são várias rotas; uma ação pode mudar números de todas. */
const refresh = () => revalidatePath("/admin", "layout");

const STATUS_VERB: Record<PlaceStatus, string> = {
  approved: "Aprovou",
  rejected: "Rejeitou",
  pending: "Voltou para revisão",
};

/** Apaga os 12 lugares fictícios do seed, caso tenham ido parar no banco de produção. */
export async function removeDemoPlaces() {
  const admin = await requireAdmin();
  await getRepo().deleteDemoPlaces();
  await log(admin, "Apagou os lugares fictícios");
  updateTag(CATALOG_TAG);
  refresh();
}

export async function setStatus(formData: FormData) {
  const admin = await requireAdmin();
  const status = String(formData.get("status")) as PlaceStatus;
  if (!["pending", "approved", "rejected"].includes(status)) return;
  const repo = getRepo();
  const id = idFrom(formData);
  await repo.updatePlace(id, { status });
  const place = await repo.getPlace(id);
  await log(admin, STATUS_VERB[status], place?.name ?? id, text(formData.get("reason"), 200) ?? undefined);
  updateTag(CATALOG_TAG);
  refresh();
}

const text = (v: FormDataEntryValue | null, max = 200) => String(v ?? "").trim().slice(0, max) || null;
/** Faixa 1..max ou null (o banco também tem check, mas assim o erro não vira 500). */
const bandOrNull = (v: FormDataEntryValue | null, max: number) => {
  const n = Number(v);
  return Number.isInteger(n) && n >= 1 && n <= max ? n : null;
};

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
    // Só http(s): evita javascript:, data: e afins num campo que vira src de imagem.
    coverUrl: adminCoverUrl.catch(null).parse(String(formData.get("coverUrl") ?? "").trim()),
    cuisines: formData
      .getAll("cuisines")
      .map(String)
      .filter((c) => CUISINES.some((x) => x.slug === c)),
    seedSpend: bandOrNull(formData.get("seedSpend"), 4) as SpendBand | null,
    seedNoise: bandOrNull(formData.get("seedNoise"), 3) as Noise | null,
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
  const admin = await requireAdmin();
  const repo = getRepo();
  const id = idFrom(formData);
  const patch = readPlaceForm(formData);
  // Foto trocada à mão: a prévia desfocada da antiga não vale mais.
  const before = await repo.getPlace(id);
  if (before && patch.coverUrl !== before.coverUrl) patch.coverBlurhash = null;
  await repo.updatePlace(id, patch);
  await log(admin, "Editou", patch.name ?? before?.name ?? id);
  updateTag(CATALOG_TAG);
  refresh();
}

/** Cadastro manual: para lugares que o pipeline não pegou (ou antes de ter chave do Google). */
export async function createPlace(formData: FormData) {
  const admin = await requireAdmin();
  const patch = readPlaceForm(formData);
  if (!patch.name) return;
  await getRepo().createPlace({ ...patch, name: patch.name, status: "approved" });
  await log(admin, "Cadastrou à mão", patch.name);
  updateTag(CATALOG_TAG);
  refresh();
  redirect(`/admin/lugares?s=approved&q=${encodeURIComponent(patch.name)}`);
}

export async function resolveClaim(formData: FormData) {
  const admin = await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isSafeInteger(id) || id <= 0) return;
  const approve = formData.get("approve") === "1";
  await getRepo().resolveClaim(id, approve);
  await log(admin, approve ? "Aprovou dono" : "Recusou dono", text(formData.get("label")) ?? `pedido ${id}`);
  refresh();
  revalidatePath("/painel");
}

/** Tira o acesso de um dono ao painel da casa (o pedido dele continua no histórico). */
export async function revokeOwner(formData: FormData) {
  const admin = await requireAdmin();
  const placeId = idFrom(formData);
  const userId = adminId.safeParse(formData.get("userId"));
  if (!userId.success) return;
  await getRepo().revokeOwner(placeId, userId.data);
  await log(admin, "Tirou o acesso de dono", text(formData.get("label")) ?? placeId);
  refresh();
  revalidatePath("/painel");
}

/** Dá ou tira o papel de admin. Ninguém tira o próprio, para o painel não ficar sem dono. */
export async function setRole(formData: FormData) {
  const admin = await requireAdmin();
  const userId = adminId.safeParse(formData.get("userId"));
  const role = formData.get("role");
  if (!userId.success || (role !== "admin" && role !== "user")) return;
  if (userId.data === admin.id) return;
  await getRepo().setRole(userId.data, role);
  await log(admin, role === "admin" ? "Tornou admin" : "Tirou o admin", text(formData.get("label")) ?? userId.data);
  updateTag(profileTag(userId.data));
  refresh();
}
