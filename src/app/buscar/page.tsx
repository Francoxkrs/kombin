import { Page } from "@/components/ui/Page";
import { TopBar } from "@/components/ui/TopBar";
import { getCatalog } from "@/lib/catalog";
import { SearchForm } from "./SearchForm";

export const metadata = { title: "Filtros · Kombin" };

export default async function SearchPage({ searchParams }: PageProps<"/buscar">) {
  const [{ places, signals }, sp] = await Promise.all([getCatalog(), searchParams]);
  const one = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");

  const count = (list: string[]) => list.reduce((m, v) => m.set(v, (m.get(v) ?? 0) + 1), new Map<string, number>());
  const neighborhoods = [...count(places.map((p) => p.neighborhood).filter((n): n is string => !!n))]
    .sort((a, b) => b[1] - a[1])
    .map(([n]) => n);
  const back = one("o") ? `/o/${one("o")}` : "/";

  return (
    <Page>
      <TopBar back={{ href: back, label: one("o") ? "Lista" : "Descobrir" }} right={<span />} />
      <SearchForm
        places={places}
        signals={[...signals]}
        neighborhoods={neighborhoods}
        initial={{
          o: one("o") === "tudo" ? "" : one("o"),
          b: one("b"),
          p: one("p"),
          n: one("n"),
          t: one("t") ? one("t").split(",") : [],
          nc: one("nc") === "1",
          q: one("q") === "1",
        }}
      />
    </Page>
  );
}
