/**
 * Nomes dos ícones usados por ocasiões e etiquetas. O desenho de cada um está em
 * src/components/ui/Glyph.tsx (lucide, traço fino). Aqui só os nomes, para o lib não depender de React.
 */
export const GLYPH_NAMES = [
  "wine",
  "music",
  "baby",
  "beer",
  "party",
  "coffee",
  "sparkles",
  "users",
  "trees",
  "calendar",
  "martini",
  "cake",
  "leaf",
  "paw",
  "parking",
  "accessible",
  "quiet",
] as const;

export type GlyphName = (typeof GLYPH_NAMES)[number];
