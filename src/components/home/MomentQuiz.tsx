"use client";

import { ArrowLeft, Check } from "lucide-react";
import { AnimatePresence, motion, MotionConfig } from "motion/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createDecision } from "@/app/actions";
import { previewKey, type HomeData, type HomeOccasion } from "@/lib/home-shared";
import { BUDGET_OPTIONS, PARTY_OPTIONS } from "@/lib/occasions";
import { searchLoginHref } from "@/lib/prefs";
import { Photo } from "../ui/Photo";
import { BTN_LIGHT, btn } from "../ui/styles";
import { SubmitButton } from "../ui/SubmitButton";

interface Answers {
  o: string;
  p: string;
  /** null = ainda não respondeu; "" = tanto faz. */
  b: string | null;
}

const STEPS = ["Qual é o momento?", "Quantas pessoas?", "Quanto por pessoa?"] as const;

const PARTY_LABELS: Record<string, string> = { "2": "Duas", "3-5": "De 3 a 5", "6+": "6 ou mais" };

const fmt = (n: number) => n.toLocaleString("pt-BR");

/** Opção grande, um toque e já passa para a próxima pergunta. */
function Option({
  selected,
  onClick,
  children,
  dot,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  dot?: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={selected}
      className={`press group flex min-h-14 w-full items-center gap-3 rounded-[18px] border px-4 py-3 text-left transition-colors duration-200 ${
        selected ? "border-foreground bg-foreground text-background" : "border-line bg-surface hover:border-muted"
      }`}
    >
      {dot && <span className="size-3 shrink-0 rounded-full" style={{ background: dot }} />}
      <span className="min-w-0 flex-1">{children}</span>
      <Check className={`size-5 shrink-0 transition-opacity ${selected ? "opacity-100" : "opacity-0"}`} strokeWidth={2.25} />
    </button>
  );
}

/**
 * Quiz de 3 passos, uma pergunta por tela: ocasião, pessoas, orçamento. Cada toque
 * avança sozinho e o número de casas que ainda combinam aparece desde o 2º passo,
 * então a pessoa vê o resultado se formando em vez de preencher um formulário.
 * No fim, o melhor match com o motivo e as avaliações fica colado no botão.
 */
