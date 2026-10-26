import { NextResponse } from "next/server";
import { getCatalog } from "@/lib/catalog";
import { liveInfo } from "@/lib/google";
import { getRepo } from "@/lib/repo";

/**
 * Nota, horário e telefone do Google para a página do lugar. Buscado pelo navegador
 * depois que a página abre (não atrasa a tela) e guardado na CDN por 30 minutos.
 */
export async function GET(_req: Request, ctx: RouteContext<"/api/live/[id]">) {
  const { id } = await ctx.params;
  const place = (await getCatalog()).byId.get(id) ?? (await getRepo().getPlace(id));
  if (!place?.googlePlaceId) return NextResponse.json(null, { status: 404 });
  const info = await liveInfo(place.googlePlaceId);
  if (!info) return NextResponse.json(null, { status: 404 });
  return NextResponse.json(info, {
    headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600" },
  });
}
