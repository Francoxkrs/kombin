export type PlaceStatus = "pending" | "approved" | "rejected";

/** Faixa de gasto por pessoa: 1 = até R$ 40, 2 = R$ 40-80, 3 = R$ 80-150, 4 = R$ 150+ */
export type SpendBand = 1 | 2 | 3 | 4;

/** Barulho: 1 = dá pra conversar, 2 = médio, 3 = alto */
export type Noise = 1 | 2 | 3;

export interface Place {
  id: string;
  googlePlaceId: string | null;
  name: string;
  category: string | null;
  neighborhood: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  whatsapp: string | null;
  instagram: string | null;
  coverUrl: string | null;
  menuUrl: string | null;
  /** Tipos de comida (slugs de src/lib/cuisines.ts). */
  cuisines: string[];
  status: PlaceStatus;
  /** Estimativas iniciais (curadoria ou IA). Valem como uma "visita" de peso baixo. */
  seedSpend: SpendBand | null;
  seedNoise: Noise | null;
  seedCover: boolean | null;
  /** Nota de vibe por ocasião (0-10), vinda do vibe-check com IA de visão ou do admin. */
  vibe: Record<string, number>;
  aiSummary: string | null;
  /** Modelo que fez o vibe-check (null = só regras a partir dos dados do Google ou do admin). */
  aiModel: string | null;
  /** Etiquetas (slugs de src/lib/tags.ts): música ao vivo, bom pra grupos... */
  tags: string[];
  /** Destaque pago: aparece marcado no Descobrir, sem furar os filtros. */
  featured: boolean;
}

/** Agregado das micro-reviews de um lugar. */
export interface PlaceSignals {
  reviews: number;
  spendAvg: number | null;
  noiseAvg: number | null;
  coverRatio: number | null;
  /** Quantas das avaliações têm visita confirmada (check-in ou "Como chegar" antes). */
  verified?: number;
  /** Peso somado das avaliações: 1 cada, 2 com visita confirmada. Sem a migração 0004, fica vazio. */
  weight?: number;
}

export interface MicroReview {
  placeId: string;
  deviceId: string;
  occasion: string | null;
  spend: SpendBand;
  cover: boolean;
  noise: Noise;
  /** Visita confirmada: check-in no raio do lugar ou "Como chegar" algumas horas antes. */
  verified?: boolean;
}

export interface DecisionSession {
  code: string;
  occasion: string;
  placeIds: string[];
  createdAt: string;
}

export interface Vote {
  deviceId: string;
  placeId: string;
  voterName: string | null;
}

export type LeadKind = "whatsapp" | "directions";

export interface LeadCount {
  placeId: string;
  whatsapp: number;
  directions: number;
}
