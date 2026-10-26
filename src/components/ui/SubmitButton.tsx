"use client";

import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";

/**
 * Botão de envio de <form action={serverAction}>: fica desligado enquanto a ação
 * roda, para dois toques não criarem dois registros.
 */
export function SubmitButton({ className, children }: { className: string; children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} aria-busy={pending} className={className}>
      {pending && <Loader2 className="size-4 animate-spin" />}
      {children}
    </button>
  );
}
