"use client";

import { usePathname } from "next/navigation";

const TITLES: [string, string][] = [
  ["/admin/lugares", "Lugares"],
  ["/admin/donos", "Donos"],
  ["/admin/usuarios", "Usuários"],
  ["/admin/importar", "Importar"],
  ["/admin/historico", "Histórico"],
];

/** Título da tela do admin, pelo endereço (o layout é um só para todas). */
export function AdminTitle() {
  const path = usePathname();
  return <>{TITLES.find(([p]) => path.startsWith(p))?.[1] ?? "Visão geral"}</>;
}
