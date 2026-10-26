import Link from "next/link";
import { notFound } from "next/navigation";
import { BTN_IPE, INPUT, TEXTAREA } from "@/components/ui/styles";
import { TopBar } from "@/components/ui/TopBar";
import { PlaceRow } from "@/components/PlaceRow";
import { requireUser } from "@/lib/auth";
import { getRepo } from "@/lib/repo";
import { claimPlace } from "../../actions";

export const metadata = { title: "Reivindicar restaurante · Kombin" };

export default async function ClaimPage({ params, searchParams }: PageProps<"/painel/reivindicar/[id]">) {
  const { id } = await params;
  const user = await requireUser(`/painel/reivindicar/${id}`);
  const repo = getRepo();
  const place = await repo.getPlace(id);
  if (!place) notFound();
  const sent = (await searchParams).enviado === "1" || (await repo.hasOpenClaim(user.id, id));
  const alreadyOwner = await repo.isOwner(user.id, id);

  return (
    <>
      <TopBar back={{ href: "/painel", label: "Painel" }} />
      <main className="flex-1 space-y-6 px-5 pt-4 pb-12">
        <h1 className="title text-[44px]">Este restaurante é seu?</h1>
        <PlaceRow place={place} />
        {alreadyOwner ? (
          <Link href="/painel" className={`${BTN_IPE} w-full`}>
            Você já tem acesso. Abrir painel
          </Link>
        ) : sent ? (
          <div>
            <h2 className="title text-[28px]">Pedido enviado</h2>
            <p className="mt-2 text-[17px] leading-snug text-muted">
              A gente confirma pelo contato que você deixou e libera o painel. Costuma levar até 2 dias úteis.
            </p>
          </div>
        ) : (
          <form action={claimPlace} className="space-y-4">
            <input type="hidden" name="placeId" value={place.id} />
            <label className="block text-[15px] text-muted">
              Telefone ou WhatsApp para confirmarmos
              <input name="contact" required inputMode="tel" placeholder="67 99999-9999" className={`${INPUT} mt-2`} />
            </label>
            <label className="block text-[15px] text-muted">
              Seu cargo e algo que comprove (opcional)
              <textarea
                name="message"
                rows={3}
                placeholder="Sou o proprietário. CNPJ 00.000.000/0001-00"
                className={`${TEXTAREA} mt-2`}
              />
            </label>
            <button className={`${BTN_IPE} w-full`}>Pedir acesso</button>
          </form>
        )}
      </main>
    </>
  );
}
