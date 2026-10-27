/**
 * "Fala do seu jeito": transforma uma frase ("jantar a dois tranquilo até 100 reais no Centro")
 * nos filtros do Kombin. São regras, não IA: roda no celular, de graça e sem mandar a frase a ninguém.
 */

import { CUISINES } from "./cuisines";
import { getOccasion, type Party } from "./occasions";
import { getTag } from "./tags";

export interface ParsedRequest {
  occasion?: string;
  party?: Party;
  /** Faixa do formulário: 1 até R$ 50, 2 de R$ 50 a 100, 3 acima de R$ 100. */
  budget?: "1" | "2" | "3";
  neighborhood?: string;
  cuisine?: string;
  tags: string[];
  noCover: boolean;
  quiet: boolean;
  near: boolean;
  /** O que foi entendido, em palavras, para mostrar de volta à pessoa. */
  understood: string[];
}

/** Sem acento, minúsculo, um espaço entre palavras. */
export const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9$+ ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/**
 * O termo aparece como palavra inteira; com * no fim, como começo de palavra
 * ("namorad*" pega namorado e namorada, mas "pet" não pega "petisco").
 */
const has = (text: string, terms: string[]) =>
  terms.some((t) =>
    t.endsWith("*") ? new RegExp(`(^| )${t.slice(0, -1)}`).test(text) : new RegExp(`(^| )${t}( |$)`).test(text),
  );

const OCCASION_TERMS: [string, string[]][] = [
  ["aniversario", ["aniversario*", "niver", "comemora*", "festa*"]],
  ["happy-hour", ["happy hour", "happy", "depois do trabalho", "depois do expediente", "trampo", "colegas", "firma"]],
  ["pagode", ["pagode", "samba", "boteco", "buteco"]],
  ["familia", ["familia", "meus pais", "com os pais", "filho*", "filha*", "crianca*", "kids"]],
  ["cafe", ["estudar", "notebook", "cafeteria", "cafe da tarde", "um cafe", "tomar cafe"]],
  ["encontro", ["a dois", "date", "namorad*", "mozao", "mozinho", "casal", "romantic*", "encontro", "crush", "esposa", "marido"]],
];

const TAG_TERMS: [string, string[]][] = [
  ["musica-ao-vivo", ["musica ao vivo", "som ao vivo", "show", "shows", "banda"]],
  ["grupos", ["grupo*", "galera", "turma", "mesa grande"]],
  ["criancas", ["crianca*", "kids", "filho*", "filha*", "parquinho", "brinquedoteca"]],
  ["area-externa", ["area externa", "ao ar livre", "varanda", "rooftop", "terraco"]],
  ["coberto", ["ar condicionado", "climatizado", "coberto", "fechado"]],
  ["reserva", ["reserva*"]],
  ["drinks", ["drink*", "coquetel*", "caipirinha*", "gin"]],
  ["chopp", ["chopp", "chope", "chopinho"]],
  ["vinhos", ["vinho*"]],
  ["sobremesa", ["sobremesa*", "doce", "doces"]],
  ["cafe", ["cafe especial"]],
  ["vegetariano", ["vegetarian*", "vegan*", "sem carne"]],
  ["pet", ["pet", "pets", "cachorro*", "doguinho"]],
  ["estacionamento", ["estacionamento", "estacionar", "onde parar o carro"]],
  ["acessivel", ["acessivel", "acessibilidade", "cadeirante", "cadeira de rodas"]],
];

const CUISINE_TERMS: [string, string[]][] = [
  ["pizza", ["pizza*"]],
  ["japonesa", ["japon*", "sushi*", "temaki*", "sashimi"]],
  ["hamburguer", ["hamburguer*", "burger*", "burguer*", "lanche*"]],
  ["italiana", ["italian*", "massa", "massas", "macarrao", "lasanha"]],
  ["carnes", ["churrasc*", "carne", "carnes", "picanha", "steak", "parrilla", "costela"]],
  ["regional", ["regional", "pantaneir*", "soba", "sopa paraguaia", "chipa"]],
  ["frutos-do-mar", ["frutos do mar", "peixe*", "camarao"]],
  ["mexicana", ["mexican*", "taco", "tacos", "burrito*"]],
  ["arabe", ["arabe", "esfiha*", "esfirra*", "kibe", "shawarma"]],
  ["asiatica", ["asiatic*", "chines*", "tailandes*", "corean*", "yakisoba"]],
  ["petiscos", ["petisco*", "porcao", "porcoes"]],
];

