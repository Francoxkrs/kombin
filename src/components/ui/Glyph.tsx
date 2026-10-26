import {
  Accessibility,
  Baby,
  Beer,
  CakeSlice,
  CalendarCheck,
  Coffee,
  Leaf,
  type LucideIcon,
  Martini,
  MessagesSquare,
  Music,
  PartyPopper,
  PawPrint,
  SquareParking,
  Sparkles,
  Trees,
  UsersRound,
  Wine,
} from "lucide-react";
import type { GlyphName } from "@/lib/glyphs";

const ICONS: Record<GlyphName, LucideIcon> = {
  wine: Wine,
  music: Music,
  baby: Baby,
  beer: Beer,
  party: PartyPopper,
  coffee: Coffee,
  sparkles: Sparkles,
  users: UsersRound,
  trees: Trees,
  calendar: CalendarCheck,
  martini: Martini,
  cake: CakeSlice,
  leaf: Leaf,
  paw: PawPrint,
  parking: SquareParking,
  accessible: Accessibility,
  quiet: MessagesSquare,
};

/** Ícone de ocasião ou etiqueta, sempre em traço fino. */
export function Glyph({ name, className = "size-4", strokeWidth = 1.5 }: { name: GlyphName; className?: string; strokeWidth?: number }) {
  const Icon = ICONS[name];
  return <Icon className={className} strokeWidth={strokeWidth} aria-hidden />;
}
