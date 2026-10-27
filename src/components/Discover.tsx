"use client";

import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createDecision } from "@/app/actions";
import type { ContextNote } from "@/lib/context";
import { forWho, getOccasion, type Occasion } from "@/lib/occasions";
import { posterNameSize, type PlaceScreen } from "@/lib/screen";
import { ContextNotes } from "./ContextNotes";
import { Wordmark } from "./ui/Logo";
import { Photo } from "./ui/Photo";
import { SaveButton } from "./ui/SaveButton";
import { BTN_IPE, BTN_LIGHT, btn } from "./ui/styles";
import { SubmitButton } from "@/components/ui/SubmitButton";

export interface Slate {
  slug: string;
  count: number;
  screens: PlaceScreen[];
}

const POSITION_KEY = "kb_discover";

/** A animação do encaixe da marca toca só na primeira abertura da página. */
let brandPlayed = false;

function readPosition(slug: string): number {
  try {
    const saved = JSON.parse(sessionStorage.getItem(POSITION_KEY) ?? "null");
    return saved?.slug === slug ? Number(saved.index) || 0 : 0;
  } catch {
    return 0;
  }
}

function savePosition(slug: string, index: number) {
  try {
    sessionStorage.setItem(POSITION_KEY, JSON.stringify({ slug, index }));
  } catch {}
}

/** Uma tela por lugar: a foto ocupa tudo, o texto fica embaixo, em cima do véu. */
function Screen({
  place,
  occasion,
  first,
  saved,
  loggedIn,
}: {
  place: PlaceScreen;
  occasion: Occasion;
  first: boolean;
  saved: boolean;
  loggedIn: boolean;
}) {
  const reduce = useReducedMotion();
  const href = `/l/${place.id}?o=${occasion.slug}`;
  return (
    <section className="relative h-full snap-start snap-always overflow-hidden" aria-label={place.name}>
      <motion.div
        className="absolute inset-0"
        initial={reduce ? false : { scale: 1.08 }}
        whileInView={{ scale: 1 }}
        viewport={{ amount: 0.6 }}
        transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <Photo src={place.photos[0] ?? null} fallbacks={place.photos.slice(1)} blurhash={place.blurhash} alt="" className="absolute inset-0" eager={first} />
      </motion.div>
      <div className="scrim-bottom absolute inset-x-0 bottom-0 h-[75%]" />
      <div className="absolute inset-x-0 bottom-0 px-5 pb-[calc(env(safe-area-inset-bottom)+5.75rem)]">
        <p className="text-[17px] font-medium">
          <span className="text-ipe">{place.compat}%</span> combina com {occasion.target}
        </p>
        <h2 className={`title mt-2 break-words ${posterNameSize(place.name)}`}>{place.name}</h2>
        <p className="mt-3 max-w-[34ch] text-[17px] leading-snug text-foreground/90">
          {place.about} {place.why}
        </p>
        <div className="mt-5 flex items-center gap-2">
          <Link href={href} transitionTypes={["nav-forward"]} className={btn("ipe", "md")}>
            Ver o lugar
          </Link>
          <SaveButton placeId={place.id} saved={saved} loggedIn={loggedIn} back={`/?o=${occasion.slug}`} />
        </div>
        {first && <p className="mt-5 text-[14px] text-foreground/75">Passe pra cima para ver o próximo</p>}
      </div>
    </section>
  );
}

/** Última tela da ocasião: mandar pra votar ou abrir a lista inteira, com filtros. */
function EndScreen({ slate, occasion, isAdmin }: { slate: Slate; occasion: Occasion; isAdmin: boolean }) {
  const top = slate.screens.slice(0, 3);
  if (slate.count === 0) {
    return (
      <section className="flex h-full snap-start flex-col justify-end px-5 pb-[calc(env(safe-area-inset-bottom)+6rem)]">
        <h2 className="title text-[48px]">A curadoria está chegando</h2>
        <p className="mt-4 max-w-[32ch] text-[17px] leading-snug text-muted">
          Ainda não tem lugar de Campo Grande para {occasion.target}. Tente outra ocasião ali em cima.
        </p>
        {isAdmin && (
          <Link href="/admin/importar" className={`${BTN_IPE} mt-7 w-full`}>
            Importar do Google agora
          </Link>
        )}
      </section>
    );
  }
  return (
    <section className="flex h-full snap-start flex-col justify-end px-5 pb-[calc(env(safe-area-inset-bottom)+6rem)]">
      <h2 className="title text-[56px]">Ainda na dúvida?</h2>
      <p className="mt-4 max-w-[32ch] text-[17px] leading-snug text-muted">
        {top.length >= 2
          ? `Mande os ${top.length} que mais combinam ${forWho(occasion.decideWho)} votar pelo celular, sem baixar nada. Ou veja a lista inteira com filtro de preço, couvert e bairro.`
          : "Veja a lista inteira com filtro de preço, couvert e bairro."}
      </p>
      {top.length >= 2 && (
        <form action={createDecision} className="mt-7">
          <input type="hidden" name="occasion" value={occasion.slug} />
          {top.map((p) => (
            <input key={p.id} type="hidden" name="placeId" value={p.id} />
          ))}
          <SubmitButton className={`${BTN_IPE} w-full`}>{occasion.decideLabel}</SubmitButton>
        </form>
      )}
      <Link href={`/o/${occasion.slug}`} transitionTypes={["nav-forward"]} className={`${BTN_LIGHT} mt-2 w-full`}>
        Ver os {slate.count} {slate.count === 1 ? "lugar" : "lugares"}
      </Link>
    </section>
  );
}

