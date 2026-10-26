import { ArrowLeft, Heart } from "lucide-react";
import Link from "next/link";
import { Photo } from "@/components/ui/Photo";
import { pickFromParams } from "../../params";
import { IPE, LIGHT, NIGHT } from "../style";

export default async function CinemaLugar({ searchParams }: PageProps<"/conceitos/cinema/lugar">) {
  const { occ, place } = await pickFromParams(searchParams);
  const compat = place.compat[occ.id];
  const target = occ.id === "encontro" ? "noite a dois" : occ.label.toLowerCase();
  const [a, b, c] = place.reasons.map((r) => r.toLowerCase());

  return (
    <div className="min-h-dvh pb-32" style={{ background: NIGHT, color: LIGHT, fontFamily: "var(--f-brico)" }}>
      <div className="relative h-[60svh]">
        <Photo src={place.photos[0]} fallbacks={place.photos.slice(1)} alt={place.name} className="absolute inset-0" eager />
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/85 to-transparent" />
        <div className="absolute inset-x-0 top-0 flex justify-between px-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <Link
            href={`/conceitos/cinema?o=${occ.id}`}
            aria-label="Voltar"
            className="grid size-11 place-items-center rounded-full text-black"
            style={{ background: LIGHT }}
          >
            <ArrowLeft className="size-5" strokeWidth={2} />
          </Link>
          <button aria-label="Salvar" className="grid size-11 place-items-center rounded-full text-black" style={{ background: LIGHT }}>
            <Heart className="size-5" strokeWidth={2} />
          </button>
        </div>
        <div className="absolute inset-x-0 bottom-0 px-5 pb-6">
          <p className="text-[17px] font-medium">{place.kind}</p>
          <h1 className="mt-1 text-[64px] leading-[0.9] font-semibold tracking-[-0.035em]">{place.name}</h1>
        </div>
      </div>

      <section className="px-5 pt-7">
        <p className="text-[24px] leading-[1.25] font-medium tracking-[-0.01em]">
          Combina <span style={{ color: IPE }}>{compat}%</span> com {target}: {a}, {b} e {c}.
        </p>
      </section>

      <section className="mt-8 px-5">
        <h2 className="text-[28px] leading-none font-semibold tracking-[-0.03em]">Antes de ir</h2>
        <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-[17px]">
          <dt className="text-white/70">Gasto médio</dt>
          <dd>R$&nbsp;{place.price} por pessoa</dd>
          <dt className="text-white/70">Hoje</dt>
          <dd>Aberto até 23h</dd>
          <dt className="text-white/70">Quem foi diz</dt>
          <dd>Dá pra conversar, sem couvert</dd>
        </dl>
      </section>

      <section className="mt-8 grid grid-cols-2 gap-2 px-5">
        {place.photos.slice(1, 3).map((src) => (
          <Photo key={src} src={src} alt={`Mais uma foto de ${place.name}`} className="aspect-[4/5] w-full" />
        ))}
      </section>

      <div
        className="fixed bottom-0 left-1/2 z-40 flex w-full max-w-md -translate-x-1/2 gap-2 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
        style={{ background: NIGHT }}
      >
        <a href="#" className="grid h-14 flex-1 place-items-center rounded-full text-[16px] font-semibold text-black" style={{ background: IPE }}>
          Reservar no WhatsApp
        </a>
        <a href="#" className="grid h-14 place-items-center rounded-full px-6 text-[16px] font-semibold text-black" style={{ background: LIGHT }}>
          Como chegar
        </a>
      </div>
    </div>
  );
}
