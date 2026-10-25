import Link from "next/link";
import { notFound } from "next/navigation";
import { createDecision } from "@/app/actions";
import { Header } from "@/components/Header";
import { PlaceCard } from "@/components/PlaceCard";
import { QuickPrefs } from "@/components/QuickPrefs";
import { ReviewPrompt } from "@/components/ReviewPrompt";
import { CUISINES } from "@/lib/cuisines";
import { rankPlaces, type MatchPrefs } from "@/lib/match";
import { getOccasion } from "@/lib/occasions";
import { getRepo } from "@/lib/repo";
import type { SpendBand } from "@/lib/types";

function parsePrefs(sp: Record<string, string | string[] | undefined>): MatchPrefs {
  const one = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  const b = Number(one("b"));
  const lat = Number(one("lat"));
  const lng = Number(one("lng"));
  return {
    cuisine: one("c") || undefined,
    budget: b >= 1 && b <= 4 ? (b as SpendBand) : undefined,
    noCover: one("nc") === "1",
    origin: Number.isFinite(lat) && Number.isFinite(lng) && one("lat") ? { lat, lng } : undefined,
  };
}

export async function generateMetadata({ params }: PageProps<"/o/[slug]">) {
  const occasion = getOccasion((await params).slug);
  return { title: occasion ? `${occasion.name} · Kombin` : "Kombin" };
}

export default async function OccasionPage({ params, searchParams }: PageProps<"/o/[slug]">) {
  const occasion = getOccasion((await params).slug);
  if (!occasion) notFound();

  const repo = getRepo();
  const [places, signals] = await Promise.all([repo.listPlaces("approved"), repo.getSignals()]);
  const prefs = parsePrefs(await searchParams);
  const results = rankPlaces(places, signals, occasion, prefs);
  const top = results.slice(0, 3);
  const more = results.slice(3, 10);

  // Chips de comida: só os tipos que têm lugar nesta ocasião.
  const forOccasion = prefs.cuisine
    ? rankPlaces(places, signals, occasion, { ...prefs, cuisine: undefined })
    : results;
  const cuisines = CUISINES.map((c) => ({
    slug: c.slug,
    label: c.label,
    count: forOccasion.filter((r) => r.place.cuisines.includes(c.slug)).length,
  })).filter((c) => c.count > 0);

  // Conta a aparição no top 3 (é o número do painel do restaurante).
  await repo
    .addImpressions(
      top.map((r) => r.place.id),
      occasion.slug,
    )
    .catch((e) => console.error("aparições não registradas", e));

  return (
    <>
      <Header back={{ href: "/", label: "Ocasiões" }} />
      <main className="flex-1 px-5 pb-36">
        <h1 className="mt-2 text-4xl leading-[1.05] font-bold tracking-tight">{occasion.name}</h1>
        <p className="mt-2 mb-5 text-muted">{occasion.tagline}</p>
        <QuickPrefs color={occasion.color} cuisines={cuisines} />

        {top.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-dashed border-line p-6 text-center">
            <p className="font-semibold">Nada combina com esses filtros ainda.</p>
            <Link href={`/o/${occasion.slug}`} className="mt-2 inline-block text-sm underline">
              Limpar filtros
            </Link>
          </div>
        ) : (
          <ol className="mt-6 space-y-5">
            {top.map((r, i) => (
              <li key={r.place.id}>
                <PlaceCard result={r} occasion={occasion} rank={i} />
              </li>
            ))}
          </ol>
        )}

        {more.length > 0 && (
          <details className="mt-8">
            <summary className="cursor-pointer text-sm font-semibold text-muted">
              Ver mais {more.length} opções
            </summary>
            <ol className="mt-4 space-y-5">
              {more.map((r, i) => (
                <li key={r.place.id}>
                  <PlaceCard result={r} occasion={occasion} rank={i + 3} />
                </li>
              ))}
            </ol>
          </details>
        )}
      </main>

      {top.length >= 2 && (
        <form
          action={createDecision}
          className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md bg-gradient-to-t from-background via-background/95 to-transparent px-5 pt-8 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
        >
          <input type="hidden" name="occasion" value={occasion.slug} />
          {top.map((r) => (
            <input key={r.place.id} type="hidden" name="placeId" value={r.place.id} />
          ))}
          <button
            className="w-full rounded-2xl py-4 text-base font-semibold text-white shadow-lg transition active:scale-[0.98]"
            style={{ background: occasion.color }}
          >
            {occasion.decideLabel} →
          </button>
          <p className="mt-2 text-center text-xs text-muted">
            Manda as {top.length} opções no WhatsApp. Quem recebe vota sem baixar nada.
          </p>
        </form>
      )}
      <ReviewPrompt />
    </>
  );
}
