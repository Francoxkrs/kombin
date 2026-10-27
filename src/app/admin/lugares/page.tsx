import Link from "next/link";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { BTN_IPE, BTN_LIGHT, chip, INPUT } from "@/components/ui/styles";
import { requireAdmin } from "@/lib/auth";
import { cuisineLabel } from "@/lib/cuisines";
import { OCCASIONS } from "@/lib/occasions";
import { getRepo } from "@/lib/repo";
import type { Place, PlaceStatus } from "@/lib/types";
import { CoverEditor } from "../../painel/PhotoEditors";
import { saveDetails, setStatus } from "../actions";
import { Confirm } from "../Confirm";
import { PlaceFields } from "../PlaceFields";

// A troca de capa roda como server action desta página.
export const maxDuration = 60;

const FILTERS = [
  { key: "pending", label: "Para revisar" },
  { key: "approved", label: "Aprovados" },
  { key: "rejected", label: "Rejeitados" },
  { key: "nocover", label: "Sem capa" },
] as const;

type Filter = (typeof FILTERS)[number]["key"];

/** Uma página com 300 cartões abertos pesa no celular; a busca acha o resto. */
const SHOW = 40;

const norm = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

export default async function AdminPlaces({ searchParams }: PageProps<"/admin/lugares">) {
  await requireAdmin();
  const sp = await searchParams;
  const filter: Filter = FILTERS.find((f) => f.key === sp.s)?.key ?? "pending";
  const q = String(sp.q ?? "").trim();
  const repo = getRepo();
  const status: PlaceStatus = filter === "nocover" ? "approved" : filter;
  const [all, signals, leads] = await Promise.all([repo.listPlaces(status), repo.getSignals(), repo.leadCounts(30)]);
  const leadsBy = new Map(leads.map((l) => [l.placeId, l]));
  const needle = norm(q);
  const places = all
    .filter((p) => filter !== "nocover" || !p.coverUrl)
    .filter((p) => !needle || norm([p.name, p.neighborhood ?? "", p.category ?? ""].join(" ")).includes(needle));

  return (
    <>
      <div className="lg:flex lg:items-center lg:gap-4">
      <form className="flex gap-2 lg:w-[440px] lg:shrink-0">
        <input type="hidden" name="s" value={filter} />
        <input name="q" defaultValue={q} placeholder="Nome, bairro ou tipo" className={INPUT} aria-label="Buscar lugar" />
        <button className={BTN_LIGHT}>Buscar</button>
      </form>
      <nav className="no-scrollbar -mx-5 mt-4 flex gap-2 overflow-x-auto px-5 lg:mx-0 lg:mt-0 lg:px-0">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={`/admin/lugares?s=${f.key}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
            replace
            className={chip(f.key === filter)}
          >
            {f.label}
          </Link>
        ))}
      </nav>
      </div>
      <p className="mt-4 text-[15px] text-muted">
        {places.length === 0
          ? "Nada aqui."
          : places.length > SHOW
            ? `${places.length} lugares. Mostrando os ${SHOW} primeiros; busque para achar os outros.`
            : `${places.length} ${places.length === 1 ? "lugar" : "lugares"}`}
      </p>
      <ul className="mt-4 grid items-start gap-4 xl:grid-cols-2">
        {places.slice(0, SHOW).map((p) => (
          <PlaceCard
            key={p.id}
            place={p}
            leads={leadsBy.get(p.id)}
            reviews={signals.get(p.id)?.reviews ?? 0}
          />
        ))}
      </ul>
    </>
  );
}

function PlaceCard({
  place: p,
  leads: l,
  reviews,
}: {
  place: Place;
  leads?: { whatsapp: number; directions: number };
  reviews: number;
}) {
  const others = (["pending", "approved", "rejected"] as const).filter((s) => s !== p.status);
  return (
    <li className="rounded-2xl bg-surface p-5 text-[15px]">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Link href={`/l/${p.id}`} className="text-[18px] font-semibold underline-offset-4 hover:underline">
            {p.name}
          </Link>
          <p className="text-muted">
            {[p.cuisines.map(cuisineLabel).join(", ") || p.category, p.neighborhood].filter(Boolean).join(", ")}
          </p>
        </div>
        <p className="shrink-0 text-right text-[13px] text-muted">
          {l ? `${l.whatsapp} WhatsApp, ${l.directions} rota` : "sem cliques"}
          <br />
          {reviews} avaliações
        </p>
      </div>
      {p.aiSummary && <p className="mt-2 text-ink-2">{p.aiSummary}</p>}
      <div className="mt-2 flex flex-wrap gap-1">
        {OCCASIONS.map((o) => (
          <span key={o.slug} className="rounded-full bg-soft px-2.5 py-1 text-[13px]">
            {o.slug}: <b>{p.vibe[o.slug]?.toFixed(1) ?? "–"}</b>
          </span>
        ))}
      </div>

      <details className="mt-3">
        <summary className="flex h-11 cursor-pointer items-center text-muted">
          {p.coverUrl ? "Trocar foto de capa" : "Pôr foto de capa"}
        </summary>
        <div className="mt-3">
          <CoverEditor placeId={p.id} current={p.coverUrl} blurhash={p.coverBlurhash} />
        </div>
      </details>

      <details>
        <summary className="flex h-11 cursor-pointer items-center text-muted">Editar</summary>
        <form action={saveDetails} className="mt-3 space-y-2">
          <input type="hidden" name="id" value={p.id} />
          <PlaceFields place={p} />
          <SubmitButton className={`${BTN_IPE} w-full`}>Salvar</SubmitButton>
        </form>
      </details>

      <div className="mt-3 flex flex-wrap items-start gap-2">
        {others.map((st) =>
          st === "rejected" ? (
            <Confirm
              key={st}
              label="Rejeitar"
              warning={`${p.name} sai do app para todo mundo. Dá para voltar depois em “Rejeitados”.`}
              confirm="Rejeitar mesmo"
              action={setStatus}
              fields={{ id: p.id, status: st }}
              reason
            />
          ) : (
            <form key={st} action={setStatus}>
              <input type="hidden" name="id" value={p.id} />
              <input type="hidden" name="status" value={st} />
              <button className={chip(st === "approved", true)}>
                {st === "approved" ? "Aprovar" : "Voltar p/ revisão"}
              </button>
            </form>
          ),
        )}
      </div>
    </li>
  );
}
