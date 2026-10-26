import Link from "next/link";

export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden>
      <rect width="40" height="40" rx="10" fill="#0b0b0c" />
      <path d="M13 10h5.2v8.6L25.6 10H32l-8.3 9.3L32.4 30h-6.5l-5.9-7.6-1.8 2V30H13V10z" fill="#fff" />
    </svg>
  );
}

export function Logo() {
  return (
    <Link href="/" transitionTypes={["nav-back"]} className="press flex items-center gap-2" aria-label="Kombin, início">
      <LogoMark />
      <span className="text-[1.6rem] leading-none font-extrabold tracking-[-0.05em]">kombin</span>
    </Link>
  );
}
