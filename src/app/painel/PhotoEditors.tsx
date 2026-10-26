"use client";

import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { Photo } from "@/components/ui/Photo";
import { btn, BTN_IPE } from "@/components/ui/styles";
import { optimizeImage, TARGET_BYTES } from "@/lib/image-client";
import type { MenuPhoto } from "@/lib/types";
import { addMenuPage, editMenuPage, saveCover } from "./actions";

const kb = (n: number) => (n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1).replace(".", ",")} MB` : `${Math.round(n / 1024)} KB`);

/** Lê a foto do celular aceitando HEIC do iPhone, que o navegador converte ao abrir. */
const ACCEPT = "image/*";

export function CoverEditor({
  placeId,
  current,
  blurhash,
}: {
  placeId: string;
  current: string | null;
  blurhash: string | null;
}) {
  const [ready, setReady] = useState<{ file: File; blurhash: string; preview: string; from: number } | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => () => {
    if (ready) URL.revokeObjectURL(ready.preview);
  }, [ready]);

  async function pick(file: File | undefined) {
    if (!file) return;
    setError(null);
    setStatus("Preparando a foto…");
    try {
      const out = await optimizeImage(file, TARGET_BYTES.cover);
      setReady({ file: out.file, blurhash: out.blurhash, preview: URL.createObjectURL(out.file), from: file.size });
      setStatus(null);
    } catch {
      setStatus(null);
      setError("Não deu para abrir essa foto. Tente outra.");
    }
  }

  function save() {
    if (!ready) return;
    const fd = new FormData();
    fd.set("placeId", placeId);
    fd.set("cover", ready.file);
    fd.set("blurhash", ready.blurhash);
    start(async () => {
      const res = await saveCover(fd);
      if (res.ok) {
        setReady(null);
        setStatus("Capa trocada.");
      } else setError(res.error);
    });
  }

  return (
    <div>
      <Photo
        src={ready?.preview ?? current}
        blurhash={ready ? ready.blurhash : blurhash}
        alt="Foto de capa"
        className="aspect-[4/5] w-full"
      />
      <input ref={input} type="file" accept={ACCEPT} className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
      {ready && (
        <p className="mt-3 text-[15px] text-muted">
          Reduzida de {kb(ready.from)} para {kb(ready.file.size)}, sem a localização da foto.
        </p>
      )}
      {status && <p className="mt-3 text-[15px] text-muted" role="status">{status}</p>}
      {error && <p className="mt-3 text-[15px] text-danger" role="alert">{error}</p>}
      <div className="mt-4 flex gap-2">
        <button type="button" onClick={() => input.current?.click()} className={`${btn(ready ? "quiet" : "light")} flex-1`} disabled={pending}>
          {current || ready ? "Escolher outra" : "Escolher foto"}
        </button>
        {ready && (
          <button type="button" onClick={save} className={`${BTN_IPE} flex-1`} disabled={pending}>
            {pending ? "Salvando…" : "Usar esta"}
          </button>
        )}
      </div>
    </div>
  );
}

export function MenuEditor({ placeId, pages, max }: { placeId: string; pages: MenuPhoto[]; max: number }) {
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pending, start] = useTransition();
  const input = useRef<HTMLInputElement>(null);
  const room = max - pages.length;

  async function add(list: FileList | null) {
    const files = [...(list ?? [])].slice(0, room);
    if (input.current) input.current.value = "";
    if (files.length === 0) return;
    setError(null);
    setBusy(true);
    let sent = 0;
    let bytes = 0;
    try {
      for (const [i, file] of files.entries()) {
        setProgress(`Enviando página ${i + 1} de ${files.length}…`);
        const out = await optimizeImage(file, TARGET_BYTES.menu);
        const fd = new FormData();
        fd.set("placeId", placeId);
        fd.set("page", out.file);
        fd.set("meta", JSON.stringify({ blurhash: out.blurhash, w: out.width, h: out.height }));
        const res = await addMenuPage(fd);
        if (!res.ok) {
          setError(res.error);
          break;
        }
        sent++;
        bytes += out.file.size;
      }
    } catch {
      setError("Não deu para abrir uma das fotos. Tente outra.");
    }
    setBusy(false);
    setProgress(sent > 0 ? `${sent} ${sent === 1 ? "página enviada" : "páginas enviadas"} (${kb(bytes)} no total).` : null);
  }

  function edit(url: string, op: "remove" | "up" | "down") {
    if (op === "remove" && !confirm("Tirar esta página do cardápio?")) return;
    start(async () => {
      const res = await editMenuPage(placeId, url, op);
      if (!res.ok) setError(res.error);
    });
  }

  return (
    <div>
      {pages.length > 0 && (
        <ol className="grid grid-cols-3 gap-1">
          {pages.map((p, i) => (
            <li key={p.url} className="relative">
              <Photo src={p.url} blurhash={p.blurhash} alt={`Página ${i + 1} do cardápio`} className="aspect-[3/4] w-full" />
              <span className="absolute top-1.5 left-1.5 grid size-7 place-items-center rounded-full bg-background/85 text-[13px] font-semibold tabular-nums">
                {i + 1}
              </span>
              <div className="absolute inset-x-0 bottom-0 flex justify-between p-1.5">
                <div className="flex gap-1">
                  <IconButton label="Mover para antes" disabled={i === 0 || pending} onClick={() => edit(p.url, "up")}>
                    <ChevronLeft className="size-4" />
                  </IconButton>
                  <IconButton label="Mover para depois" disabled={i === pages.length - 1 || pending} onClick={() => edit(p.url, "down")}>
                    <ChevronRight className="size-4" />
                  </IconButton>
                </div>
                <IconButton label="Tirar página" disabled={pending} onClick={() => edit(p.url, "remove")}>
                  <X className="size-4" />
                </IconButton>
              </div>
            </li>
          ))}
        </ol>
      )}
      <input ref={input} type="file" accept={ACCEPT} multiple className="hidden" onChange={(e) => add(e.target.files)} />
      {progress && <p className="mt-3 text-[15px] text-muted" role="status">{progress}</p>}
      {error && <p className="mt-3 text-[15px] text-danger" role="alert">{error}</p>}
      {room > 0 ? (
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={busy}
          className={`${btn(pages.length ? "quiet" : "light")} mt-4 w-full`}
        >
          <Plus className="size-5" strokeWidth={2} />
          {busy ? "Enviando…" : pages.length ? "Adicionar páginas" : "Fotografar o cardápio"}
        </button>
      ) : (
        <p className="mt-4 text-[15px] text-muted">Chegou no máximo de {max} páginas. Tire uma para trocar.</p>
      )}
    </div>
  );
}

function IconButton({
  label,
  children,
  ...rest
}: { label: string; children: React.ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      aria-label={label}
      className="press grid size-8 place-items-center rounded-full bg-background/85 text-foreground disabled:opacity-30"
      {...rest}
    >
      {children}
    </button>
  );
}
