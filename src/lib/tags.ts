import type { GlyphName } from "./glyphs";

/**
 * Etiquetas de um lugar. Vêm da importação do Google (atributos como "música ao vivo")
 * e podem ser ajustadas pelo admin ou pelo dono.
 */
export interface Tag {
  slug: string;
  label: string;
  icon: GlyphName;
}

export const TAGS: Tag[] = [
  { slug: "musica-ao-vivo", label: "Música ao vivo", icon: "music" },
  { slug: "grupos", label: "Bom pra grupos", icon: "users" },
  { slug: "criancas", label: "Bom pra criança", icon: "baby" },
  { slug: "area-externa", label: "Área externa", icon: "trees" },
  { slug: "reserva", label: "Aceita reserva", icon: "calendar" },
  { slug: "drinks", label: "Drinks", icon: "martini" },
  { slug: "chopp", label: "Chopp e cerveja", icon: "beer" },
  { slug: "vinhos", label: "Carta de vinhos", icon: "wine" },
  { slug: "sobremesa", label: "Sobremesas", icon: "cake" },
  { slug: "cafe", label: "Café especial", icon: "coffee" },
  { slug: "vegetariano", label: "Opção vegetariana", icon: "leaf" },
  { slug: "pet", label: "Aceita pet", icon: "paw" },
  { slug: "estacionamento", label: "Estacionamento", icon: "parking" },
  { slug: "acessivel", label: "Acessível", icon: "accessible" },
];

const BY_SLUG = new Map(TAGS.map((t) => [t.slug, t]));

export function getTag(slug: string): Tag | undefined {
  return BY_SLUG.get(slug);
}
