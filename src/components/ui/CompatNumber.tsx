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
