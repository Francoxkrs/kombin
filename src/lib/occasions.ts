import type { GlyphName } from "./glyphs";

const unsplash = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&q=70`;

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
  /** Nome curto para chips. */
  short: string;
  /** Ícone (src/components/ui/Glyph.tsx). */
  icon: GlyphName;
  /** Nome em duas partes: a segunda vai em serifa itálica ("A dois," + "pra conversar"). */
  display: [string, string];
  /** Frase da saudação quando esta é a ocasião do momento. */
  mood: string;
  /** Fotos de ambiente do card da ocasião (a primeira que carregar). */
  images: string[];
  /** Etiquetas que contam a favor nesta ocasião (src/lib/tags.ts). */
  wantTags: string[];
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
    short: "A dois",
    icon: "wine",
    display: ["A dois,", "pra conversar"],
    mood: "Clima perfeito para um jantar tranquilo",
    images: [unsplash("photo-1510812431401-41d2bd2722f3"), unsplash("photo-1559339352-11d035aa65de"), unsplash("photo-1414235077428-338989a2e8c0")],
    wantTags: ["vinhos", "reserva", "drinks"],
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
    short: "Pagode",
    icon: "music",
    display: ["Pagode e", "porção"],
    mood: "Noite boa pra samba e mesa cheia",
    images: [unsplash("photo-1514933651103-005eec06c04b"), unsplash("photo-1516450360452-9312f5e86fc7"), unsplash("photo-1429962714451-bb934ecdc4ec")],
    wantTags: ["musica-ao-vivo", "chopp", "grupos", "area-externa"],
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
    short: "Família",
    icon: "baby",
    display: ["Família com", "criança"],
    mood: "Dia bom pra almoçar com a família",
    images: [unsplash("photo-1543353071-873f17a7a088"), unsplash("photo-1555396273-367ea4eb4db5"), unsplash("photo-1504674900247-0877df9cc836")],
    wantTags: ["criancas", "grupos", "estacionamento"],
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
    short: "Happy hour",
    icon: "beer",
    display: ["Happy hour", "do trampo"],
    mood: "Hora de um chopp depois do expediente",
    images: [unsplash("photo-1528605248644-14dd04022da1"), unsplash("photo-1436076863939-06870fe779c2"), unsplash("photo-1470337458703-46ad1756a187")],
    wantTags: ["chopp", "drinks", "grupos", "area-externa"],
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
    short: "Aniversário",
    icon: "party",
    display: ["Aniversário", "da galera"],
    mood: "Bom dia pra juntar a galera",
    images: [unsplash("photo-1530103862676-de8c9debad1d"), unsplash("photo-1511795409834-ef04bbd61622"), unsplash("photo-1492684223066-81342ee5ff30")],
    wantTags: ["grupos", "reserva", "drinks"],
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
    short: "Café",
    icon: "coffee",
    display: ["Café pra", "estudar"],
    mood: "Hora de um café sem pressa",
    images: [unsplash("photo-1501339847302-ac426a4a7cbb"), unsplash("photo-1495474472287-4d71bcdd2085"), unsplash("photo-1554118811-1e0d58224f24")],
    wantTags: ["cafe", "sobremesa"],
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

/** "Qualquer ocasião": usado pela busca quando a pessoa não escolhe uma. Vale a melhor nota de vibe. */
export const ANY_OCCASION: Occasion = {
  slug: "tudo",
  name: "Para o seu momento",
  short: "Qualquer",
  icon: "sparkles",
  display: ["Para o seu", "momento"],
  mood: "Lugares que combinam com você",
  images: [unsplash("photo-1517248135467-4c7edcad34c4"), unsplash("photo-1552566626-52f8b828add9")],
  wantTags: [],
  tagline: "Os lugares de Campo Grande que mais combinam com o que você escolheu.",
  decideLabel: "Decidir com a galera",
  decideWho: "galera",
  color: "#0b0b0c",
  defaultParty: "3-5",
  weights: { vibe: 2.5, price: 2, distance: 1.5 },
};

export function getOccasion(slug: string): Occasion | undefined {
  if (slug === ANY_OCCASION.slug) return ANY_OCCASION;
  return OCCASIONS.find((o) => o.slug === slug);
}

/** Nota de vibe do lugar para a ocasião ("tudo" = a melhor nota que ele tem). */
export function vibeFor(vibe: Record<string, number>, occasion: Occasion): number | undefined {
  if (occasion.slug !== ANY_OCCASION.slug) return vibe[occasion.slug];
  const all = Object.values(vibe);
  return all.length ? Math.max(...all) : undefined;
}

export const PARTY_OPTIONS = [
  { value: "2", label: "A dois" },
  { value: "3-5", label: "3 a 5 pessoas" },
  { value: "6+", label: "Grupo 6+" },
] as const;
export type Party = (typeof PARTY_OPTIONS)[number]["value"];

export const SPEND_LABELS: Record<number, string> = {
  1: "até R$ 50",
  2: "R$ 50 a 100",
  3: "R$ 100 a 150",
  4: "R$ 150+",
};

/** Faixas que a busca oferece (a 3ª cobre "R$ 100+"). */
export const BUDGET_OPTIONS = [
  { value: "1", label: "Até R$ 50" },
  { value: "2", label: "R$ 50–100" },
  { value: "3", label: "R$ 100+" },
] as const;

/** Valor típico por pessoa de cada faixa, para o "~R$ 75/pessoa" dos cards. */
export const SPEND_TYPICAL: Record<number, string> = {
  1: "R$ 40",
  2: "R$ 75",
  3: "R$ 120",
  4: "R$ 190",
};

/** "R$ 60" a partir da média (que pode ser fracionada, vinda das reviews). */
export function spendTypical(spend: number | null | undefined): string | null {
  if (spend == null) return null;
  const lo = Math.floor(spend);
  const hi = Math.ceil(spend);
  const val = (k: number) => Number(SPEND_TYPICAL[k].replace(/\D/g, ""));
  if (lo === hi || !SPEND_TYPICAL[hi]) return SPEND_TYPICAL[Math.max(1, Math.min(4, Math.round(spend)))];
  const v = val(lo) + (val(hi) - val(lo)) * (spend - lo);
  return `R$ ${Math.round(v / 5) * 5}`;
}

export const NOISE_LABELS: Record<number, string> = {
  1: "dá pra conversar",
  2: "barulho médio",
  3: "animado e alto",
};
