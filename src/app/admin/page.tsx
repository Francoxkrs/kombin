import Link from "next/link";
import { Page } from "@/components/ui/Page";
import { TopBar } from "@/components/ui/TopBar";
import { requireAdmin } from "@/lib/auth";
import { cuisineLabel } from "@/lib/cuisines";
import { OCCASIONS } from "@/lib/occasions";
import { getRepo } from "@/lib/repo";
import type { PlaceStatus } from "@/lib/types";
import { ESSENTIALS, QUERIES } from "@/lib/ingest/google";
import { createPlace, removeDemoPlaces, resolveClaim, saveDetails, setStatus } from "./actions";
import { ImportPanel } from "./ImportPanel";
import { PlaceFields } from "./PlaceFields";

export const metadata = { title: "Admin · Kombin", robots: { index: false } };
// A importação e o vibe-check rodam como server actions desta página.
export const maxDuration = 60;

const TABS = [
  { key: "importar", label: "Importar do Google" },
  { key: "pending", label: "Para revisar" },
  { key: "approved", label: "Aprovados" },
  { key: "rejected", label: "Rejeitados" },
  { key: "claims", label: "Donos" },
  { key: "new", label: "+ Lugar" },
] as const;

type Tab = (typeof TABS)[number]["key"];

export default async function AdminPage({ searchParams }: PageProps<"/admin">) {
  await requireAdmin();
  const sp = await searchParams;
  const tab: Tab = TABS.find((t) => t.key === sp.s)?.key ?? "importar";
  const repo = getRepo();
  const leads = await repo.leadCounts(30);
  const totalWhats = leads.reduce((s, l) => s + l.whatsapp, 0);
  const totalDir = leads.reduce((s, l) => s + l.directions, 0);

  return (
    <Page>
      <TopBar back={{ href: "/perfil", label: "Você" }} />
      <main className="px-5 pt-2 pb-12">
        <h1 className="display text-[2.4rem]">Admin</h1>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-[1.3rem] bg-soft p-4">
            <p className="display text-[2rem]">{totalWhats}</p>
            <p className="text-xs text-muted">cliques em WhatsApp (30 dias)</p>
          </div>
          <div className="rounded-[1.3rem] bg-soft p-4">
            <p className="display text-[2rem]">{totalDir}</p>
            <p className="text-xs text-muted">cliques em Como chegar (30 dias)</p>
          </div>
        </div>

        <nav className="no-scrollbar -mx-5 mt-6 flex gap-2 overflow-x-auto px-5">
          {TABS.map((t) => (
            <Link
              key={t.key}
              href={`/admin?s=${t.key}`}
              replace
              className={`press shrink-0 rounded-full border px-4 py-2 text-sm font-semibold ${t.key === tab ? "border-foreground bg-foreground text-white" : "border-line bg-white"}`}
            >
              {t.label}
            </Link>
          ))}
        </nav>

        <div className="mt-5">
          {tab === "importar" && <Import />}
          {tab === "new" && <NewPlace />}
          {tab === "claims" && <Claims />}
          {(tab === "pending" || tab === "approved" || tab === "rejected") && (
            <PlaceList status={tab} leads={new Map(leads.map((l) => [l.placeId, l]))} />
          )}
        </div>
      </main>
    </Page>
  );
}

async function Import() {
  const repo = getRepo();
  const [queue, demo] = await Promise.all([repo.placesWithoutVision().then((l) => l.length), repo.countDemoPlaces()]);
  return (
    <>
      {demo > 0 && (
        <form action={removeDemoPlaces} className="mb-4 rounded-[1.5rem] border border-amber-300 bg-amber-50 p-4">
          <p className="font-bold">Há {demo} lugares fictícios no banco</p>
          <p className="mt-1 text-sm text-ink-2">
            São os lugares de teste (Adega Lume, Varanda do Samba...), sem foto e com WhatsApp falso. Apague antes de
            divulgar o app.
          </p>
          <button className="press mt-3 w-full rounded-xl bg-foreground py-3 font-bold text-white">
            Apagar lugares fictícios
          </button>
        </form>
      )}
      <ImportPanel
        queries={QUERIES.map((q) => q.label)}
        essentials={ESSENTIALS}
        hasGoogleKey={!!process.env.GOOGLE_MAPS_API_KEY}
        hasVision={!!(process.env.GEMINI_API_KEY || process.env.ANTHROPIC_API_KEY)}
        visionQueue={queue}
      />
    </>
  );
}

