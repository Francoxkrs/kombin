import Link from "next/link";
import { K_STEM, K_TIP, WORD_OMBIN, WORDMARK_RATIO, WORDMARK_VIEWBOX } from "./brand-paths";

/**
 * Marca Kombin, rota Encaixe: o K tem duas peças. A haste (leite) tem um recorte e a
 * ponta (ipê) entra nele com uma folga. A ponta é sempre a cor de destaque.
 */

/** Símbolo: só o K. Em fundo noite, para votação, e-mails e ícones. */
export function LogoMark({ size = 36, tile = true }: { size?: number; tile?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" aria-hidden>
      {tile && <rect width="512" height="512" rx="112" fill="#2a1b12" />}
      <g transform="translate(119.2 406) scale(0.4412)">
        <path d={K_STEM} fill="#f6f0e6" />
        <path d={K_TIP} fill="#ffc81e" />
      </g>
    </svg>
  );
}

/**
 * Assinatura: K + "ombin" em curvas. `encaixe` faz a ponta entrar no recorte uma vez,
 * a única animação da marca (desligada com movimento reduzido).
 */
export function Wordmark({ height = 26, encaixe = false }: { height?: number; encaixe?: boolean }) {
  return (
    <svg
      viewBox={WORDMARK_VIEWBOX}
      height={height}
      width={Math.round(height * WORDMARK_RATIO)}
      role="img"
      aria-label="Kombin"
      className="block"
    >
      <path d={K_STEM} className="fill-foreground" />
      <path d={K_TIP} className={`fill-ipe ${encaixe ? "k-encaixe" : ""}`} />
      <path d={WORD_OMBIN} className="fill-foreground" />
    </svg>
  );
}

export function Logo() {
  return (
    <Link href="/" transitionTypes={["nav-back"]} className="press flex h-11 items-center" aria-label="Kombin, início">
      <Wordmark />
    </Link>
  );
}
