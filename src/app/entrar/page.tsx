import { redirect } from "next/navigation";
import { LogoMark } from "@/components/ui/Logo";
import { Page } from "@/components/ui/Page";
import { Photo } from "@/components/ui/Photo";
import { TopBar } from "@/components/ui/TopBar";
import { getCurrentUser, safeNext } from "@/lib/auth";
import { getCatalog } from "@/lib/catalog";
import { photoSrc } from "@/lib/photos";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Entrar · Kombin" };

export default async function LoginPage({ searchParams }: PageProps<"/entrar">) {
  const sp = await searchParams;
  const next = safeNext(typeof sp.next === "string" ? sp.next : null, "/perfil");
  if (await getCurrentUser()) redirect(next);
  const error = sp.erro ? "Não deu para entrar. Tente de novo." : null;
  const photos = (await getCatalog()).places
    .map((p) => ({ src: photoSrc(p), name: p.name }))
    .filter((p): p is { src: string; name: string } => !!p.src)
    .slice(0, 6);

  return (
    <Page>
      <TopBar back={{ href: "/", label: "Descobrir" }} right={<span />} />
      {photos.length >= 3 && (
        <div className="relative -mt-2 h-56 overflow-hidden" aria-hidden>
          <div className="grid grid-cols-3 gap-2 px-5">
            {photos.map((p, i) => (
              <Photo
                key={p.src}
                src={p.src}
                alt=""
                name={p.name}
                className={`rise aspect-[3/4] rounded-2xl ${i % 3 === 1 ? "translate-y-8" : ""}`}
              />
            ))}
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/40 to-white" />
        </div>
      )}
      <main className="flex-1 px-5 pb-12">
        <div className="rise">
          <LogoMark size={44} />
        </div>
        <h1 className="rise display mt-4 text-[2.5rem]" style={{ "--i": 1 } as React.CSSProperties}>
          Entre no Kombin
        </h1>
        <p className="rise mt-2 mb-7 text-[1.02rem] text-muted" style={{ "--i": 2 } as React.CSSProperties}>
          Salve lugares, ganhe o selo Explorador e, se você tem um restaurante, acesse seu painel.
        </p>
        <LoginForm next={next} error={error} />
        <p className="mt-8 text-center text-xs text-muted">Ver lugares e votar em link de amigo não precisa de conta.</p>
      </main>
    </Page>
  );
}
