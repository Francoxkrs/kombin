import { ArrowLeft, Heart } from "lucide-react";
import Link from "next/link";
import { Photo } from "@/components/ui/Photo";
import { pickFromParams } from "../../params";

const NARROW = { fontVariationSettings: '"wdth" 62' } as const;

export default async function CoresLugar({ searchParams }: PageProps<"/conceitos/cores/lugar">) {
  const { occ, place } = await pickFromParams(searchParams);
  const compat = place.compat[occ.id];
  const facts = [
    ["Gasto médio", `R$\u00a0${place.price} por pessoa`],
    ["Couvert", place.reasons.includes("Música ao vivo") ? "Cobra nos dias de show" : "Não cobra"],
    ["Som", place.reasons.includes("Música ao vivo") ? "Música ao vivo" : "Dá pra conversar"],
    ["Hoje", "Aberto até 23h"],
  ];

  return (
    <div className="min-h-dvh bg-white pb-32 text-black" style={{ fontFamily: "var(--f-archivo)" }}>
      <div className="relative">
        <Photo src={place.photos[0]} fallbacks={place.photos.slice(1)} alt={place.name} className="aspect-[4/3] w-full" eager />
        <Link
          href={`/conceitos/cores?o=${occ.id}`}
          aria-label="Voltar"
          className="absolute top-[max(0.75rem,env(safe-area-inset-top))] left-3 grid size-11 place-items-center bg-white"
        >
          <ArrowLeft className="size-5" strokeWidth={2} />
        </Link>
        <button
          aria-label="Salvar"
          className="absolute top-[max(0.75rem,env(safe-area-inset-top))] right-3 grid size-11 place-items-center bg-white"
        >
          <Heart className="size-5" strokeWidth={2} />
        </button>
      </div>

      <section className="px-4 pt-5 pb-7" style={{ background: occ.color, color: occ.ink }}>
        <p className="text-[15px] font-medium">{place.kind}</p>
        <h1 className="mt-2 text-[58px] leading-[0.86] font-extrabold uppercase" style={NARROW}>
          {place.name}
        </h1>
        <div className="mt-6 flex items-end gap-3">
          <p className="text-[124px] leading-[0.76] font-black" style={NARROW}>
            {compat}
          </p>
          <p className="pb-1 text-[18px] leading-tight">
            % combina com
            <br />
            {occ.label.toLowerCase() === "a dois" ? "noite a dois" : occ.label.toLowerCase()}
          </p>
        </div>
      </section>

      <section className="px-4 pt-8">
        <h2 className="text-[30px] leading-none font-extrabold uppercase" style={NARROW}>
          Por que combina
        </h2>
        <ul className="mt-4 space-y-3 text-[20px] leading-snug">
          {[...place.reasons, `Cabe em R$\u00a0${place.price} por pessoa`].map((r) => (
            <li key={r} className="flex items-baseline gap-3">
              <span aria-hidden className="size-3 shrink-0 translate-y-[-1px]" style={{ background: occ.color }} />
              {r}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10 bg-[#F1F1EF] px-4 py-6">
        <h2 className="text-[30px] leading-none font-extrabold uppercase" style={NARROW}>
          Antes de ir
        </h2>
        <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-[16px]">
          {facts.map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-[#555]">{k}</dt>
              <dd className="font-semibold">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="px-4 pt-8">
        <h2 className="text-[30px] leading-none font-extrabold uppercase" style={NARROW}>
          Na dúvida?
        </h2>
        <p className="mt-3 max-w-[32ch] text-[17px] leading-snug">
          Mande as três opções que mais combinam e deixe a outra pessoa votar pelo celular.
        </p>
        <a href="#" className="mt-4 grid h-14 place-items-center bg-black text-[16px] font-semibold text-white">
          Mandar pra votar
        </a>
      </section>

      <div className="fixed bottom-0 left-1/2 z-40 grid w-full max-w-md -translate-x-1/2 grid-cols-2 pb-[env(safe-area-inset-bottom)]" style={{ background: occ.color }}>
        <a href="#" className="grid h-16 place-items-center text-[16px] font-semibold" style={{ color: occ.ink }}>
          Reservar no WhatsApp
        </a>
        <a href="#" className="grid h-16 place-items-center bg-black text-[16px] font-semibold text-white">
          Como chegar
        </a>
      </div>
    </div>
  );
}
