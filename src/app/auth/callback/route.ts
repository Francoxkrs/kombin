import { NextResponse, type NextRequest } from "next/server";
import { safeNext } from "@/lib/auth";
import { createAuthClient } from "@/lib/supabase/server";

/** Volta do Google ou do link do e-mail: troca o código pela sessão. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"), "/perfil");

  if (code) {
    const supabase = await createAuthClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, origin));
    console.error("login falhou:", error.message);
  }
  return NextResponse.redirect(new URL(`/entrar?erro=1&next=${encodeURIComponent(next)}`, origin));
}
