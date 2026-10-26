"use client";

import { Check, Share } from "lucide-react";
import { useState } from "react";
import { ROUND_LIGHT } from "./styles";

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
    <button type="button" onClick={share} aria-label={copied ? "Link copiado" : "Compartilhar"} className={ROUND_LIGHT}>
      {copied ? <Check className="size-5" strokeWidth={2.2} /> : <Share className="size-5" strokeWidth={2} />}
    </button>
  );
}
