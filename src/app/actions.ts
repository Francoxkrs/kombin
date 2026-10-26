"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser, profileTag, requireUser } from "@/lib/auth";
import { getCatalog } from "@/lib/catalog";
import { allow, currentIp, LIMITS } from "@/lib/rate-limit";
import { getRepo } from "@/lib/repo";
import type { SavedList } from "@/lib/repo/supabase";
import { savedTag } from "@/lib/saved";
import { createAuthClient } from "@/lib/supabase/server";
import { decisionForm, profileName, saveToggle } from "@/lib/validation";

/** Cria a votação "Decidir com o grupo" com as opções escolhidas e abre a página dela. */
export async function createDecision(formData: FormData) {
  const form = decisionForm.safeParse({
    occasion: formData.get("occasion"),
    placeIds: formData.getAll("placeId").map(String),
  });
  if (!form.success) throw new Error("Votação inválida");
  const { occasion, placeIds } = form.data;
  // Só lugares aprovados entram na votação (a página dela é pública).
  const catalog = await getCatalog();
  if (!placeIds.every((id) => catalog.byId.has(id))) throw new Error("Votação inválida");
  if (!(await allow(`decision:ip:${await currentIp()}`, LIMITS.decision))) {
    throw new Error("Muitas votações em pouco tempo. Tente de novo daqui a pouco.");
  }
  const user = await getCurrentUser();
  const code = await getRepo().createSession(occasion, placeIds, user?.id ?? null);
  redirect(`/v/${code}?novo=1`);
}

/** Salva ou tira um lugar de "Quero ir" / "Já fui". Devolve o estado novo. */
export async function toggleSave(placeId: string, list: SavedList, saved: boolean): Promise<boolean> {
  const input = saveToggle.safeParse({ placeId, list, saved });
  if (!input.success) return !saved;
  const user = await getCurrentUser();
  if (!user) return false;
  if (!(await allow(`account:user:${user.id}`, LIMITS.account))) return !saved;
  const repo = getRepo();
  const exists = (await getCatalog()).byId.has(placeId) || (await repo.getPlace(placeId))?.status === "approved";
  if (!exists) return false;
  await repo.setSaved(user.id, placeId, list, saved);
  updateTag(savedTag(user.id));
  return saved;
}

export async function updateName(formData: FormData) {
  const user = await requireUser("/perfil");
  const name = profileName.safeParse(formData.get("name") ?? "");
  if (!name.success) return;
  if (!(await allow(`account:user:${user.id}`, LIMITS.account))) return;
  await getRepo().updateProfileName(user.id, name.data);
  updateTag(profileTag(user.id));
}

export async function signOut() {
  const supabase = await createAuthClient();
  await supabase.auth.signOut();
  redirect("/");
}
