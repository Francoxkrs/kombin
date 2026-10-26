import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Photo } from "@/components/ui/Photo";
import { pickFromParams } from "../../params";
import { CARBON, GREEN, leader, PAPER, perforation } from "../style";

const CONDENSED = { fontFamily: "var(--f-barlow-c)" } as const;

export default async function ComandaLugar({ searchParams }: PageProps<"/conceitos/comanda/lugar">) {
  const { occ, place } = await pickFromParams(searchParams);
  const compat = place.compat[occ.id];
  const items: [string, string][] = [
    ...place.reasons.map((r): [string, string] => [r, "sim"]),
    ["Gasto por pessoa", `R$\u00a0${place.price}`],
    ["Aberto hoje", "até 23h"],
  ];

  return (
    <div className="min-h-dvh pb-32" style={{ background: GREEN, color: PAPER, fontFamily: "var(--f-barlow)" }}>
      <header className="flex h-14 items-center px-2 pt-[env(safe-area-inset-top)]">
        <Link href={`/conceitos/comanda?o=${occ.id}`} className="flex h-11 items-center gap-2 px-2 text-[16px] font-medium">
          <ArrowLeft className="size-5" strokeWidth={2} /> Comanda
        </Link>
      </header>

      <div className="px-6 pt-2">
        <div className="-rotate-2 p-2" style={{ background: PAPER }}>
          <Photo src={place.photos[0]} fallbacks={place.photos.slice(1)} alt={place.name} className="aspect-[4/3] w-full" eager />
        </div>
      </div>

      <section className="mx-4 -mt-3 text-black" style={{ background: PAPER }}>
        <div className="h-3" style={perforation("top")} aria-hidden />
        <div className="px-5 pt-4 pb-6">
          <p className="text-[15px]">{place.kind}</p>
          <h1 className="mt-1 text-[56px] leading-[0.86] font-extrabold uppercase" style={CONDENSED}>
            {place.name}
          </h1>

          <ul className="mt-6 space-y-2.5 text-[17px]">
            {items.map(([k, v]) => (
              <li key={k} className="flex items-end gap-2">
                <span>{k}</span>
                <span className="mb-1.5 h-[7px] flex-1" style={leader} aria-hidden />
                <span className="font-semibold" style={{ color: CARBON }}>
                  {v}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-7 flex items-end justify-between gap-4 pt-1">
            <p className="text-[22px] leading-[0.95] font-bold uppercase" style={CONDENSED}>
              Total que combina
              <br />
              com {occ.label.toLowerCase()}
            </p>
            <p className="text-[84px] leading-[0.8] font-extrabold" style={{ ...CONDENSED, color: CARBON }}>
              {compat}%
            </p>
          </div>
        </div>
        <div className="h-3" style={perforation("bottom")} aria-hidden />
      </section>

      <p className="mx-4 mt-6 max-w-[34ch] text-[16px] leading-snug">
        Foi lá? Conta em três toques quanto gastou, se teve couvert e se dava pra conversar. Isso ajusta a comanda de todo mundo.
      </p>

      <div
        className="fixed bottom-0 left-1/2 z-40 grid w-full max-w-md -translate-x-1/2 grid-cols-2 gap-2 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
        style={{ background: GREEN }}
      >
        <a href="#" className="grid h-14 place-items-center text-[20px] font-bold uppercase text-black" style={{ ...CONDENSED, background: occ.ficha }}>
          Reservar
        </a>
        <a href="#" className="grid h-14 place-items-center text-[20px] font-bold uppercase text-black" style={{ ...CONDENSED, background: PAPER }}>
          Como chegar
        </a>
      </div>
    </div>
  );
}
