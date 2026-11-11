import Link from "next/link";
import type { HomeOccasion } from "@/lib/home-shared";
import { Photo } from "../ui/Photo";

/**
 * O melhor de hoje em cada ocasião, com dados de agora (o índice já leva o clima em conta).
 * Rótulos por cima da foto sempre em caixa escura com desfoque e borda fina: a foto pode ser
 * clara, escura ou saturada, e o texto continua legível.
 */
export function LiveBoard({ occasions }: { occasions: HomeOccasion[] }) {
  const best = occasions.filter((o) => o.top[0]);
  if (best.length === 0) return null;
  return (
    <section aria-labelledby="hoje-title" className="border-t border-line py-24 lg:py-32">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8 lg:px-10">
        <div className="flex items-end justify-between gap-6">
          <div>
            <h2 id="hoje-title" className="title text-[40px] sm:text-[52px] lg:text-[60px]">
              O melhor de hoje, por momento
            </h2>
            <p className="mt-4 max-w-[40ch] text-[17px] leading-[1.6] text-ink-2">
              A casa que mais combina com cada ocasião agora, em Campo Grande.
            </p>
          </div>
          <Link href="/descobrir" transitionTypes={["nav-forward"]} className="press hidden h-11 shrink-0 items-center text-[16px] font-semibold underline decoration-ipe decoration-2 underline-offset-8 sm:flex">
            Ver todas
          </Link>
        </div>
      </div>

      <ul className="no-scrollbar mt-10 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-5 px-5 sm:scroll-px-8 sm:px-8 lg:mx-auto lg:grid lg:max-w-[1240px] lg:grid-cols-3 lg:gap-5 lg:overflow-visible lg:px-10">
        {best.map((o) => {
          const p = o.top[0];
          return (
            <li key={o.slug} className="w-[80%] shrink-0 snap-start sm:w-[46%] lg:w-auto">
              <Link
                href={`/l/${p.id}?o=${o.slug}`}
                transitionTypes={["nav-forward"]}
                className="press group relative block aspect-[4/5] overflow-hidden rounded-[22px] lg:aspect-[10/11]"
              >
                <Photo
                  src={p.photos[0] ?? null}
                  fallbacks={p.photos.slice(1)}
                  blurhash={p.blurhash}
                  alt=""
                  className="absolute inset-0"
                  imgClassName="transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
                />
                <span className="absolute top-3 left-3 flex h-9 items-center gap-2 rounded-full border border-white/15 bg-black/45 px-3 text-[14px] font-medium text-white backdrop-blur-md">
                  <span className="size-2.5 rounded-full" style={{ background: o.color }} />
                  {o.short}
                </span>
                <span className="absolute inset-x-3 bottom-3 rounded-[16px] border border-white/12 bg-black/55 p-4 backdrop-blur-md">
                  <span className="block truncate text-[20px] font-semibold tracking-tight text-white">{p.name}</span>
                  <span className="mt-1 block text-[14px] text-white/85">
                    <span className="font-semibold text-ipe">{p.compat}%</span> combina com {o.target}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="mt-6 px-5 sm:hidden">
        <Link href="/descobrir" transitionTypes={["nav-forward"]} className="press flex h-11 items-center text-[16px] font-semibold underline decoration-ipe decoration-2 underline-offset-8">
          Ver todas
        </Link>
      </div>
    </section>
  );
}