function NewPlace() {
  return (
    <form action={createPlace} className="space-y-3 rounded-[1.5rem] border border-line p-4">
      <p className="font-semibold">Cadastrar lugar à mão</p>
      <p className="text-sm text-muted">
        Entra direto como aprovado. Dê nota de vibe só para as ocasiões em que ele deve aparecer.
      </p>
      <PlaceFields />
      <button className="press w-full rounded-xl bg-foreground py-3 font-bold text-white">Cadastrar</button>
    </form>
  );
}

async function Claims() {
  const claims = await getRepo().listOpenClaims();
  if (claims.length === 0) return <p className="text-muted">Nenhum pedido de dono em aberto.</p>;
  return (
    <ul className="space-y-3">
      {claims.map((c) => (
        <li key={c.id} className="rounded-[1.5rem] border border-line p-4 text-sm">
          <p className="text-base font-bold">{c.placeName}</p>
          <p>
            {c.userName ?? "Sem nome"} · <b>{c.contact}</b>
          </p>
          {c.message && <p className="mt-1 text-muted">“{c.message}”</p>}
          <p className="mt-1 text-xs text-muted">Confirme pelo contato antes de aprovar.</p>
          <div className="mt-3 flex gap-2">
            {[
              { v: "1", label: "Aprovar" },
              { v: "0", label: "Recusar" },
            ].map((b) => (
              <form key={b.v} action={resolveClaim}>
                <input type="hidden" name="id" value={c.id} />
                <input type="hidden" name="approve" value={b.v} />
                <button className="press rounded-xl border border-line px-3 py-2 font-semibold">{b.label}</button>
              </form>
            ))}
          </div>
        </li>
      ))}
    </ul>
  );
}

async function PlaceList({
  status,
  leads,
}: {
  status: PlaceStatus;
  leads: Map<string, { whatsapp: number; directions: number }>;
}) {
  const repo = getRepo();
  const [places, signals] = await Promise.all([repo.listPlaces(status), repo.getSignals()]);
  if (places.length === 0) return <p className="text-muted">Nada aqui.</p>;
  const others = (["pending", "approved", "rejected"] as const).filter((s) => s !== status);

  return (
    <ul className="space-y-4">
      {places.map((p) => {
        const l = leads.get(p.id);
        const s = signals.get(p.id);
        return (
          <li key={p.id} className="rounded-[1.5rem] border border-line p-4 text-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-base font-bold">{p.name}</p>
                <p className="text-muted">
                  {[p.cuisines.map(cuisineLabel).join(", ") || p.category, p.neighborhood].filter(Boolean).join(" · ")}
                </p>
              </div>
              <p className="shrink-0 text-right text-xs text-muted">
                {l ? `${l.whatsapp} WhatsApp · ${l.directions} rota` : "sem cliques"}
                <br />
                {s?.reviews ?? 0} avaliações
              </p>
            </div>
            {p.aiSummary && <p className="mt-2 italic">“{p.aiSummary}”</p>}
            <div className="mt-2 flex flex-wrap gap-1">
              {OCCASIONS.map((o) => (
                <span key={o.slug} className="rounded-full bg-soft px-2 py-0.5 text-xs">
                  {o.slug}: <b>{p.vibe[o.slug]?.toFixed(1) ?? "–"}</b>
                </span>
              ))}
            </div>

            <details className="mt-3">
              <summary className="cursor-pointer text-muted">Editar</summary>
              <form action={saveDetails} className="mt-3 space-y-2">
                <input type="hidden" name="id" value={p.id} />
                <PlaceFields place={p} />
                <button className="press w-full rounded-xl bg-foreground py-2.5 font-bold text-white">Salvar</button>
              </form>
            </details>

            <div className="mt-3 flex gap-2">
              {others.map((st) => (
                <form key={st} action={setStatus}>
                  <input type="hidden" name="id" value={p.id} />
                  <input type="hidden" name="status" value={st} />
                  <button className="press rounded-xl border border-line px-3 py-2 font-semibold">
                    {st === "approved" ? "Aprovar" : st === "rejected" ? "Rejeitar" : "Voltar p/ revisão"}
                  </button>
                </form>
              ))}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
