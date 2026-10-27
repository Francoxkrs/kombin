import { Page } from "@/components/ui/Page";
import { Shell } from "@/components/workspace/Shell";
import { requireAdmin } from "@/lib/auth";
import { getRepo } from "@/lib/repo";
import { AdminTitle } from "./AdminTitle";

export const metadata = { title: "Admin · Kombin", robots: { index: false } };

/** Moldura de todas as telas do admin. Cada página também chama requireAdmin(). */
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  await requireAdmin();
  const c = await getRepo().adminCounts();
  return (
    <Page>
      <Shell
        area="Admin do Kombin"
        title={<AdminTitle />}
        root="/admin"
        nav={[
          { href: "/admin", label: "Visão geral" },
          { href: "/admin/lugares", label: "Lugares", badge: c.pending },
          { href: "/admin/donos", label: "Donos", badge: c.openClaims },
          { href: "/admin/usuarios", label: "Usuários" },
          { href: "/admin/importar", label: "Importar" },
          { href: "/admin/historico", label: "Histórico" },
        ]}
      >
        {children}
      </Shell>
    </Page>
  );
}
