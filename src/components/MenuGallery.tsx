"use client";

import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Photo } from "@/components/ui/Photo";
import { ROUND_LIGHT } from "@/components/ui/styles";
import type { MenuPhoto } from "@/lib/types";

/**
 * Cardápio fotografado pelo dono: as páginas lado a lado na página do lugar e, ao tocar,
 * a página aberta na tela inteira (dá para dar zoom com dois dedos e passar para a próxima).
 */
export function MenuGallery({ pages, placeName }: { pages: MenuPhoto[]; placeName: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const strip = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open == null) {
      if (d.open) d.close();
      return;
    }
    if (!d.open) d.showModal();
    const el = strip.current?.children[open] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest", inline: "start" });
  }, [open]);

  return (
    <>
      <div className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-1 overflow-x-auto px-5">
        {pages.map((p, i) => (
          <button
            key={p.url}
            type="button"
            onClick={() => setOpen(i)}
            aria-label={`Abrir a página ${i + 1} do cardápio`}
            className="press w-[44%] shrink-0 snap-start"
          >
            <Photo src={p.url} blurhash={p.blurhash} alt={`Cardápio de ${placeName}, página ${i + 1}`} className="aspect-[3/4] w-full" />
          </button>
        ))}
      </div>

      <dialog
        ref={dialog}
        onClose={() => setOpen(null)}
        className="m-0 h-dvh max-h-none w-screen max-w-none bg-black p-0 text-foreground backdrop:bg-black"
        aria-label={`Cardápio de ${placeName}`}
      >
        <div ref={strip} className="no-scrollbar flex h-full snap-x snap-mandatory overflow-x-auto">
          {pages.map((p, i) => (
            <div key={p.url} className="flex h-full w-screen shrink-0 snap-start items-center justify-center overflow-auto">
              {/* eslint-disable-next-line @next/next/no-img-element -- página inteira, já otimizada no envio */}
              <img
                src={p.url}
                alt={`Cardápio de ${placeName}, página ${i + 1} de ${pages.length}`}
                width={p.w}
                height={p.h}
                className="max-h-full w-full object-contain"
              />
            </div>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between px-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <span className="rounded-full bg-black/60 px-3 py-1.5 text-[15px] font-semibold">
            {pages.length} {pages.length === 1 ? "página" : "páginas"}
          </span>
          <button type="button" onClick={() => setOpen(null)} aria-label="Fechar o cardápio" className={`${ROUND_LIGHT} pointer-events-auto`}>
            <X className="size-5" strokeWidth={2} />
          </button>
        </div>
      </dialog>
    </>
  );
}
