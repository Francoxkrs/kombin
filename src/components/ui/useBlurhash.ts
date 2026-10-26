"use client";

import { decode } from "blurhash";
import { useMemo, useSyncExternalStore } from "react";

const cache = new Map<string, string | null>();
const noop = () => () => {};

function toDataUrl(hash: string): string | null {
  if (cache.has(hash)) return cache.get(hash)!;
  let out: string | null = null;
  try {
    const size = 32;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    const data = ctx.createImageData(size, size);
    data.data.set(decode(hash, size, size));
    ctx.putImageData(data, 0, 0);
    out = canvas.toDataURL();
  } catch {
    // Hash inválido: fica sem prévia.
  }
  cache.set(hash, out);
  return out;
}

/** BlurHash virando uma imagem de 32 px (data URL) para ficar atrás da foto enquanto ela carrega. Só no navegador. */
export function useBlurhash(hash: string | null | undefined): string | null {
  const browser = useSyncExternalStore(noop, () => true, () => false);
  return useMemo(() => (browser && hash ? toDataUrl(hash) : null), [browser, hash]);
}
