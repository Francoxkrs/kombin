/**
 * Classes dos controles do Kombin, num lugar só para server e client components.
 * Botão é pílula; foto não tem canto arredondado; o amarelo do ipê é só da ação principal.
 */

const TONES = {
  /** Ação principal da tela (uma por tela). */
  ipe: "bg-ipe text-on-ipe",
  /** Ação secundária, ao lado da principal. */
  light: "bg-foreground text-background",
  /** Ação de apoio, sem disputar atenção. */
  quiet: "bg-surface text-foreground",
};

const SIZES = { lg: "h-14 px-7", md: "h-12 px-6", tight: "h-14 px-4" };

/** Botão em pílula. Altura e respiro vêm daqui, para não brigar com classes de fora. */
export function btn(tone: keyof typeof TONES, size: keyof typeof SIZES = "lg") {
  return `press flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-[16px] font-semibold disabled:opacity-50 ${SIZES[size]} ${TONES[tone]}`;
}

export const BTN_IPE = btn("ipe");
export const BTN_LIGHT = btn("light");
export const BTN_QUIET = btn("quiet");

/** Botão redondo claro, por cima de foto. */
export const ROUND_LIGHT = "press grid size-11 shrink-0 place-items-center rounded-full bg-foreground text-background";

/** Filtro de ligar e desligar. Dentro de um bloco de superfície, passe onSurface para o chip não sumir. */
export const chip = (active: boolean, onSurface = false) =>
  `press flex h-11 shrink-0 items-center gap-2 rounded-full px-4 text-[15px] transition-colors duration-200 ${
    active ? "bg-foreground font-semibold text-background" : `${onSurface ? "bg-soft" : "bg-surface"} text-foreground`
  }`;

const FIELD =
  "w-full rounded-2xl bg-surface px-4 text-[16px] text-foreground outline-none transition placeholder:text-muted focus:bg-soft focus:ring-2 focus:ring-ipe";

export const INPUT = `h-14 ${FIELD}`;
export const TEXTAREA = `py-3 ${FIELD}`;

/** Os mesmos campos dentro de um bloco de superfície (painéis), onde bg-surface sumiria. */
export const INPUT_ON_SURFACE = INPUT.replace("bg-surface", "bg-soft").replace("focus:bg-soft", "focus:bg-background");
export const TEXTAREA_ON_SURFACE = TEXTAREA.replace("bg-surface", "bg-soft").replace("focus:bg-soft", "focus:bg-background");
