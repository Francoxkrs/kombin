import Link from "next/link";
import { redirect } from "next/navigation";
import { BarChart } from "@/components/ui/BarChart";
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
    <div className="space-y-10">
      <section>
        <h2 className="title text-[28px]">Últimos {DAYS} dias</h2>
        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-5">
          {kpis.map((k) => (
            <div key={k.label} className="flex flex-col-reverse">
              <dt className="mt-1 text-[15px] leading-snug text-muted">
                {k.label}
                {k.delta != null && (
                  <span className="block text-[13px] text-ink-2">
                    {k.delta > 0 ? "▲" : k.delta < 0 ? "▼" : "="} {Math.abs(k.delta)}% vs. 30 dias antes
                  </span>
                )}
              </dt>
              <dd className="title text-[44px] tabular-nums">{k.n}</dd>
            </div>
          ))}
          <div className="flex flex-col-reverse">
            <dt className="mt-1 text-[15px] leading-snug text-muted">
              lugares no ar
              <span className="block text-[13px] text-ink-2">{c.users} contas, {c.owners} donos</span>
            </dt>
            <dd className="title text-[44px] tabular-nums">{c.approved}</dd>
          </div>
        </dl>
      </section>

      <section>
        <h2 className="title text-[28px]">Buscas por dia</h2>
        {searchTimes.length === 0 ? (
          <p className="mt-2 text-[15px] text-muted">
            Nenhuma busca registrada. Se o app já está no ar, confira se a migração 0006 rodou.
          </p>
        ) : (
          <div className="mt-4">
            <BarChart
              days={perDay.map((d) => d.day)}
              series={[{ label: "Buscas", color: "var(--ipe)", values: perDay.map((d) => d.count) }]}
              label={`Buscas por dia nos últimos ${DAYS} dias`}
            />
          </div>
        )}
        {occasions.length > 0 && (
          <ul className="mt-5 space-y-3">
            {occasions.map((o) => (
              <li key={o.key} className="text-[16px]">
                <div className="flex justify-between">
                  <span>{getOccasion(o.key)?.name ?? o.key}</span>
                  <b className="tabular-nums">{o.count}</b>
                </div>
                <div className="mt-1.5 h-2 rounded-full bg-surface">
                  <div
                    className="h-full rounded-full bg-ipe"
                    style={{ width: `${(o.count / occasions[0].count) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="title text-[28px]">Precisa de você</h2>
        {queue.length === 0 ? (
          <p className="mt-2 text-[15px] text-muted">Nada pendente. Tudo revisado.</p>
        ) : (
          <ul className="mt-3">
            {queue.map((q) => (
              <li key={q.label}>
                <Link href={q.href} className="flex h-14 items-center justify-between gap-3 border-b border-line text-[16px]">
                  <span>
                    <b className="tabular-nums">{q.n}</b> {q.label}
                  </span>
                  <span className="text-muted" aria-hidden>
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="title text-[28px]">Cota do Google hoje</h2>
        <p className="mt-2 text-[15px] leading-snug text-muted">
          Fotos e horários pedidos ao Google pelas telas públicas. Ao chegar no teto, o app para de chamar até as 20h de Campo
          Grande (meia-noite UTC) e mostra o que já tem.
        </p>
        <p className="mt-4 text-[16px]">
          <b className="tabular-nums">{google}</b> de {limit} chamadas
        </p>
        <div
          className="mt-2 h-2 rounded-full bg-surface"
          role="meter"
          aria-valuemin={0}
          aria-valuemax={limit}
          aria-valuenow={google}
          aria-label="Uso da cota do Google hoje"
        >
          <div
            className={`h-full rounded-full ${share >= 0.8 ? "bg-danger" : "bg-ipe"}`}
            style={{ width: `${share * 100}%` }}
          />
        </div>
        {share >= 0.8 && (
          <p className="mt-2 text-[14px] text-danger">Perto do teto. Suba GOOGLE_DAILY_LIMIT na Vercel se o gasto couber.</p>
        )}
      </section>
    </div>
  );
}
