"use client";

import { encode } from "blurhash";

/**
 * Prepara a foto no próprio celular antes de subir, para caber no 1 GB grátis do Supabase:
 * - lado maior de no máximo 1200 px;
 * - WebP (JPEG no Safari antigo, que não gera WebP) baixando a qualidade até o alvo de tamanho;
 * - redesenhar no canvas descarta EXIF, GPS e o resto dos metadados;
 * - BlurHash de 4x3 para a prévia desfocada que aparece enquanto a foto carrega.
 */

export interface OptimizedImage {
  file: File;
  blurhash: string;
  width: number;
  height: number;
}

const MAX_SIDE = 1200;
const QUALITIES = [0.82, 0.72, 0.62, 0.52, 0.42];

/** Alvo de tamanho: capa ~150 KB; cardápio pode ir a ~260 KB para o texto continuar legível. */
export const TARGET_BYTES = { cover: 150 * 1024, menu: 260 * 1024 } as const;

async function decode(file: File): Promise<ImageBitmap | HTMLImageElement> {
  // createImageBitmap já gira a foto pelo EXIF; o <img> é o plano B de navegador antigo.
  if ("createImageBitmap" in window) {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      // HEIC e afins: cai no <img>, que o Safari sabe abrir.
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

const toBlob = (canvas: HTMLCanvasElement, type: string, quality: number) =>
  new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));

function blurhashOf(source: CanvasImageSource, width: number, height: number): string {
  const w = 32;
  const h = Math.max(1, Math.round((32 * height) / width));
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  ctx.drawImage(source, 0, 0, w, h);
  return encode(ctx.getImageData(0, 0, w, h).data, w, h, 4, 3);
}

export async function optimizeImage(file: File, targetBytes: number = TARGET_BYTES.cover): Promise<OptimizedImage> {
  const source = await decode(file);
  const srcW = "naturalWidth" in source ? source.naturalWidth : source.width;
  const srcH = "naturalHeight" in source ? source.naturalHeight : source.height;
  if (!srcW || !srcH) throw new Error("Não deu para abrir essa foto.");

  const scale = Math.min(1, MAX_SIDE / Math.max(srcW, srcH));
  const width = Math.round(srcW * scale);
  const height = Math.round(srcH * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  // Fundo branco para PNG transparente não virar preto no JPEG.
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, width, height);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, width, height);
  if ("close" in source) source.close();

  let blob: Blob | null = null;
  for (const q of QUALITIES) {
    blob = await toBlob(canvas, "image/webp", q);
    // Safari que não gera WebP devolve PNG: troca para JPEG.
    if (!blob || blob.type !== "image/webp") blob = await toBlob(canvas, "image/jpeg", q);
    if (blob && blob.size <= targetBytes) break;
  }
  if (!blob) throw new Error("Não deu para preparar essa foto.");

  const ext = blob.type === "image/webp" ? "webp" : "jpg";
  return {
    file: new File([blob], `foto.${ext}`, { type: blob.type }),
    blurhash: blurhashOf(canvas, width, height),
    width,
    height,
  };
}
