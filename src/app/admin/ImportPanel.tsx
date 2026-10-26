"use client";

import { Check, CircleAlert, Loader2, Plus, Search } from "lucide-react";
import { motion } from "motion/react";
import { useState, useTransition } from "react";
import { BTN_IPE, BTN_LIGHT, chip } from "@/components/ui/styles";
import { importEssential, importGooglePlace, importQuery, searchGoogle, visionNext, type GoogleHit } from "./import-actions";

interface LogLine {
  text: string;
  kind: "ok" | "info" | "error";
}

/** ", 12 com nota abaixo de 4,2, 8 já no app" */
function describe(reasons: Record<string, number>): string {
  const parts = Object.entries(reasons)
    .sort((a, b) => b[1] - a[1])
    .map(([why, n]) => `${n} ${why}`);
  return parts.length ? `: ${parts.join(", ")}` : "";
}

/** Importação do Google pelo navegador: uma busca por vez, com barra de progresso. */
export function ImportPanel({
  queries,
  essentials,
  hasGoogleKey,
  hasVision,
  visionQueue,
}: {
  queries: string[];
  essentials: string[];
  hasGoogleKey: boolean;
  hasVision: boolean;
  visionQueue: number;
}) {
  const [running, setRunning] = useState<"import" | "vision" | null>(null);
  const [progress, setProgress] = useState(0);
  const [log, setLog] = useState<LogLine[]>([]);
  const [total, setTotal] = useState(0);
  const [queue, setQueue] = useState(visionQueue);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<GoogleHit[] | null>(null);
  const [searching, startSearch] = useTransition();
  const [adding, setAdding] = useState<string | null>(null);

  const push = (l: LogLine) => setLog((prev) => [l, ...prev].slice(0, 40));

  async function runImport() {
    setRunning("import");
    setLog([]);
    let added = 0;
    const steps = essentials.length + queries.length;
    // Primeiro as casas conhecidas, pelo nome; depois as buscas por tipo de comida.
    for (let i = 0; i < essentials.length; i++) {
      setProgress(i / steps);
      const r = await importEssential(i);
      if (!r.ok) {
        push({ text: r.error, kind: "error" });
        setRunning(null);
        return;
      }
      if (r.status === "added") {
        added++;
        setTotal(added);
        setQueue((n) => n + 1);
      }
      push({
        text:
          r.status === "added"
            ? `${r.name}: adicionado`
            : r.status === "known"
              ? `${r.name}: já no app`
              : `${essentials[i]}: não achei no Google, adicione pela busca abaixo`,
        kind: r.status === "missing" ? "error" : r.status === "added" ? "ok" : "info",
      });
    }
    for (let i = 0; i < queries.length; i++) {
      setProgress((essentials.length + i) / steps);
      const r = await importQuery(i);
      if (!r.ok) {
        push({ text: r.error, kind: "error" });
        break;
      }
      added += r.added.length;
      setTotal(added);
      push({
        text: r.added.length
          ? `${r.label}: +${r.added.length} (${r.added.slice(0, 3).join(", ")}${r.added.length > 3 ? "…" : ""})`
          : `${r.label}: nada novo (${r.found} encontrados${describe(r.reasons)})`,
        kind: r.added.length ? "ok" : "info",
      });
      setQueue((n) => n + r.added.length);
    }
    setProgress(1);
    setRunning(null);
  }

  async function runVision() {
    setRunning("vision");
    for (;;) {
      const r = await visionNext();
      if (!r.ok) {
        push({ text: r.error, kind: "error" });
        break;
      }
      if (!r.name) break;
      setQueue(r.remaining);
      push({ text: `${r.name}: estética ${r.aesthetic ?? "?"}/10`, kind: "ok" });
      if (r.remaining === 0) break;
      // Plano grátis do Gemini: ~10 pedidos por minuto.
      await new Promise((res) => setTimeout(res, 6500));
    }
    setRunning(null);
  }

  function search(e: React.FormEvent) {
    e.preventDefault();
    startSearch(async () => {
      const r = await searchGoogle(q);
      if (r.ok) setHits(r.hits);
      else push({ text: r.error, kind: "error" });
    });
  }

  async function add(hit: GoogleHit) {
    setAdding(hit.id);
    const r = await importGooglePlace(hit.id);
    setAdding(null);
    if (r.ok) {
      setHits((h) => h?.map((x) => (x.id === hit.id ? { ...x, known: true } : x)) ?? null);
      push({ text: `${hit.name} adicionado`, kind: "ok" });
    } else push({ text: r.error, kind: "error" });
  }

  if (!hasGoogleKey) {
    return (
      <div className="rounded-2xl bg-surface p-5 text-[15px]">
        <p className="text-[18px] font-semibold text-ipe">Falta a chave do Google</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-ink-2">
          <li>No Google Cloud, ative a <b>Places API (New)</b> e crie uma chave de API.</li>
          <li>Crie um alerta de orçamento de US$ 1 (a cota grátis cobre a importação).</li>
          <li>
            Na Vercel, em Settings &gt; Environment Variables, crie <code>GOOGLE_MAPS_API_KEY</code> e faça um Redeploy.
          </li>
        </ol>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl bg-surface p-5">
        <p className="title text-[28px]">Importar restaurantes de Campo Grande</p>
        <p className="mt-2 text-[15px] leading-snug text-muted">
          Primeiro as {essentials.length} casas essenciais pelo nome ({essentials.slice(0, 3).join(", ")}…), depois{" "}
          {queries.length} buscas (pizzarias, japoneses, bares com música…). Nas buscas entram só lugares abertos, com nota
          4,2+ e 150+ avaliações no Google. Usa cerca de {essentials.length + queries.length} das 1.000 chamadas grátis do
          mês.
        </p>
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-soft">
          <motion.div className="h-full rounded-full bg-ipe" animate={{ width: `${progress * 100}%` }} transition={{ duration: 0.4 }} />
        </div>
        <button
          onClick={runImport}
          disabled={running !== null}
          className={`${BTN_IPE} mt-4 w-full`}
        >
          {running === "import" ? (
            <>
              <Loader2 className="size-5 animate-spin" /> Importando… {total} novos
            </>
          ) : progress === 1 ? (
            <>
              <Check className="size-5" /> Pronto: {total} novos. Rodar de novo
            </>
          ) : (
            "Começar importação"
          )}
        </button>
      </section>

      <section className="rounded-2xl bg-surface p-5">
        <p className="text-[18px] font-semibold">Refinar com IA de visão (opcional)</p>
        <p className="mt-1 text-[15px] leading-snug text-muted">
          A importação já dá notas por ocasião a partir dos dados do Google. A IA olha 3 fotos de cada lugar e ajusta as
          notas pelo ambiente. {queue} {queue === 1 ? "lugar" : "lugares"} na fila.
        </p>
        {hasVision ? (
          <button
            onClick={runVision}
            disabled={running !== null || queue === 0}
            className={`${BTN_LIGHT} mt-4 w-full`}
          >
            {running === "vision" && <Loader2 className="size-5 animate-spin" />}
            {running === "vision" ? `Analisando… ${queue} na fila` : "Analisar fotos"}
          </button>
        ) : (
          <p className="mt-3 rounded-xl bg-soft p-3 text-[15px]">
            Para ligar: crie uma chave grátis em aistudio.google.com e cadastre <code>GEMINI_API_KEY</code> na Vercel.
          </p>
        )}
      </section>

      <section className="rounded-2xl bg-surface p-5">
        <p className="text-[18px] font-semibold">Adicionar um lugar específico</p>
        <form onSubmit={search} className="mt-3 flex gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ex.: Coco Bambu"
            className="h-12 min-w-0 flex-1 rounded-xl bg-soft px-3 text-[16px] outline-none placeholder:text-muted focus:ring-2 focus:ring-ipe"
          />
          <button className="press grid w-12 place-items-center rounded-full bg-foreground text-background" aria-label="Buscar no Google">
            {searching ? <Loader2 className="size-5 animate-spin" /> : <Search className="size-5" />}
          </button>
        </form>
        {hits && (
          <ul className="mt-3">
            {hits.length === 0 && <li className="py-3 text-[15px] text-muted">Nada encontrado em Campo Grande.</li>}
            {hits.map((h) => (
              <li key={h.id} className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{h.name}</p>
                  <p className="truncate text-[13px] text-muted">
                    {h.rating ? `nota ${h.rating.toFixed(1).replace(".", ",")} (${h.reviews}), ` : ""}
                    {h.address}
                  </p>
                </div>
                {h.known ? (
                  <span className="flex items-center gap-1 text-[15px] font-semibold text-ipe">
                    <Check className="size-4" /> No Kombin
                  </span>
                ) : (
                  <button onClick={() => add(h)} disabled={adding !== null} className={chip(false, true)}>
                    {adding === h.id ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />} Adicionar
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {log.length > 0 && (
        <ul className="space-y-1.5 text-[15px]">
          {log.map((l, i) => (
            <li key={`${i}-${l.text}`} className={`flex gap-2 ${l.kind === "error" ? "text-danger" : l.kind === "ok" ? "" : "text-muted"}`}>
              {l.kind === "error" ? <CircleAlert className="mt-0.5 size-4 shrink-0" /> : <Check className="mt-0.5 size-4 shrink-0 text-ipe" />}
              {l.text}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
