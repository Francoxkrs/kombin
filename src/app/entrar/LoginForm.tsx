"use client";

import { Eye, EyeOff, Loader2, MailCheck } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { GoogleIcon } from "@/components/ui/icons";
import { authErrorMessage } from "@/lib/auth-errors";
import { createBrowserAuthClient } from "@/lib/supabase/browser";

type Mode = "entrar" | "criar" | "esqueci";

const MIN_PASSWORD = 8;

const input =
  "w-full rounded-2xl border border-line bg-surface px-4 py-3.5 text-[0.95rem] outline-none transition placeholder:text-muted/70 focus:border-foreground";

export function LoginForm({ next, error, google }: { next: string; error: string | null; google: boolean }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("entrar");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(error);
  const [sent, setSent] = useState<null | "confirmar" | "senha">(null);

  const callback = (to: string) => `${window.location.origin}/auth/callback?next=${encodeURIComponent(to)}`;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (mode !== "esqueci" && password.length < MIN_PASSWORD) {
      setMessage(`A senha precisa de pelo menos ${MIN_PASSWORD} caracteres.`);
      return;
    }
    setBusy(true);
    const auth = createBrowserAuthClient().auth;
    try {
      if (mode === "entrar") {
        const { error } = await auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.replace(next);
        router.refresh();
        return;
      }
      if (mode === "criar") {
        const { data, error } = await auth.signUp({
          email,
          password,
          options: { data: { name: name.trim() || undefined }, emailRedirectTo: callback(next) },
        });
        if (error) throw error;
        // Supabase devolve usuário sem identidades quando o e-mail já existe (para não vazar quem tem conta).
        if (data.user && data.user.identities?.length === 0) throw new Error("already registered");
        if (data.session) {
          router.replace(next);
          router.refresh();
          return;
        }
        setSent("confirmar");
      } else {
        const { error } = await auth.resetPasswordForEmail(email, { redirectTo: callback("/redefinir-senha") });
        if (error) throw error;
        setSent("senha");
      }
    } catch (err) {
      setMessage(authErrorMessage(err instanceof Error ? err.message : String(err)));
    } finally {
      setBusy(false);
    }
  }

  async function withGoogle() {
    const { error } = await createBrowserAuthClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callback(next) },
    });
    if (error) setMessage(authErrorMessage(error.message));
  }

  if (sent) {
    return (
      <div className="rise rounded-3xl border border-line bg-surface p-7 text-center">
        <MailCheck className="mx-auto size-8 text-foreground" strokeWidth={1.5} />
        <p className="mt-3 text-xl font-semibold">
          Confira seu <span className="accent text-[1.15em]">e-mail</span>
        </p>
        <p className="mt-2 text-sm text-muted">
          {sent === "confirmar" ? (
            <>
              Mandamos um link para <b className="text-foreground">{email}</b>. Toque nele para confirmar a conta e entrar.
            </>
          ) : (
            <>
              Se <b className="text-foreground">{email}</b> tiver conta, chega um link para criar uma senha nova.
            </>
          )}
        </p>
        <button
          onClick={() => {
            setSent(null);
            setMode("entrar");
          }}
          className="mt-5 text-sm font-semibold underline"
        >
          Voltar para o login
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {mode !== "esqueci" && (
        <div className="grid grid-cols-2 gap-1 rounded-2xl border border-line bg-soft p-1" role="tablist">
          {(["entrar", "criar"] as const).map((m) => (
            <button
              key={m}
              role="tab"
              aria-selected={mode === m}
              onClick={() => {
                setMode(m);
                setMessage(null);
              }}
              className="relative rounded-xl py-2.5 text-xs font-semibold"
            >
              {mode === m && (
                <motion.span
                  layoutId="auth-tab"
                  className="absolute inset-0 rounded-xl bg-foreground"
                  transition={{ type: "spring", stiffness: 500, damping: 40 }}
                />
              )}
              <span className={`relative ${mode === m ? "text-background" : "text-muted"}`}>
                {m === "entrar" ? "Já tenho conta" : "Criar conta"}
              </span>
            </button>
          ))}
        </div>
      )}

      <form onSubmit={submit} className="space-y-3">
        <AnimatePresence initial={false}>
          {mode === "criar" && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
                autoComplete="name"
                maxLength={40}
                className={input}
              />
            </motion.div>
          )}
        </AnimatePresence>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seu@email.com"
          autoComplete="email"
          className={input}
        />
        {mode !== "esqueci" && (
          <div className="relative">
            <input
              type={show ? "text" : "password"}
              required
              minLength={MIN_PASSWORD}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === "criar" ? `Crie uma senha (mín. ${MIN_PASSWORD})` : "Sua senha"}
              autoComplete={mode === "criar" ? "new-password" : "current-password"}
              className={`${input} pr-12`}
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              aria-label={show ? "Esconder senha" : "Mostrar senha"}
              className="absolute inset-y-0 right-1 grid w-11 place-items-center text-muted"
            >
              {show ? <EyeOff className="size-[18px]" strokeWidth={1.5} /> : <Eye className="size-[18px]" strokeWidth={1.5} />}
            </button>
          </div>
        )}

        {message && (
          <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">
            {message}
          </p>
        )}

        <button
          disabled={busy}
          className="press flex h-14 w-full items-center justify-center gap-2 rounded-full bg-foreground text-sm font-semibold text-background disabled:opacity-60"
        >
          {busy && <Loader2 className="size-4 animate-spin" />}
          {mode === "entrar" ? "Entrar" : mode === "criar" ? "Criar minha conta" : "Mandar link para nova senha"}
        </button>
      </form>

      <div className="text-center text-sm">
        {mode === "esqueci" ? (
          <button onClick={() => setMode("entrar")} className="font-medium text-muted underline">
            Lembrei a senha
          </button>
        ) : mode === "entrar" ? (
          <button onClick={() => setMode("esqueci")} className="font-medium text-muted underline">
            Esqueci a senha
          </button>
        ) : (
          <p className="text-xs text-muted">Ao criar a conta você aceita receber e-mails só sobre a sua conta.</p>
        )}
      </div>

      {google && mode !== "esqueci" && (
        <>
          <div className="flex items-center gap-3 text-xs text-muted">
            <span className="h-px flex-1 bg-line" /> ou <span className="h-px flex-1 bg-line" />
          </div>
          <button
            onClick={withGoogle}
            className="press flex h-14 w-full items-center justify-center gap-3 rounded-full border border-line bg-surface text-sm font-semibold"
          >
            <GoogleIcon />
            Continuar com Google
          </button>
        </>
      )}
    </div>
  );
}
