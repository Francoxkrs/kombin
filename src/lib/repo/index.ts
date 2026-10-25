import "server-only";
import { createRepo, type Repo } from "./supabase";

let repo: Repo | undefined;

/** Banco do Kombin (Supabase). Precisa de NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SECRET_KEY. */
export function getRepo(): Repo {
  if (repo) return repo;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase não configurado: defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SECRET_KEY no .env.local (veja o README).",
    );
  }
  repo = createRepo(url, key);
  return repo;
}

export type { Repo };
