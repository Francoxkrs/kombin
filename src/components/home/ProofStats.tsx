import type { HomeData } from "@/lib/home-shared";

const fmt = (n: number) => n.toLocaleString("pt-BR");

/**
 * Prova ao lado do botão, onde a pessoa hesita. Só números reais do banco: casas no ar,
 * avaliações e visitas confirmadas. O que ainda é zero não aparece (zero não convence ninguém).
 */
export function ProofStats({ stats, className = "" }: { stats: HomeData["stats"]; className?: string }) {
  const items = [
    stats.places > 0 && { n: fmt(stats.places), label: stats.places === 1 ? "casa avaliada" : "casas avaliadas" },
    stats.reviews > 0 && { n: fmt(stats.reviews), label: stats.reviews === 1 ? "avaliação de quem foi" : "avaliações de quem foi" },
    stats.verified > 0 && { n: fmt(stats.verified), label: stats.verified === 1 ? "visita confirmada" : "visitas confirmadas" },
    { n: "6", label: "ocasiões" },
  ].filter((x): x is { n: string; label: string } => !!x).slice(0, 3);

  return (
    <dl className={`flex gap-7 ${className}`}>
      {items.map((s) => (
        <div key={s.label} className="flex min-w-0 flex-col-reverse justify-end">
          <dt className="mt-1.5 max-w-[12ch] text-[13px] leading-snug text-muted">{s.label}</dt>
          <dd className="text-[26px] font-semibold leading-none tracking-tight tabular-nums">{s.n}</dd>
        </div>
      ))}
    </dl>
  );
}
