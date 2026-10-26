"use client";

import { ChevronDown, Clock, Phone, Star } from "lucide-react";
import { useEffect, useState } from "react";
import type { LiveInfo as Info } from "@/lib/google";

function useLive(placeId: string, enabled: boolean) {
  const [info, setInfo] = useState<Info | null>(null);
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    fetch(`/api/live/${placeId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => alive && setInfo(d))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [placeId, enabled]);
  return info;
}

/** Nota do Google ao lado do nome (buscada ao vivo, com atribuição). */
export function LiveRating({ placeId, enabled }: { placeId: string; enabled: boolean }) {
  const info = useLive(placeId, enabled);
  if (!info?.rating) return null;
  return (
    <a
      href={info.googleMapsUri}
      target="_blank"
      rel="noopener"
      className="press flex items-center gap-1.5 text-[0.95rem] font-semibold"
    >
      <Star className="size-4 fill-foreground" strokeWidth={0} />
      {info.rating.toFixed(1).replace(".", ",")}
      <span className="font-normal text-muted">({info.userRatingCount?.toLocaleString("pt-BR")} no Google)</span>
    </a>
  );
}

/** Linhas de horário e telefone da seção "Informações do local". */
export function LiveRows({ placeId, enabled }: { placeId: string; enabled: boolean }) {
  const info = useLive(placeId, enabled);
  const [open, setOpen] = useState(false);
  const hours = info?.regularOpeningHours;
  const today = (new Date().getDay() + 6) % 7; // Google começa na segunda

  return (
    <>
      <li className="border-t border-line py-3.5">
        <button onClick={() => setOpen(!open)} className="flex w-full items-center gap-3 text-left" aria-expanded={open}>
          <Clock className="size-5 shrink-0" strokeWidth={2} />
          <span className="flex-1">Horário de funcionamento</span>
          <span className={hours?.openNow ? "font-semibold text-match" : "text-muted"}>
            {hours?.openNow == null ? "Consultar" : hours.openNow ? "Aberto agora" : "Fechado agora"}
          </span>
          {hours?.weekdayDescriptions && (
            <ChevronDown className={`size-4 transition-transform ${open ? "rotate-180" : ""}`} strokeWidth={2.4} />
          )}
        </button>
        {open && hours?.weekdayDescriptions && (
          <ul className="mt-3 space-y-1 pl-8 text-sm text-ink-2">
            {hours.weekdayDescriptions.map((d, i) => (
              <li key={d} className={i === today ? "font-bold text-foreground" : ""}>
                {d}
              </li>
            ))}
          </ul>
        )}
      </li>
      {info?.nationalPhoneNumber && (
        <li className="border-t border-line">
          <a href={`tel:${info.nationalPhoneNumber.replace(/\D/g, "")}`} className="flex items-center gap-3 py-3.5">
            <Phone className="size-5 shrink-0" strokeWidth={2} />
            <span className="flex-1">Telefone</span>
            <span className="text-muted">{info.nationalPhoneNumber}</span>
          </a>
        </li>
      )}
    </>
  );
}
