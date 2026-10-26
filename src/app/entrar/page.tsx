import { redirect } from "next/navigation";
import { CityHero } from "@/components/CityHero";
import { Page } from "@/components/ui/Page";
import { getCurrentUser, safeNext } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Entrar · Kombin" };

export default async function LoginPage({ searchParams }: PageProps<"/entrar">) {
  const sp = await searchParams;
  const next = safeNext(typeof sp.next === "string" ? sp.next : null, "/perfil");
  if (await getCurrentUser()) redirect(next);
  const error = sp.erro ? "O link expirou ou já foi usado. Entre com sua senha ou peça um novo." : null;

  return (
    <Page>
      <CityHero back="/">
        <h1 className="title text-[48px]">Seus lugares, do seu jeito</h1>
      </CityHero>
      <main className="flex-1 px-5 pt-5 pb-12">
        <p className="mb-6 max-w-[34ch] text-[17px] leading-snug text-muted">
          Guarde onde quer ir, ganhe o selo Explorador e, se tem um restaurante, acesse o painel.
        </p>
        <LoginForm next={next} error={error} google={process.env.AUTH_GOOGLE === "1"} />
        <p className="mt-8 text-[15px] text-muted">Ver lugares e votar em link de amigo não precisa de conta.</p>
      </main>
    </Page>
  );
}
