/** Tipos de comida. O foco do Kombin é restaurante: a pessoa pode querer a ocasião E a comida. */
export interface Cuisine {
  slug: string;
  label: string;
  emoji: string;
  /** Tipos do Google Places (primaryType/types) que caem nesta culinária. */
  googleTypes: string[];
}

export const CUISINES: Cuisine[] = [
  { slug: "pizza", label: "Pizza", emoji: "🍕", googleTypes: ["pizza_restaurant"] },
  {
    slug: "japonesa",
    label: "Japonesa", emoji: "🍣",
    googleTypes: ["japanese_restaurant", "sushi_restaurant", "ramen_restaurant"],
  },
  { slug: "hamburguer", label: "Hambúrguer", emoji: "🍔", googleTypes: ["hamburger_restaurant"] },
  { slug: "italiana", label: "Italiana", emoji: "🍝", googleTypes: ["italian_restaurant"] },
  {
    slug: "carnes",
    label: "Carnes e churrasco", emoji: "🥩",
    googleTypes: ["steak_house", "barbecue_restaurant", "brazilian_restaurant"],
  },
  { slug: "regional", label: "Regional", emoji: "🐟", googleTypes: [] },
  { slug: "frutos-do-mar", label: "Frutos do mar", emoji: "🦐", googleTypes: ["seafood_restaurant"] },
  { slug: "mexicana", label: "Mexicana", emoji: "🌮", googleTypes: ["mexican_restaurant"] },
  {
    slug: "arabe",
    label: "Árabe", emoji: "🧆",
    googleTypes: ["middle_eastern_restaurant", "lebanese_restaurant", "turkish_restaurant"],
  },
  {
    slug: "asiatica",
    label: "Asiática", emoji: "🥢",
    googleTypes: ["chinese_restaurant", "thai_restaurant", "asian_restaurant", "korean_restaurant"],
  },
  { slug: "vegetariana", label: "Vegetariana", emoji: "🥗", googleTypes: ["vegetarian_restaurant", "vegan_restaurant"] },
  {
    slug: "petiscos",
    label: "Petiscos e bar", emoji: "🍻",
    googleTypes: ["bar", "pub", "bar_and_grill", "wine_bar", "cocktail_bar"],
  },
  {
    slug: "cafe",
    label: "Café e doces", emoji: "☕",
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
