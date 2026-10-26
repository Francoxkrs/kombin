/**
 * Só aceita caminhos internos no ?next= (evita redirecionar para outro site).
 * "/\\evil.com" e "/\tevil.com" passavam no teste antigo e o navegador lê como
 * "//evil.com"; por isso confere de novo depois de montar a URL.
 */
export function safeNext(next: string | null | undefined, fallback = "/"): string {
  if (!next || !next.startsWith("/") || /[\\\u0000-\u001f\u007f]/.test(next)) return fallback;
  const base = "https://kombin.invalid";
  try {
    const url = new URL(next, base);
    return url.origin === base ? `${url.pathname}${url.search}${url.hash}` : fallback;
  } catch {
    return fallback;
  }
}
