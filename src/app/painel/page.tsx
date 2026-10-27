import { Check } from "lucide-react";
import Link from "next/link";
import { BTN_IPE, BTN_LIGHT, INPUT, TEXTAREA } from "@/components/ui/styles";
import { TopBar } from "@/components/ui/TopBar";
import { PlaceRow } from "@/components/PlaceRow";
import { requireUser } from "@/lib/auth";
import { CUISINES } from "@/lib/cuisines";
import { BarChart, SERIES_COLORS } from "@/components/ui/BarChart";
import { countByDay, ownerTips, summarizeReviews } from "@/lib/dashboard";
import { getOccasion, NOISE_LABELS, SPEND_LABELS } from "@/lib/occasions";
import { getRepo } from "@/lib/repo";
import { TAGS } from "@/lib/tags";
import type { Place } from "@/lib/types";
import { MAX_MENU_PAGES } from "@/lib/validation";
import { saveOwnerDetails } from "./actions";
import { CoverEditor, MenuEditor } from "./PhotoEditors";
import { SubmitButton } from "@/components/ui/SubmitButton";

export const metadata = { title: "Painel do restaurante · Kombin" };

const field = `${INPUT} mt-2`;

/** O que deixa a página do restaurante completa, na ordem em que o cliente sente falta. */
function checklist(place: Place) {
  return [
    { done: !!place.coverUrl, label: "Foto sua de capa", href: "#capa" },
    { done: place.menuPhotos.length > 0 || !!place.menuUrl, label: "Cardápio", href: "#cardapio" },
    { done: !!place.whatsapp, label: "WhatsApp para reservas", href: "#info" },
    { done: !!place.about, label: "Recado da casa", href: "#info" },
    { done: place.tags.length > 0, label: "O que a casa tem", href: "#info" },
    { done: !!place.instagram, label: "Instagram", href: "#info" },
  ];
}

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
            Encontre a página do seu restaurante e peça acesso. Depois da aprovação você coloca foto, cardápio
            e WhatsApp, e vê quantas vezes apareceu e quantos clientes chamaram.{" "}
            <Link href="/restaurantes" className="underline underline-offset-4">
              Como funciona
            </Link>
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

  const [stats, clicks, reviews] = await Promise.all([
    Promise.all(owned.map((p) => repo.placeStats(p.id, 30))),
    Promise.all(owned.map((p) => repo.leadTimes(30, p.id))),
    Promise.all(owned.map((p) => repo.placeReviews(p.id))),
  ]);

  return (
    <>
      <TopBar back={{ href: "/perfil", label: "Você" }} />
      <main className="flex-1 space-y-8 px-5 pt-4 pb-16">
        <h1 className="title text-[44px]">Painel do restaurante</h1>
        {owned.map((place, i) => {
          const s = stats[i];
          const totalImp = s.impressions.reduce((a, b) => a + b.count, 0);
          const topOcc = s.impressions[0] ? getOccasion(s.impressions[0].occasion) : undefined;
          const items = checklist(place);
          const byKind = (kind: string) =>
            countByDay(clicks[i].filter((c) => c.kind === kind).map((c) => c.created_at), 30);
          const whatsDays = byKind("whatsapp");
          const dirDays = byKind("directions");
          const summary = summarizeReviews(reviews[i]);
          const tips = ownerTips(
            summary,
            { about: place.about, whatsapp: place.whatsapp, menuCount: place.menuPhotos.length + (place.menuUrl ? 1 : 0) },
            { whatsapp: s.whatsapp, directions: s.directions },
          );
          const done = items.filter((x) => x.done).length;
          return (
            <section key={place.id} className="space-y-12">
              <div>
                <PlaceRow place={place} href={`/l/${place.id}`} />
                <Link href={`/l/${place.id}`} className="mt-1 inline-flex h-11 items-center text-[15px] text-muted underline underline-offset-4">
                  Ver como o cliente vê
                </Link>
              </div>

              <div>
                <h2 className="title text-[28px]">
                  {done === items.length ? "Sua página está completa" : `Sua página: ${done} de ${items.length}`}
                </h2>
                <div className="mt-4 flex h-2 gap-1" aria-hidden>
                  {items.map((x) => (
                    <div key={x.label} className={`flex-1 rounded-full ${x.done ? "bg-ipe" : "bg-surface"}`} />
                  ))}
                </div>
                {done < items.length && (
                  <p className="mt-4 text-[15px] leading-snug text-muted">
                    Quem abre sua página decide ali. Foto, cardápio e WhatsApp respondem o que a pessoa ia perguntar antes de ir.
                  </p>
                )}
                <ul className="mt-3">
                  {items.map((x) => (
                    <li key={x.label}>
                      <a href={x.href} className="flex h-11 items-center gap-3 text-[16px]">
                        <span
                          className={`grid size-6 place-items-center rounded-full ${x.done ? "bg-ipe text-on-ipe" : "border border-line"}`}
                        >
                          {x.done && <Check className="size-4" strokeWidth={2.5} />}
                        </span>
                        <span className={x.done ? "text-muted" : ""}>{x.label}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h2 className="title text-[28px]">Últimos 30 dias</h2>
                <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-5">
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
              </div>

              <div>
                <h2 className="title text-[28px]">Cliques por dia</h2>
                <p className="mt-2 mb-4 text-[15px] leading-snug text-muted">
                  Cada barra é um dia. Cada aparelho conta uma vez a cada 30 minutos, então é gente de verdade, não toque repetido.
                </p>
                {s.whatsapp + s.directions === 0 ? (
                  <p className="rounded-2xl bg-surface p-5 text-[15px] leading-snug text-muted">
                    Ninguém chamou no WhatsApp nem pediu rota nos últimos 30 dias. Foto de capa e cardápio são o que mais faz a
                    pessoa sair do “vou ver” para o “vou”.
                  </p>
                ) : (
                  <BarChart
                    days={whatsDays.map((d) => d.day)}
                    series={[
                      { label: "WhatsApp", color: SERIES_COLORS[0], values: whatsDays.map((d) => d.count) },
                      { label: "Rota", color: SERIES_COLORS[1], values: dirDays.map((d) => d.count) },
                    ]}
                    label={`Cliques por dia em ${place.name}: ${s.whatsapp} no WhatsApp e ${s.directions} pedidos de rota`}
                  />
                )}
              </div>

              <div>
                <h2 className="title text-[28px]">O que os clientes disseram</h2>
                {summary.total === 0 ? (
                  <p className="mt-2 text-[15px] leading-snug text-muted">
                    Ainda ninguém avaliou. As avaliações chegam de quem marca “Já fui” e responde três perguntas: quanto gastou,
                    se pagou couvert e como estava o barulho.
                  </p>
                ) : (
                  <>
                    <p className="mt-2 text-[15px] leading-snug text-muted">
                      {summary.total} {summary.total === 1 ? "avaliação" : "avaliações"}
                      {summary.verified > 0 && `, ${summary.verified} de quem confirmou a visita`}. Você vê o que disseram, não
                      quem disse.
                    </p>
                    <Distribution
                      title="Gasto por pessoa"
                      rows={summary.spend.map((x) => ({ label: x.label, count: x.count }))}
                      total={summary.total}
                    />
                    <Distribution
                      title="Barulho"
                      rows={summary.noise.map((x) => ({ label: x.label, count: x.count }))}
                      total={summary.total}
                    />
                    {summary.coverShare != null && (
                      <p className="mt-5 text-[16px]">
                        <b className="tabular-nums">{Math.round(summary.coverShare * 100)}%</b> disseram que pagaram couvert.
                      </p>
                    )}
                  </>
                )}
                {tips.length > 0 && (
                  <div className="mt-6 rounded-2xl bg-surface p-5">
                    <p className="text-[18px] font-semibold">O que dá para mudar</p>
                    <ul className="mt-2 space-y-2 text-[15px] leading-snug text-ink-2">
                      {tips.map((t) => (
                        <li key={t} className="flex gap-2">
                          <span className="text-ipe" aria-hidden>
                            •
                          </span>
                          {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {summary.total > 0 && (
                  <details className="mt-4">
                    <summary className="flex h-11 cursor-pointer items-center text-[15px] text-muted">
                      Ver as últimas avaliações
                    </summary>
                    <ul className="divide-y divide-line">
                      {reviews[i].slice(0, 20).map((r, k) => (
                        <li key={k} className="py-3 text-[15px]">
                          <p>
                            {SPEND_LABELS[r.spend]}, {NOISE_LABELS[r.noise]}, {r.cover ? "com couvert" : "sem couvert"}
                          </p>
                          <p className="text-[13px] text-muted">
                            {new Date(r.createdAt).toLocaleDateString("pt-BR", { timeZone: "America/Campo_Grande" })}
                            {r.occasion && ` · ${getOccasion(r.occasion)?.name ?? r.occasion}`}
                            {r.verified && " · visita confirmada"}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>

              {s.impressions.length > 0 && (
                <div>
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

              <div id="capa" className="scroll-mt-20">
                <h2 className="title text-[28px]">Foto de capa</h2>
                <p className="mt-2 mb-4 text-[15px] leading-snug text-muted">
                  É a primeira coisa que aparece no Descobrir. Foto do salão cheio de luz vende mais que foto de prato.
                </p>
                <CoverEditor placeId={place.id} current={place.coverUrl} blurhash={place.coverBlurhash} />
              </div>

              <div id="cardapio" className="scroll-mt-20">
                <h2 className="title text-[28px]">Cardápio</h2>
                <p className="mt-2 mb-4 text-[15px] leading-snug text-muted">
                  Fotografe cada página, de frente e com luz. Até {MAX_MENU_PAGES} páginas; o app reduz as fotos antes de enviar.
                </p>
                <MenuEditor placeId={place.id} pages={place.menuPhotos} max={MAX_MENU_PAGES} />
              </div>

              <form id="info" action={saveOwnerDetails} className="scroll-mt-20 space-y-5 text-[15px]">
                <h2 className="title text-[28px]">Informações</h2>
                <input type="hidden" name="placeId" value={place.id} />
                <label className="block">
                  Recado da casa
                  <textarea
                    name="about"
                    rows={3}
                    maxLength={280}
                    defaultValue={place.about ?? ""}
                    placeholder="Ex.: Sexta tem jazz ao vivo a partir das 20h. Reserve a mesa da varanda pelo WhatsApp."
                    className={`${TEXTAREA} mt-2`}
                  />
                  <span className="mt-1 block text-[13px] text-muted">Aparece na sua página, assinado como “da casa”. Até 280 letras.</span>
                </label>
                <label className="block">
                  WhatsApp para reservas (com DDD)
                  <input name="whatsapp" defaultValue={place.whatsapp ?? ""} inputMode="tel" placeholder="67 99999-9999" className={field} />
                </label>
                <label className="block">
                  Instagram
                  <input name="instagram" defaultValue={place.instagram ?? ""} placeholder="@seurestaurante" className={field} />
                </label>
                <fieldset>
                  <legend className="mb-2">O que a casa tem</legend>
                  <div className="flex flex-wrap gap-1.5">
                    {TAGS.map((t) => (
                      <label key={t.slug} className="flex items-center gap-2 rounded-full bg-surface px-3 py-2">
                        <input type="checkbox" name="tags" value={t.slug} defaultChecked={place.tags.includes(t.slug)} />
                        {t.label}
                      </label>
                    ))}
                  </div>
                </fieldset>
                <fieldset>
                  <legend className="mb-2">Tipo de comida</legend>
                  <div className="flex flex-wrap gap-1.5">
                    {CUISINES.map((c) => (
                      <label key={c.slug} className="flex items-center gap-2 rounded-full bg-surface px-3 py-2">
                        <input type="checkbox" name="cuisines" value={c.slug} defaultChecked={place.cuisines.includes(c.slug)} />
                        {c.label}
                      </label>
                    ))}
                  </div>
                </fieldset>
                <label className="block">
                  Cardápio online (opcional)
                  <input name="menuUrl" type="url" defaultValue={place.menuUrl ?? ""} placeholder="https://" className={field} />
                  <span className="mt-1 block text-[13px] text-muted">Se você já usa um cardápio digital, o link aparece junto das fotos.</span>
                </label>
                <SubmitButton className={`${BTN_IPE} w-full`}>Salvar informações</SubmitButton>
                <p className="text-[14px] text-muted">
                  Gasto médio, couvert e barulho vêm de quem foi e não podem ser editados aqui. É isso que faz o cliente confiar no número.
                </p>
              </form>
            </section>
          );
        })}
      </main>
    </>
  );
}

/** Barras horizontais de uma pergunta da avaliação (quantos escolheram cada resposta). */
function Distribution({ title, rows, total }: { title: string; rows: { label: string; count: number }[]; total: number }) {
  return (
    <div className="mt-5">
      <p className="text-[16px] font-semibold">{title}</p>
      <ul className="mt-2 space-y-2">
        {rows.map((r) => (
          <li key={r.label} className="text-[15px]">
            <div className="flex justify-between">
              <span>{r.label}</span>
              <span className="tabular-nums text-muted">{r.count}</span>
            </div>
            <div className="mt-1 h-2 rounded-full bg-surface">
              <div className="h-full rounded-full bg-ipe" style={{ width: `${(r.count / total) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
