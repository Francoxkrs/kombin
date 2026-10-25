/**
 * Ocasiões do Kombin e os pesos que cada uma dá aos critérios do índice.
 * Mudar um peso aqui muda o ranking na hora, sem migração de banco.
 */

export type NoiseWant = "quiet" | "lively";

export interface OccasionWeights {
  /** Nota de vibe da ocasião (vibe-check da IA ou do admin). */
  vibe: number;
  /** Quanto o barulho importa e em que direção. */
  noise?: { w: number; want: NoiseWant };
  /** Quanto o couvert importa e se a ocasião quer ou não. */
  cover?: { w: number; want: boolean };
  /** Peso do orçamento, quando a pessoa escolhe um. */
  price: number;
  /** Peso da distância, quando a pessoa libera a localização. */
  distance: number;
}

export interface Occasion {
  slug: string;
  name: string;
  tagline: string;
  /** Texto do botão de decisão compartilhada. */
  decideLabel: string;
  /** Quem recebe o link: aparece na mensagem do WhatsApp. */
  decideWho: string;
  color: string;
  defaultParty: "2" | "3-5" | "6+";
  weights: OccasionWeights;
}

export const OCCASIONS: Occasion[] = [
  {
    slug: "encontro",
    name: "A dois, pra conversar",
    tagline: "Luz baixa, sem couvert, mesa que dá pra ouvir o outro.",
    decideLabel: "Decidir com o mozão",
    decideWho: "mozão",
    color: "#7a1f3d",
    defaultParty: "2",
    weights: {
      vibe: 4,
      noise: { w: 3, want: "quiet" },
      cover: { w: 3, want: false },
      price: 1.5,
      distance: 1,
    },
  },
  {
    slug: "pagode",
    name: "Pagode e porção",
    tagline: "Música ao vivo, mesa grande e porção pra dividir.",
    decideLabel: "Decidir com a galera",
    decideWho: "galera",
    color: "#d9541e",
    defaultParty: "6+",
    weights: {
      vibe: 3,
      noise: { w: 3, want: "lively" },
      cover: { w: 1, want: true },
      price: 2,
      distance: 1,
    },
  },
  {
    slug: "familia",
    name: "Família com criança",
    tagline: "Espaço, cardápio fácil e ninguém olhando torto pro barulho.",
    decideLabel: "Decidir com a família",
    decideWho: "família",
    color: "#2f7d4f",
    defaultParty: "3-5",
    weights: {
      vibe: 3,
      noise: { w: 1.5, want: "quiet" },
      cover: { w: 1, want: false },
      price: 2,
      distance: 1.5,
    },
  },
  {
    slug: "happy-hour",
    name: "Happy hour do trampo",
    tagline: "Chopp gelado, petisco e saída fácil depois do expediente.",
    decideLabel: "Decidir com o time",
    decideWho: "time",
    color: "#b7790f",
    defaultParty: "3-5",
    weights: {
      vibe: 3,
      noise: { w: 1, want: "lively" },
      cover: { w: 1.5, want: false },
      price: 2,
      distance: 2,
    },
  },
  {
    slug: "aniversario",
    name: "Aniversário da galera",
    tagline: "Mesa pra muita gente, clima de festa e conta que não assusta.",
    decideLabel: "Decidir com a galera",
    decideWho: "galera",
    color: "#6d3fc0",
    defaultParty: "6+",
    weights: {
      vibe: 3,
      noise: { w: 2, want: "lively" },
      price: 2.5,
      distance: 1,
    },
  },
  {
    slug: "cafe",
    name: "Café pra estudar",
    tagline: "Tomada, wi-fi, silêncio e um café que vale a pena.",
    decideLabel: "Decidir com a dupla",
    decideWho: "dupla",
    color: "#6b4a32",
    defaultParty: "2",
    weights: {
      vibe: 3,
      noise: { w: 3, want: "quiet" },
      cover: { w: 1, want: false },
      price: 2,
      distance: 2,
    },
  },
];

export function getOccasion(slug: string): Occasion | undefined {
  return OCCASIONS.find((o) => o.slug === slug);
}

export const SPEND_LABELS: Record<number, string> = {
  1: "até R$ 40",
  2: "R$ 40 a 80",
  3: "R$ 80 a 150",
  4: "R$ 150+",
};

export const NOISE_LABELS: Record<number, string> = {
  1: "dá pra conversar",
  2: "barulho médio",
  3: "animado e alto",
};
