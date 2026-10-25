import { NextResponse, type NextRequest } from "next/server";
import { photoUri } from "@/lib/google";
import { getRepo } from "@/lib/repo";

/**
 * Foto do Google buscada ao vivo e entregue por redirecionamento: a chave da
 * API fica no servidor e nenhuma foto é guardada no nosso banco.
 */
export async function GET(request: NextRequest, ctx: RouteContext<"/api/photo/[id]">) {
  const { id } = await ctx.params;
  const place = await getRepo().getPlace(id);
  if (!place?.googlePlaceId) return new NextResponse(null, { status: 404 });

  const index = Math.min(4, Math.max(0, Number(request.nextUrl.searchParams.get("i")) || 0));
  const photo = await photoUri(place.googlePlaceId, index);
  if (!photo) return new NextResponse(null, { status: 404 });

  const res = NextResponse.redirect(photo.uri, 302);
  // Cache só no navegador de quem vê, por pouco tempo, para não repetir a cobrança na mesma sessão.
  res.headers.set("Cache-Control", "private, max-age=3600");
  return res;
}
