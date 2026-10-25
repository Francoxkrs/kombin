"use server";

import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getRepo } from "@/lib/repo";
import type { Noise, PlaceStatus, SpendBand } from "@/lib/types";

const COOKIE = "kb_admin";

function adminPassword(): string | null {
  if (process.env.ADMIN_PASSWORD) return process.env.ADMIN_PASSWORD;
  // Sem senha configurada, o admin só existe no modo demonstração.
  return getRepo().mode === "demo" ? "demo" : null;
}

const digest = (s: string) => createHash("sha256").update(`kombin:${s}`).digest();

export async function isAdmin(): Promise<boolean> {
  const pw = adminPassword();
  const token = (await cookies()).get(COOKIE)?.value;
  if (!pw || !token) return false;
  const a = Buffer.from(token, "hex");
  const b = digest(pw);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin");
}

export async function login(formData: FormData) {
  const pw = adminPassword();
  if (pw && formData.get("password") === pw) {
    (await cookies()).set(COOKIE, digest(pw).toString("hex"), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30,
      path: "/admin",
    });
  }
  redirect("/admin");
}

export async function logout() {
  (await cookies()).delete({ name: COOKIE, path: "/admin" });
  redirect("/admin");
}

export async function setStatus(formData: FormData) {
  await requireAdmin();
  const status = String(formData.get("status")) as PlaceStatus;
  if (!["pending", "approved", "rejected"].includes(status)) return;
  await getRepo().updatePlace(String(formData.get("id")), { status });
  revalidatePath("/admin");
}

const intOrNull = (v: FormDataEntryValue | null) => (v ? Number(v) : null);

export async function saveDetails(formData: FormData) {
  await requireAdmin();
  const whatsapp = String(formData.get("whatsapp") ?? "").replace(/\D/g, "");
  const cover = String(formData.get("seedCover") ?? "");
  await getRepo().updatePlace(String(formData.get("id")), {
    whatsapp: whatsapp || null,
    neighborhood: String(formData.get("neighborhood") ?? "").trim() || null,
    coverUrl: String(formData.get("coverUrl") ?? "").trim() || null,
    seedSpend: intOrNull(formData.get("seedSpend")) as SpendBand | null,
    seedNoise: intOrNull(formData.get("seedNoise")) as Noise | null,
    seedCover: cover === "" ? null : cover === "1",
  });
  revalidatePath("/admin");
}
