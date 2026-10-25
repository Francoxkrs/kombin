import { NextResponse, type NextRequest } from "next/server";
import { getDecisionState } from "@/lib/decision";
import { DEVICE_COOKIE } from "@/lib/device-cookie";
import { getRepo } from "@/lib/repo";

function device(request: NextRequest) {
  return request.cookies.get(DEVICE_COOKIE)?.value ?? null;
}

/** Estado da votação (a página consulta a cada poucos segundos). */
export async function GET(request: NextRequest, ctx: RouteContext<"/api/v/[code]">) {
  const { code } = await ctx.params;
  const state = await getDecisionState(code, device(request) ?? "");
  if (!state) return NextResponse.json({ error: "votação não encontrada" }, { status: 404 });
  return NextResponse.json(state, { headers: { "Cache-Control": "no-store" } });
}

/** Registra ou troca o voto deste aparelho. Corpo: { placeId, name? } */
export async function POST(request: NextRequest, ctx: RouteContext<"/api/v/[code]">) {
  const { code } = await ctx.params;
  const deviceId = device(request);
  if (!deviceId) return NextResponse.json({ error: "cookie ausente" }, { status: 400 });

  const body = (await request.json().catch(() => ({}))) as { placeId?: string; name?: string };
  const repo = getRepo();
  const session = await repo.getSession(code);
  if (!session || !body.placeId || !session.placeIds.includes(body.placeId)) {
    return NextResponse.json({ error: "voto inválido" }, { status: 400 });
  }
  const voterName = body.name?.trim().slice(0, 30) || null;
  await repo.castVote(code, { deviceId, placeId: body.placeId, voterName });
  return NextResponse.json(await getDecisionState(code, deviceId));
}
