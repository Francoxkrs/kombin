import Link from "next/link";
import { Wordmark } from "../ui/Logo";

export function HomeFooter() {
  return (
    <footer className="border-t border-line pb-[calc(env(safe-area-inset-bottom)+7rem)] pt-14 lg:pb-14">
      <div className="mx-auto flex max-w-[1240px] flex-col gap-8 px-5 sm:px-8 lg:flex-row lg:items-end lg:justify-between lg:px-10">
        <div>
          <Wordmark height={30} />
          <p className="mt-4 max-w-[34ch] text-[15px] leading-[1.6] text-muted">Lugares que combinam com você. Feito em Campo Grande, MS.</p>
        </div>
        <nav aria-label="Rodapé" className="flex flex-wrap gap-x-8 gap-y-2 text-[15px] font-medium text-ink-2">
          <Link href="/descobrir" className="flex h-11 items-center hover:text-foreground">Descobrir</Link>
          <Link href="/restaurantes" className="flex h-11 items-center hover:text-foreground">Para restaurantes</Link>
          <Link href="/privacidade" className="flex h-11 items-center hover:text-foreground">Privacidade</Link>
        </nav>
      </div>
    </footer>
  );
}
