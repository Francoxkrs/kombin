"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Descobrir", match: (p: string) => p === "/" },
  { href: "/buscar", label: "Buscar", match: (p: string) => p.startsWith("/buscar") },
  { href: "/perfil", label: "Você", match: (p: string) => p.startsWith("/perfil") },
];

/** Telas com barra de ação própria no rodapé (filtros, ranking, lugar, votação, login) não mostram a navegação. */
const HIDDEN = ["/buscar", "/o/", "/l/", "/v/", "/admin", "/painel", "/auth", "/entrar", "/redefinir-senha"];

/** Navegação principal: texto, sem ícone, colada no rodapé. */
export function TabBar() {
  const pathname = usePathname();
  if (HIDDEN.some((h) => pathname.startsWith(h))) return null;
  const activeIndex = TABS.findIndex((t) => t.match(pathname));

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed bottom-0 left-1/2 z-40 grid w-full max-w-md -translate-x-1/2 grid-cols-3 bg-background pb-[env(safe-area-inset-bottom)]"
      style={{ viewTransitionName: "tabbar" }}
    >
      {TABS.map((t, i) => {
        const active = i === activeIndex;
        return (
          <Link
            key={t.href}
            href={t.href}
            transitionTypes={[i > activeIndex ? "nav-forward" : "nav-back"]}
            aria-current={active ? "page" : undefined}
            className={`grid h-16 place-items-center text-[15px] ${active ? "font-semibold text-foreground" : "text-muted"}`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
