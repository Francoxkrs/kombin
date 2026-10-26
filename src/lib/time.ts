import { getOccasion } from "./occasions";

/** Hora em Campo Grande (UTC-4, sem horário de verão). */
function campoGrandeHour(now: number): { hour: number; weekday: number } {
  const d = new Date(now - 4 * 3_600_000);
  return { hour: d.getUTCHours(), weekday: d.getUTCDay() };
}

const DAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export function greeting(now = Date.now()): { hello: string; moment: string; suggested: string; mood: string } {
  const { hour, weekday } = campoGrandeHour(now);
  // Madrugada ainda é a noite do dia anterior: 0h30 de segunda é "domingo à noite".
  const late = hour < 5;
  const day = late ? (weekday + 6) % 7 : weekday;
  const part = late || hour >= 18 ? "noite" : hour < 12 ? "manhã" : "tarde";
  const hello = part === "manhã" ? "Bom dia" : part === "tarde" ? "Boa tarde" : "Boa noite";
  // Sugestão da ocasião do momento: café de manhã, happy hour no fim da tarde de dia útil,
  // samba na noite de sexta e sábado, jantar a dois nas outras noites.
  const weekend = day === 0 || day === 6;
  const suggested =
    late || hour >= 20
      ? day === 5 || day === 6
        ? "pagode"
        : "encontro"
      : hour < 11
        ? "cafe"
        : hour < 16
          ? weekend
            ? "familia"
            : "cafe"
          : weekend
            ? "pagode"
            : "happy-hour";
  const mood = getOccasion(suggested)?.mood ?? "";
  return { hello, moment: `${DAYS[day]} à ${part}`, suggested, mood };
}
