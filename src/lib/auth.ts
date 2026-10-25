import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { getRepo } from "./repo";
import { createAuthClient } from "./supabase/server";

export interface CurrentUser {
  id: string;
  email: string | null;
  name: string;
  avatarUrl: string | null;
  isAdmin: boolean;
}

function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/** Quem está logado nesta requisição (ou null). Uma consulta por requisição. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const meta = user.user_metadata ?? {};
  const repo = getRepo();
  let profile = await repo.getProfile(user.id);
  if (!profile) {
    await repo.ensureProfile(user.id, meta.full_name ?? meta.name ?? null, meta.avatar_url ?? null);
    profile = await repo.getProfile(user.id);
  }

  const email = user.email?.toLowerCase() ?? null;
  return {
    id: user.id,
    email,
    name: profile?.name || meta.full_name || email?.split("@")[0] || "Você",
    avatarUrl: profile?.avatarUrl ?? meta.avatar_url ?? null,
    isAdmin: profile?.role === "admin" || (!!email && adminEmails().includes(email)),
  };
});

/** Exige login: manda para /entrar e volta para `next` depois. */
export async function requireUser(next: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/entrar?next=${encodeURIComponent(next)}`);
  return user;
}

export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireUser("/admin");
  if (!user.isAdmin) redirect("/perfil");
  return user;
}

/** Só aceita caminhos internos no ?next= (evita redirecionar para outro site). */
export function safeNext(next: string | null | undefined, fallback = "/"): string {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}
