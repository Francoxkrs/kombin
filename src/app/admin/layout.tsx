import { Page } from "@/components/ui/Page";
import { TopBar } from "@/components/ui/TopBar";
import { requireAdmin } from "@/lib/auth";
import { getRepo } from "@/lib/repo";
import { AdminNav } from "./AdminNav";

export const metadata = { title: "Admin · Kombin", robots: { index: false } };

/** Moldura de todas as telas do admin. Cada página também chama requireAdmin(). */
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  await requireAdmin();
  const c = await getRepo().adminCounts();
  return (
    <Page>
      <TopBar back={{ href: "/perfil", label: "Você" }} />
      <main className="px-5 pt-2 pb-12">
        <h1 className="title text-[48px]">Admin</h1>
        <AdminNav badges={{ "/admin/lugares": c.pending, "/admin/donos": c.openClaims }} />
        <div className="mt-6">{children}</div>
      </main>
    </Page>
  );
}
