import { Sparkles } from "lucide-react";
import Link from "next/link";
import type { Occasion } from "@/lib/occasions";
import { Glyph } from "./ui/Glyph";
import { Photo } from "./ui/Photo";

/** Card vertical de ocasião (storytelling): foto de ambiente, selo, ícone, nome e frase. */
export function OccasionCard({
  occasion,
  count,
  now,
  index,
}: {
  occasion: Occasion;
  count: number;
  /** É a ocasião sugerida para a hora do dia. */
  now: boolean;
  index: number;
}) {
  const [first, ...rest] = occasion.images;
  return (
    <Link
      href={`/o/${occasion.slug}`}
      transitionTypes={["nav-forward"]}
      className="press rise group relative block aspect-[3/4] w-[260px] cursor-pointer overflow-hidden rounded-3xl"
      style={{ "--i": index } as React.CSSProperties}
    >
      <Photo
        src={first ?? null}
        fallbacks={rest}
        alt=""
        className="absolute inset-0"
        imgClassName="transition-[scale] duration-700 ease-out group-hover:scale-105"
        eager={index < 2}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/10" />
      <div className="relative flex h-full flex-col justify-between p-6 text-white">
        <span className="flex w-fit items-center gap-1.5 rounded-full border border-white/20 bg-white/15 px-3 py-1 text-xs backdrop-blur-md">
          {now ? (
            <>
              <Sparkles className="size-3.5" strokeWidth={1.5} /> Ideal pra agora
            </>
          ) : (
            `${count} ${count === 1 ? "lugar" : "lugares"}`
          )}
        </span>
        <div className="min-w-0">
          <Glyph name={occasion.icon} className="mb-3 size-6 text-white" />
          <p className="mb-1 text-2xl leading-tight font-semibold tracking-[-0.02em] break-words">
            {occasion.display[0]} <span className="accent text-[1.1em]">{occasion.display[1]}</span>
          </p>
          <p className="line-clamp-2 text-xs leading-relaxed break-words text-white/80">{occasion.tagline}</p>
        </div>
      </div>
    </Link>
  );
}
