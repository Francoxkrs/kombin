"use client";

import { Check, Share2 } from "lucide-react";
import { useState } from "react";

export function ShareButton({ title, text, path }: { title: string; text: string; path: string }) {
  const [copied, setCopied] = useState(false);
  async function share() {
    const url = `${window.location.origin}${path}`;
    if (navigator.share) {
      await navigator.share({ title, text, url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(url).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    }
  }
  return (
    <button
      type="button"
      onClick={share}
      aria-label="Compartilhar"
      className="press grid size-10 place-items-center rounded-full bg-black/40 text-white backdrop-blur-md"
    >
      {copied ? <Check className="size-[18px] text-emerald-400" strokeWidth={2} /> : <Share2 className="size-[18px]" strokeWidth={1.5} />}
    </button>
  );
}
