"use client";

import { Compass, Search, UserRound } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Descobrir", icon: Compass, match: (p: string) => p === "/" || p.startsWith("/o/") },
  { href: "/buscar", label: "Buscar", icon: Search, match: (p: string) => p.startsWith("/buscar") },
  { href: "/perfil", label: "Você", icon: UserRound, match: (p: string) => p.startsWith("/perfil") || p.startsWith("/entrar") },
];

/** Telas com barra de ação própria no rodapé não mostram as abas. */
const HIDDEN = ["/o/", "/l/", "/v/", "/admin", "/painel", "/auth", "/entrar"];

export function TabBar() {
  const pathname = usePathname();
  if (HIDDEN.some((h) => pathname.startsWith(h))) return null;
  const activeIndex = TABS.findIndex((t) => t.match(pathname));

  return (
    <nav
      aria-label="Navegação principal"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-md justify-center px-5 pb-[max(0.9rem,env(safe-area-inset-bottom))]"
      style={{ viewTransitionName: "tabbar" }}
    >
      <ul className="pointer-events-auto flex gap-1 rounded-full border border-white/60 bg-white/75 p-1.5 shadow-[0_18px_50px_-18px_rgba(0,0,0,0.45)] backdrop-blur-xl backdrop-saturate-150">
        {TABS.map((t, i) => {
          const active = i === activeIndex;
          const Icon = t.icon;
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                transitionTypes={[i > activeIndex ? "nav-forward" : "nav-back"]}
                aria-current={active ? "page" : undefined}
                className="press relative flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold"
              >
                {active && (
                  <motion.span
                    layoutId="tab-pill"
                    className="absolute inset-0 rounded-full bg-foreground"
                    transition={{ type: "spring", stiffness: 500, damping: 38 }}
                  />
                )}
                <Icon className={`relative size-[1.15rem] ${active ? "text-white" : "text-ink-2"}`} strokeWidth={2.2} />
                <span className={`relative ${active ? "text-white" : "sr-only"}`}>{t.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
