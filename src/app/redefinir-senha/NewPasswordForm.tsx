"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BTN_IPE, INPUT } from "@/components/ui/styles";
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
        className={INPUT}
      />
      {message && (
        <p role="alert" className="text-[15px] text-danger">
          {message}
        </p>
      )}
      <button
        disabled={busy}
        className={`${BTN_IPE} w-full`}
      >
        {busy && <Loader2 className="size-4 animate-spin" />} Salvar senha
      </button>
    </form>
  );
}
