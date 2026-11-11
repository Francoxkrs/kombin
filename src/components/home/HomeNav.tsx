"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Wordmark } from "../ui/Logo";
import { btn } from "../ui/styles";
import { useScrollTo } from "./SmoothScroll";

/** A animação do encaixe da marca toca só na primeira abertura. */
let brandPlayed = false;

/** Barra do topo: transparente no começo; ao rolar, ganha fundo escuro desfocado e uma linha fina. */
export function HomeNav({ account }: { account: React.ReactNode }) {
  const scrollTo = useScrollTo();
  const [solid, setSolid] = useState(false);
  const [encaixe] = useState(() => !brandPlayed);

  useEffect(() => {
    brandPlayed = true;
    const on = () => setSolid(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 border-b pt-[env(safe-area-inset-top)] transition-[background-color,border-color] duration-300 ${
        solid ? "border-line/70 bg-background/80 backdrop-blur-md" : "border-transparent"
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-[1240px] items-center justify-between gap-6 px-5 sm:px-8 lg:px-10" aria-label="Principal">
        <Link href="/" className="press flex h-11 items-center" aria-label="Kombin, início">
          <Wordmark encaixe={encaixe} />
        </Link>
        <div className="flex items-center gap-1 sm:gap-6">
          <Link href="/descobrir" transitionTypes={["nav-forward"]} className="press hidden h-11 items-center text-[15px] font-medium text-ink-2 hover:text-foreground sm:flex">
            Descobrir
          </Link>
          <Link href="/restaurantes" transitionTypes={["nav-forward"]} className="press hidden h-11 items-center text-[15px] font-medium text-ink-2 hover:text-foreground md:flex">
            Para restaurantes
          </Link>
          {account}
          <button onClick={() => scrollTo("#quiz")} className={`${btn("ipe", "md")} hidden lg:flex`}>
            Achar meu lugar
          </button>
        </div>
      </nav>
    </header>
  );
}
