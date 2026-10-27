import Link from "next/link";
import { Wordmark } from "@/components/ui/Logo";
import { TopBar } from "@/components/ui/TopBar";
import { type NavItem, WorkspaceNav } from "./WorkspaceNav";

/**
 * Moldura das telas de gestão (admin e painel do restaurante). No celular segue o app:
 * barra do topo e pílulas. No computador, ocupa a tela toda com barra lateral; o
 * data-wide libera a largura que o layout raiz limita ao tamanho de celular.
 */
export function Shell({
  area,
  title,
  nav,
  root,
  sidebar,
  actions,
  children,
}: {
  /** "Admin" ou "Painel do restaurante". */
  area: string;
  title: React.ReactNode;
  nav: NavItem[];
  /** Rota da primeira aba, para marcar a ativa. */
  root: string;
  /** Conteúdo extra da barra lateral, acima da navegação (troca de restaurante). */
  sidebar?: React.ReactNode;
  /** Botões ao lado do título. */
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div data-wide className="min-h-dvh lg:grid lg:grid-cols-[264px_minmax(0,1fr)]">
      <aside className="hidden border-r border-line px-5 py-7 lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:overflow-y-auto">
        <Link href="/" aria-label="Kombin, voltar ao app" className="press self-start">
          <Wordmark height={26} />
        </Link>
        <p className="mt-2 text-[14px] text-muted">{area}</p>
        {sidebar}
        {nav.length > 0 && <WorkspaceNav items={nav} root={root} variant="side" />}
        <div className="mt-auto space-y-1 pt-8 text-[15px]">
          <Link href="/perfil" className="flex h-11 items-center rounded-xl px-3 text-ink-2 hover:bg-surface/60 hover:text-foreground">
            Sua conta
          </Link>
          <Link href="/" className="flex h-11 items-center rounded-xl px-3 text-ink-2 hover:bg-surface/60 hover:text-foreground">
            Abrir o app
          </Link>
        </div>
      </aside>

      <div className="min-w-0">
        <div className="lg:hidden">
          <TopBar back={{ href: "/perfil", label: "Você" }} />
          <div className="px-5 pt-2">
            <p className="text-[15px] text-muted">{area}</p>
            <h1 className="title text-[40px] leading-[1.05] text-balance">{title}</h1>
            {actions && <div className="mt-4 flex flex-wrap gap-2">{actions}</div>}
            {sidebar && <div className="mt-4">{sidebar}</div>}
            {nav.length > 0 && (
              <div className="mt-5">
                <WorkspaceNav items={nav} root={root} variant="chips" />
              </div>
            )}
          </div>
        </div>
        <header className="hidden items-end justify-between gap-6 px-10 pt-10 lg:flex">
          <h1 className="title text-[48px] leading-none text-balance">{title}</h1>
          {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
        </header>
        <main className="max-w-[1240px] px-5 pt-6 pb-16 lg:px-10 lg:pt-8">{children}</main>
      </div>
    </div>
  );
}

/** Bloco de conteúdo dos painéis: superfície, título e o resto. */
export function Panel({
  title,
  hint,
  id,
  children,
  className = "",
}: {
  title?: string;
  hint?: React.ReactNode;
  id?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`scroll-mt-6 rounded-2xl bg-surface p-5 lg:p-6 ${className}`}>
      {title && <h2 className="text-[20px] font-semibold tracking-tight">{title}</h2>}
      {hint && <p className="mt-1 text-[15px] leading-snug text-muted">{hint}</p>}
      <div className={title || hint ? "mt-5" : ""}>{children}</div>
    </section>
  );
}

/** Número grande com legenda e, quando há base, a variação contra o período anterior. */
export function Stat({ n, label, delta }: { n: number | string; label: string; delta?: number | null }) {
  return (
    <div className="flex flex-col-reverse justify-end rounded-2xl bg-surface p-5">
      <dt className="mt-2 text-[15px] leading-snug text-muted">
        {label}
        {delta != null && (
          <span className={`mt-1 block text-[13px] ${delta > 0 ? "text-ipe" : "text-ink-2"}`}>
            {delta > 0 ? "+" : ""}
            {delta}% contra os 30 dias antes
          </span>
        )}
      </dt>
      <dd className="title text-[44px] leading-none tabular-nums">{n}</dd>
    </div>
  );
}
