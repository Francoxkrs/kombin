import "server-only";
import type { Catalog } from "./catalog";
import type { MatchPrefs } from "./match";
import { rankPlaces } from "./match";
import { occasionColor } from "./occasion-colors";
import { BUDGET_OPTIONS, getOccasion, type Occasion, OCCASIONS, PARTY_OPTIONS, type Party } from "./occasions";
import { placePhotos, toScreen } from "./screen";
import type { SpendBand } from "./types";
import { type HomeData, type HomeOccasion, type HomePlace, previewKey, type QuizPreview } from "./home-shared";

export type { HomeData, HomeOccasion, HomePlace, QuizPreview };

/** Os pesos da ocasião em palavras: é o "algoritmo" que a história do hero mostra. */
function weightBars(o: Occasion): { label: string; share: number }[] {
  const w = o.weights;
  const list: { label: string; w: number }[] = [{ label: "Clima da ocasião", w: w.vibe }];
  if (w.noise) list.push({ label: w.noise.want === "quiet" ? "Dá pra conversar" : "Som e agito", w: w.noise.w });
  if (w.cover) list.push({ label: w.cover.want ? "Música ao vivo" : "Sem couvert", w: w.cover.w });
  list.push({ label: "Gasto que cabe", w: w.price }, { label: "Perto de você", w: w.distance });
  const top = list.sort((a, b) => b.w - a.w).slice(0, 4);
  const max = top[0].w;
  return top.map((x) => ({ label: x.label, share: Math.round((x.w / max) * 100) / 100 }));
}


/**
 * Monta tudo o que a página inicial precisa a partir do catálogo em cache: os 3 melhores de
 * cada ocasião e a prévia do quiz para cada combinação (6 × 4 × 4 = 96 rankings, em memória).
 */
export function buildHome(catalog: Catalog, ctx: MatchPrefs, suggested: string): HomeData {
  const toHome = (r: ReturnType<typeof rankPlaces>[number]): HomePlace => {
    const s = toScreen(r);
    return {
      id: s.id,
      name: s.name,
      about: s.about,
      badges: r.badges,
      compat: s.compat,
      reviews: r.reviews,
      photos: placePhotos(r.place).slice(0, 2),
      blurhash: s.blurhash,
    };
  };

  const occasions: HomeOccasion[] = OCCASIONS.map((o) => {
    const ranked = rankPlaces(catalog.places, catalog.signals, o, ctx);
    return {
      slug: o.slug,
      short: o.short,
      name: o.name,
      tagline: o.tagline,
      target: o.target,
      decideLabel: o.decideLabel,
      color: occasionColor(o.slug),
      count: ranked.length,
      weights: weightBars(o),
      top: ranked.slice(0, 3).map(toHome),
    };
  });

  const previews: Record<string, QuizPreview> = {};
  const parties = ["", ...PARTY_OPTIONS.map((p) => p.value)];
  const budgets = ["", ...BUDGET_OPTIONS.map((b) => b.value)];
  for (const o of OCCASIONS) {
    for (const p of parties) {
      for (const b of budgets) {
        const ranked = rankPlaces(catalog.places, catalog.signals, getOccasion(o.slug)!, {
          ...ctx,
          party: (p || undefined) as Party | undefined,
          budget: (b ? Number(b) : undefined) as SpendBand | undefined,
        });
        previews[previewKey(o.slug, p, b)] = {
          count: ranked.length,
          best: ranked[0] ? toHome(ranked[0]) : null,
          ids: ranked.slice(0, 3).map((r) => r.place.id),
        };
      }
    }
  }

  // A história conta a ocasião da hora; se ela ainda não tem casa, a que tem mais.
  const fallback = [...occasions].sort((a, b) => b.count - a.count)[0];
  const story = occasions.find((o) => o.slug === suggested && o.top.length >= 2)?.slug ?? fallback?.slug ?? suggested;

  let reviews = 0;
  let verified = 0;
  for (const s of catalog.signals.values()) {
    reviews += s.reviews;
    verified += s.verified ?? 0;
  }

  return { occasions, story, previews, stats: { places: catalog.places.length, reviews, verified } };
}
