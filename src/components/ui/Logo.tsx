import Link from "next/link";

/** Marca redonda (votação, e-mails): o "k" em ipê sobre a noite. */
export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden>
      <circle cx="20" cy="20" r="20" fill="#ffc81e" />
      <path d="M13 10h5.2v8.6L25.6 10H32l-8.3 9.3L32.4 30h-6.5l-5.9-7.6-1.8 2V30H13V10z" fill="#1a1008" />
    </svg>
  );
}

export function Wordmark({ className = "text-[26px]" }: { className?: string }) {
  return <span className={`leading-none font-bold tracking-[-0.04em] text-foreground ${className}`}>kombin</span>;
}

export function Logo() {
  return (
    <Link href="/" transitionTypes={["nav-back"]} className="press flex h-11 items-center" aria-label="Kombin, início">
      <Wordmark />
    </Link>
  );
}
