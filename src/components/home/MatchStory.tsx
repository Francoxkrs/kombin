"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";
import { useLayoutEffect, useRef } from "react";
import type { HomeData, HomeOccasion, HomePlace } from "@/lib/home-shared";
import { Photo } from "../ui/Photo";
import { BTN_QUIET, btn } from "../ui/styles";
import { ProofStats } from "./ProofStats";
import { useScrollTo } from "./SmoothScroll";

gsap.registerPlugin(ScrollTrigger);

const CAPTIONS = [
  {
    title: "Você escolhe o momento.",
    body: "Cada ocasião pesa diferente. A dois, conversar vale mais que o preço.",
  },
  {
    title: "A gente lê cada casa.",
    body: "Gasto, couvert e barulho contados por quem foi, e o clima de agora.",
  },
  {
    title: "E mostra quanto combina.",
    body: "Um número para o seu momento, com o motivo do lado.",
  },
];

/* Estado inicial já no HTML do servidor: nada pisca entre o primeiro quadro e a hidratação. */
const HIDDEN: React.CSSProperties = { opacity: 0 };
/** Casas "na fila", ainda não lidas: aparecem apagadas desde o começo. */
const QUEUED: React.CSSProperties = { opacity: 0.18 };
const BAR_EMPTY: React.CSSProperties = { transform: "scaleX(0)" };

function Row({ place }: { place: HomePlace }) {
  return (
    <li data-row className="relative flex items-center gap-3 py-2.5 will-change-transform" style={QUEUED}>
      <Photo src={place.photos[0] ?? null} fallbacks={place.photos.slice(1)} blurhash={place.blurhash} alt="" className="size-12 shrink-0 rounded-[10px]" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[16px] font-semibold leading-tight">{place.name}</p>
        <p className="mt-1 truncate text-[13px] leading-tight text-muted">{place.badges.join(", ") || place.about}</p>
        <span className="mt-2 block h-[3px] overflow-hidden rounded-full bg-line">
          <span
            data-row-bar
            data-share={place.compat / 100}
            className="block h-full origin-left rounded-full bg-ipe will-change-transform"
            style={BAR_EMPTY}
          />
        </span>
      </div>
      <p className="w-14 shrink-0 text-right text-[22px] font-semibold tabular-nums tracking-tight">
        <span data-count={place.compat}>0</span>%
      </p>
    </li>
  );
}

/** Onde a casa vencedora vira cartaz: foto inteira e rótulos em caixa escura, legíveis em qualquer foto. */
function MatchCard({ place, occasion }: { place: HomePlace; occasion: HomeOccasion }) {
  return (
    <div data-match className="absolute inset-0 overflow-hidden rounded-[22px] will-change-transform" style={{ opacity: 0, transform: "translateY(24px) scale(0.97)" }}>
      <Photo src={place.photos[0] ?? null} fallbacks={place.photos.slice(1)} blurhash={place.blurhash} alt="" className="absolute inset-0" />
      <div className="absolute top-3 left-3 flex items-center gap-2 rounded-full border border-white/15 bg-black/45 py-1.5 pr-3 pl-1.5 backdrop-blur-md">
        {/* "Combina %": a ocasião e a casa, dois círculos que se encaixam tanto quanto combinam. */}
        <span className="relative flex h-6 w-10" aria-hidden>
          <span className="absolute left-0 size-6 rounded-full" style={{ background: occasion.color }} />
          <span
            className="absolute size-6 rounded-full bg-ipe ring-2 ring-black/50"
            style={{ left: `${4 + (1 - place.compat / 100) * 40}px` }}
          />
        </span>
        <span className="text-[14px] font-semibold text-white">{place.compat}% combina</span>
      </div>
      <div className="absolute inset-x-3 bottom-3 rounded-[16px] border border-white/12 bg-black/55 p-4 backdrop-blur-md">
        <p className="text-[13px] text-white/75">O match para {occasion.target}</p>
        <p className="title mt-1 text-[30px] text-white">{place.name}</p>
        <p className="mt-2 line-clamp-2 text-[14px] leading-normal text-white/85">{place.about}</p>
        <Link href={`/l/${place.id}?o=${occasion.slug}`} transitionTypes={["nav-forward"]} className={`${btn("ipe", "md")} mt-4 w-full`}>
          Ver o lugar
        </Link>
      </div>
    </div>
  );
}

