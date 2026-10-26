import Link from "next/link";

/** Marca quadrada (ícone do app, e-mails). */
export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden>
      <rect width="40" height="40" rx="10" fill="#111111" />
      <path d="M13 10h5.2v8.6L25.6 10H32l-8.3 9.3L32.4 30h-6.5l-5.9-7.6-1.8 2V30H13V10z" fill="#fbf9f5" />
      <circle cx="32" cy="31" r="2.6" fill="#10b981" />
    </svg>
  );
}

/** Logo tipográfico: "kombin" com o ponto esmeralda. */
export function Wordmark({ className = "text-[1.45rem]" }: { className?: string }) {
  return (
    <span className={`font-bold leading-none tracking-[-0.06em] text-foreground ${className}`}>
      kombin<span className="text-[#10b981]">.</span>
    </span>
  );
}

export function Logo() {
  return (
    <Link href="/" transitionTypes={["nav-back"]} className="press flex items-center" aria-label="Kombin, início">
      <Wordmark />
    </Link>
  );
}
