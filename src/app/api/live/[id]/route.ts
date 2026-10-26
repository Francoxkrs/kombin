import { unstable_cache } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { getCatalog } from "@/lib/catalog";
import { liveInfo } from "@/lib/google";
import { allow, googleDailyLimit, ipFrom, LIMITS, tooMany } from "@/lib/rate-limit";
import { getRepo } from "@/lib/repo";
import { placeId } from "@/lib/validation";

/**
 * Horário e telefone do Google por lugar, guardados no servidor por 30 minutos.
 * O cache é pelo place_id, então mudar a URL (?x=1, ?x=2...) não gera chamada nova
 * ao Google; a CDN só ajuda, não é ela que protege a conta.
 */
const cachedLive = (googlePlaceId: string) =>
  unstable_cache(
    async () => {
      if (!(await allow("google:live:day", googleDailyLimit()))) return null;
      return liveInfo(googlePlaceId);
    },
    ["live", googlePlaceId],
    { revalidate: 1800 },
  )();

/**
 * Nota, horário e telefone do Google para a página do lugar. Buscado pelo navegador
 * depois que a página abre (não atrasa a tela) e guardado na CDN por 30 minutos.
 */
export async function GET(request: NextRequest, ctx: RouteContext<"/api/live/[id]">) {
  const { id } = await ctx.params;
  if (!placeId.safeParse(id).success) return NextResponse.json(null, { status: 404 });
  if (!(await allow(`google:ip:${ipFrom(request.headers)}`, LIMITS.googleIp))) return tooMany();
  const place = (await getCatalog()).byId.get(id) ?? (await getRepo().getPlace(id));
  if (!place?.googlePlaceId || place.status === "rejected") return NextResponse.json(null, { status: 404 });
  const info = await cachedLive(place.googlePlaceId);
  if (!info) return NextResponse.json(null, { status: 404 });
  return NextResponse.json(info, {
    headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600" },
  });
}
