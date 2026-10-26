import { SearchX, UsersRound } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { createDecision } from "@/app/actions";
import { RestaurantCard, RestaurantRow } from "@/components/RestaurantCard";
import { QuickPrefs } from "@/components/QuickPrefs";
import { ReviewPrompt } from "@/components/ReviewPrompt";
import { Glyph } from "@/components/ui/Glyph";
import { Page } from "@/components/ui/Page";
import { Photo } from "@/components/ui/Photo";
import { TopBar } from "@/components/ui/TopBar";
import { getCurrentUser } from "@/lib/auth";
import { getCatalog } from "@/lib/catalog";
import { cuisineLabel } from "@/lib/cuisines";
import { rankPlaces } from "@/lib/match";
import { getOccasion } from "@/lib/occasions";
import { photoSrc } from "@/lib/photos";
import { parsePrefs } from "@/lib/prefs";
import { getRepo } from "@/lib/repo";
import { getSaved } from "@/lib/saved";

export async function generateMetadata({ params }: PageProps<"/o/[slug]">) {
  const occasion = getOccasion((await params).slug);
  return { title: occasion ? `${occasion.name} · Kombin` : "Kombin" };
}

/** Quantos resultados viram card grande; o resto vira linha. */
const CARDS = 6;

export default async function OccasionPage({ params, searchParams }: PageProps<"/o/[slug]">) {
  const occasion = getOccasion((await params).slug);
  if (!occasion) notFound();

  const [{ places, signals }, user, sp] = await Promise.all([getCatalog(), getCurrentUser(), searchParams]);
  const saved = new Set(user ? (await getSaved(user.id)).want : []);
  const prefs = parsePrefs(sp);
  const results = rankPlaces(places, signals, occasion, prefs);
  const top = results.slice(0, 3);

  // Conta a aparição no top 3 (número do painel do restaurante), depois de responder.
  if (top.length > 0 && occasion.slug !== "tudo") {
    after(() =>
      getRepo()
        .addImpressions(
          top.map((r) => r.place.id),
          occasion.slug,
        )
        .catch((e) => console.error("aparições não registradas", e)),
    );
  }

  const isAny = occasion.slug === "tudo";
  const [lead, accent] = isAny && prefs.cuisine ? [cuisineLabel(prefs.cuisine), ""] : occasion.display;
  const href = (id: string) => `/l/${id}?o=${occasion.slug}`;

  return (
    <Page>
      <TopBar back={{ href: "/", label: "Descobrir" }} />
      <main className="flex-1 px-5 pb-36">
        <header className="pt-3">
          <span className="rise grid size-11 place-items-center rounded-full border border-line bg-surface">
            <Glyph name={occasion.icon} className="size-5 text-foreground" />
          </span>
          <h1
            className="rise mt-4 text-4xl leading-[1.05] font-bold tracking-tight"
            style={{ "--i": 1 } as React.CSSProperties}
          >
            {lead} {accent && <span className="accent text-[1.12em]">{accent}</span>}
          </h1>
          <p className="rise mt-2 text-sm leading-relaxed text-muted" style={{ "--i": 2 } as React.CSSProperties}>
            {occasion.tagline}
          </p>
        </header>

        <div className="mt-6">
          <QuickPrefs occasion={occasion.slug} />
        </div>

        <p className="mt-7 mb-4 flex items-center justify-between text-xs text-muted">
          <span>
            <b className="font-semibold text-foreground">{results.length}</b>{" "}
            {results.length === 1 ? "lugar combina" : "lugares combinam"}
          </span>
          <span>Mais compatíveis primeiro</span>
        </p>

        {results.length === 0 ? (
          <div className="mt-2 rounded-3xl border border-line bg-soft p-7 text-center">
            <SearchX className="mx-auto size-7 text-muted" strokeWidth={1.5} />
            <p className="mt-3 text-lg font-semibold">Nada combina com esses filtros ainda.</p>
            <p className="mt-1 text-sm text-muted">Tire um filtro ou tente outra ocasião.</p>
            <Link
              href={`/o/${occasion.slug}`}
              className="press mt-5 inline-block rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-background"
            >
              Limpar filtros
            </Link>
          </div>
        ) : (
          <ol className="space-y-5">
            {results.slice(0, CARDS).map((r, i) => (
              <li key={r.place.id}>
                <RestaurantCard
                  place={r.place}
                  compat={r.compat}
                  badges={r.badges}
                  spend={r.spend}
                  saved={saved.has(r.place.id)}
                  loggedIn={!!user}
                  href={href(r.place.id)}
                  index={i}
                />
              </li>
            ))}
          </ol>
        )}

        {results.length > CARDS && (
          <section className="mt-10">
            <h2 className="text-xl font-semibold tracking-[-0.02em]">
              Também <span className="accent text-[1.15em]">combinam</span>
            </h2>
            <ol className="mt-2 divide-y divide-line">
              {results.slice(CARDS, 20).map((r, i) => (
                <li key={r.place.id}>
                  <RestaurantRow result={r} href={href(r.place.id)} index={i} />
                </li>
              ))}
            </ol>
          </section>
        )}
      </main>

      {top.length >= 2 && <div aria-hidden className="dock-scrim" />}
      {top.length >= 2 && (
        <form
          action={createDecision}
          className="fixed left-1/2 z-40 w-[calc(100%-2.5rem)] max-w-[24rem] -translate-x-1/2"
          style={{ bottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
        >
          <input type="hidden" name="occasion" value={occasion.slug} />
          {top.map((r) => (
            <input key={r.place.id} type="hidden" name="placeId" value={r.place.id} />
          ))}
          <button className="press flex w-full items-center gap-3 rounded-full border border-white/10 bg-[#111111]/90 py-2 pr-5 pl-2 text-left text-white shadow-2xl backdrop-blur-xl">
            <span className="flex -space-x-3">
              {top.map((r) => (
                <Photo
                  key={r.place.id}
                  src={photoSrc(r.place)}
                  alt=""
                  name={r.place.name}
                  className="size-10 rounded-full ring-2 ring-[#111111]"
                />
              ))}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">{occasion.decideLabel}</span>
              <span className="block truncate text-xs text-white/60">Manda as {top.length} opções pra votar no WhatsApp</span>
            </span>
            <UsersRound className="size-5 shrink-0" strokeWidth={1.5} />
          </button>
        </form>
      )}
      <ReviewPrompt />
    </Page>
  );
}
