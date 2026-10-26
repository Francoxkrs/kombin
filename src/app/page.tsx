import { ArrowRight, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { OccasionCard } from "@/components/OccasionCard";
import { RestaurantCard } from "@/components/RestaurantCard";
import { ReviewPrompt } from "@/components/ReviewPrompt";
import { Page } from "@/components/ui/Page";
import { Photo } from "@/components/ui/Photo";
import { TopBar } from "@/components/ui/TopBar";
import { getCurrentUser } from "@/lib/auth";
import { getCatalog } from "@/lib/catalog";
import { rankPlaces, type MatchResult } from "@/lib/match";
import { ANY_OCCASION, getOccasion, OCCASIONS } from "@/lib/occasions";
import { photoSrc } from "@/lib/photos";
import { getSaved } from "@/lib/saved";
import { greeting } from "@/lib/time";

export default async function DiscoverPage() {
  const [{ places, signals, byId }, user] = await Promise.all([getCatalog(), getCurrentUser()]);
  const saved = user ? await getSaved(user.id) : { want: [], been: [] };
  const savedSet = new Set(saved.want);
  const { moment, mood, suggested } = greeting();

  const occasions = OCCASIONS.map((o) => ({ o, count: rankPlaces(places, signals, o).length })).sort((a, b) =>
    a.o.slug === suggested ? -1 : b.o.slug === suggested ? 1 : 0,
  );

  // "Escolhas para o seu momento": o ranking da ocasião da hora; se faltar lugar, completa com os melhores no geral.
  const now = getOccasion(suggested) ?? ANY_OCCASION;
  const picks: MatchResult[] = rankPlaces(places, signals, now).slice(0, 12);
  if (picks.length < 6) {
    const seen = new Set(picks.map((r) => r.place.id));
    picks.push(...rankPlaces(places, signals, ANY_OCCASION).filter((r) => !seen.has(r.place.id)).slice(0, 12 - picks.length));
  }
  const wantList = saved.want.map((id) => byId.get(id)).filter((p) => !!p).slice(0, 8);

  return (
    <Page>
      <TopBar city />
      <main className="flex-1 pb-36">
        <section className="px-5 pt-5">
          <p className="rise text-sm text-muted">
            {moment}
            {mood && ` · ${mood}`}
          </p>
          <h1
            className="rise mt-3 text-4xl leading-[1.05] font-bold tracking-tight text-foreground"
            style={{ "--i": 1 } as React.CSSProperties}
          >
            O que <span className="accent text-[1.12em]">combina</span> com você hoje?
          </h1>
          <Link
            href="/buscar"
            transitionTypes={["nav-forward"]}
            className="press rise mt-6 flex items-center justify-between gap-3 rounded-full border border-line bg-surface py-2 pr-2 pl-5 shadow-sm"
            style={{ "--i": 2 } as React.CSSProperties}
          >
            <span className="truncate text-[13px] tracking-[-0.01em] text-muted">Escolher ocasião, companhia e orçamento...</span>
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-foreground text-background">
              <SlidersHorizontal className="size-[18px]" strokeWidth={1.5} />
            </span>
          </Link>
        </section>

        <section className="mt-8">
          <div className="flex items-baseline justify-between px-5">
            <h2 className="text-xl font-semibold tracking-[-0.02em]">
              Qual é a <span className="accent text-[1.15em]">ocasião</span>?
            </h2>
            <span className="text-xs text-muted">{OCCASIONS.length} momentos</span>
          </div>
          <ul className="no-scrollbar mt-4 flex snap-x snap-mandatory scroll-px-5 gap-4 overflow-x-auto px-5 pb-2">
            {occasions.map(({ o, count }, i) => (
              <li key={o.slug} className="shrink-0 snap-start">
                <OccasionCard occasion={o} count={count} now={o.slug === suggested} index={i} />
              </li>
            ))}
          </ul>
        </section>

        {wantList.length > 0 && (
          <section className="mt-10">
            <div className="flex items-baseline justify-between px-5">
              <h2 className="text-xl font-semibold tracking-[-0.02em]">
                Na sua <span className="accent text-[1.15em]">lista</span>
              </h2>
              <Link href="/perfil" className="flex items-center gap-1 text-xs font-medium text-ink-2">
                Ver tudo <ArrowRight className="size-3.5" strokeWidth={1.5} />
              </Link>
            </div>
            <ul className="no-scrollbar mt-4 flex gap-3 overflow-x-auto px-5">
              {wantList.map((p) => (
                <li key={p.id} className="w-36 shrink-0">
                  <Link href={`/l/${p.id}`} transitionTypes={["nav-forward"]} className="press block">
                    <Photo src={photoSrc(p)} alt="" name={p.name} className="aspect-square rounded-2xl" />
                    <p className="mt-2 truncate text-sm font-semibold">{p.name}</p>
                    <p className="truncate text-xs text-muted">{p.neighborhood ?? p.category}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="@container mt-10 px-5">
          <h2 className="text-xl font-semibold tracking-[-0.02em]">
            Escolhas para o seu <span className="accent text-[1.15em]">momento</span>
          </h2>
          <p className="mt-0.5 text-xs text-muted">
            {now.slug === "tudo" ? "Os que mais combinam em Campo Grande" : `${now.name} · ordenado por compatibilidade`}
          </p>
          {picks.length === 0 ? (
            <div className="mt-5 rounded-3xl border border-line bg-soft p-6 text-center">
              <p className="text-lg font-semibold">
                A curadoria está <span className="accent text-[1.15em]">chegando</span>
              </p>
              <p className="mt-1 text-sm text-muted">
                Os primeiros restaurantes entram assim que o time importar a lista de Campo Grande.
              </p>
              {user?.isAdmin && (
                <Link
                  href="/admin?s=importar"
                  className="press mt-4 inline-block rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-background"
                >
                  Importar do Google agora
                </Link>
              )}
            </div>
          ) : (
            <div className="mt-5 grid grid-cols-1 gap-5 @xl:grid-cols-2">
              {picks.map((r, i) => (
                <RestaurantCard
                  key={r.place.id}
                  place={r.place}
                  compat={r.compat}
                  badges={r.badges}
                  spend={r.spend}
                  saved={savedSet.has(r.place.id)}
                  loggedIn={!!user}
                  href={now.slug === "tudo" ? undefined : `/l/${r.place.id}?o=${now.slug}`}
                  index={i % 6}
                />
              ))}
            </div>
          )}
        </section>
      </main>
      <ReviewPrompt />
    </Page>
  );
}