export function MomentQuiz({ data, loggedIn }: { data: HomeData; loggedIn: boolean }) {
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [a, setA] = useState<Answers>({ o: "", p: "", b: null });
  const heading = useRef<HTMLHeadingElement>(null);
  const moved = useRef(false);

  const occasion: HomeOccasion | undefined = data.occasions.find((o) => o.slug === a.o);
  const preview = a.o ? data.previews[previewKey(a.o, a.p, a.b ?? "")] : null;

  // Foco no título de cada passo: leitor de tela e teclado acompanham a troca.
  useEffect(() => {
    if (moved.current) heading.current?.focus({ preventScroll: true });
  }, [step]);

  function go(next: number) {
    moved.current = true;
    setDir(next > step ? 1 : -1);
    setStep(next);
  }

  function answer(key: keyof Answers, value: string) {
    setA((prev) => ({ ...prev, [key]: value }));
    go(step + 1);
  }

  const query = new URLSearchParams({ ...(a.p && { p: a.p }), ...(a.b && { b: a.b }) }).toString();
  const results = `/o/${a.o}${query ? `?${query}` : ""}`;
  // Filtrar pede login (o Kombin aprende o gosto de quem usa); a pessoa volta direto para os resultados.
  const resultsHref = loggedIn || !query ? results : searchLoginHref(results);

  // Com movimento reduzido, o MotionConfig "user" tira o deslize e deixa só o fade.
  const slide = {
    initial: { opacity: 0, x: 48 * dir },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -48 * dir },
  };

  return (
    <MotionConfig reducedMotion="user">
    <section id="quiz" aria-label="Achar meu lugar" className="scroll-mt-16 border-t border-line">
      <div className="mx-auto flex min-h-svh max-w-[1240px] flex-col px-5 pt-20 pb-28 sm:px-8 lg:grid lg:grid-cols-12 lg:gap-10 lg:px-10 lg:py-32">
        <div className="lg:col-span-4">
          <h2 className="title text-[34px] sm:text-[52px] lg:text-[60px]">Três toques e pronto.</h2>
          <p className="mt-4 hidden max-w-[34ch] text-[17px] leading-[1.6] text-ink-2 sm:block">
            Sem formulário. Responda o que importa e veja as casas que combinam com o seu momento.
          </p>
        </div>

        <div className="mt-6 lg:col-span-7 lg:col-start-6 lg:mt-0">
          {/* Progresso: três trilhos, um por pergunta. O resultado é o quarto estado. */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => go(step - 1)}
              disabled={step === 0}
              className="press -ml-2 grid size-11 shrink-0 place-items-center rounded-full disabled:opacity-0"
              aria-label="Voltar uma pergunta"
            >
              <ArrowLeft className="size-5" strokeWidth={2} />
            </button>
            <div className="grid flex-1 grid-cols-3 gap-1.5" aria-hidden>
              {STEPS.map((s, i) => (
                <span key={s} className="h-[3px] overflow-hidden rounded-full bg-line">
                  <motion.span
                    className="block h-full origin-left bg-ipe"
                    initial={false}
                    animate={{ scaleX: i < step ? 1 : 0 }}
                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  />
                </span>
              ))}
            </div>
            <p className="w-24 shrink-0 text-right text-[14px] tabular-nums text-muted" aria-live="polite">
              {step < 3 ? `${step + 1} de 3` : "Pronto"}
            </p>
          </div>

          <div className="relative mt-6 min-h-[480px] overflow-hidden">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div key={step} {...slide} transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }} className="w-full">
                {step < 3 && (
                  <>
                    <h3 ref={heading} tabIndex={-1} className="title text-[32px] outline-none sm:text-[40px]">
                      {STEPS[step]}
                    </h3>
                    {preview && (
                      <p className="mt-2 text-[15px] text-muted">
                        <span className="font-semibold text-foreground tabular-nums">{fmt(preview.count)}</span>{" "}
                        {preview.count === 1 ? "casa combina" : "casas combinam"} até aqui
                      </p>
                    )}
                  </>
                )}

                {step === 0 && (
                  <div className="mt-5 grid gap-2 sm:grid-cols-2 sm:gap-2.5">
                    {data.occasions.map((o) => (
                      <Option key={o.slug} dot={o.color} selected={a.o === o.slug} onClick={() => answer("o", o.slug)}>
                        <span className="block text-[17px] font-semibold leading-tight">{o.short}</span>
                        <span className={`mt-1 block text-[13px] leading-snug ${a.o === o.slug ? "text-background/70" : "text-muted"}`}>
                          {o.tagline}
                        </span>
                      </Option>
                    ))}
                  </div>
                )}

                {step === 1 && (
                  <div className="mt-6 grid gap-2.5">
                    {PARTY_OPTIONS.map((p) => (
                      <Option key={p.value} selected={a.p === p.value} onClick={() => answer("p", p.value)}>
                        <span className="text-[17px] font-semibold">{PARTY_LABELS[p.value] ?? p.label}</span>
                      </Option>
                    ))}
                  </div>
                )}

                {step === 2 && (
                  <div className="mt-6 grid gap-2.5">
                    {[...BUDGET_OPTIONS, { value: "", label: "Tanto faz" }].map((b) => (
                      <Option key={b.value || "any"} selected={a.b === b.value} onClick={() => answer("b", b.value)}>
                        <span className="text-[17px] font-semibold">{b.label}</span>
                      </Option>
                    ))}
                  </div>
                )}

                {step === 3 && occasion && preview && (
                  <div>
                    <h3 ref={heading} tabIndex={-1} className="title text-[32px] outline-none sm:text-[40px]">
                      {preview.count > 0
                        ? `${fmt(preview.count)} ${preview.count === 1 ? "casa combina" : "casas combinam"} com ${occasion.target}`
                        : `Nada ainda para ${occasion.target} com esse orçamento`}
                    </h3>

                    {preview.best ? (
                      <Link
                        href={`/l/${preview.best.id}?o=${occasion.slug}`}
                        transitionTypes={["nav-forward"]}
                        className="press mt-6 flex gap-4 rounded-[22px] border border-line bg-surface p-3"
                      >
                        <Photo
                          src={preview.best.photos[0] ?? null}
                          fallbacks={preview.best.photos.slice(1)}
                          blurhash={preview.best.blurhash}
                          alt=""
                          className="aspect-[4/5] w-28 shrink-0 rounded-[14px]"
                        />
                        <span className="flex min-w-0 flex-1 flex-col py-1">
                          <span className="text-[14px] text-muted">O que mais combina</span>
                          <span className="title mt-1 text-[24px]">{preview.best.name}</span>
                          <span className="mt-1 text-[15px] font-medium">
                            <span className="text-ipe">{preview.best.compat}%</span> combina
                          </span>
                          {preview.best.badges.length > 0 && (
                            <span className="mt-auto flex flex-wrap gap-x-3 gap-y-1 pt-3 text-[13px] text-ink-2">
                              {preview.best.badges.map((b) => (
                                <span key={b} className="flex items-center gap-1">
                                  <Check className="size-3.5 text-ipe" strokeWidth={2.5} /> {b}
                                </span>
                              ))}
                            </span>
                          )}
                          {preview.best.reviews > 0 && (
                            <span className="pt-2 text-[13px] text-muted">
                              {fmt(preview.best.reviews)} {preview.best.reviews === 1 ? "avaliação" : "avaliações"} de quem foi
                            </span>
                          )}
                        </span>
                      </Link>
                    ) : (
                      <p className="mt-4 max-w-[36ch] text-[17px] leading-[1.6] text-muted">
                        Tente &quot;Tanto faz&quot; no orçamento, ou outra ocasião.
                      </p>
                    )}

                    {preview.count > 0 ? (
                      <>
                        <Link href={resultsHref} transitionTypes={["nav-forward"]} className={`${btn("ipe")} mt-6 w-full`}>
                          Ver {preview.count === 1 ? "o lugar" : `os ${fmt(preview.count)} lugares`}
                        </Link>
                        {!loggedIn && query && (
                          <p className="mt-3 text-center text-[13px] leading-snug text-muted">
                            Antes, você entra com seu e-mail. Assim o Kombin aprende o seu gosto, e você cai direto nos resultados.
                          </p>
                        )}
                        {preview.ids.length >= 2 && (
                          <form action={createDecision} className="mt-3">
                            <input type="hidden" name="occasion" value={occasion.slug} />
                            {preview.ids.map((id) => (
                              <input key={id} type="hidden" name="placeId" value={id} />
                            ))}
                            <SubmitButton className={`${BTN_LIGHT} w-full`}>
                              Mandar os {preview.ids.length} pra votar
                            </SubmitButton>
                          </form>
                        )}
                      </>
                    ) : (
                      <button onClick={() => go(2)} className={`${btn("ipe")} mt-6 w-full`}>
                        Mudar o orçamento
                      </button>
                    )}
                    <button onClick={() => go(0)} className="press mx-auto mt-4 flex h-11 items-center text-[15px] font-medium text-muted">
                      Começar de novo
                    </button>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
    </MotionConfig>
  );
}
