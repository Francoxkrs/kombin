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
    <div className="space-y-10">
      <section>
        <h2 className="title text-[28px]">Pedidos em aberto</h2>
        {claims.length === 0 ? (
          <p className="mt-2 text-muted">Nenhum pedido de dono em aberto.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {claims.map((c) => (
              <li key={c.id} className="rounded-2xl bg-surface p-5 text-[15px]">
                <p className="text-[18px] font-semibold">{c.placeName}</p>
                <p>
                  {c.userName ?? "Sem nome"}, <b className="font-semibold">{c.contact}</b>
                </p>
                {c.message && <p className="mt-1 text-muted">“{c.message}”</p>}
                <p className="mt-1 text-[14px] text-muted">
                  Pedido em {dateBR(c.createdAt)}. Confirme pelo contato antes de aprovar.
                </p>
                <div className="mt-3 flex gap-2">
                  {[
                    { v: "1", label: "Aprovar" },
                    { v: "0", label: "Recusar" },
                  ].map((b) => (
                    <form key={b.v} action={resolveClaim}>
                      <input type="hidden" name="id" value={c.id} />
                      <input type="hidden" name="approve" value={b.v} />
                      <input type="hidden" name="label" value={`${c.userName ?? "Sem nome"} em ${c.placeName}`} />
                      <button className={chip(b.v === "1", true)}>{b.label}</button>
                    </form>
                  ))}
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
