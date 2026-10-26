"use client";

import { Heart } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { Photo } from "@/components/ui/Photo";
import { OCCASIONS, occasion, ranked, type OccasionId } from "../data";
import { IPE, LIGHT, NIGHT } from "./style";

export function CinemaHome({ initial }: { initial: OccasionId }) {
  const [current, setCurrent] = useState<OccasionId>(initial);
  const pager = useRef<HTMLDivElement>(null);
  const o = occasion(current);
  const list = ranked(current);
  const target = o.id === "encontro" ? "noite a dois" : o.label.toLowerCase();

  function pick(id: OccasionId) {
    setCurrent(id);
    pager.current?.scrollTo({ top: 0 });
  }

  return (
    <div className="relative h-dvh" style={{ background: NIGHT, color: LIGHT, fontFamily: "var(--f-brico)" }}>
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-36 bg-gradient-to-b from-black/60 to-transparent" />
      <header className="absolute inset-x-0 top-0 z-30 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <p className="px-5 text-[26px] leading-none font-bold tracking-[-0.03em]">kombin</p>
        <ul aria-label="Ocasiões" className="no-scrollbar mt-3 flex gap-5 overflow-x-auto px-5 pb-2">
          {OCCASIONS.map((x) => {
            const active = x.id === current;
            return (
              <li key={x.id} className="shrink-0">
                <button
                  onClick={() => pick(x.id)}
                  aria-pressed={active}
                  className={`flex h-11 flex-col justify-center text-[17px] ${active ? "font-semibold" : "text-white/70"}`}
                >
                  {x.label}
                  <span className="mt-1 h-[3px] w-full" style={{ background: active ? IPE : "transparent" }} />
                </button>
              </li>
            );
          })}
        </ul>
      </header>

      <div ref={pager} className="no-scrollbar h-full snap-y snap-mandatory overflow-y-auto">
        {list.map((p, i) => (
          <section key={`${current}-${p.id}`} className="relative h-dvh snap-start snap-always">
            <Photo
              src={p.photos[0]}
              fallbacks={p.photos.slice(1)}
              alt={p.name}
              className="absolute inset-0"
              eager={i === 0}
            />
            <div className="absolute inset-x-0 bottom-0 h-[70%] bg-gradient-to-t from-black/85 via-black/45 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 px-5 pb-[calc(env(safe-area-inset-bottom)+5.5rem)]">
              <p className="text-[17px] font-medium">
                <span style={{ color: IPE }}>{p.compat[current]}%</span> combina com {target}
              </p>
              <h2 className="mt-2 text-[60px] leading-[0.9] font-semibold tracking-[-0.035em]">{p.name}</h2>
              <p className="mt-3 max-w-[32ch] text-[17px] leading-snug">
                {p.kind}, R$&nbsp;{p.price} por pessoa. {p.reasons[0]} e {p.reasons[1].toLowerCase()}.
              </p>
              <div className="mt-5 flex gap-2">
                <Link
                  href={`/conceitos/cinema/lugar?o=${current}&p=${p.id}`}
                  className="grid h-12 place-items-center rounded-full px-7 text-[16px] font-semibold text-black"
                  style={{ background: IPE }}
                >
                  Ver o lugar
                </Link>
                <button
                  aria-label={`Salvar ${p.name}`}
                  className="grid size-12 place-items-center rounded-full text-black"
                  style={{ background: LIGHT }}
                >
                  <Heart className="size-5" strokeWidth={2} />
                </button>
              </div>
              {i === 0 && list.length > 1 && <p className="mt-6 text-[14px] text-white/80">Passe pra cima para ver o próximo</p>}
            </div>
          </section>
        ))}
      </div>

      <nav
        aria-label="Navegação principal"
        className="absolute inset-x-0 bottom-0 z-30 grid grid-cols-3 pb-[env(safe-area-inset-bottom)]"
        style={{ background: NIGHT }}
      >
        {["Descobrir", "Buscar", "Você"].map((t, i) => (
          <a
            key={t}
            href="#"
            aria-current={i === 0 ? "page" : undefined}
            className={`grid h-16 place-items-center text-[15px] ${i === 0 ? "font-semibold" : "text-white/70"}`}
          >
            {t}
          </a>
        ))}
      </nav>
    </div>
  );
}
