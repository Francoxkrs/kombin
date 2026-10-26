"use client";

import { UtensilsCrossed } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useBlurhash } from "./useBlurhash";

interface Props {
  src: string | null;
  /** Outras fotos para tentar se a primeira não carregar. */
  fallbacks?: string[];
  alt: string;
  /** Nome do lugar (só para acessibilidade). */
  name?: string;
  className?: string;
  eager?: boolean;
  /** Classes extras da <img>. */
  imgClassName?: string;
  /** Prévia desfocada da primeira foto (BlurHash), para não piscar o vazio enquanto carrega. */
  blurhash?: string | null;
}

/** Foto com entrada suave. Se nenhuma fonte carregar, fica a superfície da noite com um ícone fino. */
export function Photo({ src, fallbacks = [], alt, className = "", eager, imgClassName = "", blurhash }: Props) {
  const sources = [src, ...fallbacks].filter((s): s is string => !!s);
  const [index, setIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const img = useRef<HTMLImageElement>(null);
  const current = sources[index];
  // "relative" junto com "absolute" no className deixaria a caixa com altura zero.
  const position = /\b(absolute|fixed)\b/.test(className) ? "" : "relative";
  const blur = useBlurhash(index === 0 ? blurhash : null);

  const fail = () => {
    setLoaded(false);
    setIndex((i) => i + 1);
  };

  // A foto pode terminar de carregar antes de o React assumir a página (onLoad não dispara).
  useEffect(() => {
    const el = img.current;
    if (!el?.complete) return;
    if (el.naturalWidth > 0) setLoaded(true);
    else fail();
  }, [current]);

  return (
    <div className={`${position} overflow-hidden bg-surface ${className}`}>
      {blur && current && (
        // eslint-disable-next-line @next/next/no-img-element -- data URL de 32 px, não passa pelo otimizador
        <img src={blur} alt="" aria-hidden className="absolute inset-0 size-full scale-110 object-cover blur-md" />
      )}
      {!current && (
        <div className="absolute inset-0 grid place-items-center" aria-hidden>
          <UtensilsCrossed className="size-6 text-muted" strokeWidth={1.25} />
        </div>
      )}
      {current && (
        // eslint-disable-next-line @next/next/no-img-element -- fotos do Google passam pelo nosso proxy com cache próprio
        <img
          ref={img}
          key={current}
          src={current}
          alt={alt}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={eager ? "high" : undefined}
          data-loaded={loaded}
          onLoad={() => setLoaded(true)}
          onError={fail}
          className={`fade-img absolute inset-0 size-full object-cover ${imgClassName}`}
        />
      )}
    </div>
  );
}
