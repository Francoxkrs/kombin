/** Cores e texturas da direção "Comanda". */
export const GREEN = "#0E3B2C";
export const PAPER = "#F2EEE3";
export const CARBON = "#2346B5";

/** Furos da picotagem: meias-luas da cor do fundo na borda do papel. */
export const perforation = (edge: "top" | "bottom") => ({
  background: `radial-gradient(circle at 9px ${edge === "top" ? "0" : "100%"}, ${GREEN} 6px, transparent 6.5px) 0 0 / 18px 100% repeat-x`,
});

/** Pontilhado de cardápio entre o nome e o valor. */
export const leader = {
  background: "radial-gradient(circle, currentColor 1.1px, transparent 1.5px) 0 50% / 7px 7px repeat-x",
};
