import { requireAdmin } from "@/lib/auth";
import { getRepo } from "@/lib/repo";
import { dateTimeBR } from "../format";

export default async function AdminHistory() {
  await requireAdmin();
  const log = await getRepo().listAdminLog(150);

  if (log === null) {
    return (
      <p className="rounded-2xl bg-surface p-5 text-[15px] leading-snug">
        O histórico ainda está desligado. Rode <b>supabase/migrations/0007_painel_admin.sql</b> no SQL Editor do Supabase e
        as próximas ações aparecem aqui.
      </p>
    );
  }
  if (log.length === 0) return <p className="text-muted">Nenhuma ação registrada ainda.</p>;

  return (
    <>
      <p className="text-[15px] text-muted">As últimas {log.length} mudanças feitas no admin, das mais novas para as mais antigas.</p>
      <ol className="mt-4 max-w-3xl divide-y divide-line">
        {log.map((e) => (
          <li key={e.id} className="py-3 text-[15px]">
            <p>
              <b className="font-semibold">{e.actor ?? "Alguém"}</b> {e.action.toLowerCase()}
              {e.target && <>: {e.target}</>}
            </p>
            {e.detail && <p className="text-ink-2">“{e.detail}”</p>}
            <p className="text-[13px] text-muted">{dateTimeBR(e.at)}</p>
          </li>
        ))}
      </ol>
    </>
  );
}
