import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { K_STEM, K_TIP, WORD_OMBIN, WORDMARK_RATIO, WORDMARK_VIEWBOX } from "@/components/ui/brand-paths";

/** Imagens de compartilhamento (WhatsApp, Instagram): 1200x630, nas cores da marca. */
export const OG_SIZE = { width: 1200, height: 630 };

export const OG = {
  noite: "#2a1b12",
  leite: "#f6f0e6",
  muted: "#b9b0a6",
  line: "#4d392b",
  ipe: "#ffc81e",
  brasa: "#1a1008",
};

/** Bricolage estática (o gerador não lê fonte variável): Grito 700/75 e Conversa 500/100. */
export async function ogFonts() {
  const dir = join(process.cwd(), "assets/fonts");
  const [bold, medium] = await Promise.all([
    readFile(join(dir, "Bricolage-Bold.ttf")),
    readFile(join(dir, "Bricolage-Medium.ttf")),
  ]);
  return [
    { name: "Grito", data: bold, weight: 700 as const, style: "normal" as const },
    { name: "Conversa", data: medium, weight: 500 as const, style: "normal" as const },
  ];
}

export function OgWordmark({ height }: { height: number }) {
  return (
    <svg viewBox={WORDMARK_VIEWBOX} height={height} width={Math.round(height * WORDMARK_RATIO)}>
      <path d={K_STEM} fill={OG.leite} />
      <path d={K_TIP} fill={OG.ipe} />
      <path d={WORD_OMBIN} fill={OG.leite} />
    </svg>
  );
}
