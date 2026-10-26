/** "67 99999-9999" → "5567999999999" (formato do wa.me). Vazio ou inválido → null. */
export function normalizeWhatsapp(raw: FormDataEntryValue | string | null): string | null {
  let digits = String(raw ?? "").replace(/\D/g, "");
  if (digits.length === 10 || digits.length === 11) digits = `55${digits}`;
  return digits.length >= 12 && digits.length <= 13 ? digits : null;
}
