import Link from "next/link";
import { connection } from "next/server";
import { CityHero } from "@/components/CityHero";
import { Page } from "@/components/ui/Page";
import { BTN_IPE, BTN_QUIET } from "@/components/ui/styles";

export const metadata = {
  title: "Para restaurantes · Kombin",
  description: "Página grátis com cardápio em foto e WhatsApp de reserva, e os números de quem chegou pelo Kombin.",
};

const POINTS = [
  {
    title: "Uma página que responde antes de perguntarem",
    body: "Foto de capa sua, cardápio fotografado, recado da casa e o botão de reservar no WhatsApp. De graça.",
  },
  {
    title: "Você vê quem chegou por aqui",
    body: "Quantas vezes apareceu no top 3 de cada ocasião, quantos chamaram no WhatsApp e quantos pediram rota.",
  },
  {
    title: "Nota que não se compra",
    body: "Gasto, couvert e barulho vêm de quem foi. O destaque pago aparece marcado e nunca fura os filtros do cliente.",
  },
];

/** Página pública para o dono de restaurante entender o Kombin antes de criar conta. Dá para mandar por WhatsApp. */
export default async function ForRestaurants() {
  // A foto do topo vem do banco a cada visita, como no /entrar.
  await connection();
  const contact = process.env.KOMBIN_CONTACT_WHATSAPP;
  return (
    <Page>
      <CityHero back="/">
        <h1 className="title text-[48px]">Para quem tem restaurante em Campo Grande</h1>
      </CityHero>
      <main className="flex-1 px-5 pt-6 pb-16">
        <p className="max-w-[34ch] text-[19px] leading-snug">
          O Kombin recomenda lugares pela ocasião: encontro, família, happy hour, aniversário. Quem abre sua página já está
          escolhendo onde ir hoje.
        </p>
        <ol className="mt-10 space-y-8">
          {POINTS.map((p, i) => (
            <li key={p.title} className="grid grid-cols-[2.5rem_1fr]">
              <span className="title text-[34px] text-ipe tabular-nums">{i + 1}</span>
              <div>
                <h2 className="title text-[26px] leading-[1]">{p.title}</h2>
                <p className="mt-2 text-[16px] leading-snug text-muted">{p.body}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-12 space-y-2">
          <Link href="/painel" className={`${BTN_IPE} w-full`}>
            Achar meu restaurante
          </Link>
          {contact && (
            <a
              href={`https://wa.me/${contact}?text=${encodeURIComponent("Tenho um restaurante e quero entrar no Kombin")}`}
              className={`${BTN_QUIET} w-full`}
            >
              Falar com o time
            </a>
          )}
        </div>
        <p className="mt-6 text-[14px] text-muted">
          Para editar a página você cria uma conta e pede acesso. A gente confirma pelo telefone em até 2 dias úteis.
        </p>
      </main>
    </Page>
  );
}
