"use client";

import { Heart } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useOptimistic, useState, useTransition } from "react";
import { toggleSave } from "@/app/actions";

interface Props {
  placeId: string;
  saved: boolean;
  loggedIn: boolean;
  /** Para onde voltar depois do login. */
  back: string;
  variant?: "glass" | "plain" | "pill";
}

const BURST = Array.from({ length: 8 }, (_, i) => (i / 8) * Math.PI * 2);

/** Coração "Quero ir": salva na hora (otimista) e solta uma faísca. */
export function SaveButton({ placeId, saved, loggedIn, back, variant = "glass" }: Props) {
  const router = useRouter();
  const [optimistic, setOptimistic] = useOptimistic(saved);
  const [burst, setBurst] = useState(0);
  const [, start] = useTransition();

  function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!loggedIn) {
      router.push(`/entrar?next=${encodeURIComponent(back)}`);
      return;
    }
    const next = !optimistic;
    if (next) setBurst((b) => b + 1);
    if (navigator.vibrate) navigator.vibrate(8);
    start(async () => {
      setOptimistic(next);
      await toggleSave(placeId, "want", next);
    });
  }

  const label = optimistic ? "Tirar de Quero ir" : "Salvar em Quero ir";
  const base =
    variant === "glass"
      ? "size-11 rounded-full bg-white/85 shadow-[0_8px_24px_-10px_rgba(0,0,0,0.5)] backdrop-blur-md"
      : variant === "pill"
        ? "h-12 gap-2 rounded-2xl border border-line bg-white px-4 text-sm font-bold"
        : "size-10 rounded-full";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={optimistic}
      aria-label={label}
      className={`press relative flex items-center justify-center ${base}`}
    >
      <motion.span
        key={optimistic ? "on" : "off"}
        initial={{ scale: optimistic ? 0.4 : 1 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 600, damping: 14 }}
        className="grid place-items-center"
      >
        <Heart
          className={`size-[1.3rem] ${optimistic ? "fill-[#ff3b5c] text-[#ff3b5c]" : "text-foreground"}`}
          strokeWidth={2.3}
        />
      </motion.span>
      {variant === "pill" && <span>{optimistic ? "Na sua lista" : "Quero ir"}</span>}
      <AnimatePresence>
        {burst > 0 && (
          <span key={burst} className="pointer-events-none absolute inset-0" aria-hidden>
            {BURST.map((a) => (
              <motion.span
                key={a}
                className="absolute top-1/2 left-1/2 size-1.5 rounded-full bg-[#ff3b5c]"
                initial={{ x: "-50%", y: "-50%", opacity: 1, scale: 1 }}
                animate={{ x: `calc(-50% + ${Math.cos(a) * 26}px)`, y: `calc(-50% + ${Math.sin(a) * 26}px)`, opacity: 0, scale: 0.4 }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              />
            ))}
          </span>
        )}
      </AnimatePresence>
    </button>
  );
}
