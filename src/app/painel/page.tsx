import { BTN_IPE, BTN_LIGHT, INPUT } from "@/components/ui/styles";
import { TopBar } from "@/components/ui/TopBar";
import { PlaceRow } from "@/components/PlaceRow";
import { requireUser } from "@/lib/auth";
import { CUISINES } from "@/lib/cuisines";
import { getOccasion } from "@/lib/occasions";
import { getRepo } from "@/lib/repo";
import { saveOwnerDetails } from "./actions";
import { SubmitButton } from "@/components/ui/SubmitButton";

export const metadata = { title: "Painel do restaurante · Kombin" };

const field = `${INPUT} mt-2`;

export default async function OwnerPanel({ searchParams }: PageProps<"/painel">) {
  const user = await requireUser("/painel");
  const repo = getRepo();
  const owned = await repo.ownedPlaces(user.id);
  const contact = process.env.KOMBIN_CONTACT_WHATSAPP;

  if (owned.length === 0) {
    const q = String((await searchParams).q ?? "").trim().toLowerCase();
    const results = q
      ? (await repo.listPlaces("approved")).filter((p) => p.name.toLowerCase().includes(q)).slice(0, 8)
      : [];
    return (
      <>
        <TopBar back={{ href: "/perfil", label: "Você" }} />
        <main className="flex-1 px-5 pt-4 pb-12">
          <h1 className="title text-[44px]">Seu restaurante no Kombin</h1>
          <p className="mt-3 text-[17px] leading-snug text-muted">
            Encontre a página do seu restaurante e peça acesso. Depois da aprovação você edita
            WhatsApp, cardápio e foto, e vê quantas vezes apareceu e quantos clientes chamaram.
          </p>
          <form className="mt-6 flex gap-2">
            <input name="q" defaultValue={q} placeholder="Nome do restaurante" className={INPUT} />
            <button className={BTN_LIGHT}>Buscar</button>
          </form>
          <ul className="mt-4 space-y-1">
            {results.map((p) => (
              <li key={p.id}>
                <PlaceRow
                  place={p}
                  href={`/painel/reivindicar/${p.id}`}
                  right={<span className="text-[15px] font-semibold text-ipe">É meu</span>}
                />
              </li>
            ))}
          </ul>
          {q && results.length === 0 && (
            <p className="mt-6 text-[15px] text-muted">
              Não achou? Seu restaurante ainda não está no Kombin.
              {contact && (
                <>
                  {" "}
                  <a className="underline underline-offset-4" href={`https://wa.me/${contact}?text=${encodeURIComponent("Quero meu restaurante no Kombin")}`}>
                    Fale com a gente
                  </a>
                  .
                </>
              )}
            </p>
          )}
        </main>
      </>
    );
  }

  const stats = await Promise.all(owned.map((p) => repo.placeStats(p.id, 30)));

  return (
    <>
      <TopBar back={{ href: "/perfil", label: "Você" }} />
      <main className="flex-1 space-y-10 px-5 pt-4 pb-12">
        <h1 className="title text-[44px]">Painel do restaurante</h1>
        {owned.map((place, i) => {
          const s = stats[i];
          const totalImp = s.impressions.reduce((a, b) => a + b.count, 0);
          const topOcc = s.impressions[0] ? getOccasion(s.impressions[0].occasion) : undefined;
          return (
            <section key={place.id} className="space-y-4">
              <PlaceRow place={place} href={`/l/${place.id}`} />

              <p className="pt-2 text-[15px] text-muted">Últimos 30 dias</p>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-5">
                {[
                  { n: totalImp, label: "vezes no top 3 de uma ocasião" },
                  { n: s.whatsapp, label: "clientes chamaram no WhatsApp" },
                  { n: s.directions, label: "pediram rota" },
                  { n: s.saves, label: "salvaram em “Quero ir” / “Já fui”" },
                ].map((k) => (
                  <div key={k.label} className="flex flex-col-reverse">
                    <dt className="mt-1 text-[15px] leading-snug text-muted">{k.label}</dt>
                    <dd className="title text-[48px] tabular-nums">{k.n}</dd>
                  </div>
                ))}
              </dl>

              {s.impressions.length > 0 && (
                <div className="pt-4">
                  <h2 className="title mb-4 text-[28px]">Onde você aparece</h2>
                  <ul className="space-y-3">
                    {s.impressions.map((imp) => {
                      const occ = getOccasion(imp.occasion);
                      return (
                        <li key={imp.occasion} className="text-[16px]">
                          <div className="flex justify-between">
                            <span>{occ?.name ?? imp.occasion}</span>
                            <b>{imp.count}</b>
                          </div>
                          <div className="mt-1.5 h-2 rounded-full bg-surface">
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${(imp.count / s.impressions[0].count) * 100}%`, background: "var(--ipe)" }}
                            />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {topOcc && contact && (
                <a
                  href={`https://wa.me/${contact}?text=${encodeURIComponent(`Quero destacar o ${place.name} em "${topOcc.name}" no Kombin`)}`}
                  className="block rounded-2xl bg-ipe p-5 text-on-ipe"
                >
                  <p className="title text-[28px]">Apareça primeiro em “{topOcc.name}”</p>
                  <p className="mt-2 text-[15px] leading-snug">
                    Destaque nos dias que você escolher, sempre marcado como patrocinado. Fale com a gente.
                  </p>
                </a>
              )}

              <details className="rounded-2xl bg-surface p-5">
                <summary className="cursor-pointer text-[17px] font-semibold">Editar informações</summary>
                <form action={saveOwnerDetails} className="mt-5 space-y-4 text-[15px]">
                  <input type="hidden" name="placeId" value={place.id} />
                  <label className="block">
                    WhatsApp para reservas (com DDD)
                    <input name="whatsapp" defaultValue={place.whatsapp ?? ""} inputMode="tel" placeholder="67 99999-9999" className={field} />
                  </label>
                  <label className="block">
                    Instagram
                    <input name="instagram" defaultValue={place.instagram ?? ""} placeholder="@seurestaurante" className={field} />
                  </label>
                  <label className="block">
                    Link do cardápio
                    <input name="menuUrl" type="url" defaultValue={place.menuUrl ?? ""} placeholder="https://" className={field} />
                  </label>
                  <fieldset>
                    <legend className="mb-1">Tipo de comida</legend>
                    <div className="flex flex-wrap gap-1.5">
                      {CUISINES.map((c) => (
                        <label key={c.slug} className="flex items-center gap-2 rounded-full bg-soft px-3 py-2">
                          <input type="checkbox" name="cuisines" value={c.slug} defaultChecked={place.cuisines.includes(c.slug)} />
                          {c.label}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  <label className="block">
                    Foto de capa (até 4 MB)
                    <input name="cover" type="file" accept="image/*" className="mt-1 block w-full text-sm" />
                  </label>
                  <SubmitButton className={`${BTN_IPE} w-full`}>Salvar</SubmitButton>
                  <p className="text-[14px] text-muted">
                    Avaliações, gasto médio, couvert e barulho vêm dos clientes e não podem ser editados aqui.
                  </p>
                </form>
              </details>
            </section>
          );
        })}
      </main>
    </>
  );
}
