import { Page } from "@/components/ui/Page";

export const metadata = {
  title: "Privacidade · Kombin",
  description: "Quais dados o Kombin guarda, para quê e como apagar.",
};

const SECTIONS = [
  {
    title: "O que guardamos",
    body: "Se você entra com Google ou e-mail: seu nome, e-mail e foto de perfil. Sem conta: um código anônimo do aparelho, para contar votos e avaliações sem repetir. Também guardamos o que você faz no app: avaliações, votos, lugares salvos e cliques de WhatsApp e rota.",
  },
  {
    title: "Para que usamos",
    body: "Para recomendar lugares que combinam com você, mostrar ao restaurante quantas pessoas chegaram pelo Kombin (só números, nunca quem foi) e manter o app sem abuso. Não vendemos seus dados e não mostramos anúncios de terceiros.",
  },
  {
    title: "Com quem dividimos",
    body: "Usamos Supabase (banco de dados e login), Vercel (hospedagem) e Google (login e dados de lugares). Eles processam os dados só para o app funcionar.",
  },
  {
    title: "Como apagar",
    body: "Peça pelo e-mail de contato do Kombin e apagamos sua conta e tudo ligado a ela em até 15 dias, como prevê a LGPD.",
  },
];

/** Política de privacidade pública (exigida pelo Google para o login com Google). */
export default function Privacy() {
  const contact = process.env.KOMBIN_CONTACT_EMAIL;
  return (
    <Page>
      <main className="flex-1 px-5 pt-10 pb-16">
        <h1 className="title text-[44px]">Privacidade</h1>
        <p className="mt-3 text-[15px] text-muted">Atualizada em 26 de outubro de 2026.</p>
        {SECTIONS.map((s) => (
          <section key={s.title} className="mt-8">
            <h2 className="text-[22px] font-semibold">{s.title}</h2>
            <p className="mt-2 max-w-[60ch] text-[17px] leading-snug text-ink-2">{s.body}</p>
          </section>
        ))}
        {contact && (
          <p className="mt-8 text-[17px]">
            Contato: <a className="underline" href={`mailto:${contact}`}>{contact}</a>
          </p>
        )}
      </main>
    </Page>
  );
}
