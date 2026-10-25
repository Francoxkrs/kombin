import Link from "next/link";

export function Header({ back }: { back?: { href: string; label: string } }) {
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
    </header>
  );
}
