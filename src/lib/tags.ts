/**
 * Etiquetas de um lugar. Vêm da importação do Google (atributos como "música ao vivo")
 * e podem ser ajustadas pelo admin ou pelo dono.
 */
export interface Tag {
  slug: string;
  label: string;
}

export const TAGS: Tag[] = [
  { slug: "musica-ao-vivo", label: "Música ao vivo" },
  { slug: "grupos", label: "Bom pra grupos" },
  { slug: "criancas", label: "Bom pra criança" },
  { slug: "area-externa", label: "Área externa" },
  { slug: "reserva", label: "Aceita reserva" },
  { slug: "drinks", label: "Drinks" },
  { slug: "chopp", label: "Chopp" },
  { slug: "vinhos", label: "Carta de vinhos" },
  { slug: "sobremesa", label: "Sobremesas" },
  { slug: "cafe", label: "Café especial" },
  { slug: "vegetariano", label: "Opção vegetariana" },
  { slug: "pet", label: "Aceita pet" },
  { slug: "estacionamento", label: "Estacionamento" },
  { slug: "acessivel", label: "Acessível" },
];

const BY_SLUG = new Map(TAGS.map((t) => [t.slug, t]));

export function getTag(slug: string): Tag | undefined {
  return BY_SLUG.get(slug);
}
