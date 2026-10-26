import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { DEVICE_COOKIE } from "@/lib/device-cookie";
import { supabasePublicKey, supabaseUrl } from "@/lib/supabase/env";

/**
 * Roda antes de cada página:
 *  1. Dá a cada aparelho um id anônimo (votos e avaliações sem login).
 *  2. Renova a sessão do Supabase Auth, para as páginas lerem o login certo.
 */
export async function proxy(request: NextRequest) {
  let deviceId = request.cookies.get(DEVICE_COOKIE)?.value;
  const newDevice = !deviceId;
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    request.cookies.set(DEVICE_COOKIE, deviceId);
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    supabaseUrl(),
    supabasePublicKey(),
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(list) {
          for (const { name, value } of list) request.cookies.set(name, value);
          response = NextResponse.next({ request });
          for (const { name, value, options } of list) response.cookies.set(name, value, options);
        },
      },
    },
  );
  // Não coloque código entre o createServerClient e o getUser: é aqui que a sessão é renovada.
  await supabase.auth.getUser();

  if (newDevice) {
    response.cookies.set(DEVICE_COOKIE, deviceId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 365 * 2,
      path: "/",
    });
  }
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|manifest.webmanifest|.*\\.(?:png|svg|jpg|webp)$).*)",
  ],
};
