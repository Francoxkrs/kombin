import { ChevronLeft, MapPin, UserRound } from "lucide-react";
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
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}

export async function AccountButton() {
  const user = await getCurrentUser();
  return user ? (
    <Link href="/perfil" aria-label="Seu perfil" className="press rounded-full ring-2 ring-background">
      <Avatar name={user.name} url={user.avatarUrl} size={34} />
    </Link>
  ) : (
    <Link
      href="/entrar"
      aria-label="Entrar"
      className="press grid size-[34px] place-items-center rounded-full border border-line bg-surface text-foreground"
    >
      <UserRound className="size-[18px]" strokeWidth={1.5} />
    </Link>
  );
}

/** Seletor de cidade (por enquanto só Campo Grande). */
export function CityPill() {
  return (
    <span className="flex items-center gap-1 rounded-full bg-soft px-3 py-1.5 text-xs font-medium whitespace-nowrap text-ink-2">
      <MapPin className="size-3.5" strokeWidth={1.5} /> Campo Grande
    </span>
  );
}

/** Barra do topo: logo + cidade no início; nas outras telas, botão de voltar. */
export function TopBar({
  back,
  right,
  city = false,
}: {
  back?: { href: string; label?: string };
  right?: React.ReactNode;
  city?: boolean;
}) {
  return (
    <header className="flex items-center justify-between gap-3 px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-2">
      {back ? (
        <Link
          href={back.href}
          transitionTypes={["nav-back"]}
          className="press -ml-2 flex items-center gap-0.5 rounded-full py-2 pr-3 pl-1 text-sm font-medium text-ink-2"
        >
          <ChevronLeft className="size-5" strokeWidth={1.5} />
          {back.label ?? "Voltar"}
        </Link>
      ) : (
        <Logo />
      )}
      <div className="flex items-center gap-2">
        {city && <CityPill />}
        {right ?? <AccountButton />}
      </div>
    </header>
  );
}

/** Botão redondo de vidro escuro, para ficar por cima de foto. */
export function GlassButton({
  children,
  label,
  className = "",
}: {
  children: React.ReactNode;
  label: string;
  className?: string;
}) {
  return (
    <span
      aria-label={label}
      className={`press grid size-10 place-items-center rounded-full bg-black/40 text-white backdrop-blur-md ${className}`}
    >
      {children}
    </span>
  );
}
