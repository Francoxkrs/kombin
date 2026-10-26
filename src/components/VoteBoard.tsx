"use client";

import { Crown, Heart, Link2, X } from "lucide-react";
import { AnimatePresence, motion, useMotionValue, useTransform, type PanInfo } from "motion/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { DecisionOption, DecisionState } from "@/lib/decision";
import { theWho } from "@/lib/occasions";
import { WhatsAppIcon } from "./ui/icons";
import { Photo } from "./ui/Photo";
import { btn, INPUT } from "./ui/styles";

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
  onYes,
  onNo,
  depth,
}: {
  option: DecisionOption;
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
      className="absolute inset-0 cursor-grab touch-pan-y overflow-hidden bg-surface active:cursor-grabbing"
      style={{ x, rotate, zIndex: 10 - depth }}
      initial={{ scale: 0.92, y: 24, opacity: 0 }}
      animate={{ scale: 1 - depth * 0.05, y: depth * 14, opacity: depth > 2 ? 0 : 1 }}
      exit={{ x: x.get() >= 0 ? 520 : -520, opacity: 0, rotate: x.get() >= 0 ? 18 : -18, transition: { duration: 0.32 } }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      drag={depth === 0 ? "x" : false}
      dragSnapToOrigin
      onDragEnd={onDragEnd}
    >
      <Photo src={option.photo} alt={`Foto de ${option.name}`} name={option.name} className="absolute inset-0" eager />
      <div className="scrim-bottom absolute inset-x-0 bottom-0 h-3/4" />
      <motion.span
        style={{ opacity: yes }}
        className="title absolute top-6 left-5 -rotate-12 rounded-2xl border-4 border-ipe px-4 py-2 text-[34px] text-ipe"
      >
        Esse!
      </motion.span>
      <motion.span
        style={{ opacity: no }}
        className="title absolute top-6 right-5 rotate-12 rounded-2xl border-4 border-foreground px-4 py-2 text-[34px] text-foreground"
      >
        Próximo
      </motion.span>
      <div className="absolute inset-x-0 bottom-0 p-5">
        {option.compat != null && (
          <p className="text-[15px] font-medium">
            <span className="text-ipe">{option.compat}%</span> combina
          </p>
        )}
        <p className="title mt-1 text-[40px] break-words">{option.name}</p>
        <p className="mt-2 text-[15px] leading-snug text-foreground/90">
          {[option.subtitle, ...option.reasons].filter(Boolean).join(". ")}.
        </p>
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
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-[20px] leading-snug font-medium">
            Agora é com {theWho(occasion.decideWho)}. Quem receber o link vota arrastando as
            fotos, sem baixar nada, e o resultado aparece aqui na hora.
          </p>
          <div className="mt-5 flex gap-2">
            <a href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} className={`${btn("ipe", "tight")} flex-1`}>
              <WhatsAppIcon /> Mandar no WhatsApp
            </a>
            <button onClick={copy} className={btn("quiet", "tight")}>
              <Link2 className="size-5" strokeWidth={2} /> {copied ? "Copiado" : "Link"}
            </button>
          </div>
        </motion.section>
      )}

      <label className="block">
        <span className="text-[15px] text-muted">Seu nome (aparece no voto)</span>
        <input ref={nameRef} placeholder="Ex.: Ana" maxLength={30} className={`${INPUT} mt-2`} />
      </label>

      {voting ? (
        <div>
          <div className="relative mx-auto aspect-[3/4] w-full">
            <AnimatePresence>
              {cards.map((o, i) => (
                <SwipeCard
                  key={o.id}
                  option={o}
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
                className="press grid size-16 place-items-center rounded-full bg-surface"
              >
                <X className="size-7" strokeWidth={2.2} />
              </button>
              <button
                onClick={() => vote(cards[0].id)}
                aria-label={`Votar em ${cards[0].name}`}
                className="press grid size-20 place-items-center rounded-full bg-ipe text-on-ipe"
              >
                <Heart className="size-9 fill-current" strokeWidth={0} />
              </button>
            </div>
          )}
          <p className="mt-4 text-center text-[15px] text-muted">Arraste pra direita no que você quer.</p>
        </div>
      ) : (
        <section>
          <div className="flex items-end justify-between">
            <h2 className="title text-[32px]">Resultado</h2>
            <span className="text-[15px] text-muted">
              {state.totalVotes} {state.totalVotes === 1 ? "voto" : "votos"}
            </span>
          </div>
          <ol className="mt-4 space-y-1">
            {sorted.map((o) => {
              const pct = state.totalVotes ? Math.round((o.votes / state.totalVotes) * 100) : 0;
              const mine = state.myVote === o.id;
              const lead = leader?.id === o.id;
              return (
                <motion.li
                  layout
                  key={o.id}
                  className="relative overflow-hidden bg-surface"
                >
                  <motion.div
                    className="absolute inset-y-0 left-0 bg-ipe/20"
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  />
                  <div className="relative flex items-center gap-4 pr-4">
                    <Photo src={o.photo} alt="" name={o.name} className="size-[72px] shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5 truncate text-[18px] font-semibold">
                        {lead && <Crown className="size-4 shrink-0 text-ipe" strokeWidth={2.4} />}
                        {o.name}
                      </p>
                      <p className="truncate text-[14px] text-muted">
                        {mine ? "Seu voto" : o.voters.length > 0 ? o.voters.join(", ") : o.subtitle}
                        {mine && o.voters.length > 1 ? `, ${o.voters.length - 1} mais` : ""}
                      </p>
                    </div>
                    <span className="title text-[32px] tabular-nums">{pct}%</span>
                  </div>
                </motion.li>
              );
            })}
          </ol>
          <div className="mt-4 flex gap-2">
            <button onClick={startVoting} className={`${btn("quiet", "tight")} flex-1`}>
              {state.myVote ? "Mudar voto" : "Votar"}
            </button>
            {leader && (
              <Link href={`/l/${leader.id}?o=${occasion.slug}`} className={`${btn("ipe", "tight")} flex-1`}>
                Ver {leader.name.split(" ")[0]}
              </Link>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
