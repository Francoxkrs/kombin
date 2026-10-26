import { createBrowserClient } from "@supabase/ssr";
import { supabasePublicKey, supabaseUrl } from "./env";

/** Cliente do navegador, usado só para iniciar o login. */
export function createBrowserAuthClient() {
  return createBrowserClient(
    supabaseUrl(),
    supabasePublicKey(),
  );
}
