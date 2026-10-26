import { redirect } from "next/navigation";
import { Wordmark } from "@/components/ui/Logo";
import { Page } from "@/components/ui/Page";
import { Photo } from "@/components/ui/Photo";
import { TopBar } from "@/components/ui/TopBar";
import { getCurrentUser, safeNext } from "@/lib/auth";
import { OCCASIONS } from "@/lib/occasions";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Entrar · Kombin" };

export default async function LoginPage({ searchParams }: PageProps<"/entrar">) {
  const sp = await searchParams;
  const next = safeNext(typeof sp.next === "string" ? sp.next : null, "/perfil");
  if (await getCurrentUser()) redirect(next);
  const error = sp.erro ? "O link expirou ou já foi usado. Entre com sua senha ou peça um novo." : null;
  // Fotos de ambiente das ocasiões (não são de um lugar específico).
  const mosaic = ["encontro", "happy-hour", "cafe"].map((slug) => OCCASIONS.find((o) => o.slug === slug)!.images);

  return (
    <Page>
      <TopBar back={{ href: "/", label: "Descobrir" }} right={<span />} />
      <div className="relative -mt-1 h-36 overflow-hidden" aria-hidden>
        <div className="grid grid-cols-3 gap-2 px-5">
          {mosaic.map(([first, ...rest], i) => (
            <Photo
              key={first}
              src={first}
              fallbacks={rest}
              alt=""
              className={`rise aspect-[3/4] rounded-2xl ${i === 1 ? "translate-y-8" : ""}`}
              eager
            />
          ))}
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/40 to-background" />
      </div>
      <main className="flex-1 px-5 pb-36">
        <Wordmark className="rise text-[1.6rem]" />
        <h1 className="rise mt-3 text-4xl leading-[1.05] font-bold tracking-tight" style={{ "--i": 1 } as React.CSSProperties}>
          Seus lugares, do seu <span className="accent text-[1.12em]">jeito</span>.
        </h1>
        <p className="rise mt-2 mb-6 text-sm text-muted" style={{ "--i": 2 } as React.CSSProperties}>
          Salve lugares, ganhe o selo Explorador e, se você tem um restaurante, acesse seu painel.
        </p>
        <LoginForm next={next} error={error} google={process.env.AUTH_GOOGLE === "1"} />
        <p className="mt-8 text-center text-xs text-muted">Ver lugares e votar em link de amigo não precisa de conta.</p>
      </main>
    </Page>
  );
}
