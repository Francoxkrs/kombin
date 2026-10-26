import { unstable_cache } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { getCatalog } from "@/lib/catalog";
import { photoBytes, photoNames } from "@/lib/ingest/google";
import { allow, googleDailyLimit, ipFrom, LIMITS, tooMany } from "@/lib/rate-limit";
import { getRepo } from "@/lib/repo";
import { placeId } from "@/lib/validation";

/** Nomes das fotos do Google por 1 hora (eles expiram; não vão para o banco). */
const namesFor = (googlePlaceId: string, key: string) =>
  unstable_cache(() => photoNames(key, googlePlaceId), ["gphotos", googlePlaceId], { revalidate: 3600 })();

/**
 * Foto do Google servida pelo nosso domínio: a chave da API fica no servidor e a
 * CDN da Vercel guarda a resposta por 1 dia, então cada foto custa ~1 chamada por dia,
 * não uma por visita.
 *
 * A CDN guarda por URL completa. Para ninguém furar o cache com ?i=0&x=123 (cada
 * variação seria uma chamada paga), qualquer URL fora do formato exato é
 * redirecionada para a forma canônica, e há teto por IP e teto diário global.
 */
export async function GET(request: NextRequest, ctx: RouteContext<"/api/photo/[id]">) {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) return new NextResponse(null, { status: 404 });
  const { id } = await ctx.params;
  if (!placeId.safeParse(id).success) return new NextResponse(null, { status: 404 });

  const sp = request.nextUrl.searchParams;
  const index = Math.min(4, Math.max(0, Math.trunc(Number(sp.get("i"))) || 0));
  const small = sp.get("w") === "s";
  const canonical = `i=${index}${small ? "&w=s" : ""}`;
  if (request.nextUrl.search.slice(1) !== canonical) {
    const url = request.nextUrl.clone();
    url.search = canonical;
    return NextResponse.redirect(url, 308);
  }

  if (!(await allow(`google:ip:${ipFrom(request.headers)}`, LIMITS.googleIp))) return tooMany();
  const place = (await getCatalog()).byId.get(id) ?? (await getRepo().getPlace(id));
  if (!place?.googlePlaceId || place.status === "rejected") return new NextResponse(null, { status: 404 });

  try {
    const names = await namesFor(place.googlePlaceId, key);
    const photo = names[index];
    if (!photo) return new NextResponse(null, { status: 404 });
    if (!(await allow("google:photo:day", googleDailyLimit()))) return new NextResponse(null, { status: 404 });
    const img = await photoBytes(key, photo.name, small ? 480 : 1000);
    if (!img) return new NextResponse(null, { status: 404 });
    return new NextResponse(img.bytes, {
      headers: {
        "Content-Type": img.mimeType,
        "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
        ...(photo.author ? { "X-Photo-Author": encodeURIComponent(photo.author) } : {}),
      },
    });
  } catch (e) {
    console.error("foto do Google", e);
    return new NextResponse(null, { status: 502 });
  }
}
