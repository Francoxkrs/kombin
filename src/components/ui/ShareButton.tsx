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
      className="press grid size-11 place-items-center rounded-full bg-white/85 shadow-[0_8px_24px_-10px_rgba(0,0,0,0.5)] backdrop-blur-md"
    >
      {copied ? <Check className="size-5 text-match" strokeWidth={2.6} /> : <Share2 className="size-5" strokeWidth={2.2} />}
    </button>
  );
}
