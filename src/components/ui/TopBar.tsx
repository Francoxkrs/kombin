import { ChevronLeft, MapPin } from "lucide-react";
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
      className="grid place-items-center rounded-full bg-foreground font-bold text-white"
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}

export async function AccountButton() {
  const user = await getCurrentUser();
  return user ? (
    <Link href="/perfil" aria-label="Seu perfil" className="press rounded-full ring-2 ring-white">
      <Avatar name={user.name} url={user.avatarUrl} />
    </Link>
  ) : (
    <Link
      href="/entrar"
      className="press rounded-full border border-line bg-white px-4 py-2 text-sm font-bold"
    >
      Entrar
    </Link>
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
          className="press -ml-2 flex items-center gap-0.5 rounded-full py-2 pr-3 pl-1 text-[0.95rem] font-semibold"
        >
          <ChevronLeft className="size-5" strokeWidth={2.4} />
          {back.label ?? "Voltar"}
        </Link>
      ) : (
        <Logo />
      )}
      <div className="flex items-center gap-2">
        {city && (
          <span className="flex items-center gap-1 rounded-full bg-soft px-3 py-2 text-[0.8rem] font-semibold whitespace-nowrap">
            <MapPin className="size-3.5" strokeWidth={2.4} /> Campo Grande
          </span>
        )}
        {right ?? <AccountButton />}
      </div>
    </header>
  );
}

/** Botão redondo de vidro, para ficar por cima de foto. */
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
      className={`press grid size-11 place-items-center rounded-full bg-white/80 text-foreground shadow-[0_8px_24px_-10px_rgba(0,0,0,0.5)] backdrop-blur-md ${className}`}
    >
      {children}
    </span>
  );
}
