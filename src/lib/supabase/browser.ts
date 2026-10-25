import { createBrowserClient } from "@supabase/ssr";

/** Cliente do navegador, usado só para iniciar o login. */
export function createBrowserAuthClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
