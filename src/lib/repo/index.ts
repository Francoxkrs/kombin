import "server-only";
import { createRepo, type Repo } from "./supabase";
import { supabaseSecretKey, supabaseUrl } from "../supabase/env";

let repo: Repo | undefined;

/** Banco do Kombin (Supabase). Precisa de NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SECRET_KEY. */
export function getRepo(): Repo {
  if (repo) return repo;
  const url = supabaseUrl();
  const key = supabaseSecretKey();
  if (!url || !key) {
    throw new Error(
      "Supabase não configurado: defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SECRET_KEY (ou ligue a integração Supabase da Vercel). Veja o README.",
    );
  }
  repo = createRepo(url, key);
  return repo;
}

export type { Repo };
