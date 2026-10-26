"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authErrorMessage } from "@/lib/auth-errors";
import { createBrowserAuthClient } from "@/lib/supabase/browser";

export function NewPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) return setMessage("A senha precisa de pelo menos 8 caracteres.");
    setBusy(true);
    const { error } = await createBrowserAuthClient().auth.updateUser({ password });
    setBusy(false);
    if (error) return setMessage(authErrorMessage(error.message));
    router.replace("/perfil");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <input
        type="password"
        required
        minLength={8}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Nova senha (mín. 8)"
        autoComplete="new-password"
        className="w-full rounded-2xl border border-line bg-surface px-4 py-3.5 text-[0.95rem] outline-none focus:border-foreground"
      />
      {message && (
        <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">
          {message}
        </p>
      )}
      <button
        disabled={busy}
        className="press flex h-14 w-full items-center justify-center gap-2 rounded-full bg-foreground text-sm font-semibold text-background disabled:opacity-60"
      >
        {busy && <Loader2 className="size-4 animate-spin" />} Salvar senha
      </button>
    </form>
  );
}
