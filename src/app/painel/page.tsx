import { Header } from "@/components/Header";
import { PlaceRow } from "@/components/PlaceRow";
import { requireUser } from "@/lib/auth";
import { CUISINES } from "@/lib/cuisines";
import { getOccasion } from "@/lib/occasions";
import { getRepo } from "@/lib/repo";
import { saveOwnerDetails } from "./actions";

export const metadata = { title: "Painel do restaurante · Kombin" };

const field = "w-full rounded-xl border border-line bg-background px-3 py-2.5";

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
        <Header back={{ href: "/perfil", label: "Perfil" }} />
        <main className="flex-1 px-5 pt-4 pb-12">
          <h1 className="text-3xl leading-tight font-bold tracking-tight">Seu restaurante no Kombin</h1>
          <p className="mt-2 text-muted">
            Encontre a página do seu restaurante e peça acesso. Depois da aprovação você edita
            WhatsApp, cardápio e foto, e vê quantas vezes apareceu e quantos clientes chamaram.
          </p>
          <form className="mt-6 flex gap-2">
            <input name="q" defaultValue={q} placeholder="Nome do restaurante" className={field} />
            <button className="rounded-xl bg-foreground px-4 font-semibold text-background">Buscar</button>
          </form>
          <ul className="mt-4 space-y-2">
            {results.map((p) => (
              <li key={p.id}>
                <PlaceRow
                  place={p}
                  href={`/painel/reivindicar/${p.id}`}
                  right={<span className="pr-2 text-sm font-semibold">É meu ›</span>}
                />
              </li>
            ))}
          </ul>
          {q && results.length === 0 && (
            <p className="mt-6 text-sm text-muted">
              Não achou? Seu restaurante ainda não está no Kombin.
              {contact && (
                <>
                  {" "}
                  <a className="underline" href={`https://wa.me/${contact}?text=${encodeURIComponent("Quero meu restaurante no Kombin")}`}>
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
      <Header back={{ href: "/perfil", label: "Perfil" }} />
      <main className="flex-1 space-y-10 px-5 pt-4 pb-12">
        <h1 className="text-3xl font-bold tracking-tight">Painel do restaurante</h1>
        {owned.map((place, i) => {
          const s = stats[i];
          const totalImp = s.impressions.reduce((a, b) => a + b.count, 0);
          const topOcc = s.impressions[0] ? getOccasion(s.impressions[0].occasion) : undefined;
          return (
            <section key={place.id} className="space-y-4">
              <PlaceRow place={place} href={`/l/${place.id}`} />

              <p className="text-sm font-semibold text-muted">Últimos 30 dias</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { n: totalImp, label: "vezes no top 3 de uma ocasião" },
                  { n: s.whatsapp, label: "clientes chamaram no WhatsApp" },
                  { n: s.directions, label: "pediram rota" },
                  { n: s.saves, label: "salvaram em “Quero ir” / “Já fui”" },
                ].map((k) => (
                  <div key={k.label} className="rounded-2xl bg-surface p-4">
                    <p className="text-3xl font-bold">{k.n}</p>
                    <p className="text-xs text-muted">{k.label}</p>
                  </div>
                ))}
              </div>

              {s.impressions.length > 0 && (
                <div className="rounded-2xl bg-surface p-4">
                  <p className="mb-3 text-sm font-semibold">Onde você aparece</p>
                  <ul className="space-y-2">
                    {s.impressions.map((imp) => {
                      const occ = getOccasion(imp.occasion);
                      return (
                        <li key={imp.occasion} className="text-sm">
                          <div className="flex justify-between">
                            <span>{occ?.name ?? imp.occasion}</span>
                            <b>{imp.count}</b>
                          </div>
                          <div className="mt-1 h-1.5 rounded-full bg-background">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${(imp.count / s.impressions[0].count) * 100}%`,
                                background: occ?.color ?? "#151413",
                              }}
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
                  className="block rounded-2xl p-4 text-white"
                  style={{ background: topOcc.color }}
                >
                  <p className="font-bold">Apareça primeiro em “{topOcc.name}”</p>
                  <p className="text-sm text-white/85">
                    Destaque nos dias que você escolher, sempre marcado como patrocinado. Fale com a gente.
                  </p>
                </a>
              )}

              <details className="rounded-2xl bg-surface p-4">
                <summary className="cursor-pointer font-semibold">Editar informações</summary>
                <form action={saveOwnerDetails} className="mt-4 space-y-3 text-sm">
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
                        <label key={c.slug} className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5">
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
                  <button className="w-full rounded-xl bg-foreground py-3 font-semibold text-background">Salvar</button>
                  <p className="text-xs text-muted">
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
