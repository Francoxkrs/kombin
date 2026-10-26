import { BookOpen, Check, ChevronLeft, MapPin, Navigation, Store, Wallet } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ViewTransition } from "react";
import { Gallery } from "@/components/Gallery";
import { LiveRating, LiveRows } from "@/components/LiveInfo";
import { MicroReview } from "@/components/MicroReview";
import { CompatBadge } from "@/components/ui/CompatNumber";
import { InstagramIcon, WhatsAppIcon } from "@/components/ui/icons";
import { Page } from "@/components/ui/Page";
import { SaveButton } from "@/components/ui/SaveButton";
import { ShareButton } from "@/components/ui/ShareButton";
import { getCurrentUser } from "@/lib/auth";
import { EMPTY_SIGNALS, getCatalog } from "@/lib/catalog";
import { cuisineLabel } from "@/lib/cuisines";
import { computeMatch } from "@/lib/match";
import { getOccasion, NOISE_LABELS, OCCASIONS, SPEND_LABELS, spendTypical } from "@/lib/occasions";
import { photoCount, photoSrc } from "@/lib/photos";
import { getRepo } from "@/lib/repo";
import { getSaved } from "@/lib/saved";
import { getTag } from "@/lib/tags";

export async function generateMetadata({ params }: PageProps<"/l/[id]">) {
  const { id } = await params;
  const place = (await getCatalog()).byId.get(id);
  return { title: place ? `${place.name} · Kombin` : "Kombin" };
}

