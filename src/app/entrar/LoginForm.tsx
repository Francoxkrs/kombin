"use client";

import { Eye, EyeOff, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { GoogleIcon } from "@/components/ui/icons";
import { BTN_IPE, BTN_QUIET, INPUT } from "@/components/ui/styles";
import { authErrorMessage } from "@/lib/auth-errors";
import { createBrowserAuthClient } from "@/lib/supabase/browser";

type Mode = "entrar" | "criar" | "esqueci";

const MIN_PASSWORD = 8;

const input = INPUT;

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
      <div>
        <h2 className="title text-[36px]">Confira seu e-mail</h2>
        <p className="mt-3 text-[17px] leading-snug text-muted">
          {sent === "confirmar" ? (
            <>
              Mandamos um link para <b className="font-semibold text-foreground">{email}</b>. Toque nele para confirmar a conta e entrar.
            </>
          ) : (
            <>
              Se <b className="font-semibold text-foreground">{email}</b> tiver conta, chega um link para criar uma senha nova.
            </>
          )}
        </p>
        <button
          onClick={() => {
            setSent(null);
            setMode("entrar");
          }}
          className={`${BTN_QUIET} mt-6 w-full`}
        >
          Voltar para o login
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {mode !== "esqueci" && (
        <div className="flex gap-6" role="tablist">
          {(["entrar", "criar"] as const).map((m) => (
            <button
              key={m}
              role="tab"
              aria-selected={mode === m}
              onClick={() => {
                setMode(m);
                setMessage(null);
              }}
              className={`flex h-11 flex-col justify-center text-[17px] ${mode === m ? "font-semibold" : "text-muted"}`}
            >
              {m === "entrar" ? "Já tenho conta" : "Criar conta"}
              <span className={`mt-1 h-[3px] w-full ${mode === m ? "bg-ipe" : "bg-transparent"}`} />
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
              className="absolute inset-y-0 right-1 grid w-12 place-items-center text-muted"
            >
              {show ? <EyeOff className="size-5" strokeWidth={1.75} /> : <Eye className="size-5" strokeWidth={1.75} />}
            </button>
          </div>
        )}

        {message && (
          <p role="alert" className="text-[15px] text-danger">
            {message}
          </p>
        )}

        <button
          disabled={busy}
          className={`${BTN_IPE} w-full`}
        >
          {busy && <Loader2 className="size-4 animate-spin" />}
          {mode === "entrar" ? "Entrar" : mode === "criar" ? "Criar minha conta" : "Mandar link para nova senha"}
        </button>
      </form>

      <div className="text-[15px]">
        {mode === "esqueci" ? (
          <button onClick={() => setMode("entrar")} className="h-11 text-muted underline underline-offset-4">
            Lembrei a senha
          </button>
        ) : mode === "entrar" ? (
          <button onClick={() => setMode("esqueci")} className="h-11 text-muted underline underline-offset-4">
            Esqueci a senha
          </button>
        ) : (
          <p className="text-muted">Ao criar a conta você aceita receber e-mails só sobre a sua conta.</p>
        )}
      </div>

      {google && mode !== "esqueci" && (
        <>
          <button onClick={withGoogle} className={`${BTN_QUIET} w-full`}>
            <GoogleIcon />
            Continuar com Google
          </button>
        </>
      )}
    </div>
  );
}
