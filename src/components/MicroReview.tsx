"use client";

import { useState, useTransition } from "react";
import type { MicroReviewBody } from "@/app/api/review/route";
import type { Noise, SpendBand } from "@/lib/types";

const STEPS = [
  {
    q: "Gastou quanto por pessoa?",
    options: [
      { label: "até R$ 40", value: 1 },
      { label: "R$ 40 a 80", value: 2 },
      { label: "R$ 80 a 150", value: 3 },
      { label: "R$ 150+", value: 4 },
    ],
  },
  {
    q: "Tinha couvert?",
    options: [
      { label: "Não", value: 0 },
      { label: "Sim", value: 1 },
    ],
  },
  {
    q: "Dava pra conversar?",
    options: [
      { label: "De boa", value: 1 },
      { label: "Mais ou menos", value: 2 },
      { label: "Só gritando", value: 3 },
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

/** Avaliação relâmpago: 3 perguntas, 3 toques, recompensa na hora. */
export function MicroReview({ placeId, placeName, occasion, color = "#151413", variant = "prompt" }: Props) {
  const [open, setOpen] = useState(variant === "prompt");
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [done, setDone] = useState<{ total: number; loggedIn: boolean } | null>(null);
  const [pending, startTransition] = useTransition();

  function choose(value: number) {
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

  if (!open) {
    return (
      <button
        onClick={() => {
          setStep(0);
          setAnswers([]);
          setDone(null);
          setOpen(true);
        }}
        className="w-full rounded-2xl border border-line bg-surface py-3.5 text-sm font-semibold"
      >
        Já fui. Avaliar em 3 toques
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={close}>
      <div
        role="dialog"
        aria-label={`Avaliar ${placeName}`}
        className="animate-rise w-full max-w-md rounded-t-[2rem] bg-surface px-6 pt-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-5 h-1.5 w-10 rounded-full bg-line" />
        {done ? (
          <div className="py-4 text-center">
            <div
              className="animate-stamp mx-auto mb-5 grid size-24 place-items-center rounded-full border-4 text-sm font-black tracking-wider uppercase"
              style={{ borderColor: color, color }}
            >
              Valeu!
            </div>
            <p className="text-lg font-bold">Sua dica já entrou no índice de {placeName}.</p>
            <p className="mt-1 text-sm text-muted">
              {done.total === 1
                ? "Primeira avaliação feita. Faltam 4 para o selo Explorador."
                : done.total < 5
                  ? `${done.total} avaliações. Faltam ${5 - done.total} para o selo Explorador.`
                  : `${done.total} avaliações. Você é Explorador de Campo Grande.`}
            </p>
            {!done.loggedIn && (
              <a href="/entrar" className="mt-3 inline-block text-sm font-semibold underline">
                Entre para guardar no seu perfil e ganhar o selo
              </a>
            )}
            <button onClick={() => setOpen(false)} className="mt-6 w-full rounded-2xl bg-foreground py-3.5 font-semibold text-background">
              Fechar
            </button>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted">Como foi em {placeName}?</p>
            <div className="mt-1 mb-5 flex items-center justify-between">
              <h2 className="text-2xl font-bold tracking-tight">{STEPS[step].q}</h2>
              <span className="text-sm text-muted">{step + 1}/3</span>
            </div>
            <div className={`grid gap-2.5 ${STEPS[step].options.length === 4 ? "grid-cols-2" : "grid-cols-1"}`}>
              {STEPS[step].options.map((o) => (
                <button
                  key={o.label}
                  disabled={pending}
                  onClick={() => choose(o.value)}
                  className="rounded-2xl border-2 border-line py-4 text-base font-semibold transition active:scale-[0.97] disabled:opacity-50"
                >
                  {o.label}
                </button>
              ))}
            </div>
            <button onClick={close} className="mt-4 w-full py-2 text-sm text-muted">
              {variant === "prompt" ? "Acabei não indo" : "Agora não"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
