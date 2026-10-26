import { redirect } from "next/navigation";
import { Page } from "@/components/ui/Page";
import { TopBar } from "@/components/ui/TopBar";
import { getCurrentUser } from "@/lib/auth";
import { NewPasswordForm } from "./NewPasswordForm";

export const metadata = { title: "Nova senha · Kombin" };

/** Chega aqui pelo link de "Esqueci a senha" (o /auth/callback já abriu a sessão). */
export default async function ResetPasswordPage() {
  if (!(await getCurrentUser())) redirect("/entrar?erro=1");
  return (
    <Page>
      <TopBar back={{ href: "/perfil", label: "Perfil" }} right={<span />} />
      <main className="flex-1 px-5 pt-6 pb-12">
        <h1 className="title text-[48px]">Crie uma senha nova</h1>
        <p className="mt-3 mb-8 text-[17px] text-muted">Depois disso, é só entrar com o e-mail e essa senha.</p>
        <NewPasswordForm />
      </main>
    </Page>
  );
}
