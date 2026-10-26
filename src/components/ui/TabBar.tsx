"use client";

import { Compass, Search, UserRound } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Descobrir", icon: Compass, match: (p: string) => p === "/" },
  { href: "/buscar", label: "Buscar", icon: Search, match: (p: string) => p.startsWith("/buscar") },
  { href: "/perfil", label: "Você", icon: UserRound, match: (p: string) => p.startsWith("/perfil") },
];

/**
 * Telas com barra de ação própria no rodapé (filtros, ranking, lugar, votação, login)
 * não mostram o dock: nunca duas barras flutuantes ao mesmo tempo.
 */
const HIDDEN = ["/buscar", "/o/", "/l/", "/v/", "/admin", "/painel", "/auth", "/entrar", "/redefinir-senha", "/conceitos"];

export function TabBar() {
  const pathname = usePathname();
  if (HIDDEN.some((h) => pathname.startsWith(h))) return null;
  const activeIndex = TABS.findIndex((t) => t.match(pathname));

  return (
    <>
      <div aria-hidden className="dock-scrim" />
      <nav
        aria-label="Navegação principal"
        className="fixed left-1/2 z-40 -translate-x-1/2"
        style={{ bottom: "max(1.25rem, env(safe-area-inset-bottom))", viewTransitionName: "tabbar" }}
      >
        <ul className="flex items-center gap-1 rounded-full border border-white/10 bg-[#111111]/90 px-2 py-2 text-white shadow-2xl backdrop-blur-xl">
          {TABS.map((t, i) => {
            const active = i === activeIndex;
            const Icon = t.icon;
            return (
              <li key={t.href}>
                <Link
                  href={t.href}
                  transitionTypes={[i > activeIndex ? "nav-forward" : "nav-back"]}
                  aria-current={active ? "page" : undefined}
                  aria-label={t.label}
                  className="press relative flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium"
                >
                  {active && (
                    <motion.span
                      layoutId="tab-pill"
                      className="absolute inset-0 rounded-full bg-[#fbf9f5]"
                      transition={{ type: "spring", stiffness: 500, damping: 38 }}
                    />
                  )}
                  <Icon className={`relative size-[18px] ${active ? "text-[#111111]" : "text-white/70"}`} strokeWidth={1.5} />
                  {active && <span className="relative text-[#111111]">{t.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
