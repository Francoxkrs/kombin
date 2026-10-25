import "server-only";
import { memoryRepo } from "./memory";
import { createSupabaseRepo } from "./supabase";
import type { Repo } from "./types";

let repo: Repo | undefined;

/**
 * Com SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY definidos, usa o Supabase.
 * Sem eles, roda em modo demonstração com dados fictícios em memória.
 */
export function getRepo(): Repo {
  if (repo) return repo;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  repo = url && key ? createSupabaseRepo(url, key) : memoryRepo;
  return repo;
}
