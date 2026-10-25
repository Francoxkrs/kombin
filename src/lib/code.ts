// Sem 0/O/1/I/L para o código ser fácil de ditar.
const ALPHABET = "23456789abcdefghjkmnpqrstuvwxyz";

/** Código curto e aleatório para o link de votação (ex.: kombin.app/v/k7m2qx). */
export function newCode(length = 6): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}
