import Link from "next/link";
import { notFound } from "next/navigation";
import { toggleSaved } from "@/app/actions";
import { Header } from "@/components/Header";
import { MicroReview } from "@/components/MicroReview";
import { MatchBadge, Reasons } from "@/components/PlaceCard";
import { PlaceImage } from "@/components/PlaceImage";
import { getCurrentUser } from "@/lib/auth";
import { cuisineLabel } from "@/lib/cuisines";
import { liveInfo, photoUri } from "@/lib/google";
import { computeMatch } from "@/lib/match";
import { getOccasion, NOISE_LABELS, OCCASIONS, SPEND_LABELS } from "@/lib/occasions";
import { getRepo } from "@/lib/repo";

export default async function PlacePage({ params, searchParams }: PageProps<"/l/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const repo = getRepo();
  const place = await repo.getPlace(id);
  if (!place || place.status !== "approved") notFound();

  const occasion = getOccasion(typeof sp.o === "string" ? sp.o : "") ?? null;
  const color = occasion?.color ?? "#151413";
  const signals = (await repo.getSignals()).get(place.id) ?? {
    reviews: 0,
    spendAvg: null,
    noiseAvg: null,
    coverRatio: null,
  };
  const match = occasion ? computeMatch(place, signals, occasion) : null;

  const [live, hero] = place.googlePlaceId
    ? await Promise.all([
        liveInfo(place.googlePlaceId),
        place.coverUrl ? Promise.resolve(null) : photoUri(place.googlePlaceId, 0, 1200),
      ])
    : [null, null];

  // Onde a ocasião é forte: as 3 melhores notas de vibe.
  const bestFor = OCCASIONS.filter((o) => (place.vibe[o.slug] ?? 0) >= 7)
    .sort((a, b) => (place.vibe[b.slug] ?? 0) - (place.vibe[a.slug] ?? 0))
    .slice(0, 3);

  const user = await getCurrentUser();
  const saved = user ? await repo.savedLists(user.id, place.id) : [];
  const here = `/l/${place.id}${occasion ? `?o=${occasion.slug}` : ""}`;

  const spend = match?.spend ?? place.seedSpend;
  const leadQuery = `p=${place.id}${occasion ? `&o=${occasion.slug}` : ""}${match ? `&c=${match.compat}` : ""}`;

  return (
    <>
      <Header
        back={
          occasion
            ? { href: `/o/${occasion.slug}`, label: occasion.name }
            : { href: "/", label: "Início" }
        }
      />
      <main className="flex-1 pb-40">
        <div className="relative px-5">
          {hero ? (
            <figure>
              {/* eslint-disable-next-line @next/next/no-img-element -- URL do Google é temporária */}
              <img src={hero.uri} alt={`Ambiente do ${place.name}`} className="aspect-[4/3] w-full rounded-3xl object-cover" />
              <figcaption className="mt-1.5 text-right text-[11px] text-muted">
                Foto: {hero.author ?? "Google"} · Google Maps
              </figcaption>
            </figure>
          ) : (
            <PlaceImage
              placeId={place.id}
              name={place.name}
              coverUrl={place.coverUrl}
              hasGoogle={false}
              color={color}
              className="aspect-[4/3] w-full rounded-3xl"
            />
          )}
        </div>

        <section className="space-y-6 px-5 pt-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl leading-tight font-bold tracking-tight">{place.name}</h1>
              <p className="mt-1 text-muted">
                {[place.cuisines.map(cuisineLabel).join(", ") || place.category, place.neighborhood]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
            {match && <MatchBadge compat={match.compat} size="lg" />}
          </div>

          <div className="flex gap-2">
            {(
              [
                { list: "want", label: "Quero ir", on: "Na lista ✓" },
                { list: "been", label: "Já fui", on: "Já fui ✓" },
              ] as const
            ).map((b) => {
              const on = saved.includes(b.list);
              return (
                <form key={b.list} action={toggleSaved} className="flex-1">
                  <input type="hidden" name="placeId" value={place.id} />
                  <input type="hidden" name="list" value={b.list} />
                  <input type="hidden" name="back" value={here} />
                  <button
                    className={`w-full rounded-2xl border py-3 text-sm font-semibold transition active:scale-95 ${on ? "text-white" : "border-line bg-surface"}`}
                    style={on ? { background: color, borderColor: color } : undefined}
                    aria-pressed={on}
                  >
                    {on ? b.on : b.label}
                  </button>
                </form>
              );
            })}
          </div>

          {match && (match.reasons.length > 0 || match.warning) && (
            <div className="rounded-3xl bg-surface p-5">
              <h2 className="mb-3 font-bold">Por que combina com {occasion!.name.toLowerCase()}</h2>
              <Reasons reasons={match.reasons} warning={match.warning} />
            </div>
          )}

          {place.aiSummary && <p className="text-lg leading-snug">“{place.aiSummary}”</p>}

          <dl className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-2xl bg-surface p-3">
              <dt className="text-[11px] text-muted uppercase">Gasto</dt>
              <dd className="mt-1 text-sm font-semibold">{spend ? SPEND_LABELS[Math.round(spend)] : "?"}</dd>
            </div>
            <div className="rounded-2xl bg-surface p-3">
              <dt className="text-[11px] text-muted uppercase">Couvert</dt>
              <dd className="mt-1 text-sm font-semibold">
                {signals.coverRatio != null
                  ? signals.coverRatio >= 0.5
                    ? "Costuma ter"
                    : "Raro"
                  : place.seedCover == null
                    ? "?"
                    : place.seedCover
                      ? "Costuma ter"
                      : "Não"}
              </dd>
            </div>
            <div className="rounded-2xl bg-surface p-3">
              <dt className="text-[11px] text-muted uppercase">Som</dt>
              <dd className="mt-1 text-sm font-semibold">
                {(() => {
                  const n = signals.noiseAvg ?? place.seedNoise;
                  return n ? NOISE_LABELS[Math.round(n)] : "?";
                })()}
              </dd>
            </div>
          </dl>
          <p className="-mt-3 text-center text-xs text-muted">
            {signals.reviews > 0
              ? `Baseado em ${signals.reviews} ${signals.reviews === 1 ? "visita" : "visitas"} da galera do Kombin`
              : "Estimativa da curadoria. Seja a primeira pessoa a confirmar."}
          </p>

          {live && (
            <div className="space-y-1 text-sm">
              {live.rating && (
                <p>
                  <span className="font-semibold">★ {live.rating.toFixed(1).replace(".", ",")}</span>{" "}
                  <span className="text-muted">
                    ({live.userRatingCount?.toLocaleString("pt-BR")} avaliações no Google)
                  </span>
                </p>
              )}
              {live.regularOpeningHours?.openNow != null && (
                <p className={live.regularOpeningHours.openNow ? "text-match" : "text-muted"}>
                  {live.regularOpeningHours.openNow ? "Aberto agora" : "Fechado agora"}
                </p>
              )}
            </div>
          )}

          {bestFor.length > 0 && (
            <div>
              <h2 className="mb-2 text-sm font-semibold text-muted">Combina com</h2>
              <div className="flex flex-wrap gap-2">
                {bestFor.map((o) => (
                  <a
                    key={o.slug}
                    href={`/l/${place.id}?o=${o.slug}`}
                    className="rounded-full px-3 py-1.5 text-sm font-medium text-white"
                    style={{ background: o.color }}
                  >
                    {o.name}
                  </a>
                ))}
              </div>
            </div>
          )}

          <MicroReview
            placeId={place.id}
            placeName={place.name}
            occasion={occasion?.slug ?? null}
            color={color}
            variant="button"
          />

          {(place.menuUrl || place.instagram) && (
            <div className="flex gap-2 text-sm">
              {place.menuUrl && (
                <a href={place.menuUrl} target="_blank" rel="noopener" className="flex-1 rounded-2xl bg-surface py-3 text-center font-semibold">
                  Ver cardápio
                </a>
              )}
              {place.instagram && (
                <a
                  href={`https://instagram.com/${place.instagram}`}
                  target="_blank"
                  rel="noopener"
                  className="flex-1 rounded-2xl bg-surface py-3 text-center font-semibold"
                >
                  @{place.instagram}
                </a>
              )}
            </div>
          )}

          <Link href={`/painel/reivindicar/${place.id}`} className="block text-center text-sm text-muted underline">
            É dono deste lugar? Acesse o painel
          </Link>
        </section>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-md gap-2 bg-gradient-to-t from-background via-background/95 to-transparent px-5 pt-8 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        {place.whatsapp && (
          <a
            href={`/api/go/whatsapp?${leadQuery}`}
            className="flex-[2] rounded-2xl py-4 text-center font-semibold text-white shadow-lg active:scale-[0.98]"
            style={{ background: color }}
          >
            Reservar via WhatsApp
          </a>
        )}
        <a
          href={`/api/go/directions?${leadQuery}`}
          className="flex-1 rounded-2xl border border-line bg-surface py-4 text-center font-semibold active:scale-[0.98]"
        >
          Como chegar
        </a>
      </div>
    </>
  );
}
