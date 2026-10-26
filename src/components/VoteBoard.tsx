"use client";

import { Crown, Heart, Link2, RotateCcw, X } from "lucide-react";
import { AnimatePresence, motion, useMotionValue, useTransform, type PanInfo } from "motion/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { DecisionOption, DecisionState } from "@/lib/decision";
import { WhatsAppIcon } from "./ui/icons";
import { Photo } from "./ui/Photo";

const NAME_KEY = "kb_name";

function readName(): string {
  try {
    return localStorage.getItem(NAME_KEY) ?? "";
  } catch {
    return "";
  }
}

/** Um card do baralho: arrasta para a direita = "esse!", para a esquerda = "próximo". */
function SwipeCard({
  option,
  color,
  onYes,
  onNo,
  depth,
}: {
  option: DecisionOption;
  color: string;
  onYes: () => void;
  onNo: () => void;
  depth: number;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-220, 220], [-14, 14]);
  const yes = useTransform(x, [20, 120], [0, 1]);
  const no = useTransform(x, [-120, -20], [1, 0]);

  function onDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.x > 110 || info.velocity.x > 600) onYes();
    else if (info.offset.x < -110 || info.velocity.x < -600) onNo();
  }

  return (
    <motion.div
      className="absolute inset-0 cursor-grab touch-pan-y overflow-hidden rounded-[2rem] bg-white shadow-[0_30px_60px_-30px_rgba(0,0,0,0.55)] active:cursor-grabbing"
      style={{ x, rotate, zIndex: 10 - depth }}
      initial={{ scale: 0.92, y: 24, opacity: 0 }}
      animate={{ scale: 1 - depth * 0.05, y: depth * 14, opacity: depth > 2 ? 0 : 1 }}
      exit={{ x: x.get() >= 0 ? 520 : -520, opacity: 0, rotate: x.get() >= 0 ? 18 : -18, transition: { duration: 0.32 } }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      drag={depth === 0 ? "x" : false}
      dragSnapToOrigin
      onDragEnd={onDragEnd}
    >
      <Photo src={option.photo} alt={`Foto de ${option.name}`} name={option.name} color={color} className="absolute inset-0" eager />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
      <motion.span
        style={{ opacity: yes }}
        className="absolute top-6 left-5 -rotate-12 rounded-xl border-4 border-[#3ddc84] px-3 py-1 text-2xl font-black text-[#3ddc84] uppercase"
      >
        Esse!
      </motion.span>
      <motion.span
        style={{ opacity: no }}
        className="absolute top-6 right-5 rotate-12 rounded-xl border-4 border-white px-3 py-1 text-2xl font-black text-white uppercase"
      >
        Próximo
      </motion.span>
      <div className="absolute inset-x-0 bottom-0 p-5 text-white">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="display text-[2rem]">{option.name}</p>
            <p className="mt-1 truncate text-white/80">{option.subtitle}</p>
          </div>
          {option.compat != null && (
            <span className="shrink-0 rounded-full bg-white px-3 py-1.5 text-sm font-extrabold text-match">{option.compat}%</span>
          )}
        </div>
        <ul className="mt-3 space-y-1 text-sm text-white/90">
          {option.reasons.map((r) => (
            <li key={r}>✓ {r}</li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
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
  const [deck, setDeck] = useState<string[]>(initial.myVote ? [] : initial.options.map((o) => o.id));
  const [voting, setVoting] = useState(!initial.myVote && !isNew);
  const [copied, setCopied] = useState(false);
  const { occasion } = state;
  const color = occasion.slug === "tudo" ? "#0b0b0c" : occasion.color;

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
    if (navigator.vibrate) navigator.vibrate([10, 40, 10]);
    const name = nameRef.current?.value.trim() ?? "";
    try {
      localStorage.setItem(NAME_KEY, name);
    } catch {}
    setVoting(false);
    setDeck([]);
    const res = await fetch(`/api/v/${state.code}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ placeId, name }),
    });
    if (res.ok) setState(await res.json());
  }

  function startVoting() {
    setDeck(state.options.map((o) => o.id));
    setVoting(true);
  }

  const shareText = `Me ajuda a escolher? ${occasion.name}: ${state.options.map((o) => o.name).join(", ")}. Vota aqui: ${shareUrl}`;

  async function copy() {
    if (navigator.share) {
      await navigator.share({ title: "Kombin", text: shareText }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(shareUrl).catch(() => {});
      setCopied(true);
    }
  }

  const sorted = [...state.options].sort((a, b) => b.votes - a.votes);
  const leader = state.totalVotes >= 1 && sorted[0].votes > (sorted[1]?.votes ?? 0) ? sorted[0] : undefined;
  const byId = new Map(state.options.map((o) => [o.id, o]));
  const cards = deck.map((id) => byId.get(id)).filter((o): o is DecisionOption => !!o);

  return (
    <div className="space-y-6">
      {isNew && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[1.75rem] p-5 text-white"
          style={{ background: color }}
        >
          <p className="text-xl font-extrabold">Agora é com {occasion.decideWho === "mozão" ? "o mozão" : `a ${occasion.decideWho}`}.</p>
          <p className="mt-1 text-sm text-white/85">
            Quem receber o link vota arrastando os cards, sem baixar nada. O resultado aparece aqui ao vivo.
          </p>
          <div className="mt-4 flex gap-2">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
              className="press flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white px-3 py-3.5 text-[0.95rem] font-bold whitespace-nowrap"
              style={{ color }}
            >
              <WhatsAppIcon /> Mandar no WhatsApp
            </a>
            <button onClick={copy} className="press flex shrink-0 items-center justify-center gap-1.5 rounded-2xl border border-white/50 px-4 py-3.5 font-bold">
              <Link2 className="size-4" /> {copied ? "Copiado!" : "Link"}
            </button>
          </div>
        </motion.div>
      )}

      <label className="block">
        <span className="text-sm font-semibold text-muted">Seu nome (aparece no voto)</span>
        <input
          ref={nameRef}
          placeholder="Ex.: Ana"
          maxLength={30}
          className="mt-1.5 w-full rounded-2xl border border-line bg-soft px-4 py-3.5 outline-none transition focus:border-foreground focus:bg-white"
        />
      </label>

      {voting ? (
        <div>
          <div className="relative mx-auto aspect-[3/4] w-full">
            <AnimatePresence>
              {cards.map((o, i) => (
                <SwipeCard
                  key={o.id}
                  option={o}
                  color={color}
                  depth={i}
                  onYes={() => vote(o.id)}
                  onNo={() => setDeck((d) => (d.length > 1 ? [...d.slice(1), d[0]] : d))}
                />
              ))}
            </AnimatePresence>
          </div>
          {cards[0] && (
            <div className="mt-6 flex items-center justify-center gap-5">
              <button
                onClick={() => setDeck((d) => (d.length > 1 ? [...d.slice(1), d[0]] : d))}
                aria-label="Próximo"
                className="press grid size-16 place-items-center rounded-full border border-line bg-white shadow-lg"
              >
                <X className="size-7" strokeWidth={2.6} />
              </button>
              <button
                onClick={() => vote(cards[0].id)}
                aria-label={`Votar em ${cards[0].name}`}
                className="press grid size-20 place-items-center rounded-full text-white shadow-xl"
                style={{ background: color }}
              >
                <Heart className="size-9 fill-white" strokeWidth={0} />
              </button>
            </div>
          )}
          <p className="mt-3 text-center text-sm text-muted">Arraste para a direita no que você quer.</p>
        </div>
      ) : (
        <section>
          <div className="flex items-end justify-between">
            <h2 className="text-[1.3rem] font-extrabold tracking-[-0.03em]">Resultado ao vivo</h2>
            <span className="text-sm text-muted">
              {state.totalVotes} {state.totalVotes === 1 ? "voto" : "votos"}
            </span>
          </div>
          <ol className="mt-3 space-y-3">
            {sorted.map((o) => {
              const pct = state.totalVotes ? Math.round((o.votes / state.totalVotes) * 100) : 0;
              const mine = state.myVote === o.id;
              const lead = leader?.id === o.id;
              return (
                <motion.li
                  layout
                  key={o.id}
                  className="relative overflow-hidden rounded-[1.4rem] border border-line bg-white p-3"
                  style={mine ? { boxShadow: `0 0 0 2.5px ${color}` } : undefined}
                >
                  <motion.div
                    className="absolute inset-y-0 left-0 opacity-[0.12]"
                    style={{ background: color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  />
                  <div className="relative flex items-center gap-3">
                    <Photo src={o.photo} alt="" name={o.name} color={color} className="size-16 shrink-0 rounded-2xl" />
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5 truncate text-[1.05rem] font-extrabold">
                        {lead && <Crown className="size-4 shrink-0 text-amber-500" strokeWidth={2.6} />}
                        {o.name}
                      </p>
                      <p className="truncate text-xs text-muted">
                        {o.voters.length > 0 ? o.voters.join(", ") : o.subtitle}
                        {mine ? " · seu voto" : ""}
                      </p>
                    </div>
                    <span className="display text-2xl">{pct}%</span>
                  </div>
                </motion.li>
              );
            })}
          </ol>
          <div className="mt-4 flex gap-2">
            <button onClick={startVoting} className="press flex flex-1 items-center justify-center gap-2 rounded-2xl border border-line py-3.5 font-bold">
              <RotateCcw className="size-4" /> {state.myVote ? "Mudar voto" : "Votar"}
            </button>
            {leader && (
              <Link
                href={`/l/${leader.id}?o=${occasion.slug}`}
                className="press flex flex-1 items-center justify-center rounded-2xl py-3.5 font-bold text-white"
                style={{ background: color }}
              >
                Reservar {leader.name.split(" ")[0]}
              </Link>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
