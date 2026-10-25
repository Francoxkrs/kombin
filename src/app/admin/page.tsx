import Link from "next/link";
import { getRepo } from "@/lib/repo";
import { OCCASIONS, SPEND_LABELS, NOISE_LABELS } from "@/lib/occasions";
import type { PlaceStatus } from "@/lib/types";
import { isAdmin, login, logout, saveDetails, setStatus } from "./actions";

export const metadata = { title: "Admin · Kombin", robots: { index: false } };

const TABS: { status: PlaceStatus; label: string }[] = [
  { status: "pending", label: "Para revisar" },
  { status: "approved", label: "Aprovados" },
  { status: "rejected", label: "Rejeitados" },
];

export default async function AdminPage({ searchParams }: PageProps<"/admin">) {
  if (!(await isAdmin())) {
    return (
      <main className="px-5 py-16">
        <h1 className="text-2xl font-bold">Admin do Kombin</h1>
        <form action={login} className="mt-6 space-y-3">
          <input
            type="password"
            name="password"
            placeholder="Senha (ADMIN_PASSWORD; no modo demo: demo)"
            className="w-full rounded-xl border border-line bg-surface px-4 py-3"
          />
          <button className="w-full rounded-xl bg-foreground py-3 font-semibold text-background">Entrar</button>
        </form>
      </main>
    );
  }

  const sp = await searchParams;
  const tab = (TABS.find((t) => t.status === sp.s)?.status ?? "pending") as PlaceStatus;
  const repo = getRepo();
  const [places, leads, signals] = await Promise.all([
    repo.listPlaces(tab),
    repo.leadCounts(30),
    repo.getSignals(),
  ]);
  const leadsById = new Map(leads.map((l) => [l.placeId, l]));
  const totalWhats = leads.reduce((s, l) => s + l.whatsapp, 0);
  const totalDir = leads.reduce((s, l) => s + l.directions, 0);

  return (
    <main className="px-5 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin</h1>
        <form action={logout}>
          <button className="text-sm text-muted underline">Sair</button>
        </form>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-2xl bg-surface p-4">
          <p className="text-3xl font-bold">{totalWhats}</p>
          <p className="text-xs text-muted">cliques em WhatsApp (30 dias)</p>
        </div>
        <div className="rounded-2xl bg-surface p-4">
          <p className="text-3xl font-bold">{totalDir}</p>
          <p className="text-xs text-muted">cliques em Como chegar (30 dias)</p>
        </div>
      </div>

      <nav className="mt-6 flex gap-2">
        {TABS.map((t) => (
          <Link
            key={t.status}
            href={`/admin?s=${t.status}`}
            className={`rounded-full px-3 py-1.5 text-sm ${t.status === tab ? "bg-foreground text-background" : "bg-surface"}`}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {places.length === 0 && <p className="mt-8 text-muted">Nada aqui.</p>}

      <ul className="mt-5 space-y-4">
        {places.map((p) => {
          const l = leadsById.get(p.id);
          const s = signals.get(p.id);
          return (
            <li key={p.id} className="rounded-2xl bg-surface p-4 text-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-base font-bold">{p.name}</p>
                  <p className="text-muted">{[p.category, p.neighborhood, p.address].filter(Boolean).join(" · ")}</p>
                </div>
                <p className="shrink-0 text-right text-xs text-muted">
                  {l ? `${l.whatsapp} WhatsApp · ${l.directions} rota` : "sem cliques"}
                  <br />
                  {s ? `${s.reviews} avaliações` : "0 avaliações"}
                </p>
              </div>
              {p.aiSummary && <p className="mt-2 italic">“{p.aiSummary}”</p>}
              <div className="mt-2 flex flex-wrap gap-1">
                {OCCASIONS.map((o) => (
                  <span key={o.slug} className="rounded-full bg-background px-2 py-0.5 text-xs">
                    {o.slug}: <b>{p.vibe[o.slug]?.toFixed(1) ?? "–"}</b>
                  </span>
                ))}
              </div>

              <details className="mt-3">
                <summary className="cursor-pointer text-muted">Editar dados</summary>
                <form action={saveDetails} className="mt-3 grid grid-cols-2 gap-2">
                  <input type="hidden" name="id" value={p.id} />
                  <input name="whatsapp" defaultValue={p.whatsapp ?? ""} placeholder="WhatsApp 5567..." className="col-span-2 rounded-lg border border-line px-3 py-2" />
                  <input name="neighborhood" defaultValue={p.neighborhood ?? ""} placeholder="Bairro" className="rounded-lg border border-line px-3 py-2" />
                  <input name="coverUrl" defaultValue={p.coverUrl ?? ""} placeholder="URL de foto própria" className="rounded-lg border border-line px-3 py-2" />
                  <select name="seedSpend" defaultValue={p.seedSpend ?? ""} className="rounded-lg border border-line px-2 py-2">
                    <option value="">Gasto ?</option>
                    {Object.entries(SPEND_LABELS).map(([v, label]) => (
                      <option key={v} value={v}>{label}</option>
                    ))}
                  </select>
                  <select name="seedNoise" defaultValue={p.seedNoise ?? ""} className="rounded-lg border border-line px-2 py-2">
                    <option value="">Barulho ?</option>
                    {Object.entries(NOISE_LABELS).map(([v, label]) => (
                      <option key={v} value={v}>{label}</option>
                    ))}
                  </select>
                  <select name="seedCover" defaultValue={p.seedCover == null ? "" : p.seedCover ? "1" : "0"} className="rounded-lg border border-line px-2 py-2">
                    <option value="">Couvert ?</option>
                    <option value="0">Sem couvert</option>
                    <option value="1">Tem couvert</option>
                  </select>
                  <button className="rounded-lg bg-foreground py-2 font-semibold text-background">Salvar</button>
                </form>
              </details>

              <div className="mt-3 flex gap-2">
                {TABS.filter((t) => t.status !== tab).map((t) => (
                  <form key={t.status} action={setStatus}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="status" value={t.status} />
                    <button className="rounded-lg border border-line px-3 py-1.5">
                      {t.status === "approved" ? "Aprovar" : t.status === "rejected" ? "Rejeitar" : "Voltar p/ revisão"}
                    </button>
                  </form>
                ))}
              </div>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
