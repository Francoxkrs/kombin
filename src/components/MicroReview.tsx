"use client";

import { BadgeCheck, MapPin, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState, useTransition } from "react";
import type { MicroReviewBody } from "@/app/api/review/route";
import { distanceKm, isWithinCheckin } from "@/lib/geo";
import type { Noise, SpendBand } from "@/lib/types";
import { BTN_LIGHT, BTN_QUIET } from "./ui/styles";

const STEPS = [
  {
    q: "Gastou quanto por pessoa?",
    options: [
      { label: "Até R$ 50", value: 1 },
      { label: "R$ 50 a 100", value: 2 },
      { label: "R$ 100 a 150", value: 3 },
      { label: "Mais de R$ 150", value: 4 },
    ],
  },
  {
    q: "Cobraram couvert?",
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

const EXPLORER_AT = 5;

type Checkin = "idle" | "locating" | "ok" | "far" | "denied";

const km = (n: number) => (n < 1 ? `${Math.round(n * 1000)} m` : `${n.toFixed(1).replace(".", ",")} km`);

interface Props {
  placeId: string;
  placeName: string;
  occasion: string | null;
  /** Onde fica o lugar, para o check-in. Sem isso, o botão de confirmar visita não aparece. */
  coords?: { lat: number; lng: number } | null;
  /** "prompt": aparece sozinho depois da visita. "button": aberto pela pessoa na página do lugar. */
  variant?: "prompt" | "button";
}

/** Avaliação relâmpago: 3 perguntas, 3 toques. */
export function MicroReview({ placeId, placeName, occasion, coords, variant = "prompt" }: Props) {
  const [open, setOpen] = useState(variant === "prompt");
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [done, setDone] = useState<{ total: number; loggedIn: boolean; verified?: boolean } | null>(null);
  const [pending, startTransition] = useTransition();
  const [checkin, setCheckin] = useState<Checkin>("idle");
  const [away, setAway] = useState(0);

  /**
   * Check-in por raio: a conta de distância (Haversine) é feita aqui no celular e
   * só o "estou no lugar" vai para o servidor. A localização não é enviada nem guardada.
   */
  function checkIn() {
    if (!coords || !navigator.geolocation) return setCheckin("denied");
    setCheckin("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const d = distanceKm(coords, { lat: pos.coords.latitude, lng: pos.coords.longitude });
        if (isWithinCheckin(d, pos.coords.accuracy)) setCheckin("ok");
        else {
          setAway(d);
          setCheckin("far");
        }
      },
      () => setCheckin("denied"),
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  }

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
        verifiedVisit: checkin === "ok",
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
    setCheckin("idle");
    setOpen(true);
  }

  return (
    <>
      {variant === "button" && (
        <button onClick={reopen} className={`${BTN_QUIET} w-full`}>
          Avaliar em 3 toques
        </button>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
          >
            <motion.div
              role="dialog"
              aria-label={`Avaliar ${placeName}`}
              className="relative w-full max-w-md rounded-t-[28px] bg-surface px-5 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
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
              <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-line" />
              <button onClick={close} aria-label="Fechar" className="press absolute top-3 right-3 grid size-11 place-items-center rounded-full bg-soft">
                <X className="size-5" strokeWidth={2} />
              </button>

              {done ? (
                <div className="pt-6">
                  <motion.p
                    initial={{ y: 24, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 420, damping: 22 }}
                    className="title text-[64px] text-ipe"
                  >
                    Valeu!
                  </motion.p>
                  <p className="mt-3 max-w-[30ch] text-[20px] leading-snug">
                    {done.verified
                      ? `Visita confirmada: sua dica entrou com peso dobrado no índice de ${placeName}.`
                      : `Sua dica já entrou no índice de ${placeName}.`}
                  </p>
                  <div className="mt-6 flex gap-1" aria-hidden>
                    {Array.from({ length: EXPLORER_AT }, (_, i) => (
                      <motion.span
                        key={i}
                        className="h-2 flex-1 rounded-full"
                        initial={{ backgroundColor: i < done.total - 1 ? "var(--ipe)" : "var(--soft)" }}
                        animate={{ backgroundColor: i < done.total ? "var(--ipe)" : "var(--soft)" }}
                        transition={{ delay: 0.3, duration: 0.4 }}
                      />
                    ))}
                  </div>
                  <p className="mt-3 text-[15px] text-muted">
                    {done.total < EXPLORER_AT
                      ? `${done.total} de ${EXPLORER_AT} para o selo Explorador de Campo Grande`
                      : "Você é Explorador de Campo Grande"}
                  </p>
                  {!done.loggedIn && (
                    <a href="/entrar" className="mt-3 inline-block text-[15px] font-semibold underline underline-offset-4">
                      Entre para guardar no seu perfil e ganhar o selo
                    </a>
                  )}
                  <button onClick={() => setOpen(false)} className={`${BTN_LIGHT} mt-7 w-full`}>
                    Fechar
                  </button>
                </div>
              ) : (
                <>
                  <p className="pr-12 text-[15px] text-muted">Como foi em {placeName}?</p>
                  <div className="mt-3 flex gap-1 pr-12" aria-hidden>
                    {STEPS.map((s, i) => (
                      <span key={s.q} className="h-1.5 flex-1 overflow-hidden rounded-full bg-soft">
                        <motion.span
                          className="block h-full bg-ipe"
                          animate={{ width: i <= step ? "100%" : "0%" }}
                          transition={{ duration: 0.35 }}
                        />
                      </span>
                    ))}
                  </div>
                  {coords && (
                    <button
                      onClick={checkIn}
                      disabled={checkin === "locating" || checkin === "ok"}
                      className="press mt-4 flex min-h-11 w-full items-center gap-3 text-left text-[15px] leading-snug"
                    >
                      {checkin === "ok" ? (
                        <BadgeCheck className="size-5 shrink-0 text-ipe" strokeWidth={2} />
                      ) : (
                        <MapPin className="size-5 shrink-0" strokeWidth={2} />
                      )}
                      <span>
                        {checkin === "idle" && (
                          <>
                            <span className="font-semibold underline underline-offset-4">Está aí agora? Confirme a visita</span>
                            <span className="block text-muted">Vale em dobro. Sua localização não sai do celular.</span>
                          </>
                        )}
                        {checkin === "locating" && <span className="text-muted">Conferindo se você está lá...</span>}
                        {checkin === "ok" && <span className="font-semibold">Visita confirmada: sua avaliação vale em dobro</span>}
                        {checkin === "far" && <span className="text-muted">Você está a {km(away)} daqui. Dá pra avaliar mesmo assim.</span>}
                        {checkin === "denied" && <span className="text-muted">Sem acesso à localização. Dá pra avaliar mesmo assim.</span>}
                      </span>
                    </button>
                  )}
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={step}
                      initial={{ x: 40, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: -40, opacity: 0 }}
                      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <h2 className="title mt-6 mb-5 text-[36px]">{STEPS[step].q}</h2>
                      <div className={`grid gap-2 ${STEPS[step].options.length === 3 ? "grid-cols-1" : "grid-cols-2"}`}>
                        {STEPS[step].options.map((o) => (
                          <button
                            key={o.label}
                            disabled={pending}
                            onClick={() => choose(o.value)}
                            className="press h-16 rounded-2xl bg-soft px-5 text-left text-[18px] font-medium disabled:opacity-50"
                          >
                            {o.label}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  </AnimatePresence>
                  <button onClick={close} className="mt-3 h-11 w-full text-[15px] text-muted">
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
