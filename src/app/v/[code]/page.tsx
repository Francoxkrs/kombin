import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
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
    <>
      <Header />
      <main className="flex-1 px-5 pb-12">
        <p className="mt-3 text-sm font-semibold" style={{ color: state.occasion.color }}>
          {state.occasion.name}
        </p>
        <h1 className="mt-1 mb-6 text-4xl leading-[1.05] font-bold tracking-tight">
          {isNew ? "Votação criada" : "Qual vai ser?"}
        </h1>
        <VoteBoard initial={state} isNew={isNew} shareUrl={shareUrl} />
        <p className="mt-10 text-center text-sm text-muted">
          Quer achar o lugar certo pra sua próxima saída?{" "}
          <Link href="/" className="font-semibold text-foreground underline">
            Conheça o Kombin
          </Link>
        </p>
      </main>
    </>
  );
}
