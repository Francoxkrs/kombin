import Link from "next/link";
import { redirect } from "next/navigation";
import { BarChart } from "@/components/ui/BarChart";
import { Panel, Stat } from "@/components/workspace/Shell";
import { requireAdmin } from "@/lib/auth";
import { change, countByDay, splitPeriods, topCounts, withinDays } from "@/lib/dashboard";
import { getOccasion } from "@/lib/occasions";
import { googleDailyLimit } from "@/lib/rate-limit";
import { getRepo } from "@/lib/repo";

/** Endereços antigos (/admin?s=...) de antes das telas separadas. */
const LEGACY: Record<string, string> = {
  importar: "/admin/importar",
  new: "/admin/importar#novo",
  claims: "/admin/donos",
  pending: "/admin/lugares?s=pending",
  approved: "/admin/lugares?s=approved",
  rejected: "/admin/lugares?s=rejected",
};

const DAYS = 30;

export default async function AdminOverview({ searchParams }: PageProps<"/admin">) {
  await requireAdmin();
  const s = (await searchParams).s;
  if (typeof s === "string" && LEGACY[s]) redirect(LEGACY[s]);

  const repo = getRepo();
  const [c, searches, leads, reviews, signups, google] = await Promise.all([
    repo.adminCounts(),
    repo.eventTimes("search_log", DAYS * 2),
    repo.leadTimes(DAYS * 2),
    repo.eventTimes("micro_reviews", DAYS * 2),
    repo.eventTimes("profiles", DAYS * 2),
    repo.googleUsageToday(),
  ]);
  const limit = googleDailyLimit().max;
  const searchTimes = searches.map((r) => r.created_at);

  const kpis = [
    { label: "buscas", times: searchTimes },
    { label: "cliques em WhatsApp", times: leads.filter((l) => l.kind === "whatsapp").map((l) => l.created_at) },
    { label: "pedidos de rota", times: leads.filter((l) => l.kind === "directions").map((l) => l.created_at) },
    { label: "avaliações novas", times: reviews.map((r) => r.created_at) },
    { label: "contas novas", times: signups.map((r) => r.created_at) },
  ].map((k) => {
    const p = splitPeriods(k.times, DAYS);
    return { label: k.label, n: p.current, delta: change(p.current, p.previous) };
  });

  const perDay = countByDay(searchTimes, DAYS);
  const occasions = topCounts(searches.filter((r) => withinDays(r.created_at, DAYS)).map((r) => r.occasion ?? "?"));

  const queue = [
    { n: c.pending, label: "lugares para revisar", href: "/admin/lugares?s=pending" },
    { n: c.openClaims, label: "pedidos de dono", href: "/admin/donos" },
    { n: c.noCover, label: "aprovados sem foto de capa", href: "/admin/lugares?s=nocover" },
  ].filter((q) => q.n > 0);

  const share = Math.min(1, google / limit);

  return (
    <div className="space-y-6">
      <dl className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {kpis.map((k) => (
          <Stat key={k.label} n={k.n} label={`${k.label} em ${DAYS} dias`} delta={k.delta} />
        ))}
        <Stat n={c.approved} label={`lugares no ar, ${c.users} contas e ${c.owners} donos`} />
      </dl>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Panel title="Buscas por dia" hint={`Últimos ${DAYS} dias, no fuso de Campo Grande.`}>
          {searchTimes.length === 0 ? (
            <p className="text-[15px] text-muted">
              Nenhuma busca registrada. Se o app já está no ar, confira se a migração 0006 rodou.
            </p>
          ) : (
            <BarChart
              days={perDay.map((d) => d.day)}
              series={[{ label: "Buscas", color: "var(--ipe)", values: perDay.map((d) => d.count) }]}
              label={`Buscas por dia nos últimos ${DAYS} dias`}
              width={640}
            />
          )}
        </Panel>
        <Panel title="Ocasiões mais buscadas">
          {occasions.length === 0 ? (
            <p className="text-[15px] text-muted">Sem buscas no período.</p>
          ) : (
            <ul className="space-y-4">
              {occasions.map((o) => (
                <li key={o.key} className="text-[16px]">
                  <div className="flex justify-between">
                    <span>{getOccasion(o.key)?.name ?? o.key}</span>
                    <b className="tabular-nums">{o.count}</b>
                  </div>
                  <div className="mt-1.5 h-2 rounded-full bg-soft">
                    <div className="h-full rounded-full bg-ipe" style={{ width: `${(o.count / occasions[0].count) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Precisa de você">
          {queue.length === 0 ? (
            <p className="text-[15px] text-muted">Nada pendente. Tudo revisado.</p>
          ) : (
            <ul className="divide-y divide-line">
              {queue.map((q) => (
                <li key={q.label}>
                  <Link href={q.href} className="group flex h-14 items-center justify-between gap-3 text-[16px]">
                    <span>
                      <b className="tabular-nums">{q.n}</b> {q.label}
                    </span>
                    <span className="text-[15px] text-muted group-hover:text-foreground">Abrir</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title="Cota do Google hoje"
          hint="Fotos e horários pedidos ao Google pelas telas públicas. No teto, o app para de chamar até as 20h de Campo Grande (meia-noite UTC) e mostra o que já tem."
        >
          <p className="text-[16px]">
            <b className="tabular-nums">{google}</b> de {limit} chamadas
          </p>
          <div
            className="mt-2 h-2 rounded-full bg-soft"
            role="meter"
            aria-valuemin={0}
            aria-valuemax={limit}
            aria-valuenow={google}
            aria-label="Uso da cota do Google hoje"
          >
            <div className={`h-full rounded-full ${share >= 0.8 ? "bg-danger" : "bg-ipe"}`} style={{ width: `${share * 100}%` }} />
          </div>
          {share >= 0.8 && (
            <p className="mt-2 text-[14px] text-danger">Perto do teto. Suba GOOGLE_DAILY_LIMIT na Vercel se o gasto couber.</p>
          )}
        </Panel>
      </div>
    </div>
  );
}
