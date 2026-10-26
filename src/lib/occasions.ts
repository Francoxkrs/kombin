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
  /** Nome curto das abas e dos filtros. */
  short: string;
  /** Fim da frase "92% combina com ...". */
  target: string;
  /** Etiquetas que contam a favor nesta ocasião (src/lib/tags.ts). */
  wantTags: string[];
  tagline: string;
  /** Texto do botão de decisão compartilhada. */
  decideLabel: string;
  /** Quem recebe o link: aparece na mensagem do WhatsApp. */
  decideWho: string;
  defaultParty: "2" | "3-5" | "6+";
  weights: OccasionWeights;
}

export const OCCASIONS: Occasion[] = [
  {
    slug: "encontro",
    target: "noite a dois",
    short: "A dois",
    wantTags: ["vinhos", "reserva", "drinks"],
    name: "A dois, pra conversar",
    tagline: "Luz baixa, sem couvert, mesa que dá pra ouvir o outro.",
    decideLabel: "Decidir com o mozão",
    decideWho: "mozão",
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
    target: "pagode e porção",
    short: "Pagode",
    wantTags: ["musica-ao-vivo", "chopp", "grupos", "area-externa"],
    name: "Pagode e porção",
    tagline: "Música ao vivo, mesa grande e porção pra dividir.",
    decideLabel: "Decidir com a galera",
    decideWho: "galera",
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
    target: "almoço em família",
    short: "Família",
    wantTags: ["criancas", "grupos", "estacionamento"],
    name: "Família com criança",
    tagline: "Espaço, cardápio fácil e ninguém olhando torto pro barulho.",
    decideLabel: "Decidir com a família",
    decideWho: "família",
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
    target: "happy hour",
    short: "Happy hour",
    wantTags: ["chopp", "drinks", "grupos", "area-externa"],
    name: "Happy hour do trampo",
    tagline: "Chopp gelado, petisco e saída fácil depois do expediente.",
    decideLabel: "Decidir com o time",
    decideWho: "time",
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
    target: "aniversário da galera",
    short: "Aniversário",
    wantTags: ["grupos", "reserva", "drinks"],
    name: "Aniversário da galera",
    tagline: "Mesa pra muita gente, clima de festa e conta que não assusta.",
    decideLabel: "Decidir com a galera",
    decideWho: "galera",
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
    target: "café sem pressa",
    short: "Café",
    wantTags: ["cafe", "sobremesa"],
    name: "Café pra estudar",
    tagline: "Tomada, wi-fi, silêncio e um café que vale a pena.",
    decideLabel: "Decidir com a dupla",
    decideWho: "dupla",
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
  target: "o seu momento",
  name: "Para o seu momento",
  short: "Qualquer",
  wantTags: [],
  tagline: "Os lugares de Campo Grande que mais combinam com o que você escolheu.",
  decideLabel: "Decidir com a galera",
  decideWho: "galera",
  defaultParty: "3-5",
  weights: { vibe: 2.5, price: 2, distance: 1.5 },
};

const MASCULINE = new Set(["mozão", "time"]);

/** "o mozão", "a galera". */
export function theWho(who: string): string {
  return `${MASCULINE.has(who) ? "o" : "a"} ${who}`;
}

/** "pro mozão", "pra galera". */
export function forWho(who: string): string {
  return `${MASCULINE.has(who) ? "pro" : "pra"} ${who}`;
}

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
  { value: "2", label: "Duas" },
  { value: "3-5", label: "3 a 5" },
  { value: "6+", label: "6 ou mais" },
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
  { value: "1", label: "Até R$\u00a050" },
  { value: "2", label: "R$\u00a050 a 100" },
  { value: "3", label: "R$\u00a0100+" },
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
