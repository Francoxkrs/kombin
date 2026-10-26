import { unstable_cache } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { getCatalog } from "@/lib/catalog";
import { photoBytes, photoNames } from "@/lib/ingest/google";
import { getRepo } from "@/lib/repo";

/** Nomes das fotos do Google por 1 hora (eles expiram; não vão para o banco). */
const namesFor = (googlePlaceId: string, key: string) =>
  unstable_cache(() => photoNames(key, googlePlaceId), ["gphotos", googlePlaceId], { revalidate: 3600 })();

/**
 * Foto do Google servida pelo nosso domínio: a chave da API fica no servidor e a
 * CDN da Vercel guarda a resposta por 1 dia, então cada foto custa ~1 chamada por dia,
 * não uma por visita.
 */
export async function GET(request: NextRequest, ctx: RouteContext<"/api/photo/[id]">) {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) return new NextResponse(null, { status: 404 });
  const { id } = await ctx.params;
  const place = (await getCatalog()).byId.get(id) ?? (await getRepo().getPlace(id));
  if (!place?.googlePlaceId) return new NextResponse(null, { status: 404 });

  const index = Math.min(4, Math.max(0, Number(request.nextUrl.searchParams.get("i")) || 0));
  const width = request.nextUrl.searchParams.get("w") === "s" ? 480 : 1000;
  try {
    const names = await namesFor(place.googlePlaceId, key);
    const photo = names[index];
    if (!photo) return new NextResponse(null, { status: 404 });
    const img = await photoBytes(key, photo.name, width);
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