/** O "algoritmo" desenhado: abas de ocasião, os pesos dela e as casas sendo pontuadas. */
function Board({ occasion, all }: { occasion: HomeOccasion; all: HomeOccasion[] }) {
  return (
    <div className="flex h-full flex-col rounded-[28px] border border-line bg-surface p-4 shadow-[0_30px_80px_-30px_rgb(0_0_0/0.7)] sm:p-5">
      <div data-strip-box className="relative overflow-hidden">
        <ul data-strip className="flex gap-5 whitespace-nowrap will-change-transform" aria-hidden>
          {all.map((o) => (
            <li key={o.slug} data-tab={o.slug} className="pb-2 text-[15px] font-medium" style={{ opacity: 0.45 }}>
              {o.short}
            </li>
          ))}
        </ul>
        <span data-indicator className="absolute bottom-0 left-0 h-[3px] w-[100px] origin-left bg-ipe will-change-transform" style={BAR_EMPTY} />
      </div>
      <div className="relative mt-4 flex min-h-0 flex-1 flex-col overflow-hidden rounded-[18px] [mask-image:linear-gradient(to_bottom,black_88%,transparent)]">
        <div className="rounded-[18px] bg-soft p-4">
          <div className="flex items-center gap-2.5">
            <span className="size-3 shrink-0 rounded-full" style={{ background: occasion.color }} />
            <p className="truncate text-[16px] font-semibold">{occasion.name}</p>
          </div>
          <ul className="mt-3 space-y-2">
            {occasion.weights.map((w) => (
              <li key={w.label} className="grid grid-cols-[8.5rem_1fr] items-center gap-3 text-[13px] text-ink-2">
                <span className="truncate">{w.label}</span>
                <span className="h-1.5 overflow-hidden rounded-full bg-line">
                  <span
                    data-weight
                    data-share={w.share}
                    className="block h-full origin-left rounded-full will-change-transform"
                    style={{ ...BAR_EMPTY, background: occasion.color }}
                  />
                </span>
              </li>
            ))}
          </ul>
        </div>
        {occasion.top.length > 0 ? (
          <ol className="mt-2 divide-y divide-line px-1">
            {occasion.top.map((p) => (
              <Row key={p.id} place={p} />
            ))}
          </ol>
        ) : (
          <p data-row className="mt-4 px-1 text-[15px] leading-relaxed text-muted" style={QUEUED}>
            A curadoria de {occasion.target} está chegando. As outras ocasiões já têm casa.
          </p>
        )}
        {occasion.top[0] && <MatchCard place={occasion.top[0]} occasion={occasion} />}
      </div>
    </div>
  );
}

/**
 * Hero que conta o produto rolando a tela. A seção é alta (≈4 telas) e o palco fica
 * preso (sticky) no topo; uma linha do tempo do GSAP é amarrada ao scroll (scrub):
 *   0  → 12%  a promessa sobe e sai, o quadro do match assume a tela;
 *   12 → 36%  a aba anda até a ocasião da hora e os pesos dela enchem;
 *   36 → 64%  as casas entram, as barras enchem e o % conta até o valor real;
 *   64 → 86%  as outras apagam e a que mais combina vira cartaz.
 * Só transform e opacity, com will-change: nada de layout durante a rolagem.
 */
