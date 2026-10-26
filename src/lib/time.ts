/** Hora em Campo Grande (UTC-4, sem horário de verão). */
function campoGrandeHour(now: number): { hour: number; weekday: number } {
  const d = new Date(now - 4 * 3_600_000);
  return { hour: d.getUTCHours(), weekday: d.getUTCDay() };
}

const DAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export function greeting(now = Date.now()): { hello: string; moment: string; suggested: string } {
  const { hour, weekday } = campoGrandeHour(now);
  const part = hour < 5 ? "noite" : hour < 12 ? "manhã" : hour < 18 ? "tarde" : "noite";
  const hello = part === "manhã" ? "Bom dia" : part === "tarde" ? "Boa tarde" : "Boa noite";
  // Sugestão da ocasião do momento: café de manhã, happy hour no fim da tarde de dia útil...
  const weekend = weekday === 0 || weekday === 6;
  const suggested =
    hour < 11 ? "cafe" : hour < 16 ? (weekend ? "familia" : "cafe") : hour < 20 && !weekend ? "happy-hour" : weekend ? "pagode" : "encontro";
  return { hello, moment: `${DAYS[weekday]} à ${part === "manhã" ? "manhã" : part}`, suggested };
}
