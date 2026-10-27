/** Datas do admin no fuso de Campo Grande. */
const TZ = "America/Campo_Grande";

export const dateBR = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", { timeZone: TZ, day: "2-digit", month: "2-digit", year: "numeric" });

export const dateTimeBR = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", { timeZone: TZ, day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
