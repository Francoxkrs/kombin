/**
 * Etiquetas de um lugar. Vêm da importação do Google (atributos como "música ao vivo")
 * e podem ser ajustadas pelo admin ou pelo dono.
 */
export interface Tag {
  slug: string;
  label: string;
  emoji: string;
}

export const TAGS: Tag[] = [
  { slug: "musica-ao-vivo", label: "Música ao vivo", emoji: "🎶" },
  { slug: "grupos", label: "Bom pra grupos", emoji: "👥" },
  { slug: "criancas", label: "Bom pra criança", emoji: "🧸" },
  { slug: "area-externa", label: "Área externa", emoji: "🌿" },
  { slug: "reserva", label: "Aceita reserva", emoji: "📅" },
  { slug: "drinks", label: "Drinks", emoji: "🍸" },
  { slug: "chopp", label: "Chopp e cerveja", emoji: "🍺" },
  { slug: "vinhos", label: "Carta de vinhos", emoji: "🍷" },
  { slug: "sobremesa", label: "Sobremesas", emoji: "🍰" },
  { slug: "cafe", label: "Café especial", emoji: "☕" },
  { slug: "vegetariano", label: "Opção vegetariana", emoji: "🥗" },
  { slug: "pet", label: "Aceita pet", emoji: "🐶" },
  { slug: "estacionamento", label: "Estacionamento", emoji: "🅿️" },
  { slug: "acessivel", label: "Acessível", emoji: "♿" },
];

const BY_SLUG = new Map(TAGS.map((t) => [t.slug, t]));

export function getTag(slug: string): Tag | undefined {
  return BY_SLUG.get(slug);
}
