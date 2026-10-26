import "server-only";
import type { NextRequest } from "next/server";
import type { z } from "zod";

/**
 * Lê o corpo JSON de um POST vindo do próprio site e valida com o esquema.
 * Recusa outra origem (CSRF) e corpo que não seja application/json: um formulário
 * de outro site só consegue mandar text/plain sem pedir permissão ao navegador.
 */
export async function readJson<T extends z.ZodType>(
  request: NextRequest,
  schema: T,
): Promise<{ ok: true; data: z.infer<T> } | { ok: false; response: Response }> {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) {
    return { ok: false, response: Response.json({ error: "origem não permitida" }, { status: 403 }) };
  }
  if (!request.headers.get("content-type")?.startsWith("application/json")) {
    return { ok: false, response: Response.json({ error: "envie JSON" }, { status: 415 }) };
  }
  const parsed = schema.safeParse(await request.json().catch(() => undefined));
  if (!parsed.success) {
    // Sem detalhes do esquema na resposta: só o suficiente para o app.
    return { ok: false, response: Response.json({ error: "dados inválidos" }, { status: 400 }) };
  }
  return { ok: true, data: parsed.data };
}
