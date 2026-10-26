"use client";

import { MessageSquareHeart, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState, useTransition } from "react";
import type { MicroReviewBody } from "@/app/api/review/route";
import type { Noise, SpendBand } from "@/lib/types";

const STEPS = [
  {
    q: "Gastou quanto por pessoa?",
    options: [
      { label: "até R$ 40", emoji: "🪙", value: 1 },
      { label: "R$ 40 a 80", emoji: "💵", value: 2 },
      { label: "R$ 80 a 150", emoji: "💳", value: 3 },
      { label: "R$ 150+", emoji: "💎", value: 4 },
    ],
  },
  {
    q: "Tinha couvert?",
    options: [
      { label: "Não", emoji: "🙌", value: 0 },
      { label: "Sim", emoji: "🎸", value: 1 },
    ],
  },
  {
    q: "Dava pra conversar?",
    options: [
      { label: "De boa", emoji: "🤫", value: 1 },
      { label: "Mais ou menos", emoji: "🗣️", value: 2 },
      { label: "Só gritando", emoji: "📣", value: 3 },
    ],
  },
] as const;

interface Props {
  placeId: string;
  placeName: string;
  occasion: string | null;
  color?: string;
  /** "prompt": aparece sozinho depois da visita. "button": aberto pela pessoa na página do lugar. */
  variant?: "prompt" | "button";
}

const CONFETTI = ["#ff3b5c", "#0c8a47", "#ffb800", "#6d3fc0", "#1f7aff", "#ff7a1a"];

/** Avaliação relâmpago: 3 perguntas, 3 toques, recompensa na hora. */
export function MicroReview({ placeId, placeName, occasion, color = "#0b0b0c", variant = "prompt" }: Props) {
  const [open, setOpen] = useState(variant === "prompt");
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [done, setDone] = useState<{ total: number; loggedIn: boolean } | null>(null);
  const [pending, startTransition] = useTransition();

  function choose(value: number) {
    if (navigator.vibrate) navigator.vibrate(6);
    const next = [...answers, value];
    setAnswers(next);
    if (step < STEPS.length - 1) {
      setStep(step + 1);
      return;
    }
    startTransition(async () => {
      const body: MicroReviewBody = {
        placeId,
        occasion,
        spend: next[0] as SpendBand,
        cover: next[1] === 1,
        noise: next[2] as Noise,
      };
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) setDone(await res.json());
      else setOpen(false);
    });
  }

  function close() {
    setOpen(false);
    if (variant === "prompt" && !done) fetch("/api/review", { method: "DELETE" });
  }

  function reopen() {
    setStep(0);
    setAnswers([]);
    setDone(null);
    setOpen(true);
  }

  const accent = color === "#0b0b0c" ? "#0c8a47" : color;

  return (
    <>
      {variant === "button" && (
        <button
          onClick={reopen}
          className="press flex w-full items-center justify-center gap-2 rounded-2xl bg-foreground py-3.5 text-[0.95rem] font-bold text-white"
        >
          <MessageSquareHeart className="size-5" strokeWidth={2.2} /> Já fui · avaliar em 3 toques
        </button>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
          >
            <motion.div
              role="dialog"
              aria-label={`Avaliar ${placeName}`}
              className="relative w-full max-w-md overflow-hidden rounded-t-[2.2rem] bg-white px-6 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 38 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.6 }}
              onDragEnd={(_, info) => info.offset.y > 120 && close()}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mx-auto mb-4 h-1.5 w-11 rounded-full bg-line" />
              <button onClick={close} aria-label="Fechar" className="press absolute top-4 right-4 grid size-9 place-items-center rounded-full bg-soft">
                <X className="size-4" strokeWidth={2.6} />
              </button>

              {done ? (
                <div className="py-4 text-center">
                  <div className="pointer-events-none absolute inset-x-0 top-10 flex justify-center" aria-hidden>
                    {Array.from({ length: 18 }, (_, i) => (
                      <motion.span
                        key={i}
                        className="absolute size-2 rounded-[2px]"
                        style={{ background: CONFETTI[i % CONFETTI.length] }}
                        initial={{ x: 0, y: 40, opacity: 1, rotate: 0 }}
                        animate={{
                          x: (i - 9) * 18 + (i % 2 ? 8 : -8),
                          y: -40 - (i % 5) * 18,
                          opacity: 0,
                          rotate: i * 40,
                        }}
                        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
                      />
                    ))}
                  </div>
                  <motion.div
                    initial={{ scale: 2.2, rotate: -16, opacity: 0 }}
                    animate={{ scale: 1, rotate: -8, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 420, damping: 16 }}
                    className="mx-auto mb-5 grid size-28 place-items-center rounded-full border-[5px] text-base font-black tracking-wider uppercase"
                    style={{ borderColor: accent, color: accent }}
                  >
                    Valeu!
                  </motion.div>
                  <p className="text-xl font-extrabold tracking-[-0.02em]">Sua dica já entrou no índice de {placeName}.</p>
                  <div className="mx-auto mt-4 max-w-56">
                    <div className="h-2.5 overflow-hidden rounded-full bg-soft">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: accent }}
                        initial={{ width: `${(Math.min(5, done.total - 1) / 5) * 100}%` }}
                        animate={{ width: `${(Math.min(5, done.total) / 5) * 100}%` }}
                        transition={{ delay: 0.3, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                      />
                    </div>
                    <p className="mt-2 text-sm text-muted">
                      {done.total < 5
                        ? `${done.total}/5 para o selo Explorador de Campo Grande`
                        : "Você é Explorador de Campo Grande 🧭"}
                    </p>
                  </div>
                  {!done.loggedIn && (
                    <a href="/entrar" className="mt-3 inline-block text-sm font-bold underline">
                      Entre para guardar no seu perfil e ganhar o selo
                    </a>
                  )}
                  <button onClick={() => setOpen(false)} className="press mt-6 w-full rounded-2xl bg-foreground py-4 font-bold text-white">
                    Fechar
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-sm text-muted">Como foi em {placeName}?</p>
                  <div className="mt-3 flex gap-1.5" aria-hidden>
                    {STEPS.map((s, i) => (
                      <span key={s.q} className="h-1.5 flex-1 overflow-hidden rounded-full bg-soft">
                        <motion.span
                          className="block h-full rounded-full"
                          style={{ background: accent }}
                          animate={{ width: i <= step ? "100%" : "0%" }}
                          transition={{ duration: 0.35 }}
                        />
                      </span>
                    ))}
                  </div>
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={step}
                      initial={{ x: 40, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: -40, opacity: 0 }}
                      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <h2 className="display mt-5 mb-5 text-[1.9rem]">{STEPS[step].q}</h2>
                      <div className={`grid gap-2.5 ${STEPS[step].options.length === 3 ? "grid-cols-1" : "grid-cols-2"}`}>
                        {STEPS[step].options.map((o) => (
                          <button
                            key={o.label}
                            disabled={pending}
                            onClick={() => choose(o.value)}
                            className="press flex items-center gap-3 rounded-2xl border-2 border-line px-4 py-4 text-left text-[1.02rem] font-bold transition-colors hover:border-foreground disabled:opacity-50"
                          >
                            <span className="text-2xl" aria-hidden>
                              {o.emoji}
                            </span>
                            {o.label}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  </AnimatePresence>
                  <button onClick={close} className="mt-4 w-full py-2 text-sm font-semibold text-muted">
                    {variant === "prompt" ? "Acabei não indo" : "Agora não"}
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
