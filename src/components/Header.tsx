import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";

export function Avatar({ name, url, size = 32 }: { name: string; url: string | null; size?: number }) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element -- avatar externo (Google), sem otimização
    return <img src={url} alt="" width={size} height={size} className="rounded-full object-cover" style={{ width: size, height: size }} referrerPolicy="no-referrer" />;
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

export async function Header({ back }: { back?: { href: string; label: string } }) {
  const user = await getCurrentUser();
  return (
    <header className="flex items-center justify-between px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-2">
      {back ? (
        <Link href={back.href} className="-ml-1 flex items-center gap-1 py-2 text-sm font-medium text-muted">
          <span aria-hidden>‹</span> {back.label}
        </Link>
      ) : (
        <Link href="/" className="flex items-center gap-2" aria-label="Kombin, início">
          <span className="grid size-8 place-items-center rounded-lg bg-foreground text-sm font-bold text-background">
            K
          </span>
          <span className="text-xl font-bold tracking-tight">kombin</span>
        </Link>
      )}
      {user ? (
        <Link href="/perfil" aria-label="Seu perfil" className="rounded-full ring-2 ring-surface">
          <Avatar name={user.name} url={user.avatarUrl} />
        </Link>
      ) : (
        <Link href="/entrar" className="rounded-full border border-line bg-surface px-4 py-1.5 text-sm font-semibold">
          Entrar
        </Link>
      )}
    </header>
  );
}
