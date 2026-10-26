import { ArrowRight, SlidersHorizontal, Sparkles } from "lucide-react";
import Link from "next/link";
import { MarqueeBand } from "@/components/MarqueeBand";
import { PlaceTile } from "@/components/PlaceTile";
import { ReviewPrompt } from "@/components/ReviewPrompt";
import { Page } from "@/components/ui/Page";
import { Photo } from "@/components/ui/Photo";
import { TopBar } from "@/components/ui/TopBar";
import { getCurrentUser } from "@/lib/auth";
import { EMPTY_SIGNALS, getCatalog } from "@/lib/catalog";
import { CUISINES } from "@/lib/cuisines";
import { rankPlaces } from "@/lib/match";
import { ANY_OCCASION, OCCASIONS, vibeFor } from "@/lib/occasions";
import { photoSrc } from "@/lib/photos";
import { getSaved } from "@/lib/saved";
import { greeting } from "@/lib/time";

export default async function DiscoverPage() {
  const [{ places, signals, byId }, user] = await Promise.all([getCatalog(), getCurrentUser()]);
  const saved = user ? await getSaved(user.id) : { want: [], been: [] };
  const savedSet = new Set(saved.want);
  const { hello, moment, suggested } = greeting();

  const occasions = OCCASIONS.map((o) => {
    const ranked = rankPlaces(places, signals, o);
    const cover = ranked.find((r) => photoSrc(r.place))?.place ?? ranked[0]?.place;
    return { o, count: ranked.length, cover };
  }).sort((a, b) => (a.o.slug === suggested ? -1 : b.o.slug === suggested ? 1 : 0));

  const cuisines = CUISINES.map((c) => ({ ...c, count: places.filter((p) => p.cuisines.includes(c.slug)).length })).filter(
    (c) => c.count > 0,
  );

  const best = (p: (typeof places)[number]) => vibeFor(p.vibe, ANY_OCCASION) ?? 0;
  const feed = [...places].sort((a, b) => Number(b.featured) - Number(a.featured) || best(b) - best(a)).slice(0, 24);
  const wantList = saved.want.map((id) => byId.get(id)).filter((p) => !!p).slice(0, 8);
  const spendOf = (id: string) => {
    const p = byId.get(id)!;
    return signals.get(id)?.spendAvg ?? p.seedSpend ?? EMPTY_SIGNALS.spendAvg;
  };

  return (
    <Page>
      <TopBar city />
      <main className="flex-1 pb-32">
        <section className="px-5 pt-4">
          <p className="rise text-[0.95rem] font-medium text-muted">
            {hello}
            {user ? `, ${user.name.split(" ")[0]}` : ""} · {moment}
          </p>
          <h1 className="rise display mt-2 text-[2.9rem]" style={{ "--i": 1 } as React.CSSProperties}>
            O que combina com você hoje?
          </h1>
          <Link
            href="/buscar"
            transitionTypes={["nav-forward"]}
            className="press rise mt-5 flex items-center gap-3 rounded-2xl border border-line bg-white px-4 py-3.5 shadow-[0_12px_30px_-24px_rgba(0,0,0,0.5)]"
            style={{ "--i": 2 } as React.CSSProperties}
          >
            <SlidersHorizontal className="size-5" strokeWidth={2.3} />
            <span className="flex-1 text-[0.98rem] text-muted">Comida, pessoas, orçamento, bairro…</span>
            <span className="rounded-xl bg-foreground px-3 py-1.5 text-sm font-bold text-white">Filtrar</span>
          </Link>
        </section>

        <section className="mt-9">
          <div className="flex items-end justify-between px-5">
            <h2 className="text-[1.35rem] font-extrabold tracking-[-0.03em]">Qual é a ocasião?</h2>
            <span className="text-sm text-muted">{OCCASIONS.length} momentos</span>
          </div>
          <ul className="no-scrollbar mt-3 flex snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto px-5 pb-2">
            {occasions.map(({ o, count, cover }, i) => (
              <li key={o.slug} className="snap-start">
                <Link
                  href={`/o/${o.slug}`}
                  transitionTypes={["nav-forward"]}
                  className="press rise relative block h-[19rem] w-[14.5rem] overflow-hidden rounded-[1.75rem] text-white"
                  style={{ "--i": i } as React.CSSProperties}
                >
                  <Photo
                    src={cover ? photoSrc(cover) : null}
                    alt=""
                    name={o.name}
                    color={o.color}
                    className="absolute inset-0"
                    eager={i < 2}
                  />
                  <div
                    className="absolute inset-0"
                    style={{ background: `linear-gradient(180deg, transparent 25%, ${o.color}e6 78%, ${o.color})` }}
                  />
                  {o.slug === suggested && (
                    <span className="absolute top-3 left-3 flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-extrabold text-foreground">
                      <Sparkles className="size-3.5" strokeWidth={2.4} /> Pra agora
                    </span>
                  )}
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <span className="text-3xl" aria-hidden>
                      {o.emoji}
                    </span>
                    <p className="display mt-1 text-[1.6rem]">{o.name}</p>
                    <p className="mt-1.5 line-clamp-2 text-[13px] leading-snug text-white/85">{o.tagline}</p>
                    <p className="mt-2 text-xs font-bold text-white/90">
                      {count} {count === 1 ? "lugar" : "lugares"}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {cuisines.length > 0 && (
          <section className="mt-8">
            <h2 className="px-5 text-[1.35rem] font-extrabold tracking-[-0.03em]">Bateu fome de quê?</h2>
            <ul className="no-scrollbar mt-3 flex gap-2 overflow-x-auto px-5 pb-1">
              {cuisines.map((c, i) => (
                <li key={c.slug}>
                  <Link
                    href={`/o/tudo?c=${c.slug}`}
                    transitionTypes={["nav-forward"]}
                    className="press rise flex w-[4.9rem] flex-col items-center gap-1.5 text-center"
                    style={{ "--i": i } as React.CSSProperties}
                  >
                    <span className="grid size-[4.2rem] place-items-center rounded-[1.4rem] bg-soft text-[2rem]">
                      {c.emoji}
                    </span>
                    <span className="text-[12px] leading-tight font-semibold">{c.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {wantList.length > 0 && (
          <section className="mt-9">
            <div className="flex items-end justify-between px-5">
              <h2 className="text-[1.35rem] font-extrabold tracking-[-0.03em]">Na sua lista</h2>
              <Link href="/perfil" className="flex items-center gap-1 text-sm font-bold">
                Ver tudo <ArrowRight className="size-4" />
              </Link>
            </div>
            <ul className="no-scrollbar mt-3 flex gap-3 overflow-x-auto px-5">
              {wantList.map((p) => (
                <li key={p.id} className="w-36 shrink-0">
                  <Link href={`/l/${p.id}`} transitionTypes={["nav-forward"]} className="press block">
                    <Photo src={photoSrc(p)} alt="" name={p.name} className="aspect-square rounded-2xl" />
                    <p className="mt-1.5 truncate text-sm font-bold">{p.name}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-9 px-5">
          <h2 className="text-[1.35rem] font-extrabold tracking-[-0.03em]">Descubra novos lugares</h2>
          <p className="text-[0.95rem] text-muted">Sugestões em Campo Grande</p>
          {feed.length === 0 ? (
            <div className="mt-5 rounded-[1.75rem] bg-soft p-6 text-center">
              <p className="text-lg font-extrabold">A curadoria está chegando</p>
              <p className="mt-1 text-sm text-muted">
                Os primeiros restaurantes entram assim que o time importar a lista de Campo Grande.
              </p>
              {user?.isAdmin && (
                <Link href="/admin?s=importar" className="press mt-4 inline-block rounded-2xl bg-foreground px-5 py-3 font-bold text-white">
                  Importar do Google agora
                </Link>
              )}
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-6">
              {feed.map((p, i) => (
                <PlaceTile
                  key={p.id}
                  place={p}
                  spend={spendOf(p.id)}
                  saved={savedSet.has(p.id)}
                  loggedIn={!!user}
                  index={i % 6}
                />
              ))}
            </div>
          )}
        </section>

        <MarqueeBand />
      </main>
      <ReviewPrompt />
    </Page>
  );
}
