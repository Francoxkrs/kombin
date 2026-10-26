"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  src: string | null;
  alt: string;
  /** Nome do lugar: vira a inicial do fundo quando não há foto. */
  name: string;
  color?: string;
  className?: string;
  eager?: boolean;
}

/** Foto com entrada suave e fundo de reserva (gradiente com a inicial) se não houver imagem. */
export function Photo({ src, alt, name, color = "#1b1b1f", className = "", eager }: Props) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const img = useRef<HTMLImageElement>(null);
  // "relative" junto com "absolute" no className deixaria a caixa com altura zero.
  const position = /\b(absolute|fixed)\b/.test(className) ? "" : "relative";
  const hash = [...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

  // A foto pode terminar de carregar antes de o React assumir a página (onLoad não dispara).
  useEffect(() => {
    const el = img.current;
    if (!el?.complete) return;
    if (el.naturalWidth > 0) setLoaded(true);
    else setFailed(true);
  }, [src]);

  return (
    <div className={`${position} overflow-hidden bg-soft ${className}`}>
      {(!src || failed) && (
        <div
          className="absolute inset-0 grid place-items-center"
          style={{
            background: `radial-gradient(120% 90% at ${20 + (hash % 60)}% 0%, ${color}bb, ${color} 60%, #0b0b0c 140%)`,
            filter: `hue-rotate(${(hash % 40) - 20}deg)`,
          }}
          aria-hidden
        >
          <span className="display text-[5.5rem] text-white/20 select-none">{name.slice(0, 1)}</span>
        </div>
      )}
      {src && !failed && (
        // eslint-disable-next-line @next/next/no-img-element -- fotos do Google passam pelo nosso proxy com cache próprio
        <img
          ref={img}
          src={src}
          alt={alt}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={eager ? "high" : undefined}
          data-loaded={loaded}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className="fade-img absolute inset-0 size-full object-cover"
        />
      )}
    </div>
  );
}
