import "server-only";
import { unstable_cache } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { getRepo } from "./repo";
import type { Profile } from "./repo/supabase";
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

export const profileTag = (userId: string) => `profile-${userId}`;

/** Perfil (nome editado e papel) em cache: não vai ao banco a cada página. */
function cachedProfile(userId: string, name: string | null, avatarUrl: string | null) {
  return unstable_cache(
    async (): Promise<Profile | null> => {
      const repo = getRepo();
      const profile = await repo.getProfile(userId);
      if (profile) return profile;
      await repo.ensureProfile(userId, name, avatarUrl);
      return repo.getProfile(userId);
    },
    ["profile", userId],
    { revalidate: 600, tags: [profileTag(userId)] },
  )();
}

/**
 * Quem está logado nesta requisição (ou null). Sem cookie de sessão, nem chama o
 * Supabase. Com cookie, valida o token (getClaims) e lê o perfil do cache.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const jar = await cookies();
  if (!jar.getAll().some((c) => c.name.startsWith("sb-"))) return null;

  const supabase = await createAuthClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;

  const meta = (claims.user_metadata ?? {}) as Record<string, string | undefined>;
  const email = (claims.email as string | undefined)?.toLowerCase() ?? null;
  const metaName = meta.full_name ?? meta.name ?? null;
  const metaAvatar = meta.avatar_url ?? meta.picture ?? null;
  const profile = await cachedProfile(claims.sub, metaName, metaAvatar);

  return {
    id: claims.sub,
    email,
    name: profile?.name || metaName || email?.split("@")[0] || "Você",
    avatarUrl: profile?.avatarUrl ?? metaAvatar,
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
