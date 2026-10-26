import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ViewTransition } from "react";
import { LiveFacts } from "@/components/LiveInfo";
import { MenuGallery } from "@/components/MenuGallery";
import { MicroReview } from "@/components/MicroReview";
import { CompatNumber } from "@/components/ui/CompatNumber";
import { WhatsAppIcon } from "@/components/ui/icons";
import { Page } from "@/components/ui/Page";
import { Photo } from "@/components/ui/Photo";
import { SaveButton } from "@/components/ui/SaveButton";
import { ShareButton } from "@/components/ui/ShareButton";
import { BTN_IPE, BTN_LIGHT, btn, chip, ROUND_LIGHT } from "@/components/ui/styles";
import { getCurrentUser } from "@/lib/auth";
import { EMPTY_SIGNALS, getCatalog } from "@/lib/catalog";
import { computeMatch } from "@/lib/match";
import { getOccasion, NOISE_LABELS, OCCASIONS, spendTypical } from "@/lib/occasions";
import { getRepo } from "@/lib/repo";
import { getSaved } from "@/lib/saved";
import { placeKind, placePhotos, posterNameSize, sentence } from "@/lib/screen";
import { getTag } from "@/lib/tags";

export async function generateMetadata({ params }: PageProps<"/l/[id]">) {
  const { id } = await params;
  const place = (await getCatalog()).byId.get(id);
  return { title: place ? `${place.name} · Kombin` : "Kombin" };
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="contents">
      <dt className="text-muted">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

export default async function PlacePage({ params, searchParams }: PageProps<"/l/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const catalog = await getCatalog();
  const place = catalog.byId.get(id) ?? (await getRepo().getPlace(id));
  if (!place || place.status !== "approved") notFound();

  const asked = getOccasion(typeof sp.o === "string" ? sp.o : "");
  const occasion = asked && asked.slug !== "tudo" ? asked : null;
  const signals = catalog.signals.get(place.id) ?? EMPTY_SIGNALS;
  const match = occasion ? computeMatch(place, signals, occasion) : null;
  const user = await getCurrentUser();
  const saved = user ? await getSaved(user.id) : { want: [], been: [] };
  const here = `/l/${place.id}${occasion ? `?o=${occasion.slug}` : ""}`;
  const back = occasion ? `/o/${occasion.slug}` : "/";

  const photos = placePhotos(place);
  const bestFor = OCCASIONS.filter((o) => (place.vibe[o.slug] ?? 0) >= 7 && o.slug !== occasion?.slug)
    .sort((a, b) => (place.vibe[b.slug] ?? 0) - (place.vibe[a.slug] ?? 0))
    .slice(0, 4);
  const spend = match?.spend ?? signals.spendAvg ?? place.seedSpend;
  const noise = signals.noiseAvg ?? place.seedNoise;
  const coverFrom = signals.coverRatio != null ? signals.coverRatio >= 0.5 : place.seedCover;
  const cover = coverFrom == null ? null : coverFrom ? "Costuma cobrar" : "Não cobra";
  const leadQuery = `p=${place.id}${occasion ? `&o=${occasion.slug}` : ""}${match ? `&c=${match.compat}` : ""}`;
  const tags = place.tags.map((t) => getTag(t)?.label).filter((t): t is string => !!t);
  const why = match ? sentence(match.reasons.map(lowerFirst)) : null;
  const kind = [placeKind(place), place.neighborhood].filter(Boolean).join(", ");
  const price = spendTypical(spend);

  return (
    <Page>
      <div className="relative h-[62svh] min-h-[420px]">
        <ViewTransition name={`photo-${place.id}`} share="morph" default="none">
          <Photo
            src={photos[0] ?? null}
            fallbacks={photos.slice(1)}
            blurhash={place.coverUrl ? place.coverBlurhash : null}
            alt={`Foto de ${place.name}`}
            className="absolute inset-0"
            eager
          />
        </ViewTransition>
        <div className="scrim-bottom absolute inset-x-0 bottom-0 h-2/3" />
        <div className="absolute inset-x-0 top-0 flex justify-between px-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <Link href={back} transitionTypes={["nav-back"]} aria-label="Voltar" className={ROUND_LIGHT}>
            <ArrowLeft className="size-5" strokeWidth={2} />
          </Link>
          <div className="flex gap-2">
            <ShareButton title={place.name} text={`Olha esse lugar no Kombin: ${place.name}`} path={`/l/${place.id}`} />
            <SaveButton placeId={place.id} saved={saved.want.includes(place.id)} loggedIn={!!user} back={here} />
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 px-5 pb-6">
          {kind && <p className="text-[17px] font-medium">{kind}</p>}
          <h1 className={`title mt-1.5 break-words ${posterNameSize(place.name)}`}>{place.name}</h1>
        </div>
      </div>

      <main className="flex-1 pb-32">
        <section className="px-5 pt-7">
          {match ? (
            <p className="text-[24px] leading-[1.25] font-medium tracking-[-0.01em]">
              Combina <CompatNumber value={match.compat} className="text-ipe" /> com {occasion!.target}
              {why ? `: ${why}` : "."}
            </p>
          ) : (
            place.aiSummary && <p className="text-[24px] leading-[1.25] font-medium tracking-[-0.01em]">{place.aiSummary}</p>
          )}
          {match?.warning && <p className="mt-3 text-[17px] text-danger">Fique de olho: {lowerFirst(match.warning)}.</p>}
          {match && place.aiSummary && <p className="mt-4 text-[17px] leading-snug text-muted">{place.aiSummary}</p>}
        </section>

        {place.about && (
          <section className="mt-9 px-5">
            <h2 className="title text-[28px]">Da casa</h2>
            <p className="mt-3 text-[19px] leading-snug">“{place.about}”</p>
          </section>
        )}

        {bestFor.length > 0 && (
          <section className="mt-9 px-5">
            <h2 className="title text-[28px]">{occasion ? "Combina também com" : "Combina com"}</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {bestFor.map((o) => (
                <Link key={o.slug} href={`/l/${place.id}?o=${o.slug}`} replace scroll={false} className={chip(false)}>
                  {o.short}
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="mt-9 px-5">
          <h2 className="title text-[28px]">Antes de ir</h2>
          <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-6 gap-y-3.5 text-[17px] leading-snug">
            <Fact label="Gasto">{price ? `${price.replace(" ", " ")} por pessoa` : "Ninguém contou ainda"}</Fact>
            <Fact label="Couvert">{cover ?? "Ninguém contou ainda"}</Fact>
            <Fact label="Som">{noise ? NOISE_LABELS[Math.round(noise)].replace(/^./, (c) => c.toUpperCase()) : "Ninguém contou ainda"}</Fact>
            <LiveFacts placeId={place.id} enabled={!!place.googlePlaceId} />
            {place.address && (
              <Fact label="Endereço">
                <a href={`/api/go/directions?${leadQuery}`} className="underline underline-offset-4">
                  {place.address}
                </a>
              </Fact>
            )}
            {tags.length > 0 && <Fact label="Tem">{sentence(tags)}</Fact>}
            {place.instagram && (
              <Fact label="Instagram">
                <a href={`https://instagram.com/${place.instagram}`} target="_blank" rel="noopener" className="underline underline-offset-4">
                  @{place.instagram}
                </a>
              </Fact>
            )}
            {place.menuUrl && place.menuPhotos.length === 0 && (
              <Fact label="Cardápio">
                <a href={place.menuUrl} target="_blank" rel="noopener" className="underline underline-offset-4">
                  Abrir o cardápio
                </a>
              </Fact>
            )}
          </dl>
          <p className="mt-5 text-[14px] text-muted">
            {signals.reviews > 0
              ? `Gasto, couvert e som vêm de ${signals.reviews} ${signals.reviews === 1 ? "visita" : "visitas"} de quem usa o Kombin.`
              : "Gasto, couvert e som são estimativa da curadoria até alguém que foi contar."}
          </p>
        </section>

        {place.menuPhotos.length > 0 && (
          <section id="cardapio" className="mt-9 scroll-mt-4 px-5">
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="title text-[28px]">Cardápio</h2>
              {place.menuUrl && (
                <a href={place.menuUrl} target="_blank" rel="noopener" className="text-[15px] text-muted underline underline-offset-4">
                  Versão online
                </a>
              )}
            </div>
            <p className="mt-2 mb-4 text-[15px] text-muted">Fotos enviadas pela casa. Toque para ler.</p>
            <MenuGallery pages={place.menuPhotos} placeName={place.name} />
          </section>
        )}

        {photos.length > 1 && (
          <section className="mt-9 grid grid-cols-2 gap-1" aria-label={`Mais fotos de ${place.name}`}>
            {photos.slice(1, 5).map((src, i) => (
              <Photo key={src} src={src} alt={`${place.name}, foto ${i + 2}`} className="aspect-[4/5] w-full" />
            ))}
          </section>
        )}

        <section className="mt-9 px-5">
          <h2 className="title text-[28px]">Já foi?</h2>
          <p className="mt-3 max-w-[34ch] text-[17px] leading-snug text-muted">
            Conta em três toques quanto gastou, se teve couvert e se dava pra conversar. Isso acerta o índice pra todo mundo.
          </p>
          <div className="mt-5">
            <MicroReview placeId={place.id} placeName={place.name} occasion={occasion?.slug ?? null} variant="button" />
          </div>
        </section>

        <Link href={`/painel/reivindicar/${place.id}`} className="mt-10 block px-5 text-[15px] text-muted underline underline-offset-4">
          É dono deste lugar? Acesse o painel
        </Link>
      </main>

      <div className="fixed bottom-0 left-1/2 z-40 flex w-full max-w-md -translate-x-1/2 gap-2 bg-background px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {place.whatsapp ? (
          <>
            <a href={`/api/go/whatsapp?${leadQuery}`} className={`${btn("ipe", "tight")} flex-1`}>
              <WhatsAppIcon className="size-5" /> Reservar
            </a>
            <a href={`/api/go/directions?${leadQuery}`} className={BTN_LIGHT}>
              Como chegar
            </a>
          </>
        ) : (
          <>
            <a href={`/api/go/directions?${leadQuery}`} className={`${BTN_IPE} flex-1`}>
              Como chegar
            </a>
            {place.menuPhotos.length > 0 ? (
              <a href="#cardapio" className={BTN_LIGHT}>
                Cardápio
              </a>
            ) : (
              place.menuUrl && (
                <a href={place.menuUrl} target="_blank" rel="noopener" className={BTN_LIGHT}>
                  Cardápio
                </a>
              )
            )}
          </>
        )}
      </div>
    </Page>
  );
}
