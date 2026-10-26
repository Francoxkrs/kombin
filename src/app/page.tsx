import { Discover, type Slate } from "@/components/Discover";
import { ReviewPrompt } from "@/components/ReviewPrompt";
import { Page } from "@/components/ui/Page";
import { AccountButton } from "@/components/ui/TopBar";
import { getCurrentUser } from "@/lib/auth";
import { getCatalog } from "@/lib/catalog";
import { rankPlaces } from "@/lib/match";
import { getOccasion, OCCASIONS } from "@/lib/occasions";
import { getSaved } from "@/lib/saved";
import { toScreen } from "@/lib/screen";
import { greeting } from "@/lib/time";

/** Quantas telas cada ocasião mostra antes da tela final ("Ainda na dúvida?"). */
const SCREENS = 8;

export default async function DiscoverPage({ searchParams }: PageProps<"/">) {
  const [{ places, signals }, user, sp] = await Promise.all([getCatalog(), getCurrentUser(), searchParams]);
  const saved = user ? (await getSaved(user.id)).want : [];
  const { suggested } = greeting();
  const asked = typeof sp.o === "string" && sp.o !== "tudo" && getOccasion(sp.o) ? sp.o : null;

  // A ocasião da hora vem primeiro nas abas.
  const slates: Slate[] = [...OCCASIONS]
    .sort((a, b) => (a.slug === suggested ? -1 : b.slug === suggested ? 1 : 0))
    .map((o) => {
      const ranked = rankPlaces(places, signals, o);
      return { slug: o.slug, count: ranked.length, screens: ranked.slice(0, SCREENS).map(toScreen) };
    });

  return (
    <Page>
      <Discover
        slates={slates}
        initial={asked ?? suggested}
        suggested={suggested}
        saved={saved}
        loggedIn={!!user}
        isAdmin={!!user?.isAdmin}
        account={<AccountButton />}
      />
      <ReviewPrompt />
    </Page>
  );
}
