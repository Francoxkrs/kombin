/** Mensagens do Supabase Auth em português, para mostrar na tela de login. */
export function authErrorMessage(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "E-mail ou senha incorretos.";
  if (m.includes("email not confirmed")) return "Confirme seu e-mail pelo link que enviamos antes de entrar.";
  if (m.includes("already registered") || m.includes("already been registered"))
    return "Esse e-mail já tem conta. Entre com sua senha ou use “Esqueci a senha”.";
  if (m.includes("password should be at least") || m.includes("password is too short"))
    return "A senha precisa de pelo menos 8 caracteres.";
  if (m.includes("weak password") || m.includes("password is known to be weak"))
    return "Essa senha é muito fácil de adivinhar. Tente outra.";
  if (m.includes("rate limit") || m.includes("too many"))
    return "Muitas tentativas agora. Espere alguns minutos e tente de novo.";
  if (m.includes("provider is not enabled") || m.includes("unsupported provider"))
    return "O login com Google ainda não está ligado. Use e-mail e senha.";
  if (m.includes("same password") || m.includes("different from the old"))
    return "A nova senha precisa ser diferente da anterior.";
  if (m.includes("signups not allowed")) return "Cadastro fechado no momento.";
  if (m.includes("invalid email") || m.includes("unable to validate email")) return "Esse e-mail não parece válido.";
  return "Não deu certo. Tente de novo em instantes.";
}
