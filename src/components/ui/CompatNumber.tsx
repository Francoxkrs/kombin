"use client";

import { animate, useInView } from "motion/react";
import { useEffect, useRef } from "react";

/** O índice de compatibilidade "conta" de 0 até o valor quando aparece na tela. */
export function CompatNumber({ value, className = "" }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });

  useEffect(() => {
    const el = ref.current;
    if (!el || !inView) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.textContent = `${value}%`;
      return;
    }
    const controls = animate(0, value, {
      duration: 1.1,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => (el.textContent = `${Math.round(v)}%`),
    });
    return () => controls.stop();
  }, [inView, value]);

  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {value}%
    </span>
  );
}

/** Número grande em fundo claro (página do lugar). */
export function CompatBadge({ value, size = "md" }: { value: number; size?: "sm" | "md" | "lg" }) {
  const num = size === "lg" ? "text-[2.75rem]" : size === "md" ? "text-[2rem]" : "text-xl";
  return (
    <div className="shrink-0 text-right leading-none text-match">
      <CompatNumber value={value} className={`display block ${num}`} />
      <span className={`block font-medium ${size === "sm" ? "mt-0.5 text-[10px]" : "mt-1 text-xs"}`}>combina com você</span>
    </div>
  );
}

/** Selo "96% combina" em vidro escuro, por cima da foto. A estrela do app. */
export function CompatPill({ value }: { value: number }) {
  return (
    <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-black/75 px-3 py-1 text-xs font-bold text-emerald-400 backdrop-blur-md">
      <span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" aria-hidden />
      <CompatNumber value={value} /> combina
    </span>
  );
}
