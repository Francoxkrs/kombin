"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { chip } from "@/components/ui/styles";

const LINKS = [
  { href: "/admin", label: "Visão geral" },
  { href: "/admin/lugares", label: "Lugares" },
  { href: "/admin/donos", label: "Donos" },
  { href: "/admin/usuarios", label: "Usuários" },
  { href: "/admin/importar", label: "Importar" },
  { href: "/admin/historico", label: "Histórico" },
];

export function AdminNav({ badges }: { badges: Record<string, number> }) {
  const path = usePathname();
  return (
    <nav aria-label="Seções do admin" className="no-scrollbar -mx-5 mt-5 flex gap-2 overflow-x-auto px-5">
      {LINKS.map((l) => {
        const active = l.href === "/admin" ? path === "/admin" : path.startsWith(l.href);
        const n = badges[l.href] ?? 0;
        return (
          <Link key={l.href} href={l.href} aria-current={active ? "page" : undefined} className={chip(active)}>
            {l.label}
            {n > 0 && (
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-ipe px-1.5 text-[12px] font-semibold text-on-ipe">
                {n}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
