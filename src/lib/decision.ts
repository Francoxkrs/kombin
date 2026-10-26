import "server-only";
import { rankPlaces } from "./match";
import { getOccasion } from "./occasions";
import { getCatalog } from "./catalog";
import { cuisineLabel } from "./cuisines";
import { photoSrc } from "./photos";
import { getRepo } from "./repo";

export interface DecisionOption {
  id: string;
  name: string;
  subtitle: string;
  photo: string | null;
  compat: number | null;
  reasons: string[];
  votes: number;
  voters: string[];
}

export interface DecisionState {
  code: string;
  occasion: { slug: string; name: string; color: string; decideWho: string };
  options: DecisionOption[];
  totalVotes: number;
  myVote: string | null;
}

/** Estado completo de uma votação, do ponto de vista de um aparelho. */
export async function getDecisionState(code: string, deviceId: string): Promise<DecisionState | null> {
  const repo = getRepo();
  const session = await repo.getSession(code);
  if (!session) return null;
  const occasion = getOccasion(session.occasion);
  if (!occasion) return null;

  const [catalog, votes] = await Promise.all([getCatalog(), repo.getVotes(code)]);
  const missing = session.placeIds.filter((id) => !catalog.byId.has(id));
  const extra = missing.length ? await repo.getPlaces(missing) : [];
  const places = session.placeIds
    .map((id) => catalog.byId.get(id) ?? extra.find((p) => p.id === id))
    .filter((p) => !!p);
  const signals = catalog.signals;
  const matches = new Map(rankPlaces(places, signals, occasion).map((m) => [m.place.id, m]));

  return {
    code,
    occasion: {
      slug: occasion.slug,
      name: occasion.name,
      color: occasion.color,
      decideWho: occasion.decideWho,
    },
    options: places.map((p) => {
      const pv = votes.filter((v) => v.placeId === p.id);
      const m = matches.get(p.id);
      return {
        id: p.id,
        name: p.name,
        subtitle: [p.cuisines.map(cuisineLabel)[0] ?? p.category, p.neighborhood].filter(Boolean).join(" · "),
        photo: photoSrc(p),
        compat: m?.compat ?? null,
        reasons: m?.reasons.slice(0, 2) ?? [],
        votes: pv.length,
        voters: pv.map((v) => v.voterName).filter((n): n is string => !!n),
      };
    }),
    totalVotes: votes.length,
    myVote: votes.find((v) => v.deviceId === deviceId)?.placeId ?? null,
  };
}
