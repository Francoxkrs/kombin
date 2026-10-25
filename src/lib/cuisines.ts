/** Tipos de comida. O foco do Kombin é restaurante: a pessoa pode querer a ocasião E a comida. */
export interface Cuisine {
  slug: string;
  label: string;
  /** Tipos do Google Places (primaryType/types) que caem nesta culinária. */
  googleTypes: string[];
}

export const CUISINES: Cuisine[] = [
  { slug: "pizza", label: "Pizza", googleTypes: ["pizza_restaurant"] },
  {
    slug: "japonesa",
    label: "Japonesa",
    googleTypes: ["japanese_restaurant", "sushi_restaurant", "ramen_restaurant"],
  },
  { slug: "hamburguer", label: "Hambúrguer", googleTypes: ["hamburger_restaurant"] },
  { slug: "italiana", label: "Italiana", googleTypes: ["italian_restaurant"] },
  {
    slug: "carnes",
    label: "Carnes e churrasco",
    googleTypes: ["steak_house", "barbecue_restaurant", "brazilian_restaurant"],
  },
  { slug: "regional", label: "Regional", googleTypes: [] },
  { slug: "frutos-do-mar", label: "Frutos do mar", googleTypes: ["seafood_restaurant"] },
  { slug: "mexicana", label: "Mexicana", googleTypes: ["mexican_restaurant"] },
  {
    slug: "arabe",
    label: "Árabe",
    googleTypes: ["middle_eastern_restaurant", "lebanese_restaurant", "turkish_restaurant"],
  },
  {
    slug: "asiatica",
    label: "Asiática",
    googleTypes: ["chinese_restaurant", "thai_restaurant", "asian_restaurant", "korean_restaurant"],
  },
  { slug: "vegetariana", label: "Vegetariana", googleTypes: ["vegetarian_restaurant", "vegan_restaurant"] },
  {
    slug: "petiscos",
    label: "Petiscos e bar",
    googleTypes: ["bar", "pub", "bar_and_grill", "wine_bar", "cocktail_bar"],
  },
  {
    slug: "cafe",
    label: "Café e doces",
    googleTypes: ["cafe", "coffee_shop", "bakery", "dessert_shop", "ice_cream_shop", "confectionery"],
  },
];

export function getCuisine(slug: string): Cuisine | undefined {
  return CUISINES.find((c) => c.slug === slug);
}

export function cuisineLabel(slug: string): string {
  return getCuisine(slug)?.label ?? slug;
}

/** Converte os tipos do Google em culinárias do Kombin. */
export function cuisinesFromGoogleTypes(types: string[]): string[] {
  return CUISINES.filter((c) => c.googleTypes.some((t) => types.includes(t))).map((c) => c.slug);
}
