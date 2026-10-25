import Link from "next/link";
import { Header } from "@/components/Header";
import { ReviewPrompt } from "@/components/ReviewPrompt";
import { OCCASIONS } from "@/lib/occasions";
import { getRepo } from "@/lib/repo";

function greeting(now: Date): string {
  // Horário de Campo Grande (UTC-4).
  const h = (now.getUTCHours() + 20) % 24;
  const day = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"][
    new Date(now.getTime() - 4 * 3_600_000).getUTCDay()
  ];
  if (h < 11) return `${day} de manhã`;
  if (h < 17) return `${day} à tarde`;
  return `${day} à noite`;
}

export default async function Home() {
  const repo = getRepo();
  const now = new Date();
  return (
    <>
      <Header />
      <main className="flex-1 px-5 pb-10">
        <p className="mt-4 text-sm font-medium text-muted">{greeting(now)} · Campo Grande</p>
        <h1 className="mt-1 text-[2.6rem] leading-[1.02] font-bold tracking-tight">
          Qual é a ocasião?
        </h1>
        <p className="mt-2 text-muted">Um toque e a gente mostra os 3 lugares que mais combinam.</p>

        <ul className="mt-7 grid grid-cols-2 gap-3">
          {OCCASIONS.map((o, i) => (
            <li key={o.slug} className={i === 0 ? "col-span-2" : ""}>
              <Link
                href={`/o/${o.slug}`}
                className="animate-rise flex h-full flex-col justify-end overflow-hidden rounded-3xl p-4 text-white transition active:scale-[0.98]"
                style={{
                  animationDelay: `${i * 50}ms`,
                  minHeight: i === 0 ? "11rem" : "9.5rem",
                  background: `radial-gradient(130% 100% at 0% 0%, ${o.color}b3, ${o.color} 60%, #151413 160%)`,
                }}
              >
                <span className={`font-bold tracking-tight ${i === 0 ? "text-3xl" : "text-xl leading-tight"}`}>
                  {o.name}
                </span>
                {i === 0 && <span className="mt-1 text-sm text-white/80">{o.tagline}</span>}
              </Link>
            </li>
          ))}
        </ul>

        {repo.mode === "demo" && (
          <p className="mt-8 rounded-2xl border border-dashed border-line p-4 text-xs text-muted">
            Modo demonstração: lugares fictícios e dados em memória. Configure o Supabase no
            .env.local para usar a base real.
          </p>
        )}
      </main>
      <ReviewPrompt />
    </>
  );
}
