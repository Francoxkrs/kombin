import { NextResponse, type NextRequest } from "next/server";
import { getDecisionState } from "@/lib/decision";
import { DEVICE_COOKIE } from "@/lib/device-cookie";
import { allow, ipFrom, LIMITS, tooMany } from "@/lib/rate-limit";
import { getRepo } from "@/lib/repo";
import { readJson } from "@/lib/request";
import { decisionCode, voteBody } from "@/lib/validation";

function device(request: NextRequest) {
  return request.cookies.get(DEVICE_COOKIE)?.value ?? null;
}

const notFound = () => NextResponse.json({ error: "votação não encontrada" }, { status: 404 });

/** Estado da votação (a página consulta a cada poucos segundos). */
export async function GET(request: NextRequest, ctx: RouteContext<"/api/v/[code]">) {
  const { code } = await ctx.params;
  if (!decisionCode.safeParse(code).success) return notFound();
  const state = await getDecisionState(code, device(request) ?? "");
  if (!state) return notFound();
  return NextResponse.json(state, { headers: { "Cache-Control": "no-store" } });
}

/** Registra ou troca o voto deste aparelho. Corpo: { placeId, name? } */
export async function POST(request: NextRequest, ctx: RouteContext<"/api/v/[code]">) {
  const { code } = await ctx.params;
  if (!decisionCode.safeParse(code).success) return notFound();
  const deviceId = device(request);
  if (!deviceId) return NextResponse.json({ error: "cookie ausente" }, { status: 400 });

  const body = await readJson(request, voteBody);
  if (!body.ok) return body.response;
  if (!(await allow(`vote:ip:${ipFrom(request.headers)}`, LIMITS.vote))) return tooMany();

  const repo = getRepo();
  const session = await repo.getSession(code);
  if (!session || !session.placeIds.includes(body.data.placeId)) {
    return NextResponse.json({ error: "voto inválido" }, { status: 400 });
  }
  await repo.castVote(code, { deviceId, placeId: body.data.placeId, voterName: body.data.name || null });
  return NextResponse.json(await getDecisionState(code, deviceId));
}
