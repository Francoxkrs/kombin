"use client";

import { Compass, Search, UserRound } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import { Photo } from "@/components/ui/Photo";
import { MOMENT, OCCASIONS, occasion, ranked, type OccasionId, type ProtoOccasion } from "../data";

const NARROW = { fontVariationSettings: '"wdth" 62' } as const;

function Field({ o, count }: { o: ProtoOccasion; count: number }) {
  return (
    <div className="px-4 pt-5 pb-6" style={{ background: o.color, color: o.ink }}>
      <p className="text-[15px] font-medium">{MOMENT}</p>
      <h1 className="mt-2 text-[76px] leading-[0.84] font-extrabold uppercase" style={NARROW}>
        {o.title[0]}
        <br />
        {o.title[1]}
      </h1>
      <p className="mt-4 max-w-[30ch] text-[17px] leading-snug">{o.line}</p>
      <a
        href="#lista"
        className="mt-6 grid h-14 place-items-center text-[16px] font-semibold"
        style={{ background: o.ink, color: o.color }}
      >
        Ver os {count} lugares
      </a>
    </div>
  );
}

export function CoresHome({ initial }: { initial: OccasionId }) {
  const [current, setCurrent] = useState<OccasionId>(initial);
  const [previous, setPrevious] = useState<OccasionId | null>(null);
  const [origin, setOrigin] = useState(50);
  const reduce = useReducedMotion();
  const o = occasion(current);
  const list = ranked(current);
  const [first, ...rest] = list;

  function pick(id: OccasionId, index: number) {
    if (id === current) return;
    setPrevious(current);
    setOrigin(((index + 0.5) / OCCASIONS.length) * 100);
    setCurrent(id);
  }

  return (
    <div className="min-h-dvh bg-white pb-28 text-black" style={{ fontFamily: "var(--f-archivo)" }}>
      <header className="flex h-14 items-center justify-between px-4 pt-[env(safe-area-inset-top)]">
        <span className="text-[30px] leading-none font-extrabold" style={NARROW}>
          kombin
        </span>
        <span className="flex items-center gap-3 text-[15px]">
          Campo Grande
          <span className="grid size-9 place-items-center bg-black text-[15px] font-bold text-white">S</span>
        </span>
      </header>

      {/* A cor nova cobre a anterior a partir da ficha tocada. */}
      <section className="relative overflow-hidden" aria-live="polite">
        {previous && !reduce ? (
          <>
            <div aria-hidden>
              <Field o={occasion(previous)} count={ranked(previous).length} />
            </div>
            <motion.div
              key={current}
              className="absolute inset-0"
              initial={{ clipPath: `circle(0% at ${origin}% 100%)` }}
              animate={{ clipPath: `circle(150% at ${origin}% 100%)` }}
              transition={{ duration: 0.65, ease: [0.7, 0, 0.2, 1] }}
            >
              <Field o={o} count={list.length} />
            </motion.div>
          </>
        ) : (
          <Field o={o} count={list.length} />
        )}
      </section>

      <nav aria-label="Ocasiões" className="grid grid-cols-6 items-end">
        {OCCASIONS.map((x, i) => {
          const active = x.id === current;
          return (
            <button
              key={x.id}
              onClick={() => pick(x.id, i)}
              aria-pressed={active}
              className="flex flex-col text-left"
            >
              <span
                className="block w-full transition-[height] duration-300"
                style={{ background: x.color, height: active ? 72 : 44 }}
              />
              <span className={`block min-h-11 px-1.5 pt-2 text-[12.5px] leading-tight ${active ? "font-bold" : ""}`}>
                {x.label}
              </span>
            </button>
          );
        })}
      </nav>

      {first && (
        <section id="lista" className="scroll-mt-4 px-4 pt-8">
          <h2 className="text-[30px] leading-none font-extrabold uppercase" style={NARROW}>
            O que mais combina
          </h2>
          <Link href={`/conceitos/cores/lugar?o=${current}&p=${first.id}`} className="mt-4 block">
            <Photo src={first.photos[0]} fallbacks={first.photos.slice(1)} alt={first.name} className="aspect-[4/3] w-full" eager />
            <div className="mt-3 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[34px] leading-[0.88] font-extrabold uppercase" style={NARROW}>
                  {first.name}
                </p>
                <p className="mt-2 text-[15px]">
                  {first.kind}, R$&nbsp;{first.price} por pessoa
                </p>
                <p className="mt-1 text-[15px] font-semibold">{first.reasons.join(", ")}</p>
              </div>
              <p className="shrink-0 text-[56px] leading-[0.8] font-black" style={NARROW}>
                {first.compat[current]}
                <span className="text-[24px]">%</span>
              </p>
            </div>
          </Link>
        </section>
      )}

      <section className="px-4 pt-10">
        <h2 className="text-[30px] leading-none font-extrabold uppercase" style={NARROW}>
          Também combinam
        </h2>
        <ul className="mt-2">
          {rest.map((p) => (
            <li key={p.id}>
              <Link href={`/conceitos/cores/lugar?o=${current}&p=${p.id}`} className="flex items-center gap-3 py-3">
                <Photo src={p.photos[0]} fallbacks={p.photos.slice(1)} alt={p.name} className="size-[84px] shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[22px] leading-[0.92] font-extrabold uppercase" style={NARROW}>
                    {p.name}
                  </p>
                  <p className="mt-1 truncate text-[14px]">
                    {p.kind}, R$&nbsp;{p.price}
                  </p>
                  <p className="truncate text-[14px] font-semibold">{p.reasons.slice(0, 2).join(", ")}</p>
                </div>
                <p className="shrink-0 text-[34px] leading-none font-black" style={NARROW}>
                  {p.compat[current]}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <nav
        aria-label="Navegação principal"
        className="fixed bottom-0 left-1/2 z-40 grid w-full max-w-md -translate-x-1/2 grid-cols-3 bg-[#F1F1EF] pb-[env(safe-area-inset-bottom)]"
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
            className={`flex h-16 flex-col items-center justify-center gap-1 text-[12.5px] ${t.active ? "font-bold" : "text-[#555]"}`}
            style={t.active ? { boxShadow: `inset 0 4px 0 ${o.color === "#FFC81E" ? "#000" : o.color}` } : undefined}
          >
            <t.icon className="size-[22px]" strokeWidth={t.active ? 2.2 : 1.6} />
            {t.label}
          </a>
        ))}
      </nav>
    </div>
  );
}
