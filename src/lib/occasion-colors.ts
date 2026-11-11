/**
 * Cor de cada ocasião, do guia de marca (26/10/2026). É código, não enfeite: aparece só
 * onde a ocasião é o assunto (o pedido da história do match, as opções do quiz).
 * O amarelo do ipê continua sendo só da ação principal e do % de combina.
 */
export const OCCASION_COLOR: Record<string, string> = {
  encontro: "#F27EB4",
  pagode: "#B5452A",
  familia: "#236B45",
  "happy-hour": "#FF7A1A",
  aniversario: "#1F4FB8",
  cafe: "#EDE6DA",
};

export const occasionColor = (slug: string) => OCCASION_COLOR[slug] ?? "#F6F0E6";
