import Link from "next/link";
import { notFound } from "next/navigation";
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
        <h1 className="text-3xl leading-tight font-bold tracking-tight">Este restaurante é seu?</h1>
        <PlaceRow place={place} />
        {alreadyOwner ? (
          <Link href="/painel" className="block rounded-2xl bg-foreground py-4 text-center font-semibold text-white">
            Você já tem acesso. Abrir painel
          </Link>
        ) : sent ? (
          <div className="rounded-2xl bg-soft p-5">
            <p className="font-bold">Pedido enviado</p>
            <p className="mt-1 text-sm text-muted">
              A gente confirma pelo contato que você deixou e libera o painel. Costuma levar até 2 dias úteis.
            </p>
          </div>
        ) : (
          <form action={claimPlace} className="space-y-3">
            <input type="hidden" name="placeId" value={place.id} />
            <label className="block text-sm">
              Telefone ou WhatsApp para confirmarmos
              <input name="contact" required inputMode="tel" placeholder="67 99999-9999" className="mt-1 w-full rounded-xl border border-line bg-soft px-3 py-3" />
            </label>
            <label className="block text-sm">
              Seu cargo e algo que comprove (opcional)
              <textarea name="message" rows={3} placeholder="Sou o proprietário. CNPJ 00.000.000/0001-00" className="mt-1 w-full rounded-xl border border-line bg-soft px-3 py-3" />
            </label>
            <button className="w-full rounded-2xl bg-foreground py-4 font-semibold text-white">Pedir acesso</button>
          </form>
        )}
      </main>
    </>
  );
}
