import { ArrowLeft, UserRound } from "lucide-react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { Logo } from "./Logo";

export function Avatar({ name, url, size = 36 }: { name: string; url: string | null; size?: number }) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- avatar externo (Google), sem otimização
      <img
        src={url}
        alt=""
        width={size}
        height={size}
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
        referrerPolicy="no-referrer"
      />
    );
  }
  return (
    <span
      className="grid place-items-center rounded-full bg-foreground font-semibold text-background"
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}

export async function AccountButton() {
  const user = await getCurrentUser();
  return user ? (
    <Link href="/perfil" aria-label="Seu perfil" className="press grid size-11 place-items-center">
      <Avatar name={user.name} url={user.avatarUrl} size={34} />
    </Link>
  ) : (
    <Link href="/entrar" className="press flex h-11 items-center gap-2 text-[15px] font-medium">
      <UserRound className="size-5" strokeWidth={1.75} /> Entrar
    </Link>
  );
}

/** Barra do topo: marca no início; nas outras telas, voltar com o nome de onde volta. */
export function TopBar({ back, right }: { back?: { href: string; label?: string }; right?: React.ReactNode }) {
  return (
    <header className="flex items-center justify-between gap-3 px-5 pt-[max(0.75rem,env(safe-area-inset-top))] pb-1">
      {back ? (
        <Link
          href={back.href}
          transitionTypes={["nav-back"]}
          className="press -ml-1 flex h-11 items-center gap-2 pr-3 text-[16px] font-medium"
        >
          <ArrowLeft className="size-5" strokeWidth={2} />
          {back.label ?? "Voltar"}
        </Link>
      ) : (
        <Logo />
      )}
      {right ?? <AccountButton />}
    </header>
  );
}
