import { NextResponse, type NextRequest } from "next/server";
import { DEVICE_COOKIE } from "@/lib/device-cookie";

/**
 * Dá a cada aparelho um id anônimo (sem login). Ele identifica votos e
 * micro-reviews e evita voto duplicado na mesma votação.
 */
export function proxy(request: NextRequest) {
  if (request.cookies.has(DEVICE_COOKIE)) return NextResponse.next();

  const id = crypto.randomUUID();
  // Repassa o cookie já nesta requisição, para a página renderizar com ele.
  const headers = new Headers(request.headers);
  const existing = headers.get("cookie");
  headers.set("cookie", `${existing ? `${existing}; ` : ""}${DEVICE_COOKIE}=${id}`);

  const response = NextResponse.next({ request: { headers } });
  response.cookies.set(DEVICE_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365 * 2,
    path: "/",
  });
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon|manifest.webmanifest).*)"],
};
