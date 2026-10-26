"use client";

import { useState } from "react";
import { GoogleIcon } from "@/components/ui/icons";
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
      <div className="rise rounded-[1.75rem] bg-soft p-7 text-center">
        <p className="text-4xl">📬</p>
        <p className="mt-2 text-xl font-extrabold">Confira seu e-mail</p>
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
        className="press flex w-full items-center justify-center gap-3 rounded-2xl border border-line bg-white py-4 font-bold shadow-[0_10px_30px_-22px_rgba(0,0,0,0.6)]"
      >
        <GoogleIcon />
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
          className="w-full rounded-2xl border border-line bg-soft px-4 py-4 text-[1.02rem] outline-none transition focus:border-foreground focus:bg-white"
        />
        <button
          disabled={state === "sending"}
          className="press w-full rounded-2xl bg-foreground py-4 font-bold text-white disabled:opacity-60"
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
