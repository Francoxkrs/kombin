/**
 * Validação de imagem enviada por usuário, no servidor. Não confia no `type` que o
 * navegador manda: olha os primeiros bytes do arquivo (magic bytes), limita o tamanho
 * e tira os metadados (EXIF com GPS, modelo do aparelho, XMP, comentários) antes de
 * o arquivo ir para o Storage. O navegador já reprocessa a foto no canvas, mas quem
 * chama a ação direto pula essa etapa, então o servidor faz de novo.
 */

export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;

export type ImageType = "image/jpeg" | "image/png" | "image/webp";

export const IMAGE_EXT: Record<ImageType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export class UploadError extends Error {}

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

const ascii = (b: Uint8Array, at: number, len: number) => String.fromCharCode(...b.subarray(at, at + len));

/** Tipo real pelos primeiros bytes; null se não for JPEG, PNG ou WebP. */
export function sniffImageType(b: Uint8Array): ImageType | null {
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b.length >= 8 && PNG_SIGNATURE.every((v, i) => b[i] === v)) return "image/png";
  if (b.length >= 12 && ascii(b, 0, 4) === "RIFF" && ascii(b, 8, 4) === "WEBP") return "image/webp";
  return null;
}

/** JPEG: tira APP1 (EXIF/XMP), APP13 (IPTC) e comentários. Mantém o resto como está. */
function stripJpeg(b: Uint8Array): Uint8Array {
  const out: Uint8Array[] = [b.subarray(0, 2)];
  let i = 2;
  while (i + 4 <= b.length) {
    if (b[i] !== 0xff) throw new UploadError("JPEG corrompido");
    const marker = b[i + 1];
    // Início da imagem comprimida: daqui em diante não há mais segmentos de metadado.
    if (marker === 0xda) {
      out.push(b.subarray(i));
      return concat(out);
    }
    const len = (b[i + 2] << 8) | b[i + 3];
    if (len < 2 || i + 2 + len > b.length) throw new UploadError("JPEG corrompido");
    const drop = marker === 0xe1 || marker === 0xed || marker === 0xfe;
    if (!drop) out.push(b.subarray(i, i + 2 + len));
    i += 2 + len;
  }
  throw new UploadError("JPEG corrompido");
}

/** PNG: tira os blocos de texto, data e EXIF. */
function stripPng(b: Uint8Array): Uint8Array {
  const DROP = new Set(["eXIf", "tEXt", "zTXt", "iTXt", "tIME"]);
  const out: Uint8Array[] = [b.subarray(0, 8)];
  let i = 8;
  while (i + 12 <= b.length) {
    const len = ((b[i] << 24) | (b[i + 1] << 16) | (b[i + 2] << 8) | b[i + 3]) >>> 0;
    const type = ascii(b, i + 4, 4);
    const end = i + 12 + len;
    if (end > b.length) throw new UploadError("PNG corrompido");
    if (!DROP.has(type)) out.push(b.subarray(i, end));
    i = end;
    if (type === "IEND") return concat(out);
  }
  throw new UploadError("PNG corrompido");
}

/** WebP: tira os blocos EXIF e XMP e desliga os avisos deles no cabeçalho VP8X. */
function stripWebp(b: Uint8Array): Uint8Array {
  const out: Uint8Array[] = [];
  let i = 12;
  while (i + 8 <= b.length) {
    const type = ascii(b, i, 4);
    const len = (b[i + 4] | (b[i + 5] << 8) | (b[i + 6] << 16) | (b[i + 7] << 24)) >>> 0;
    const end = i + 8 + len + (len % 2);
    if (i + 8 + len > b.length) throw new UploadError("WebP corrompido");
    if (type !== "EXIF" && type !== "XMP ") {
      const chunk = b.slice(i, Math.min(end, b.length));
      if (type === "VP8X" && chunk.length > 8) chunk[8] &= ~(0x08 | 0x04);
      out.push(chunk);
    }
    i = end;
  }
  const body = concat(out);
  const header = new Uint8Array(12);
  header.set(b.subarray(0, 12));
  const size = body.length + 4;
  header[4] = size & 0xff;
  header[5] = (size >> 8) & 0xff;
  header[6] = (size >> 16) & 0xff;
  header[7] = (size >> 24) & 0xff;
  return concat([header, body]);
}

function concat(parts: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let at = 0;
  for (const p of parts) {
    out.set(p, at);
    at += p.length;
  }
  return out;
}

/** Bytes sem metadados, conferindo que são mesmo do tipo indicado. */
export function stripImageMetadata(bytes: Uint8Array, type: ImageType): Uint8Array {
  if (type === "image/jpeg") return stripJpeg(bytes);
  if (type === "image/png") return stripPng(bytes);
  return stripWebp(bytes);
}

/**
 * Valida e limpa uma foto enviada por formulário. Devolve os bytes limpos e o tipo
 * real (use estes no upload, nunca `file.type` ou o nome do arquivo do usuário).
 */
export async function readImageUpload(file: File): Promise<{ bytes: Uint8Array; type: ImageType; ext: string }> {
  if (file.size === 0) throw new UploadError("Arquivo vazio");
  if (file.size > MAX_UPLOAD_BYTES) throw new UploadError("A foto precisa ter até 2 MB");
  const raw = new Uint8Array(await file.arrayBuffer());
  const type = sniffImageType(raw);
  if (!type) throw new UploadError("Envie uma foto JPG, PNG ou WebP");
  return { bytes: stripImageMetadata(raw, type), type, ext: IMAGE_EXT[type] };
}