export default async function PlacePage({ params, searchParams }: PageProps<"/l/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const catalog = await getCatalog();
  const place = catalog.byId.get(id) ?? (await getRepo().getPlace(id));
  if (!place || place.status !== "approved") notFound();

  const occasion = getOccasion(typeof sp.o === "string" ? sp.o : "") ?? null;
  const color = occasion && occasion.slug !== "tudo" ? occasion.color : "#0b0b0c";
  const signals = catalog.signals.get(place.id) ?? EMPTY_SIGNALS;
  const match = occasion ? computeMatch(place, signals, occasion) : null;
  const user = await getCurrentUser();
  const saved = user ? await getSaved(user.id) : { want: [], been: [] };
  const here = `/l/${place.id}${occasion ? `?o=${occasion.slug}` : ""}`;
  const back = occasion ? { href: `/o/${occasion.slug}`, label: occasion.short } : { href: "/", label: "Descobrir" };

  const photos = Array.from({ length: photoCount(place) }, (_, i) => photoSrc(place, i)).filter((s): s is string => !!s);
  const bestFor = OCCASIONS.filter((o) => (place.vibe[o.slug] ?? 0) >= 7)
    .sort((a, b) => (place.vibe[b.slug] ?? 0) - (place.vibe[a.slug] ?? 0))
    .slice(0, 3);
  const spend = match?.spend ?? signals.spendAvg ?? place.seedSpend;
  const noise = signals.noiseAvg ?? place.seedNoise;
  const cover =
    signals.coverRatio != null
      ? signals.coverRatio >= 0.5
        ? "Costuma ter"
        : "Raro"
      : place.seedCover == null
        ? "?"
        : place.seedCover
          ? "Costuma ter"
          : "Não";
  const leadQuery = `p=${place.id}${occasion ? `&o=${occasion.slug}` : ""}${match ? `&c=${match.compat}` : ""}`;
  const checks = match?.checks.length ? match.checks : place.tags.map((t) => getTag(t)?.label).filter((t): t is string => !!t).slice(0, 6);
  const live = !!place.googlePlaceId;

  return (
    <Page>
      <div className="relative">
        <ViewTransition name={`photo-${place.id}`} share="morph" default="none">
          <div className="overflow-hidden rounded-b-[2rem]">
            <Gallery photos={photos} name={place.name} color={color} />
          </div>
        </ViewTransition>
        <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 pt-[max(0.9rem,env(safe-area-inset-top))]">
          <Link
            href={back.href}
            transitionTypes={["nav-back"]}
            aria-label={`Voltar para ${back.label}`}
            className="press grid size-11 place-items-center rounded-full bg-white/85 shadow-[0_8px_24px_-10px_rgba(0,0,0,0.5)] backdrop-blur-md"
          >
            <ChevronLeft className="size-6" strokeWidth={2.4} />
          </Link>
          <div className="flex gap-2">
            <ShareButton title={place.name} text={`Olha esse lugar no Kombin: ${place.name}`} path={`/l/${place.id}`} />
            <SaveButton placeId={place.id} saved={saved.want.includes(place.id)} loggedIn={!!user} back={here} />
          </div>
        </div>
      </div>

      <main className="flex-1 space-y-7 px-5 pt-6 pb-36">
        <section>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="rise display text-[2.5rem]">{place.name}</h1>
              {place.category && (
                <p className="rise mt-1.5 text-[1.2rem] text-muted" style={{ "--i": 1 } as React.CSSProperties}>
                  {place.category}
                </p>
              )}
            </div>
            {match && <CompatBadge value={match.compat} size="lg" />}
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <p className="text-[1rem] text-ink-2">
              {[place.cuisines.map(cuisineLabel).join(", "), place.neighborhood].filter(Boolean).join(" · ")}
            </p>
            <LiveRating placeId={place.id} enabled={live} />
          </div>
          {place.aiSummary && <p className="mt-4 text-[1.08rem] leading-relaxed text-ink-2">{place.aiSummary}</p>}
        </section>

        {checks.length > 0 && (
          <section className="border-t border-line pt-6">
            <h2 className="text-[1.3rem] font-extrabold tracking-[-0.03em]">
              {match ? "Por que combina com você?" : "O que tem de bom"}
            </h2>
            <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5 text-[0.98rem] text-ink-2">
              {checks.map((c) => (
                <li key={c} className="flex items-start gap-2">
                  <Check className="mt-0.5 size-[1.1rem] shrink-0 text-match" strokeWidth={3} />
                  {c}
                </li>
              ))}
            </ul>
            {match?.warning && <p className="mt-3 text-sm text-amber-700">Atenção: {match.warning.toLowerCase()}.</p>}
          </section>
        )}

        {bestFor.length > 0 && (
          <section>
            <h2 className="text-sm font-bold text-muted">Combina com</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {bestFor.map((o) => (
                <Link
                  key={o.slug}
                  href={`/l/${place.id}?o=${o.slug}`}
                  replace
                  scroll={false}
                  className="press flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-bold text-white"
                  style={{ background: o.color, outline: occasion?.slug === o.slug ? "3px solid #0b0b0c33" : undefined }}
                >
                  <span aria-hidden>{o.emoji}</span> {o.short}
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="border-t border-line pt-6">
          <h2 className="text-[1.3rem] font-extrabold tracking-[-0.03em]">Informações do local</h2>
          <ul className="mt-2 text-[0.98rem]">
            {place.address && (
              <li>
                <a href={`/api/go/directions?${leadQuery}`} className="flex items-start gap-3 py-3.5">
                  <MapPin className="mt-0.5 size-5 shrink-0" strokeWidth={2} />
                  <span className="flex-1 text-ink-2">{place.address}</span>
                </a>
              </li>
            )}
            <li className="flex items-center gap-3 border-t border-line py-3.5">
              <Wallet className="size-5 shrink-0" strokeWidth={2} />
              <span className="flex-1">Preço estimado por pessoa</span>
              <span className="font-semibold">{spendTypical(spend) ?? <span className="font-normal text-muted">Não informado</span>}</span>
            </li>
            <LiveRows placeId={place.id} enabled={live} />
            {place.instagram && (
              <li className="border-t border-line">
                <a href={`https://instagram.com/${place.instagram}`} target="_blank" rel="noopener" className="flex items-center gap-3 py-3.5">
                  <InstagramIcon className="size-5 shrink-0" />
                  <span className="flex-1">Instagram</span>
                  <span className="text-muted">@{place.instagram}</span>
                </a>
              </li>
            )}
            {place.menuUrl && (
              <li className="border-t border-line">
                <a href={place.menuUrl} target="_blank" rel="noopener" className="flex items-center gap-3 py-3.5">
                  <BookOpen className="size-5 shrink-0" strokeWidth={2} />
                  <span className="flex-1">Cardápio</span>
                  <span className="text-muted">Abrir</span>
                </a>
              </li>
            )}
          </ul>
        </section>

        <section className="rounded-[1.75rem] bg-soft p-5">
          <h2 className="text-[1.15rem] font-extrabold tracking-[-0.02em]">O que a galera diz</h2>
          <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
            {[
              { k: "Gasto", v: spend ? SPEND_LABELS[Math.round(spend)] : "?" },
              { k: "Couvert", v: cover },
              { k: "Som", v: noise ? NOISE_LABELS[Math.round(noise)] : "?" },
            ].map((s) => (
              <div key={s.k} className="rounded-2xl bg-white px-2 py-3">
                <dt className="text-[11px] font-bold tracking-wide text-muted uppercase">{s.k}</dt>
                <dd className="mt-1 text-[13px] leading-tight font-bold">{s.v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-center text-xs text-muted">
            {signals.reviews > 0
              ? `Baseado em ${signals.reviews} ${signals.reviews === 1 ? "visita" : "visitas"} da galera do Kombin`
              : "Estimativa da curadoria. Seja a primeira pessoa a confirmar."}
          </p>
          <div className="mt-4">
            <MicroReview placeId={place.id} placeName={place.name} occasion={occasion?.slug ?? null} color={color} variant="button" />
          </div>
        </section>

        {place.tags.length > 0 && (
          <section className="flex flex-wrap gap-2">
            {place.tags.map((t) => {
              const tag = getTag(t);
              return tag ? (
                <span key={t} className="rounded-full border border-line px-3 py-1.5 text-sm font-medium">
                  {tag.emoji} {tag.label}
                </span>
              ) : null;
            })}
          </section>
        )}

        <Link href={`/painel/reivindicar/${place.id}`} className="flex items-center justify-center gap-2 py-2 text-sm text-muted">
          <Store className="size-4" /> É dono deste lugar? Acesse o painel
        </Link>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-md gap-2.5 bg-gradient-to-t from-white via-white/95 to-transparent px-5 pt-10 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {place.whatsapp ? (
          <>
            <a
              href={`/api/go/whatsapp?${leadQuery}`}
              className="press flex flex-[1.4] items-center justify-center gap-2 rounded-[1.1rem] bg-foreground py-4 font-bold text-white shadow-[0_18px_40px_-18px_rgba(0,0,0,0.7)]"
            >
              <WhatsAppIcon className="size-5" /> Reservar
            </a>
            <a
              href={`/api/go/directions?${leadQuery}`}
              className="press flex flex-1 items-center justify-center gap-2 rounded-[1.1rem] border border-line bg-white py-4 font-bold"
            >
              <Navigation className="size-[1.1rem]" strokeWidth={2.4} /> Como chegar
            </a>
          </>
        ) : (
          <>
            <a
              href={`/api/go/directions?${leadQuery}`}
              className="press flex flex-[1.4] items-center justify-center gap-2 rounded-[1.1rem] bg-foreground py-4 font-bold text-white shadow-[0_18px_40px_-18px_rgba(0,0,0,0.7)]"
            >
              <Navigation className="size-[1.1rem]" strokeWidth={2.4} /> Como chegar
            </a>
            {place.menuUrl && (
              <a
                href={place.menuUrl}
                target="_blank"
                rel="noopener"
                className="press flex flex-1 items-center justify-center gap-2 rounded-[1.1rem] border border-line bg-white py-4 font-bold"
              >
                <BookOpen className="size-[1.1rem]" strokeWidth={2.4} /> Ver cardápio
              </a>
            )}
          </>
        )}
      </div>
    </Page>
  );
}
