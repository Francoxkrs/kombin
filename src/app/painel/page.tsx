import { Check } from "lucide-react";
import Link from "next/link";
import { BarChart, SERIES_COLORS } from "@/components/ui/BarChart";
import { Page } from "@/components/ui/Page";
import { BTN_IPE, BTN_LIGHT, btn, INPUT_ON_SURFACE, TEXTAREA_ON_SURFACE } from "@/components/ui/styles";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Panel, Shell, Stat } from "@/components/workspace/Shell";
import { PlaceRow } from "@/components/PlaceRow";
import { requireUser } from "@/lib/auth";
import { CUISINES } from "@/lib/cuisines";
import { change, countByDay, ownerTips, splitPeriods, summarizeReviews } from "@/lib/dashboard";
import { getOccasion, NOISE_LABELS, SPEND_LABELS } from "@/lib/occasions";
import { getRepo } from "@/lib/repo";
import { TAGS } from "@/lib/tags";
import type { Place } from "@/lib/types";
import { MAX_MENU_PAGES } from "@/lib/validation";
import { saveOwnerDetails } from "./actions";
import { CoverEditor, MenuEditor } from "./PhotoEditors";

export const metadata = { title: "Painel do restaurante · Kombin" };

const DAYS = 30;
const field = `${INPUT_ON_SURFACE} mt-2`;

/** O que deixa a página do restaurante completa, na ordem em que o cliente sente falta. */
function checklist(place: Place) {
  return [
    { done: !!place.coverUrl, label: "Foto sua de capa", href: "#fotos" },
    { done: place.menuPhotos.length > 0 || !!place.menuUrl, label: "Cardápio", href: "#fotos" },
    { done: !!place.whatsapp, label: "WhatsApp para reservas", href: "#info" },
    { done: !!place.about, label: "Recado da casa", href: "#info" },
    { done: place.tags.length > 0, label: "O que a casa tem", href: "#info" },
    { done: !!place.instagram, label: "Instagram", href: "#info" },
  ];
}

const dateBR = (iso: string) => new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Campo_Grande" });

