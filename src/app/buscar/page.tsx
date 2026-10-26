import { Page } from "@/components/ui/Page";
import { TopBar } from "@/components/ui/TopBar";
import { getCatalog } from "@/lib/catalog";
import { CUISINES } from "@/lib/cuisines";
import { TAGS } from "@/lib/tags";
import { SearchForm } from "./SearchForm";

export const metadata = { title: "Buscar · Kombin" };

export default async function SearchPage({ searchParams }: PageProps<"/buscar">) {
  const [{ places, signals }, sp] = await Promise.all([getCatalog(), searchParams]);
  const one = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");

  const count = (list: string[]) => list.reduce((m, v) => m.set(v, (m.get(v) ?? 0) + 1), new Map<string, number>());
  const neighborhoods = [...count(places.map((p) => p.neighborhood).filter((n): n is string => !!n))]
    .sort((a, b) => b[1] - a[1])
    .map(([n]) => n);
  const cuisineCount = count(places.flatMap((p) => p.cuisines));
  const tagCount = count(places.flatMap((p) => p.tags));

  return (
    <Page>
      <TopBar back={one("o") ? { href: `/o/${one("o")}`, label: "Resultados" } : undefined} />
      <SearchForm
        places={places}
        signals={[...signals]}
        neighborhoods={neighborhoods}
        cuisines={CUISINES.filter((c) => cuisineCount.has(c.slug)).map(({ slug, label, emoji }) => ({ slug, label, emoji }))}
        tags={TAGS.filter((t) => tagCount.has(t.slug))}
        initial={{
          o: one("o") === "tudo" ? "" : one("o"),
          c: one("c"),
          b: one("b"),
          p: one("p"),
          n: one("n"),
          t: one("t") ? one("t").split(",") : [],
          nc: one("nc") === "1",
        }}
      />
    </Page>
  );
}
