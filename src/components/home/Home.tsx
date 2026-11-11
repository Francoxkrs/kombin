import type { HomeData } from "@/lib/home-shared";
import { GroupDecide } from "./GroupDecide";
import { HomeFooter } from "./HomeFooter";
import { HomeNav } from "./HomeNav";
import { LiveBoard } from "./LiveBoard";
import { MatchStory } from "./MatchStory";
import { MomentQuiz } from "./MomentQuiz";
import { SmoothScroll } from "./SmoothScroll";
import { StickyCta } from "./StickyCta";

/**
 * Página inicial, de cima para baixo: a promessa e a história do match (hero preso),
 * o quiz de 3 toques, o melhor de hoje por ocasião e a votação em grupo.
 * `data-wide` libera a largura no desktop (o resto do app segue com largura de celular).
 */
export function Home({ data, loggedIn, account }: { data: HomeData; loggedIn: boolean; account: React.ReactNode }) {
  const story = data.occasions.find((o) => o.slug === data.story) ?? data.occasions[0];
  return (
    <SmoothScroll>
      <div data-wide className="relative">
        <HomeNav account={account} />
        <main>
          <MatchStory data={data} loggedIn={loggedIn} />
          <MomentQuiz data={data} loggedIn={loggedIn} />
          <LiveBoard occasions={data.occasions} />
          <GroupDecide occasion={story} />
        </main>
        <HomeFooter />
        <StickyCta places={data.stats.places} />
      </div>
    </SmoothScroll>
  );
}
