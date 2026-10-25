"use client";

import { useState } from "react";

interface Props {
  placeId: string;
  name: string;
  coverUrl: string | null;
  hasGoogle: boolean;
  color: string;
  className?: string;
  /** Qual foto do Google (0 = principal). */
  index?: number;
}

/**
 * Foto do lugar: primeiro a foto própria (restaurante/time), depois a do Google
 * buscada ao vivo, e por fim um fundo com a inicial, na cor da ocasião.
 */
export function PlaceImage({ placeId, name, coverUrl, hasGoogle, color, className = "", index = 0 }: Props) {
  const src = coverUrl ?? (hasGoogle ? `/api/photo/${placeId}?i=${index}` : null);
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    // Varia o tom por lugar para os cards sem foto não ficarem iguais.
    const hash = [...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
    const hue = (hash % 50) - 25;
    return (
      <div
        className={`relative grid place-items-center overflow-hidden ${className}`}
        style={{
          background: `radial-gradient(120% 90% at ${20 + (hash % 60)}% 10%, ${color}cc, ${color} 55%, #151413 130%)`,
          filter: `hue-rotate(${hue}deg)`,
        }}
        aria-hidden
      >
        <span className="text-7xl font-bold text-white/25 select-none">{name.slice(0, 1)}</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- a URL do Google muda a cada busca; não passa pelo otimizador
    <img
      src={src}
      alt={`Ambiente do ${name}`}
      className={`object-cover ${className}`}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
