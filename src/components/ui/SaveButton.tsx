"use client";

import { Heart } from "lucide-react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useOptimistic, useTransition } from "react";
import { toggleSave } from "@/app/actions";

interface Props {
  placeId: string;
  saved: boolean;
  loggedIn: boolean;
  /** Para onde voltar depois do login. */
  back: string;
  /** "round": círculo claro por cima de foto. "pill": botão "Quero ir" com texto. */
  variant?: "round" | "pill";
}

/** Coração "Quero ir": salva na hora (otimista). */
export function SaveButton({ placeId, saved, loggedIn, back, variant = "round" }: Props) {
  const router = useRouter();
  const [optimistic, setOptimistic] = useOptimistic(saved);
  const [, start] = useTransition();

  function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!loggedIn) {
      router.push(`/entrar?next=${encodeURIComponent(back)}`);
      return;
    }
    const next = !optimistic;
    if (navigator.vibrate) navigator.vibrate(8);
    start(async () => {
      setOptimistic(next);
      await toggleSave(placeId, "want", next);
    });
  }

  const label = optimistic ? "Tirar de Quero ir" : "Salvar em Quero ir";
  const base =
    variant === "pill"
      ? "h-14 gap-2 rounded-full bg-surface px-6 text-[16px] font-semibold text-foreground"
      : "size-11 shrink-0 rounded-full bg-foreground text-background";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={optimistic}
      aria-label={variant === "pill" ? undefined : label}
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
          className={`size-5 ${optimistic ? (variant === "pill" ? "fill-ipe text-ipe" : "fill-current") : ""}`}
          strokeWidth={2}
        />
      </motion.span>
      {variant === "pill" && <span>{optimistic ? "Na sua lista" : "Quero ir"}</span>}
    </button>
  );
}
