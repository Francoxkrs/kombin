import Link from "next/link";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { createDecision } from "@/app/actions";
import { PlaceLine, PlacePoster } from "@/components/PlacePoster";
import { QuickPrefs } from "@/components/QuickPrefs";
import { ReviewPrompt } from "@/components/ReviewPrompt";
import { Page } from "@/components/ui/Page";
import { BTN_IPE, BTN_LIGHT } from "@/components/ui/styles";
import { TopBar } from "@/components/ui/TopBar";
import { getCurrentUser } from "@/lib/auth";
import { getCatalog } from "@/lib/catalog";
import { cuisineLabel } from "@/lib/cuisines";
import { rankPlaces } from "@/lib/match";
import { getOccasion } from "@/lib/occasions";
import { parsePrefs } from "@/lib/prefs";
import { getRepo } from "@/lib/repo";
import { getSaved } from "@/lib/saved";
import { toScreen } from "@/lib/screen";

export async function generateMetadata({ params }: PageProps<"/o/[slug]">) {
  const occasion = getOccasion((await params).slug);
  return { title: occasion ? `${occasion.name} · Kombin` : "Kombin" };
}

/** Quantos resultados viram cartaz; o resto vira linha. */
const POSTERS = 6;

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
  const title = isAny && prefs.cuisine ? cuisineLabel(prefs.cuisine) : occasion.name;
  const href = (id: string) => `/l/${id}?o=${occasion.slug}`;
  const screens = results.slice(0, 20).map(toScreen);
  const decide = top.length >= 2 && !isAny;

  return (
    <Page>
      <TopBar back={{ href: isAny ? "/" : `/?o=${occasion.slug}`, label: "Descobrir" }} />
      <main className={`flex-1 ${decide ? "pb-28" : "pb-12"}`}>
        <header className="px-5 pt-4">
          <h1 className="title text-[48px] text-balance">{title}</h1>
          <p className="mt-3 max-w-[34ch] text-[17px] leading-snug text-muted">{occasion.tagline}</p>
        </header>

        <div className="mt-6">
          <QuickPrefs occasion={occasion.slug} />
        </div>

        {results.length === 0 ? (
          <section className="px-5 pt-12">
            <h2 className="title text-[36px]">Nada combina com tudo isso</h2>
            <p className="mt-3 max-w-[32ch] text-[17px] leading-snug text-muted">Tire um filtro ou tente outra ocasião.</p>
            <Link href={`/o/${occasion.slug}`} className={`${BTN_LIGHT} mt-6 w-full`}>
              Limpar filtros
            </Link>
          </section>
        ) : (
          <>
            <p className="mt-7 mb-3 px-5 text-[15px] text-muted">
              {results.length} {results.length === 1 ? "lugar combina" : "lugares combinam"}, os que mais combinam primeiro.
            </p>
            <ol className="space-y-1">
              {screens.slice(0, POSTERS).map((p, i) => (
                <li key={p.id}>
                  <PlacePoster
                    place={p}
                    href={href(p.id)}
                    target={occasion.target}
                    saved={saved.has(p.id)}
                    loggedIn={!!user}
                    eager={i < 2}
                  />
                </li>
              ))}
            </ol>
            {screens.length > POSTERS && (
              <section className="mt-10">
                <h2 className="title px-5 text-[32px]">Também combinam</h2>
                <ol className="mt-2">
                  {screens.slice(POSTERS).map((p) => (
                    <li key={p.id}>
                      <PlaceLine place={p} href={href(p.id)} />
                    </li>
                  ))}
                </ol>
              </section>
            )}
          </>
        )}
      </main>

      {decide && (
        <form
          action={createDecision}
          className="fixed bottom-0 left-1/2 z-40 w-full max-w-md -translate-x-1/2 bg-background px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
        >
          <input type="hidden" name="occasion" value={occasion.slug} />
          {top.map((r) => (
            <input key={r.place.id} type="hidden" name="placeId" value={r.place.id} />
          ))}
          <button className={`${BTN_IPE} w-full`}>
            {occasion.decideLabel}
          </button>
        </form>
      )}
      <ReviewPrompt />
    </Page>
  );
}
