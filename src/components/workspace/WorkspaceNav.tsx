"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { chip } from "@/components/ui/styles";

export interface NavItem {
  href: string;
  label: string;
  /** Número pendente (pedidos, lugares para revisar). */
  badge?: number;
}

function isActive(path: string, href: string, root: string) {
  if (href.includes("#")) return false;
  return href === root ? path === root : path.startsWith(href);
}

function Badge({ n }: { n?: number }) {
  if (!n) return null;
  return (
    <span className="grid h-5 min-w-5 place-items-center rounded-full bg-ipe px-1.5 text-[12px] font-semibold text-on-ipe tabular-nums">
      {n}
    </span>
  );
}

/** No celular: pílulas que rolam de lado. No computador: lista vertical na barra lateral. */
export function WorkspaceNav({ items, root, variant }: { items: NavItem[]; root: string; variant: "chips" | "side" }) {
  const path = usePathname();
  if (variant === "chips") {
    return (
      <nav aria-label="Seções" className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5">
        {items.map((l) => {
          const active = isActive(path, l.href, root);
          return (
            <Link key={l.href} href={l.href} aria-current={active ? "page" : undefined} className={chip(active)}>
              {l.label}
              <Badge n={l.badge} />
            </Link>
          );
        })}
      </nav>
    );
  }
  return (
    <nav aria-label="Seções" className="mt-8 flex flex-col gap-1">
      {items.map((l) => {
        const active = isActive(path, l.href, root);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={`flex h-11 items-center justify-between gap-2 rounded-xl px-3 text-[15px] transition-colors ${
              active ? "bg-surface font-semibold text-foreground" : "text-ink-2 hover:bg-surface/60 hover:text-foreground"
            }`}
          >
            <span className="flex items-center gap-3">
              <span className={`h-5 w-1 rounded-full ${active ? "bg-ipe" : "bg-transparent"}`} aria-hidden />
              {l.label}
            </span>
            <Badge n={l.badge} />
          </Link>
        );
      })}
    </nav>
  );
}
