"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { btn } from "../ui/styles";
import { useScrollTo } from "./SmoothScroll";

/**
 * Ação fixa no rodapé, no celular: aparece quando o botão do hero some e sai de cena
 * quando o quiz está na tela (lá o botão é o próprio quiz). Sempre a um polegar.
 */
export function StickyCta({ places }: { places: number }) {
  const scrollTo = useScrollTo();
  const [past, setPast] = useState(false);
  const [quizOn, setQuizOn] = useState(false);

  useEffect(() => {
    const on = () => setPast(window.scrollY > window.innerHeight * 0.45);
    on();
    window.addEventListener("scroll", on, { passive: true });
    const quiz = document.getElementById("quiz");
    const io = quiz ? new IntersectionObserver(([e]) => setQuizOn(e.isIntersecting), { threshold: 0.15 }) : null;
    if (quiz) io?.observe(quiz);
    return () => {
      window.removeEventListener("scroll", on);
      io?.disconnect();
    };
  }, []);

  const show = past && !quizOn;
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="cta"
          initial={{ y: "110%" }}
          animate={{ y: 0 }}
          exit={{ y: "110%" }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-background/85 px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md will-change-transform lg:hidden"
        >
          <div className="mx-auto flex max-w-md items-center gap-4">
            <p className="min-w-0 flex-1 text-[13px] leading-snug text-muted">
              {places > 0 ? `${places.toLocaleString("pt-BR")} casas de Campo Grande, ` : ""}3 toques
            </p>
            <button onClick={() => scrollTo("#quiz")} className={btn("ipe", "md")}>
              Achar meu lugar
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
