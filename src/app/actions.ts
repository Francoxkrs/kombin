"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser, profileTag, requireUser } from "@/lib/auth";
import { getCatalog } from "@/lib/catalog";
import { getOccasion } from "@/lib/occasions";
import { getRepo } from "@/lib/repo";
import type { SavedList } from "@/lib/repo/supabase";
import { savedTag } from "@/lib/saved";
import { createAuthClient } from "@/lib/supabase/server";

/** Cria a votação "Decidir com o grupo" com as opções escolhidas e abre a página dela. */
export async function createDecision(formData: FormData) {
  const occasion = String(formData.get("occasion") ?? "");
  const placeIds = formData.getAll("placeId").map(String).slice(0, 3);
  if (!getOccasion(occasion) || placeIds.length < 2) throw new Error("Votação inválida");
  const user = await getCurrentUser();
  const code = await getRepo().createSession(occasion, placeIds, user?.id ?? null);
  redirect(`/v/${code}?novo=1`);
}

/** Salva ou tira um lugar de "Quero ir" / "Já fui". Devolve o estado novo. */
export async function toggleSave(placeId: string, list: SavedList, saved: boolean): Promise<boolean> {
  if (list !== "want" && list !== "been") return false;
  const user = await getCurrentUser();
  if (!user) return false;
  const repo = getRepo();
  const exists = (await getCatalog()).byId.has(placeId) || !!(await repo.getPlace(placeId));
  if (!exists) return false;
  await repo.setSaved(user.id, placeId, list, saved);
  updateTag(savedTag(user.id));
  return saved;
}

export async function updateName(formData: FormData) {
  const user = await requireUser("/perfil");
  const name = String(formData.get("name") ?? "").trim().slice(0, 40);
  if (name) await getRepo().updateProfileName(user.id, name);
  updateTag(profileTag(user.id));
}

export async function signOut() {
  const supabase = await createAuthClient();
  await supabase.auth.signOut();
  redirect("/");
}
