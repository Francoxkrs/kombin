"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { createDecision } from "@/app/actions";
import type { HomeOccasion } from "@/lib/home-shared";
import { BTN_LIGHT } from "../ui/styles";
import { SubmitButton } from "../ui/SubmitButton";

/** Fatia de cada opção na votação desenhada (é ilustração do recurso, não resultado real). */
const SHARES = [0.62, 0.26, 0.12];

function VoteBar({ name, share, index, progress }: { name: string; share: number; index: number; progress: ReturnType<typeof useScroll>["scrollYProgress"] }) {
  // Cada barra enche numa fatia da rolagem, uma depois da outra.
  const scaleX = useTransform(progress, [0.15 + index * 0.08, 0.55 + index * 0.08], [0, share], { clamp: true });
  return (
    <li className="py-3">
      <div className="flex items-baseline justify-between gap-4">
        <span className="truncate text-[16px] font-semibold">{name}</span>
        {index === 0 && <span className="shrink-0 text-[13px] text-muted">Na frente</span>}
      </div>
      <span className="mt-2 block h-2 overflow-hidden rounded-full bg-line">
        <motion.span
          // Com movimento reduzido a barra já aparece cheia (pelo CSS: servidor e client renderizam igual).
          className={`block h-full origin-left rounded-full will-change-transform motion-reduce:[transform:scaleX(var(--share))!important] ${index === 0 ? "bg-ipe" : "bg-foreground/50"}`}
          style={{ scaleX, ["--share" as string]: share }}
        />
      </span>
    </li>
  );
}

/** A tela estrela do MVP: o grupo vota pelo celular, sem baixar nada. */
export function GroupDecide({ occasion }: { occasion: HomeOccasion }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const options = occasion.top.slice(0, 3);
  const names = options.length >= 2 ? options.map((p) => p.name) : ["A primeira casa", "A segunda", "A terceira"];

  return (
    <section ref={ref} aria-labelledby="grupo-title" className="border-t border-line py-24 lg:py-32">
      <div className="mx-auto grid max-w-[1240px] gap-12 px-5 sm:px-8 lg:grid-cols-12 lg:items-center lg:gap-10 lg:px-10">
        <div className="lg:col-span-5">
          <h2 id="grupo-title" className="title text-[40px] sm:text-[52px] lg:text-[60px]">
            Na dúvida, o grupo decide.
          </h2>
          <p className="mt-4 max-w-[38ch] text-[17px] leading-[1.6] text-ink-2">
            Mande as 3 que mais combinam pelo WhatsApp. Cada um vota no próprio celular, sem baixar nada e sem criar conta, e o
            Kombin mostra a vencedora.
          </p>
          {options.length >= 2 && (
            <form action={createDecision} className="mt-8 max-w-sm">
              <input type="hidden" name="occasion" value={occasion.slug} />
              {options.map((p) => (
                <input key={p.id} type="hidden" name="placeId" value={p.id} />
              ))}
              <SubmitButton className={`${BTN_LIGHT} w-full`}>{occasion.decideLabel}</SubmitButton>
            </form>
          )}
        </div>
        <div className="lg:col-span-6 lg:col-start-7">
          <div className="rounded-[28px] border border-line bg-surface p-5 sm:p-7">
            <div className="flex items-center gap-2.5">
              <span className="size-3 rounded-full" style={{ background: occasion.color }} />
              <p className="text-[16px] font-semibold">{occasion.name}</p>
            </div>
            <ol className="mt-3 divide-y divide-line">
              {names.map((n, i) => (
                <VoteBar key={n} name={n} share={SHARES[i]} index={i} progress={scrollYProgress} />
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
