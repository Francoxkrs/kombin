"use server";

import { redirect } from "next/navigation";
import { getOccasion } from "@/lib/occasions";
import { getRepo } from "@/lib/repo";

/** Cria a votação "Decidir com o grupo" com as opções escolhidas e abre a página dela. */
export async function createDecision(formData: FormData) {
  const occasion = String(formData.get("occasion") ?? "");
  const placeIds = formData.getAll("placeId").map(String).slice(0, 3);
  if (!getOccasion(occasion) || placeIds.length < 2) throw new Error("Votação inválida");
  const code = await getRepo().createSession(occasion, placeIds);
  redirect(`/v/${code}?novo=1`);
}