export default async function OwnerPanel({ searchParams }: PageProps<"/painel">) {
  const user = await requireUser("/painel");
  const repo = getRepo();
  const sp = await searchParams;
  const [owned, pending] = await Promise.all([repo.ownedPlaces(user.id), repo.userOpenClaims(user.id)]);

  if (owned.length === 0) return <NoPlace q={String(sp.q ?? "").trim()} pending={pending} sent={sp.pedido === "1"} />;

  const place = owned.find((p) => p.id === sp.p) ?? owned[0];
  const [s, clicks, reviews] = await Promise.all([
    repo.placeStats(place.id, DAYS),
    repo.leadTimes(DAYS * 2, place.id),
    repo.placeReviews(place.id),
  ]);
  const contact = process.env.KOMBIN_CONTACT_WHATSAPP;

  const timesOf = (kind: string) => clicks.filter((c) => c.kind === kind).map((c) => c.created_at);
  const whatsDays = countByDay(timesOf("whatsapp"), DAYS);
  const dirDays = countByDay(timesOf("directions"), DAYS);
  const whatsP = splitPeriods(timesOf("whatsapp"), DAYS);
  const dirP = splitPeriods(timesOf("directions"), DAYS);
  const totalImp = s.impressions.reduce((a, b) => a + b.count, 0);
  const topOcc = s.impressions[0] ? getOccasion(s.impressions[0].occasion) : undefined;
  const summary = summarizeReviews(reviews);
  const tips = ownerTips(
    summary,
    { about: place.about, whatsapp: place.whatsapp, menuCount: place.menuPhotos.length + (place.menuUrl ? 1 : 0) },
    { whatsapp: s.whatsapp, directions: s.directions },
  );
  const items = checklist(place);
  const done = items.filter((x) => x.done).length;
  const q = owned.length > 1 ? `?p=${place.id}` : "";

  return (
    <Page>
      <Shell
        area="Painel do restaurante"
        title={place.name}
        root="/painel"
        nav={[
          { href: `/painel${q}#resumo`, label: "Resumo" },
          { href: `/painel${q}#cliques`, label: "Cliques" },
          { href: `/painel${q}#avaliacoes`, label: "Avaliações" },
          { href: `/painel${q}#fotos`, label: "Foto e cardápio" },
          { href: `/painel${q}#info`, label: "Informações" },
        ]}
        sidebar={owned.length > 1 ? <PlaceSwitcher places={owned} current={place.id} /> : undefined}
        actions={
          <>
            {place.status === "approved" && (
              <Link href={`/l/${place.id}`} className={btn("quiet", "md")}>
                Ver como o cliente vê
              </Link>
            )}
            <Link href="/painel/novo" className={btn("quiet", "md")}>
              Cadastrar outra casa
            </Link>
          </>
        }
      >
        <div className="space-y-6">
          {place.status !== "approved" && (
            <p className="rounded-2xl border border-ipe/40 bg-ipe/10 p-5 text-[15px] leading-snug">
              <b className="font-semibold text-ipe">Sua casa está em revisão.</b> Ela entra no Kombin quando a gente
              aprovar. Enquanto isso, já dá para pôr foto, cardápio e WhatsApp: no dia em que entrar, a página está pronta.
            </p>
          )}

          <dl id="resumo" className="grid scroll-mt-6 grid-cols-2 gap-3 xl:grid-cols-4">
            <Stat n={s.whatsapp} label="chamaram no WhatsApp" delta={change(whatsP.current, whatsP.previous)} />
            <Stat n={s.directions} label="pediram rota" delta={change(dirP.current, dirP.previous)} />
            <Stat n={totalImp} label="vezes no top 3 de uma ocasião" />
            <Stat n={s.saves} label="salvaram em “Quero ir” ou “Já fui”" />
          </dl>
          <p className="-mt-2 text-[14px] text-muted">Últimos {DAYS} dias. Cada aparelho conta uma vez a cada 30 minutos.</p>

          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-6">
              <Panel id="cliques" title="Cliques por dia" hint="Quem saiu do “vou ver” para o “vou”.">
                {s.whatsapp + s.directions === 0 ? (
                  <p className="text-[15px] leading-snug text-muted">
                    Ninguém chamou no WhatsApp nem pediu rota nos últimos {DAYS} dias. Foto de capa e cardápio são o que
                    mais faz a pessoa decidir.
                  </p>
                ) : (
                  <BarChart
                    days={whatsDays.map((d) => d.day)}
                    series={[
                      { label: "WhatsApp", color: SERIES_COLORS[0], values: whatsDays.map((d) => d.count) },
                      { label: "Rota", color: SERIES_COLORS[1], values: dirDays.map((d) => d.count) },
                    ]}
                    label={`Cliques por dia: ${s.whatsapp} no WhatsApp e ${s.directions} pedidos de rota`}
                    width={560}
                  />
                )}
              </Panel>

              <Panel
                id="avaliacoes"
                title="O que os clientes disseram"
                hint={
                  summary.total === 0
                    ? "Ainda ninguém avaliou. As avaliações vêm de quem marca “Já fui” e responde três perguntas."
                    : `${summary.total} ${summary.total === 1 ? "avaliação" : "avaliações"}${
                        summary.verified > 0 ? `, ${summary.verified} de quem confirmou a visita` : ""
                      }. Você vê o que disseram, não quem disse.`
                }
              >
                {summary.total > 0 && (
                  <div className="grid gap-6 md:grid-cols-3">
                    <Distribution title="Gasto por pessoa" rows={summary.spend} total={summary.total} />
                    <Distribution title="Barulho" rows={summary.noise} total={summary.total} />
                    <div>
                      <p className="text-[15px] font-semibold">Couvert</p>
                      <p className="title mt-2 text-[44px] leading-none tabular-nums">
                        {Math.round((summary.coverShare ?? 0) * 100)}%
                      </p>
                      <p className="mt-2 text-[14px] text-muted">disseram que pagaram</p>
                    </div>
                  </div>
                )}
                {tips.length > 0 && (
                  <div className={`rounded-2xl bg-soft p-5 ${summary.total > 0 ? "mt-6" : ""}`}>
                    <p className="text-[17px] font-semibold">O que dá para mudar</p>
                    <ul className="mt-3 space-y-2.5 text-[15px] leading-snug text-ink-2">
                      {tips.map((t) => (
                        <li key={t} className="flex gap-3">
                          <span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-ipe" aria-hidden />
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
                      {reviews.slice(0, 20).map((r, k) => (
                        <li key={k} className="flex flex-wrap items-baseline justify-between gap-x-4 py-3 text-[15px]">
                          <span>
                            {SPEND_LABELS[r.spend]}, {NOISE_LABELS[r.noise]}, {r.cover ? "com couvert" : "sem couvert"}
                          </span>
                          <span className="text-[13px] text-muted">
                            {dateBR(r.createdAt)}
                            {r.occasion && `, ${getOccasion(r.occasion)?.short ?? r.occasion}`}
                            {r.verified && ", visita confirmada"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </Panel>
            </div>

            <div className="space-y-6 lg:sticky lg:top-6">
              <Panel title={done === items.length ? "Página completa" : `Sua página: ${done} de ${items.length}`}>
                <div className="flex h-2 gap-1" aria-hidden>
                  {items.map((x) => (
                    <div key={x.label} className={`flex-1 rounded-full ${x.done ? "bg-ipe" : "bg-soft"}`} />
                  ))}
                </div>
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
              </Panel>

              {s.impressions.length > 0 && (
                <Panel title="Onde você aparece" hint="Vezes no top 3 de cada ocasião.">
                  <ul className="space-y-3">
                    {s.impressions.map((imp) => (
                      <li key={imp.occasion} className="text-[16px]">
                        <div className="flex justify-between">
                          <span>{getOccasion(imp.occasion)?.name ?? imp.occasion}</span>
                          <b className="tabular-nums">{imp.count}</b>
                        </div>
                        <div className="mt-1.5 h-2 rounded-full bg-soft">
                          <div
                            className="h-full rounded-full bg-ipe"
                            style={{ width: `${(imp.count / s.impressions[0].count) * 100}%` }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                </Panel>
              )}

              {topOcc && contact && place.status === "approved" && (
                <a
                  href={`https://wa.me/${contact}?text=${encodeURIComponent(`Quero destacar o ${place.name} em "${topOcc.name}" no Kombin`)}`}
                  className="press block rounded-2xl bg-ipe p-5 text-on-ipe"
                >
                  <p className="title text-[26px] leading-tight">Apareça primeiro em “{topOcc.name}”</p>
                  <p className="mt-2 text-[15px] leading-snug">
                    Destaque nos dias que você escolher, sempre marcado como patrocinado. Fale com a gente.
                  </p>
                </a>
              )}
            </div>
          </div>

          <div id="fotos" className="grid scroll-mt-6 items-start gap-6 lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)]">
            <Panel
              title="Foto de capa"
              hint="É a primeira coisa que aparece no Descobrir. Foto do salão com luz vende mais que foto de prato."
            >
              <CoverEditor placeId={place.id} current={place.coverUrl} blurhash={place.coverBlurhash} />
            </Panel>
            <Panel
              title="Cardápio"
              hint={`Fotografe cada página, de frente e com luz. Até ${MAX_MENU_PAGES} páginas; o app reduz as fotos antes de enviar.`}
            >
              <MenuEditor placeId={place.id} pages={place.menuPhotos} max={MAX_MENU_PAGES} />
            </Panel>
          </div>

          <Panel id="info" title="Informações" hint="Gasto, couvert e barulho vêm de quem foi e não são editáveis. É isso que faz o cliente confiar.">
            <form action={saveOwnerDetails} className="space-y-6 text-[15px]">
              <input type="hidden" name="placeId" value={place.id} />
              <div className="grid gap-5 lg:grid-cols-2">
                <label className="block lg:row-span-2">
                  Recado da casa
                  <textarea
                    name="about"
                    rows={5}
                    maxLength={280}
                    defaultValue={place.about ?? ""}
                    placeholder="Ex.: Sexta tem jazz ao vivo a partir das 20h. Reserve a mesa da varanda pelo WhatsApp."
                    className={`${TEXTAREA_ON_SURFACE} mt-2`}
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
              </div>
              <div className="grid gap-6 lg:grid-cols-2">
                <fieldset>
                  <legend className="mb-2">O que a casa tem</legend>
                  <div className="flex flex-wrap gap-1.5">
                    {TAGS.map((t) => (
                      <label key={t.slug} className="flex items-center gap-2 rounded-full bg-soft px-3 py-2">
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
                      <label key={c.slug} className="flex items-center gap-2 rounded-full bg-soft px-3 py-2">
                        <input type="checkbox" name="cuisines" value={c.slug} defaultChecked={place.cuisines.includes(c.slug)} />
                        {c.label}
                      </label>
                    ))}
                  </div>
                </fieldset>
              </div>
              <label className="block lg:max-w-[50%]">
                Cardápio online (opcional)
                <input name="menuUrl" type="url" defaultValue={place.menuUrl ?? ""} placeholder="https://" className={field} />
                <span className="mt-1 block text-[13px] text-muted">Se você já usa um cardápio digital, o link aparece junto das fotos.</span>
              </label>
              <SubmitButton className={`${BTN_IPE} w-full lg:w-auto`}>Salvar informações</SubmitButton>
            </form>
          </Panel>
        </div>
      </Shell>
    </Page>
  );
}

function PlaceSwitcher({ places, current }: { places: Place[]; current: string }) {
  return (
    <div className="lg:mt-8">
      <p className="mb-2 hidden text-[13px] text-muted lg:block">Suas casas</p>
      <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 lg:mx-0 lg:flex-col lg:gap-1 lg:px-0">
        {places.map((p) => (
          <Link
            key={p.id}
            href={`/painel?p=${p.id}`}
            aria-current={p.id === current ? "true" : undefined}
            className={`flex h-11 shrink-0 items-center rounded-full px-4 text-[15px] lg:rounded-xl lg:px-3 ${
              p.id === current ? "bg-foreground font-semibold text-background lg:bg-soft lg:text-foreground" : "bg-surface lg:bg-transparent lg:text-ink-2"
            }`}
          >
            <span className="truncate">{p.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

/** Barras horizontais de uma pergunta da avaliação (quantos escolheram cada resposta). */
function Distribution({ title, rows, total }: { title: string; rows: { label: string; count: number }[]; total: number }) {
  return (
    <div>
      <p className="text-[15px] font-semibold">{title}</p>
      <ul className="mt-3 space-y-2.5">
        {rows.map((r) => (
          <li key={r.label} className="text-[15px]">
            <div className="flex justify-between gap-2">
              <span>{r.label}</span>
              <span className="tabular-nums text-muted">{r.count}</span>
            </div>
            <div className="mt-1 h-2 rounded-full bg-soft">
              <div className="h-full rounded-full bg-ipe" style={{ width: `${(r.count / total) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Quem ainda não tem casa no painel: achar a sua, pedir acesso ou cadastrar uma nova. */
async function NoPlace({
  q,
  pending,
  sent,
}: {
  q: string;
  pending: { placeName: string; newPlace: boolean; since: string }[];
  sent: boolean;
}) {
  const repo = getRepo();
  const contact = process.env.KOMBIN_CONTACT_WHATSAPP;
  const needle = q.toLowerCase();
  const results = needle
    ? (await repo.listPlaces("approved")).filter((p) => p.name.toLowerCase().includes(needle)).slice(0, 8)
    : [];
  return (
    <Page>
      <Shell area="Painel do restaurante" title="Seu restaurante no Kombin" root="/painel" nav={[]}>
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-6">
            {(sent || pending.length > 0) && (
              <Panel title={sent ? "Pedido enviado" : "Pedidos em análise"}>
                <p className="text-[15px] leading-snug text-muted">
                  A gente confirma pelo contato que você deixou e libera o painel. Costuma levar até 2 dias úteis.
                </p>
                {pending.length > 0 && (
                  <ul className="mt-3 divide-y divide-line">
                    {pending.map((c) => (
                      <li key={c.placeName + c.since} className="flex items-baseline justify-between gap-3 py-3 text-[16px]">
                        <span>{c.placeName}</span>
                        <span className="text-[14px] text-muted">
                          {c.newPlace ? "cadastro novo" : "acesso"}, desde {dateBR(c.since)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>
            )}

            <Panel
              title="Encontre a página da sua casa"
              hint="Depois da aprovação você coloca foto, cardápio e WhatsApp, e vê quantos clientes chamaram."
            >
              <form className="flex gap-2">
                <input name="q" defaultValue={q} placeholder="Nome do restaurante" aria-label="Nome do restaurante" className={INPUT_ON_SURFACE} />
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
                <p className="mt-4 text-[15px] text-muted">Não achamos “{q}” no Kombin. Cadastre ao lado.</p>
              )}
            </Panel>
          </div>

          <Panel title="Sua casa não está aqui?" hint="Está abrindo agora ou a gente ainda não chegou até ela? Peça para entrar.">
            <ul className="space-y-2 text-[15px] leading-snug text-ink-2">
              <li>Você manda nome, endereço e contato.</li>
              <li>A gente confere e libera seu painel.</li>
              <li>Você monta a página antes de ela aparecer no app.</li>
            </ul>
            <Link href={`/painel/novo${q ? `?nome=${encodeURIComponent(q)}` : ""}`} className={`${BTN_IPE} mt-5 w-full`}>
              Cadastrar meu restaurante
            </Link>
            <p className="mt-4 text-[14px] text-muted">
              <Link href="/restaurantes" className="underline underline-offset-4">
                Como funciona para restaurantes
              </Link>
              {contact && (
                <>
                  {" "}ou{" "}
                  <a
                    className="underline underline-offset-4"
                    href={`https://wa.me/${contact}?text=${encodeURIComponent("Quero meu restaurante no Kombin")}`}
                  >
                    fale com a gente
                  </a>
                </>
              )}
              .
            </p>
          </Panel>
        </div>
      </Shell>
    </Page>
  );
}
