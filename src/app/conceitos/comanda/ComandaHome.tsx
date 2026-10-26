"use client";

import { Compass, Search, UserRound } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import { Photo } from "@/components/ui/Photo";
import { MOMENT, OCCASIONS, occasion, ranked, type OccasionId } from "../data";
import { CARBON, GREEN, leader, PAPER, perforation } from "./style";

/** Ficha de festa: papel colorido com dois recortes nas laterais. */
const fichaMask = {
  WebkitMask:
    "radial-gradient(circle 7px at 0 50%, transparent 98%, #000 100%) left / 51% 100% no-repeat, radial-gradient(circle 7px at 100% 50%, transparent 98%, #000 100%) right / 51% 100% no-repeat",
  mask: "radial-gradient(circle 7px at 0 50%, transparent 98%, #000 100%) left / 51% 100% no-repeat, radial-gradient(circle 7px at 100% 50%, transparent 98%, #000 100%) right / 51% 100% no-repeat",
} as const;

export function ComandaHome({ initial }: { initial: OccasionId }) {
  const [current, setCurrent] = useState<OccasionId>(initial);
  const o = occasion(current);
  const list = ranked(current);

  return (
    <div className="min-h-dvh pb-28" style={{ background: GREEN, color: PAPER, fontFamily: "var(--f-barlow)" }}>
      <header className="flex h-14 items-center justify-between px-4 pt-[env(safe-area-inset-top)]">
        <span className="text-[32px] leading-none font-extrabold" style={{ fontFamily: "var(--f-barlow-c)" }}>
          kombin
        </span>
        <span className="text-[16px]">Campo Grande</span>
      </header>

      <h1
        className="mt-3 px-4 text-[64px] leading-[0.86] font-extrabold uppercase"
        style={{ fontFamily: "var(--f-barlow-c)" }}
      >
        Vai ser o quê
        <br />
        hoje?
      </h1>
      <p className="mt-3 max-w-[34ch] px-4 text-[17px] leading-snug">
        Escolha a ficha. A gente monta a comanda com os lugares que mais combinam.
      </p>

      <ul aria-label="Ocasiões" className="no-scrollbar mt-6 flex gap-2.5 overflow-x-auto px-4 pt-2 pb-1">
        {OCCASIONS.map((x) => {
          const active = x.id === current;
          return (
            <li key={x.id} className="shrink-0">
              <motion.button
                onClick={() => setCurrent(x.id)}
                aria-pressed={active}
                animate={{ y: active ? -6 : 0, rotate: active ? -3 : 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 26 }}
                className="flex h-[68px] w-[108px] flex-col justify-between px-4 py-2.5 text-left text-black"
                style={{ ...fichaMask, background: active ? PAPER : x.ficha }}
              >
                <span className="text-[11px] font-semibold">Vale uma</span>
                <span className="text-[24px] leading-none font-bold uppercase" style={{ fontFamily: "var(--f-barlow-c)" }}>
                  {x.label}
                </span>
              </motion.button>
            </li>
          );
        })}
      </ul>

      <section className="mx-4 mt-6 text-black" style={{ background: PAPER }} aria-label="Comanda">
        <div className="h-3" style={perforation("top")} aria-hidden />
        <div className="px-5 pt-3 pb-5">
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-[34px] leading-none font-extrabold uppercase" style={{ fontFamily: "var(--f-barlow-c)" }}>
              Comanda
            </h2>
            <p className="text-right text-[15px] leading-tight">
              Mesa: <b>{o.label.toLowerCase()}</b>
              <br />
              {MOMENT}
            </p>
          </div>
          <ul className="mt-5 space-y-4">
            {list.map((p) => (
              <li key={p.id}>
                <Link href={`/conceitos/comanda/lugar?o=${current}&p=${p.id}`} className="flex items-center gap-3">
                  <Photo src={p.photos[0]} fallbacks={p.photos.slice(1)} alt={p.name} className="size-16 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-end gap-2">
                      <span
                        className="min-w-0 text-[22px] leading-[0.95] font-bold uppercase"
                        style={{ fontFamily: "var(--f-barlow-c)" }}
                      >
                        {p.name}
                      </span>
                      <span className="mb-1 h-[7px] min-w-4 flex-1" style={leader} aria-hidden />
                      <span
                        className="shrink-0 text-[28px] leading-none font-extrabold"
                        style={{ fontFamily: "var(--f-barlow-c)", color: CARBON }}
                      >
                        {p.compat[current]}%
                      </span>
                    </div>
                    <p className="mt-1 text-[14px] leading-snug">
                      {p.kind}, R$&nbsp;{p.price}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="h-3" style={perforation("bottom")} aria-hidden />
      </section>

      <a
        href="#"
        className="mx-4 mt-2 flex h-16 items-center justify-between px-5 text-black"
        style={{ background: o.ficha }}
      >
        <span className="text-[24px] leading-none font-bold uppercase" style={{ fontFamily: "var(--f-barlow-c)" }}>
          Mandar pro mozão votar
        </span>
        <span className="text-[14px]">3 opções</span>
      </a>

      <nav
        aria-label="Navegação principal"
        className="fixed bottom-0 left-1/2 z-40 grid w-full max-w-md -translate-x-1/2 grid-cols-3 pb-[env(safe-area-inset-bottom)]"
        style={{ background: "#0A2C21" }}
      >
        {[
          { label: "Descobrir", icon: Compass, active: true },
          { label: "Buscar", icon: Search, active: false },
          { label: "Você", icon: UserRound, active: false },
        ].map((t) => (
          <a
            key={t.label}
            href="#"
            aria-current={t.active ? "page" : undefined}
            className={`flex h-16 flex-col items-center justify-center gap-1 text-[13px] ${t.active ? "font-semibold" : "opacity-75"}`}
          >
            <t.icon className="size-[22px]" strokeWidth={t.active ? 2.2 : 1.6} />
            {t.label}
          </a>
        ))}
      </nav>
    </div>
  );
}
