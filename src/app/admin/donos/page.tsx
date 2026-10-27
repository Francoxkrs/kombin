import Link from "next/link";
import { chip } from "@/components/ui/styles";
import { requireAdmin } from "@/lib/auth";
import { getRepo } from "@/lib/repo";
import { resolveClaim, revokeOwner } from "../actions";
import { Confirm } from "../Confirm";
import { dateBR } from "../format";

export default async function AdminOwners() {
  await requireAdmin();
  const repo = getRepo();
  const [claims, owners] = await Promise.all([repo.listOpenClaims(), repo.listOwners()]);

  return (
    <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-8">
      <section>
        <h2 className="title text-[28px]">Pedidos em aberto</h2>
        {claims.length === 0 ? (
          <p className="mt-2 text-muted">Nenhum pedido de dono em aberto.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {claims.map((c) => (
              <li key={c.id} className="rounded-2xl bg-surface p-5 text-[15px]">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[18px] font-semibold">{c.placeName}</p>
                  {c.newPlace && (
                    <span className="shrink-0 rounded-full bg-ipe px-2.5 py-1 text-[13px] font-semibold text-on-ipe">casa nova</span>
                  )}
                </div>
                <p>
                  {c.userName ?? "Sem nome"}, <b className="font-semibold">{c.contact}</b>
                </p>
                {c.message && <p className="mt-1 text-muted">“{c.message}”</p>}
                <p className="mt-1 text-[14px] text-muted">
                  Pedido em {dateBR(c.createdAt)}. Confirme pelo contato antes de aprovar.
                  {c.newPlace && " A casa ainda não está no app: confira nome e endereço em Lugares, ou aprove tudo de uma vez."}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {[
                    ...(c.newPlace ? [{ v: "1", also: "1", label: "Aprovar casa e dono" }] : []),
                    { v: "1", also: "", label: c.newPlace ? "Só o dono" : "Aprovar" },
                    { v: "0", also: "", label: "Recusar" },
                  ].map((b, i) => (
                    <form key={b.label} action={resolveClaim}>
                      <input type="hidden" name="id" value={c.id} />
                      <input type="hidden" name="placeId" value={c.placeId} />
                      <input type="hidden" name="approve" value={b.v} />
                      <input type="hidden" name="alsoPlace" value={b.also} />
                      <input type="hidden" name="label" value={`${c.userName ?? "Sem nome"} em ${c.placeName}`} />
                      <button className={chip(i === 0, true)}>{b.label}</button>
                    </form>
                  ))}
                  {c.newPlace && (
                    <Link
                      href={`/admin/lugares?s=pending&q=${encodeURIComponent(c.placeName)}`}
                      className="press flex h-11 items-center px-2 text-[15px] text-muted underline underline-offset-4"
                    >
                      Ver a casa
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="title text-[28px]">Donos aprovados</h2>
        {owners.length === 0 ? (
          <p className="mt-2 text-muted">Nenhum restaurante tem dono no app ainda.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {owners.map((o) => (
              <li key={`${o.placeId}-${o.userId}`} className="rounded-2xl bg-surface p-5 text-[15px]">
                <Link href={`/l/${o.placeId}`} className="text-[18px] font-semibold underline-offset-4 hover:underline">
                  {o.placeName}
                </Link>
                <p className="text-muted">
                  {o.userName ?? "Sem nome"}, desde {dateBR(o.since)}
                </p>
                <div className="mt-3">
                  <Confirm
                    label="Tirar acesso"
                    warning={`${o.userName ?? "Essa pessoa"} deixa de ver o painel de ${o.placeName} e não pode mais mudar foto, cardápio nem WhatsApp.`}
                    confirm="Tirar acesso"
                    action={revokeOwner}
                    fields={{ id: o.placeId, userId: o.userId, label: `${o.userName ?? "Sem nome"} em ${o.placeName}` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
