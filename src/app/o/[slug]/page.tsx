import { Users } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { createDecision } from "@/app/actions";
import { MatchCard, MatchRow } from "@/components/MatchCard";
import { QuickPrefs } from "@/components/QuickPrefs";
import { ReviewPrompt } from "@/components/ReviewPrompt";
import { Page } from "@/components/ui/Page";
import { Photo } from "@/components/ui/Photo";
import { TopBar } from "@/components/ui/TopBar";
import { getCurrentUser } from "@/lib/auth";
import { getCatalog } from "@/lib/catalog";
import { CUISINES, cuisineLabel } from "@/lib/cuisines";
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

export default async function OccasionPage({ params, searchParams }: PageProps<"/o/[slug]">) {
  const occasion = getOccasion((await params).slug);
  if (!occasion) notFound();

  const [{ places, signals }, user, sp] = await Promise.all([getCatalog(), getCurrentUser(), searchParams]);
  const saved = new Set(user ? (await getSaved(user.id)).want : []);
  const prefs = parsePrefs(sp);
  const results = rankPlaces(places, signals, occasion, prefs);
  const top = results.slice(0, 3);
  const more = results.slice(3, 15);

  // Chips de comida: só os tipos que têm lugar nesta ocasião.
  const forOccasion = prefs.cuisine ? rankPlaces(places, signals, occasion, { ...prefs, cuisine: undefined }) : results;
  const cuisines = CUISINES.map((c) => ({
    slug: c.slug,
    label: c.label,
    emoji: c.emoji,
    count: forOccasion.filter((r) => r.place.cuisines.includes(c.slug)).length,
  })).filter((c) => c.count > 0);

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
  const emoji = isAny && prefs.cuisine ? CUISINES.find((c) => c.slug === prefs.cuisine)?.emoji : occasion.emoji;

  return (
    <Page>
      <TopBar back={{ href: "/", label: "Descobrir" }} />
      <main className="flex-1 px-5 pb-44">
        <header className="pt-2">
          <span className="rise block text-4xl" aria-hidden>
            {emoji}
          </span>
          <h1 className="rise display mt-2 text-[2.65rem]" style={{ "--i": 1 } as React.CSSProperties}>
            {title}
          </h1>
          <p className="rise mt-2 text-[1.02rem] text-muted" style={{ "--i": 2 } as React.CSSProperties}>
            {isAny && prefs.cuisine ? "Os melhores de Campo Grande, do jeito que você gosta." : occasion.tagline}
          </p>
        </header>

        <div className="mt-5">
          <QuickPrefs color={occasion.color} cuisines={cuisines} occasion={occasion.slug} />
        </div>

        <p className="mt-6 mb-3 flex items-center justify-between text-sm text-muted">
          <span>
            <b className="text-foreground">{results.length}</b> {results.length === 1 ? "lugar combina" : "lugares combinam"}
          </span>
          <span>Mais compatíveis primeiro</span>
        </p>

        {top.length === 0 ? (
          <div className="mt-4 rounded-[1.75rem] bg-soft p-7 text-center">
            <p className="text-4xl">🤷</p>
            <p className="mt-2 text-lg font-extrabold">Nada combina com esses filtros ainda.</p>
            <p className="mt-1 text-sm text-muted">Tire um filtro ou tente outra ocasião.</p>
            <Link href={`/o/${occasion.slug}`} className="press mt-4 inline-block rounded-2xl bg-foreground px-5 py-3 font-bold text-white">
              Limpar filtros
            </Link>
          </div>
        ) : (
          <ol className="space-y-5">
            {top.map((r, i) => (
              <li key={r.place.id}>
                <MatchCard result={r} occasion={occasion} rank={i} saved={saved.has(r.place.id)} loggedIn={!!user} />
              </li>
            ))}
          </ol>
        )}

        {more.length > 0 && (
          <section className="mt-9">
            <h2 className="text-[1.25rem] font-extrabold tracking-[-0.03em]">Também combinam</h2>
            <ol className="mt-1 divide-y divide-line">
              {more.map((r, i) => (
                <li key={r.place.id}>
                  <MatchRow result={r} occasion={occasion} index={i} />
                </li>
              ))}
            </ol>
          </section>
        )}
      </main>

      {top.length >= 2 && (
        <form
          action={createDecision}
          className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md bg-gradient-to-t from-white via-white/95 to-transparent px-5 pt-10 pb-[max(1rem,env(safe-area-inset-bottom))]"
        >
          <input type="hidden" name="occasion" value={occasion.slug} />
          {top.map((r) => (
            <input key={r.place.id} type="hidden" name="placeId" value={r.place.id} />
          ))}
          <button
            className="press flex w-full items-center gap-3 rounded-[1.4rem] py-3 pr-5 pl-3 text-left text-white shadow-[0_18px_40px_-18px_rgba(0,0,0,0.6)]"
            style={{ background: occasion.slug === "tudo" ? "#0b0b0c" : occasion.color }}
          >
            <span className="flex -space-x-3">
              {top.map((r) => (
                <Photo
                  key={r.place.id}
                  src={photoSrc(r.place)}
                  alt=""
                  name={r.place.name}
                  className="size-10 rounded-full ring-2 ring-white/90"
                />
              ))}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[1.02rem] font-extrabold">{occasion.decideLabel}</span>
              <span className="block truncate text-xs text-white/80">Manda as {top.length} opções pra votar no WhatsApp</span>
            </span>
            <Users className="size-5 shrink-0" strokeWidth={2.4} />
          </button>
        </form>
      )}
      <ReviewPrompt />
    </Page>
  );
}
