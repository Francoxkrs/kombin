"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useRef, useState } from "react";
import { Photo } from "./ui/Photo";

/**
 * Fotos do lugar em carrossel (deslizar com o dedo). A foto cresce de leve
 * quando a página rola, um parallax discreto.
 */
export function Gallery({ photos, name, color }: { photos: string[]; name: string; color: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const { scrollY } = useScroll();
  const scale = useTransform(scrollY, [0, 400], [1, 1.12]);
  const y = useTransform(scrollY, [0, 400], [0, 60]);

  function onScroll() {
    const el = ref.current;
    if (!el) return;
    setActive(Math.round(el.scrollLeft / el.clientWidth));
  }

  if (photos.length === 0) {
    return <Photo src={null} alt="" name={name} color={color} className="aspect-square w-full" />;
  }

  return (
    <div className="relative aspect-square w-full overflow-hidden bg-soft">
      <motion.div style={{ scale, y }} className="absolute inset-0 origin-top">
        <div
          ref={ref}
          onScroll={onScroll}
          className="no-scrollbar flex size-full snap-x snap-mandatory overflow-x-auto"
          aria-label={`Fotos de ${name}`}
        >
          {photos.map((src, i) => (
            <Photo
              key={src}
              src={src}
              alt={`${name}, foto ${i + 1}`}
              name={name}
              color={color}
              className="h-full w-full shrink-0 snap-center"
              eager={i === 0}
            />
          ))}
        </div>
      </motion.div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/45 to-transparent" />
      {photos.length > 1 && (
        <div className="absolute inset-x-0 bottom-9 flex justify-center gap-1.5">
          {photos.map((src, i) => (
            <span
              key={src}
              className={`h-1.5 rounded-full bg-white transition-all duration-300 ${i === active ? "w-5" : "w-1.5 opacity-60"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
