"use client";

import { useState } from "react";
import { createBrowserAuthClient } from "@/lib/supabase/browser";

export function LoginForm({ next, error }: { next: string; error: string | null }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">(error ? "error" : "idle");
  const [message, setMessage] = useState(error);

  const callback = () => `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

  async function google() {
    const { error } = await createBrowserAuthClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callback() },
    });
    if (error) {
      setState("error");
      setMessage(error.message);
    }
  }

  async function magicLink(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    const { error } = await createBrowserAuthClient().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: callback() },
    });
    if (error) {
      setState("error");
      setMessage(error.message);
    } else {
      setState("sent");
    }
  }

  if (state === "sent") {
    return (
      <div className="rounded-3xl bg-surface p-6 text-center">
        <p className="text-lg font-bold">Confira seu e-mail</p>
        <p className="mt-1 text-sm text-muted">
          Mandamos um link de acesso para <b>{email}</b>. É só tocar nele para entrar.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button
        onClick={google}
        className="flex w-full items-center justify-center gap-3 rounded-2xl border border-line bg-surface py-4 font-semibold active:scale-[0.98]"
      >
        <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.96 10.96 0 0 0 12 1 11 11 0 0 0 2.18 7.05l3.66 2.84c.87-2.6 3.3-4.51 6.16-4.51z" />
        </svg>
        Continuar com Google
      </button>

      <div className="flex items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-line" /> ou <span className="h-px flex-1 bg-line" />
      </div>

      <form onSubmit={magicLink} className="space-y-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seu@email.com"
          autoComplete="email"
          className="w-full rounded-2xl border border-line bg-surface px-4 py-4 outline-none focus:border-foreground"
        />
        <button
          disabled={state === "sending"}
          className="w-full rounded-2xl bg-foreground py-4 font-semibold text-background disabled:opacity-60"
        >
          {state === "sending" ? "Enviando…" : "Receber link por e-mail"}
        </button>
      </form>

      {state === "error" && message && (
        <p role="alert" className="text-center text-sm text-red-700">
          {message}
        </p>
      )}
    </div>
  );
}
