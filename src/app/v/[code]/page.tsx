import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LogoMark } from "@/components/ui/Logo";
import { Page } from "@/components/ui/Page";
import { TopBar } from "@/components/ui/TopBar";
import { VoteBoard } from "@/components/VoteBoard";
import { getDecisionState } from "@/lib/decision";
import { getDeviceId } from "@/lib/device";

export async function generateMetadata({ params }: PageProps<"/v/[code]">) {
  const state = await getDecisionState((await params).code, "");
  if (!state) return { title: "Kombin" };
  return {
    title: `Vota aí: ${state.occasion.name} · Kombin`,
    description: `Escolha entre ${state.options.map((o) => o.name).join(", ")}.`,
  };
}

/** Página pública da votação: abre direto do WhatsApp, sem login e sem instalar nada. */
export default async function VotePage({ params, searchParams }: PageProps<"/v/[code]">) {
  const { code } = await params;
  const state = await getDecisionState(code, await getDeviceId());
  if (!state) notFound();
  const isNew = (await searchParams).novo === "1";
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const shareUrl = `${proto}://${host}/v/${code}`;

  return (
    <Page>
      <TopBar />
      <main className="flex-1 px-5 pb-14">
        <p className="mt-3 text-[17px] text-muted">{state.occasion.name}</p>
        <h1 className="title mt-1 mb-6 text-[56px]">{isNew ? "Votação criada" : "Qual vai ser?"}</h1>
        <VoteBoard initial={state} isNew={isNew} shareUrl={shareUrl} />
        <Link href="/" className="press mt-14 flex items-center gap-4">
          <LogoMark size={44} />
          <span className="text-[15px] leading-snug">
            <b className="block text-[17px] font-semibold">Kombin</b>
            <span className="text-muted">O lugar certo pra próxima saída em Campo Grande.</span>
          </span>
        </Link>
      </main>
    </Page>
  );
}
