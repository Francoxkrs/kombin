import { redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { getCurrentUser, safeNext } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Entrar · Kombin" };

export default async function LoginPage({ searchParams }: PageProps<"/entrar">) {
  const sp = await searchParams;
  const next = safeNext(typeof sp.next === "string" ? sp.next : null, "/perfil");
  if (await getCurrentUser()) redirect(next);
  const error = sp.erro ? "Não deu para entrar. Tente de novo." : null;

  return (
    <>
      <Header />
      <main className="flex-1 px-5 pt-6 pb-10">
        <h1 className="text-4xl leading-[1.05] font-bold tracking-tight">Entre no Kombin</h1>
        <p className="mt-2 mb-8 text-muted">
          Salve lugares, ganhe selos avaliando e, se você tem um restaurante, acesse seu painel.
        </p>
        <LoginForm next={next} error={error} />
        <p className="mt-8 text-center text-xs text-muted">
          Ver lugares e votar em link de amigo não precisa de conta.
        </p>
      </main>
    </>
  );
}
