import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/** Cliente com a sessão de quem está logado (chave pública + cookies). Só para Auth. */
export async function createAuthClient() {
  const jar = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => jar.getAll(),
        setAll(list) {
          try {
            for (const { name, value, options } of list) jar.set(name, value, options);
          } catch {
            // Chamado de um Server Component: quem renova a sessão é o proxy.
          }
        },
      },
    },
  );
}
