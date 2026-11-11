"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { createContext, useCallback, useContext, useEffect, useRef } from "react";

gsap.registerPlugin(ScrollTrigger);

type ScrollTo = (target: string | HTMLElement, offset?: number) => void;

const ScrollCtx = createContext<ScrollTo>((target) => {
  const el = typeof target === "string" ? document.querySelector(target) : target;
  el?.scrollIntoView({ behavior: "smooth", block: "start" });
});

/** Rola até um elemento com a mesma inércia do resto da página. */
export const useScrollTo = () => useContext(ScrollCtx);

/**
 * Rolagem suave só na página inicial. Uma régua de tempo para tudo: o Lenis anda no
 * ticker do GSAP e avisa o ScrollTrigger a cada quadro, então a história do hero nunca
 * fica um quadro atrás da rolagem. No toque fica a rolagem nativa (syncTouch desligado):
 * no celular, segurar o dedo da pessoa é pior do que qualquer suavização.
 * Com movimento reduzido, nada disso liga.
 */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const lenis = useRef<Lenis | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const l = new Lenis({ lerp: 0.12, wheelMultiplier: 0.9, autoRaf: false, anchors: false });
    lenis.current = l;
    l.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => l.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      gsap.ticker.lagSmoothing(500, 33);
      l.destroy();
      lenis.current = null;
    };
  }, []);

  const scrollTo = useCallback<ScrollTo>((target, offset = 0) => {
    const el = typeof target === "string" ? document.querySelector<HTMLElement>(target) : target;
    if (!el) return;
    if (lenis.current) lenis.current.scrollTo(el, { offset, duration: 1.2 });
    else window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY + offset, behavior: "smooth" });
  }, []);

  return <ScrollCtx.Provider value={scrollTo}>{children}</ScrollCtx.Provider>;
}
