import { redirect } from "next/navigation";
import { Home } from "@/components/home/Home";
import { ReviewPrompt } from "@/components/ReviewPrompt";
import { Page } from "@/components/ui/Page";
import { AccountButton } from "@/components/ui/TopBar";
import { getCurrentUser } from "@/lib/auth";
import { getCatalog } from "@/lib/catalog";
import { getMatchContext } from "@/lib/context";
import { buildHome } from "@/lib/home";
import { greeting } from "@/lib/time";

export const metadata = {
  title: "Kombin · lugares que combinam com você",
  description:
    "Diga o momento e veja quanto cada casa de Campo Grande combina com ele: barulho, couvert e gasto de quem foi.",
};

/**
 * Página inicial: conta o que o Kombin faz rolando a tela (ocasião → casas lidas → match),
 * leva para o quiz de 3 passos e mostra o melhor de hoje. O feed de telas cheias foi para /descobrir.
 */
export default async function HomePage({ searchParams }: PageProps<"/">) {
  const sp = await searchParams;
  // Links antigos do Descobrir (/?o=pagode) continuam abrindo a ocasião certa.
  if (typeof sp.o === "string") redirect(`/descobrir?o=${encodeURIComponent(sp.o)}`);

  const [catalog, user] = await Promise.all([getCatalog(), getCurrentUser()]);
  const ctx = await getMatchContext(user?.id ?? null, catalog.byId);
  const data = buildHome(catalog, ctx, greeting().suggested);

  return (
    <Page>
      <Home data={data} loggedIn={!!user} account={<AccountButton />} />
      <ReviewPrompt />
    </Page>
  );
}