/** "até 80", "até R$ 80", "80 reais", "R$ 80" → 80. */
function money(text: string): number | undefined {
  const m =
    text.match(/(?:ate|no maximo|max) (?:r\$ ?)?(\d{2,4})/) ??
    text.match(/(?:r\$ ?)(\d{2,4})/) ??
    text.match(/(\d{2,4}) ?(?:reais|conto|pila|por pessoa)/);
  return m ? Number(m[1]) : undefined;
}

function partyFrom(text: string): Party | undefined {
  const m = text.match(/(\d{1,2}) (?:pessoas|amigos|amigas|adultos)/);
  if (m) {
    const n = Number(m[1]);
    return n <= 2 ? "2" : n <= 5 ? "3-5" : "6+";
  }
  const words: [string, Party][] = [
    ["duas pessoas", "2"],
    ["tres pessoas", "3-5"],
    ["quatro pessoas", "3-5"],
    ["cinco pessoas", "3-5"],
  ];
  for (const [w, p] of words) if (text.includes(w)) return p;
  if (has(text, ["a dois", "casal", "namorad*", "mozao", "date"])) return "2";
  if (has(text, ["galera", "turma", "mesa grande"])) return "6+";
  return undefined;
}

export function parseRequest(raw: string, neighborhoods: string[] = []): ParsedRequest {
  const text = normalize(raw);
  const out: ParsedRequest = { tags: [], noCover: false, quiet: false, near: false, understood: [] };
  if (!text) return out;

  const occ = OCCASION_TERMS.find(([, terms]) => has(text, terms));
  if (occ) {
    out.occasion = occ[0];
    out.understood.push(getOccasion(occ[0])?.short ?? occ[0]);
  }

  out.party = partyFrom(text);
  if (out.party) out.understood.push(out.party === "2" ? "Duas pessoas" : out.party === "3-5" ? "3 a 5 pessoas" : "6 ou mais");

  const value = money(text);
  if (value != null) out.budget = value <= 50 ? "1" : value <= 100 ? "2" : "3";
  else if (has(text, ["barat*", "economic*", "em conta", "sem gastar muito"])) out.budget = "1";
  else if (has(text, ["chique", "sofisticad*", "caro", "requintad*"])) out.budget = "3";
  if (out.budget) out.understood.push({ "1": "Até R$ 50", "2": "R$ 50 a 100", "3": "R$ 100+" }[out.budget]);

  if (has(text, ["sem couvert", "sem cover", "nao cobra couvert", "nao cobre couvert"])) {
    out.noCover = true;
    out.understood.push("Sem couvert");
  }
  if (has(text, ["tranquil*", "calm*", "silencios*", "sossegad*", "conversar", "baixinho", "sem barulho"])) {
    out.quiet = true;
    out.understood.push("Dá pra conversar");
  }
  if (has(text, ["perto", "aqui do lado", "proximo de mim", "proximo daqui"])) {
    out.near = true;
    out.understood.push("Perto de mim");
  }

  const cuisine = CUISINE_TERMS.find(([, terms]) => has(text, terms));
  if (cuisine && CUISINES.some((c) => c.slug === cuisine[0])) {
    out.cuisine = cuisine[0];
    out.understood.push(CUISINES.find((c) => c.slug === cuisine[0])!.label);
  }

  for (const [slug, terms] of TAG_TERMS) {
    // "galera" já virou 6+ pessoas, e família/criança já viram ocasião: não precisa repetir como exigência.
    if (slug === "grupos" && out.party === "6+") continue;
    if (has(text, terms) && getTag(slug)) {
      out.tags.push(slug);
      out.understood.push(getTag(slug)!.label);
    }
  }

  const n = neighborhoods.find((name) => {
    const k = normalize(name);
    return k.length > 2 && new RegExp(`(^| )${k}( |$)`).test(text);
  });
  if (n) {
    out.neighborhood = n;
    out.understood.push(n);
  }

  return out;
}