export function MatchStory({ data, loggedIn }: { data: HomeData; loggedIn: boolean }) {
  const root = useRef<HTMLElement>(null);
  const scrollTo = useScrollTo();
  const occasion = data.occasions.find((o) => o.slug === data.story) ?? data.occasions[0];
  const storyIndex = data.occasions.indexOf(occasion);

  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const q = gsap.utils.selector(el);
    const mm = gsap.matchMedia();

    mm.add(
      // "mobile" garante que alguma condição sempre bate (o matchMedia só roda quando uma bate).
      { desktop: "(min-width: 1024px)", mobile: "(max-width: 1023.98px)", reduce: "(prefers-reduced-motion: reduce)" },
      (c) => {
        const { desktop, reduce } = c.conditions as { desktop: boolean; reduce: boolean };
        const board = q("[data-board]")[0] as HTMLElement;
        const captions = q("[data-captions]")[0] as HTMLElement;
        const stripBox = q("[data-strip-box]")[0] as HTMLElement;
        const tabs = q("[data-tab]") as HTMLElement[];
        const target = tabs[storyIndex];
        const start = tabs[storyIndex === 0 ? 1 : 0];
        const counts = q("[data-count]") as HTMLElement[];
        const rows = q("[data-row]");

        const tl = gsap.timeline({ defaults: { ease: "none", duration: 1 } });

        // 1. A promessa sai, o quadro sobe até logo abaixo da legenda (no celular).
        tl.to(q("[data-intro]"), { y: -70, opacity: 0, duration: 0.8 }, 0);
        if (!desktop) {
          // Board e coluna de texto têm o mesmo pai posicionado (o palco); a legenda é relativa à coluna.
          const col = captions.offsetParent as HTMLElement;
          const below = () => col.offsetTop + captions.offsetTop + captions.offsetHeight + 16;
          tl.to(board, { y: () => -(board.offsetTop - below()), duration: 1.2 }, 0);
        }
        tl.fromTo(q("[data-rail]"), { opacity: 0 }, { opacity: 1, duration: 0.4 }, 0.8);
        tl.fromTo(q("[data-caption='0']"), { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.6 }, 0.9);

        // 2. A aba anda até a ocasião e os pesos enchem.
        tl.fromTo(
          q("[data-indicator]"),
          { x: () => start.offsetLeft, scaleX: () => start.offsetWidth / 100 },
          { x: () => target.offsetLeft, scaleX: () => target.offsetWidth / 100, duration: 1.1, ease: "power2.inOut" },
          1.3,
        );
        tl.to(q("[data-strip]"), { x: () => Math.min(0, stripBox.clientWidth - (target.offsetLeft + target.offsetWidth) - 2), duration: 1.1, ease: "power2.inOut" }, 1.3);
        tl.to(target, { opacity: 1, duration: 0.5 }, 1.9);
        tl.to(q("[data-weight]"), { scaleX: (_i: number, t: HTMLElement) => Number(t.dataset.share), stagger: 0.2, duration: 0.8, ease: "power2.out" }, 2.3);
        tl.fromTo(q("[data-rail-fill='0']"), { scaleX: 0 }, { scaleX: 1, duration: 2.6 }, 0.8);

        // 3. As casas entram e são pontuadas.
        tl.to(q("[data-caption='0']"), { opacity: 0, y: -24, duration: 0.5 }, 3.6);
        tl.fromTo(q("[data-caption='1']"), { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.6 }, 3.9);
        tl.to(rows, { opacity: 1, stagger: 0.3, duration: 0.6, ease: "power2.out" }, 4.1);
        tl.to(q("[data-row-bar]"), { scaleX: (_i: number, t: HTMLElement) => Number(t.dataset.share), stagger: 0.3, duration: 1.2, ease: "power2.out" }, 4.4);
        counts.forEach((n, i) => {
          const v = { n: 0 };
          tl.to(v, { n: Number(n.dataset.count), duration: 1.2, ease: "power2.out", onUpdate: () => void (n.textContent = String(Math.round(v.n))) }, 4.4 + i * 0.3);
        });
        tl.fromTo(q("[data-rail-fill='1']"), { scaleX: 0 }, { scaleX: 1, duration: 2.6 }, 3.9);

        // 4. A que mais combina vira cartaz.
        tl.to(q("[data-caption='1']"), { opacity: 0, y: -24, duration: 0.5 }, 6.5);
        tl.fromTo(q("[data-caption='2']"), { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.6 }, 6.8);
        tl.to(rows.slice(1), { opacity: 0.3, duration: 0.5 }, 7);
        tl.to(q("[data-match]"), { opacity: 1, y: 0, scale: 1, duration: 1, ease: "power3.out" }, 7.2);
        tl.fromTo(q("[data-rail-fill='2']"), { scaleX: 0 }, { scaleX: 1, duration: 1.8 }, 6.8);
        tl.to({}, { duration: 1.2 }); // respiro no fim, antes de soltar o palco

        if (reduce) {
          // Movimento reduzido: sem história, a promessa fica e o quadro já aparece pronto.
          tl.progress(1).pause();
          gsap.set(q("[data-intro]"), { y: 0, opacity: 1 });
          gsap.set([board, q("[data-captions]"), q("[data-rail]")], { clearProps: "transform" });
          gsap.set(q("[data-caption], [data-rail]"), { opacity: 0 });
          return;
        }

        ScrollTrigger.create({
          trigger: el,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.6,
          animation: tl,
          invalidateOnRefresh: true,
        });
      },
    );
    return () => mm.revert();
  }, [storyIndex]);

  return (
    <section
      ref={root}
      aria-labelledby="hero-title"
      className="relative h-[430svh] motion-reduce:h-auto lg:h-[380svh]"
    >
      <div className="sticky top-0 h-svh overflow-hidden motion-reduce:relative motion-reduce:h-auto">
        <div className="mx-auto flex h-full max-w-[1240px] flex-col px-5 pt-[calc(env(safe-area-inset-top)+5rem)] sm:px-8 lg:grid lg:grid-cols-12 lg:items-center lg:gap-10 lg:px-10 lg:pt-0 motion-reduce:pb-12">
          <div className="relative lg:col-span-6">
            <div data-intro className="will-change-transform">
              <h1 id="hero-title" className="title text-[44px] sm:text-[60px] lg:text-[64px] xl:text-[72px]">
                Diga o momento. <br className="hidden sm:block" />
                A gente diz onde ir.
              </h1>
              <p className="mt-4 max-w-[38ch] text-[17px] leading-[1.6] text-ink-2 lg:mt-6 lg:text-[19px]">
                O Kombin compara as casas de Campo Grande com a sua ocasião e mostra quanto cada uma combina com você, e por quê.
              </p>
              <div data-hero-cta className="mt-6 flex flex-wrap items-center gap-3 lg:mt-8">
                <button onClick={() => scrollTo("#quiz")} className={btn("ipe")}>
                  Achar meu lugar
                </button>
                <Link href="/descobrir" transitionTypes={["nav-forward"]} className={BTN_QUIET}>
                  {loggedIn ? "Abrir o Descobrir" : "Só olhar"}
                </Link>
              </div>
              <ProofStats stats={data.stats} className="mt-6 lg:mt-10" />
            </div>

            <div data-captions className="pointer-events-none absolute inset-x-0 top-0 lg:top-1/2 lg:-translate-y-1/2">
              <div data-rail className="mb-4 grid max-w-[220px] grid-cols-3 gap-1.5" style={HIDDEN} aria-hidden>
                {CAPTIONS.map((_, i) => (
                  <span key={i} className="h-[3px] overflow-hidden rounded-full bg-line">
                    <span data-rail-fill={i} className="block h-full origin-left bg-foreground" style={BAR_EMPTY} />
                  </span>
                ))}
              </div>
              <div className="grid">
                {CAPTIONS.map((c, i) => (
                  <div key={c.title} data-caption={i} className="col-start-1 row-start-1 will-change-transform" style={HIDDEN}>
                    <h2 className="title text-[34px] sm:text-[44px] lg:text-[60px]">{c.title}</h2>
                    {/* Em tela baixa de celular a frase sai: o quadro precisa caber acima da barra de ação. */}
                    <p className="mt-3 max-w-[36ch] text-[15px] leading-[1.6] text-ink-2 [@media(max-height:760px)]:max-lg:hidden lg:mt-5 lg:text-[18px]">{c.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div
            data-board
            className="mt-8 h-[min(470px,calc(100svh-16.5rem))] shrink-0 [@media(min-height:761px)]:h-[min(500px,calc(100svh-21rem))] will-change-transform sm:h-[500px] lg:col-span-6 lg:col-start-7 lg:mt-0 lg:h-[min(600px,78svh)] motion-reduce:h-[520px]"
          >
            <Board occasion={occasion} all={data.occasions} />
          </div>
        </div>
      </div>
    </section>
  );
}
