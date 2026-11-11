/** Tipos da página inicial, usados no servidor (src/lib/home.ts) e nos componentes client. */

/** Um lugar como a página inicial mostra: serializável para o client. */
export interface HomePlace {
  id: string;
  name: string;
  /** "Restaurante italiano, Jardim dos Estados. R$ 120 por pessoa." */
  about: string;
  /** Até 3 motivos curtos ("Sem couvert", "Dá pra conversar"). */
  badges: string[];
  compat: number;
  reviews: number;
  photos: string[];
  blurhash: string | null;
}

export interface HomeOccasion {
  slug: string;
  short: string;
  name: string;
  tagline: string;
  target: string;
  /** "Decidir com o mozão". */
  decideLabel: string;
  color: string;
  count: number;
  /** O que a ocasião pesa no índice, do maior para o menor (1 = o peso mais forte). */
  weights: { label: string; share: number }[];
  /** Os 3 que mais combinam, na ordem do índice. */
  top: HomePlace[];
}

/** O que o último passo do quiz mostra para cada combinação de respostas. */
export interface QuizPreview {
  count: number;
  /** O que mais combina, com os motivos (é a prova perto do botão). */
  best: HomePlace | null;
  /** Os 3 primeiros, para a votação em grupo. */
  ids: string[];
}

export interface HomeData {
  occasions: HomeOccasion[];
  /** Ocasião da hora em Campo Grande: é a que a história do match conta. */
  story: string;
  /** Chave `${ocasião}|${pessoas}|${orçamento}`, com "" para "tanto faz". */
  previews: Record<string, QuizPreview>;
  stats: { places: number; reviews: number; verified: number };
}

export const previewKey = (o: string, p: string, b: string) => `${o}|${p}|${b}`;
