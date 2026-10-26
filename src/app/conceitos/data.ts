/**
 * Conteúdo fixo dos protótipos de direção visual (/conceitos).
 * Fotos e números são ilustrativos: servem só para comparar os três visuais.
 */

const unsplash = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=900&q=75`;

export type OccasionId = "encontro" | "pagode" | "familia" | "happy" | "niver" | "cafe";

export interface ProtoOccasion {
  id: OccasionId;
  label: string;
  /** Título da tela, em duas linhas. */
  title: [string, string];
  line: string;
  /** Cor de Campo Grande que a ocasião ganha na direção "Cores". */
  color: string;
  colorName: string;
  /** Cor do texto sobre a cor da ocasião. */
  ink: string;
  /** Cor da ficha de festa na direção "Comanda". */
  ficha: string;
}

export const OCCASIONS: ProtoOccasion[] = [
  {
    id: "encontro",
    label: "A dois",
    title: ["Noite", "a dois"],
    line: "Jantar calmo, sem couvert, mesa que dá pra conversar.",
    color: "#5B1424",
    colorName: "vinho",
    ink: "#FFFFFF",
    ficha: "#F59AC0",
  },
  {
    id: "pagode",
    label: "Pagode",
    title: ["Pagode", "e porção"],
    line: "Samba ao vivo, mesa grande e chopp gelado.",
    color: "#FFC81E",
    colorName: "ipê-amarelo",
    ink: "#000000",
    ficha: "#F7D43B",
  },
  {
    id: "familia",
    label: "Família",
    title: ["Almoço em", "família"],
    line: "Espaço kids, cardápio infantil e estacionamento.",
    color: "#1747A6",
    colorName: "arara-azul",
    ink: "#FFFFFF",
    ficha: "#8EC5F0",
  },
  {
    id: "happy",
    label: "Happy hour",
    title: ["Happy", "hour"],
    line: "Chopp depois do expediente, sem precisar de reserva.",
    color: "#FF6A13",
    colorName: "pôr do sol",
    ink: "#000000",
    ficha: "#F7A35C",
  },
  {
    id: "niver",
    label: "Niver",
    title: ["Niver da", "galera"],
    line: "Mesa pra dez, reserva fácil e sobremesa boa.",
    color: "#F27EB4",
    colorName: "ipê-rosa",
    ink: "#000000",
    ficha: "#F2B8D3",
  },
  {
    id: "cafe",
    label: "Café",
    title: ["Café sem", "pressa"],
    line: "Wi-fi, tomada e um café que vale a ida.",
    color: "#1F6B45",
    colorName: "tereré",
    ink: "#FFFFFF",
    ficha: "#9BD48A",
  },
];

export interface ProtoPlace {
  id: string;
  name: string;
  /** Tipo e bairro, em uma frase curta. */
  kind: string;
  price: number;
  reasons: [string, string, string];
  photos: string[];
  compat: Record<OccasionId, number>;
}

export const PLACES: ProtoPlace[] = [
  {
    id: "decanter",
    name: "Enoteca Decanter",
    kind: "Bar de vinhos",
    price: 120,
    reasons: ["Sem couvert", "Dá pra conversar", "Vinho em taça"],
    photos: [unsplash("1510812431401-41d2bd2722f3"), unsplash("1559339352-11d035aa65de"), unsplash("1414235077428-338989a2e8c0")],
    compat: { encontro: 94, pagode: 41, familia: 52, happy: 70, niver: 66, cafe: 38 },
  },
  {
    id: "territorio",
    name: "Território do Vinho",
    kind: "Italiano no Centro",
    price: 110,
    reasons: ["Aceita reserva", "Massa da casa", "Carta de vinhos"],
    photos: [unsplash("1414235077428-338989a2e8c0"), unsplash("1517248135467-4c7edcad34c4"), unsplash("1555396273-367ea4eb4db5")],
    compat: { encontro: 91, pagode: 48, familia: 75, happy: 72, niver: 84, cafe: 40 },
  },
  {
    id: "turista",
    name: "Turista Sushi",
    kind: "Japonês",
    price: 90,
    reasons: ["Rodízio", "Aceita reserva", "Mesa pra grupo"],
    photos: [unsplash("1579584425555-c3ce17fd4351"), unsplash("1553621042-f6e147245754"), unsplash("1540189549336-e6e99c3679fe")],
    compat: { encontro: 84, pagode: 50, familia: 80, happy: 74, niver: 86, cafe: 35 },
  },
  {
    id: "vermelho",
    name: "Vermelho Grill",
    kind: "Churrascaria na Chácara Cachoeira",
    price: 150,
    reasons: ["Mesa pra grupo", "Estacionamento", "Carne na brasa"],
    photos: [unsplash("1544025162-d76694265947"), unsplash("1555939594-58d7cb561ad1"), unsplash("1600891964092-4316c288032e")],
    compat: { encontro: 78, pagode: 62, familia: 88, happy: 65, niver: 90, cafe: 30 },
  },
  {
    id: "lupland",
    name: "Lupland",
    kind: "Cervejaria no Jardim dos Estados",
    price: 80,
    reasons: ["Música ao vivo", "Chopp gelado", "Área externa"],
    photos: [unsplash("1514933651103-005eec06c04b"), unsplash("1436076863939-06870fe779c2"), unsplash("1470337458703-46ad1756a187")],
    compat: { encontro: 55, pagode: 93, familia: 60, happy: 95, niver: 89, cafe: 33 },
  },
  {
    id: "mostarda",
    name: "Café Mostarda",
    kind: "Café",
    price: 40,
    reasons: ["Wi-fi e tomada", "Doce da casa", "Abre cedo"],
    photos: [unsplash("1501339847302-ac426a4a7cbb"), unsplash("1495474472287-4d71bcdd2085"), unsplash("1509042239860-f550ce710b93")],
    compat: { encontro: 70, pagode: 20, familia: 66, happy: 40, niver: 45, cafe: 96 },
  },
];

export function occasion(id: OccasionId): ProtoOccasion {
  return OCCASIONS.find((o) => o.id === id) ?? OCCASIONS[0];
}

/** Lugares que combinam com a ocasião (50% ou mais), do que mais combina ao que menos. */
export function ranked(id: OccasionId): ProtoPlace[] {
  return PLACES.filter((p) => p.compat[id] >= 50).sort((a, b) => b.compat[id] - a.compat[id]);
}

export const MOMENT = "Domingo à noite";
