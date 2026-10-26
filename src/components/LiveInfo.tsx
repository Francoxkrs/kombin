"use client";

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

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="contents">
      <dt className="text-muted">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

/** Linhas ao vivo do "Antes de ir": horário de hoje, nota e telefone do Google (com atribuição). */
export function LiveFacts({ placeId, enabled }: { placeId: string; enabled: boolean }) {
  const info = useLive(placeId, enabled);
  const [open, setOpen] = useState(false);
  if (!info) return null;
  const hours = info.regularOpeningHours;
  const today = (new Date().getDay() + 6) % 7; // Google começa na segunda

  return (
    <>
      {hours?.openNow != null && (
        <Fact label="Hoje">
          {hours.weekdayDescriptions ? (
            <button onClick={() => setOpen(!open)} aria-expanded={open} className="text-left">
              <span className={hours.openNow ? "font-semibold text-ipe" : ""}>{hours.openNow ? "Aberto agora" : "Fechado agora"}</span>
              <span className="text-muted underline underline-offset-4">{open ? ", esconder horários" : ", ver horários"}</span>
            </button>
          ) : (
            <span className={hours.openNow ? "font-semibold text-ipe" : ""}>{hours.openNow ? "Aberto agora" : "Fechado agora"}</span>
          )}
          {open && hours.weekdayDescriptions && (
            <ul className="mt-2 space-y-1 text-[15px] text-ink-2">
              {hours.weekdayDescriptions.map((d, i) => (
                <li key={d} className={i === today ? "font-semibold text-foreground" : ""}>
                  {d}
                </li>
              ))}
            </ul>
          )}
        </Fact>
      )}
      {info.rating != null && (
        <Fact label="No Google">
          <a href={info.googleMapsUri} target="_blank" rel="noopener" className="underline underline-offset-4">
            Nota {info.rating.toFixed(1).replace(".", ",")}, {info.userRatingCount?.toLocaleString("pt-BR")} avaliações
          </a>
        </Fact>
      )}
      {info.nationalPhoneNumber && (
        <Fact label="Telefone">
          <a href={`tel:${info.nationalPhoneNumber.replace(/\D/g, "")}`} className="underline underline-offset-4">
            {info.nationalPhoneNumber}
          </a>
        </Fact>
      )}
    </>
  );
}
