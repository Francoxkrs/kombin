"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { DecisionState } from "@/lib/decision";
import { PlaceImage } from "./PlaceImage";

const NAME_KEY = "kb_name";

function readName(): string {
  try {
    return localStorage.getItem(NAME_KEY) ?? "";
  } catch {
    return "";
  }
}

export function VoteBoard({
  initial,
  isNew,
  shareUrl,
}: {
  initial: DecisionState;
  isNew: boolean;
  shareUrl: string;
}) {
  const [state, setState] = useState(initial);
  const nameRef = useRef<HTMLInputElement>(null);
  const [sending, setSending] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { occasion } = state;

  useEffect(() => {
    if (nameRef.current) nameRef.current.value = readName();
  }, []);

  // Resultado ao vivo: consulta a cada 3 s enquanto a aba está visível.
  useEffect(() => {
    const tick = async () => {
      if (document.visibilityState !== "visible") return;
      const res = await fetch(`/api/v/${state.code}`, { cache: "no-store" });
      if (res.ok) setState(await res.json());
    };
    const t = setInterval(tick, 3000);
    return () => clearInterval(t);
  }, [state.code]);

  async function vote(placeId: string) {
    setSending(placeId);
    const name = nameRef.current?.value.trim() ?? "";
    try {
      localStorage.setItem(NAME_KEY, name);
    } catch {}
    const res = await fetch(`/api/v/${state.code}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ placeId, name }),
    });
    if (res.ok) setState(await res.json());
    setSending(null);
  }

  const shareText = `Me ajuda a escolher? ${occasion.name}: ${state.options.map((o) => o.name).join(", ")}. Vota aqui: ${shareUrl}`;

  async function share() {
    if (navigator.share) {
      await navigator.share({ title: "Kombin", text: shareText }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
    }
  }

  const leader =
    state.totalVotes >= 2
      ? [...state.options].sort((a, b) => b.votes - a.votes).find((o, _, arr) => o.votes > (arr[1]?.votes ?? 0))
      : undefined;

  return (
    <div className="space-y-6">
      {isNew && (
        <div className="animate-rise rounded-3xl p-5 text-white" style={{ background: occasion.color }}>
          <p className="text-lg font-bold">Agora é com o {occasion.decideWho}.</p>
          <p className="mt-1 text-sm text-white/85">
            Quem receber o link vota no navegador, sem baixar nada. O resultado aparece aqui ao vivo.
          </p>
          <div className="mt-4 flex gap-2">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
              className="flex-[2] rounded-2xl bg-white py-3 text-center font-semibold"
              style={{ color: occasion.color }}
            >
              Mandar no WhatsApp
            </a>
            <button onClick={share} className="flex-1 rounded-2xl border border-white/50 py-3 font-semibold">
              {copied ? "Copiado!" : "Outro app"}
            </button>
          </div>
        </div>
      )}

      {leader && (
        <div className="flex items-center justify-between gap-3 rounded-3xl bg-surface p-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-match uppercase">Ganhando</p>
            <p className="truncate text-lg font-bold">{leader.name}</p>
          </div>
          <Link
            href={`/l/${leader.id}?o=${occasion.slug}`}
            className="shrink-0 rounded-2xl px-4 py-3 text-sm font-semibold text-white"
            style={{ background: occasion.color }}
          >
            Reservar
          </Link>
        </div>
      )}

      <label className="block">
        <span className="text-sm text-muted">Seu nome (aparece no voto)</span>
        <input
          ref={nameRef}
          placeholder="Ex.: Ana"
          maxLength={30}
          className="mt-1 w-full rounded-2xl border border-line bg-surface px-4 py-3 outline-none focus:border-foreground"
        />
      </label>

      <ol className="space-y-4">
        {state.options.map((o) => {
          const mine = state.myVote === o.id;
          const pct = state.totalVotes ? Math.round((o.votes / state.totalVotes) * 100) : 0;
          return (
            <li
              key={o.id}
              className="overflow-hidden rounded-3xl bg-surface transition"
              style={mine ? { boxShadow: `0 0 0 3px ${occasion.color}` } : undefined}
            >
              <div className="flex gap-3 p-3">
                <PlaceImage
                  placeId={o.id}
                  name={o.name}
                  coverUrl={o.coverUrl}
                  hasGoogle={o.hasGoogle}
                  color={occasion.color}
                  className="size-24 shrink-0 rounded-2xl"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="truncate text-lg leading-tight font-bold">{o.name}</h3>
                    {o.compat != null && <span className="text-sm font-bold text-match">{o.compat}%</span>}
                  </div>
                  <p className="truncate text-sm text-muted">{o.subtitle}</p>
                  <ul className="mt-1 text-xs text-muted">
                    {o.reasons.map((r) => (
                      <li key={r}>✓ {r}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="px-3 pb-3">
                <div className="mb-2 h-2 overflow-hidden rounded-full bg-background">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, background: occasion.color }}
                  />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <p className="min-w-0 truncate text-xs text-muted">
                    {o.votes} {o.votes === 1 ? "voto" : "votos"}
                    {o.voters.length > 0 && ` · ${o.voters.join(", ")}`}
                  </p>
                  <button
                    onClick={() => vote(o.id)}
                    disabled={sending !== null}
                    className="shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition active:scale-95 disabled:opacity-60"
                    style={
                      mine
                        ? { background: occasion.color, color: "white" }
                        : { border: "1px solid var(--line)" }
                    }
                  >
                    {mine ? "Seu voto ✓" : sending === o.id ? "…" : "Votar"}
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
