"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser, requireUser } from "@/lib/auth";
import { getOccasion } from "@/lib/occasions";
import { getRepo } from "@/lib/repo";
import type { SavedList } from "@/lib/repo/supabase";
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

/** Salva ou tira um lugar das listas "Quero ir" / "Já fui". */
export async function toggleSaved(formData: FormData) {
  const placeId = String(formData.get("placeId"));
  const list = String(formData.get("list")) as SavedList;
  const back = String(formData.get("back") ?? `/l/${placeId}`);
  if (list !== "want" && list !== "been") return;
  const user = await requireUser(back);
  const repo = getRepo();
  if (!(await repo.getPlace(placeId))) return;
  const current = await repo.savedLists(user.id, placeId);
  await repo.setSaved(user.id, placeId, list, !current.includes(list));
  revalidatePath(`/l/${placeId}`);
  revalidatePath("/perfil");
}

export async function updateName(formData: FormData) {
  const user = await requireUser("/perfil");
  const name = String(formData.get("name") ?? "").trim().slice(0, 40);
  if (name) await getRepo().updateProfileName(user.id, name);
  revalidatePath("/perfil");
}

export async function signOut() {
  const supabase = await createAuthClient();
  await supabase.auth.signOut();
  redirect("/");
}
