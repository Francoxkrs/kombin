import "server-only";
import { unstable_cache } from "next/cache";
import { cache } from "react";
import { getRepo } from "./repo";
import type { Place, PlaceSignals } from "./types";

/** Tag do cache dos lugares aprovados. Quem muda lugar ou avaliação chama updateTag/revalidateTag com ela. */
export const CATALOG_TAG = "catalog";

const loadCatalog = unstable_cache(
  async () => {
    const repo = getRepo();
    const [places, signals] = await Promise.all([repo.listPlaces("approved"), repo.getSignals()]);
    return { places, signals: [...signals] as [string, PlaceSignals][] };
  },
  ["catalog-v2"],
  { revalidate: 300, tags: [CATALOG_TAG] },
);

export interface Catalog {
  places: Place[];
  byId: Map<string, Place>;
  signals: Map<string, PlaceSignals>;
}

/**
 * Lugares aprovados + sinais da galera, guardados em cache por 5 minutos (ou até
 * alguém editar). É o que deixa as telas rápidas: quase nenhuma página vai ao banco.
 */
export const getCatalog = cache(async (): Promise<Catalog> => {
  const c = await loadCatalog();
  return { places: c.places, byId: new Map(c.places.map((p) => [p.id, p])), signals: new Map(c.signals) };
});

export const EMPTY_SIGNALS: PlaceSignals = { reviews: 0, spendAvg: null, noiseAvg: null, coverRatio: null };