export function Discover({
  slates,
  initial,
  suggested,
  saved,
  loggedIn,
  isAdmin,
  account,
  notes = [],
}: {
  slates: Slate[];
  initial: string;
  suggested: string;
  saved: string[];
  loggedIn: boolean;
  isAdmin: boolean;
  account: React.ReactNode;
  /** Clima e gosto que mexeram na ordem ("Chovendo agora em CG · Priorizando lugares cobertos"). */
  notes?: ContextNote[];
}) {
  const [current, setCurrent] = useState(initial);
  const [encaixe] = useState(() => !brandPlayed);
  useEffect(() => {
    brandPlayed = true;
  }, []);
  const pager = useRef<HTMLDivElement>(null);
  const tabs = useRef<HTMLUListElement>(null);
  const slate = slates.find((s) => s.slug === current) ?? slates[0];
  const occasion = getOccasion(slate.slug)!;
  const savedSet = new Set(saved);

  // Voltando de um lugar, a tela continua onde a pessoa parou.
  useEffect(() => {
    const el = pager.current;
    const index = readPosition(initial);
    if (el && index > 0) el.scrollTo({ top: index * el.clientHeight, behavior: "instant" });
    tabs.current?.querySelector('[aria-pressed="true"]')?.scrollIntoView({ inline: "nearest", block: "nearest" });
  }, [initial]);

  function pick(slug: string) {
    if (slug === current) return;
    setCurrent(slug);
    pager.current?.scrollTo({ top: 0, behavior: "instant" });
    savePosition(slug, 0);
    window.history.replaceState(window.history.state, "", slug === suggested ? "/" : `/?o=${slug}`);
  }

  function onScroll() {
    const el = pager.current;
    if (el) savePosition(current, Math.round(el.scrollTop / el.clientHeight));
  }

  return (
    <div className="relative h-dvh overflow-hidden">
      <div className="scrim-top pointer-events-none absolute inset-x-0 top-0 z-20 h-40" />
      <header className="absolute inset-x-0 top-0 z-30 pt-[max(0.5rem,env(safe-area-inset-top))]">
        <div className="flex items-center justify-between px-5">
          <Wordmark encaixe={encaixe} />
          {account}
        </div>
        <ul ref={tabs} aria-label="Ocasiões" className="no-scrollbar flex gap-6 overflow-x-auto px-5">
          {slates.map((s) => {
            const o = getOccasion(s.slug)!;
            const active = s.slug === current;
            return (
              <li key={s.slug} className="shrink-0">
                <button
                  onClick={() => pick(s.slug)}
                  aria-pressed={active}
                  className={`flex h-11 flex-col justify-center text-[17px] ${active ? "font-semibold" : "text-foreground/75"}`}
                >
                  {o.short}
                  <span className={`mt-1 h-[3px] w-full ${active ? "bg-ipe" : "bg-transparent"}`} />
                </button>
              </li>
            );
          })}
        </ul>
        <ContextNotes notes={notes} className="mt-1 px-5 [&_li]:text-[14px]" />
      </header>

      <div
        ref={pager}
        onScroll={onScroll}
        className="no-scrollbar h-full snap-y snap-mandatory overflow-y-auto overscroll-contain"
      >
        {slate.screens.map((p, i) => (
          <Screen key={`${slate.slug}-${p.id}`} place={p} occasion={occasion} first={i === 0} saved={savedSet.has(p.id)} loggedIn={loggedIn} />
        ))}
        <EndScreen key={`${slate.slug}-end`} slate={slate} occasion={occasion} isAdmin={isAdmin} />
      </div>
    </div>
  );
}
