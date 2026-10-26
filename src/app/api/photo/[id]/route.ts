import { unstable_cache } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { getCatalog } from "@/lib/catalog";
import { photoBytes, photoNames } from "@/lib/ingest/google";
import { allow, googleDailyLimit, ipFrom, LIMITS, tooMany } from "@/lib/rate-limit";
import { getRepo } from "@/lib/repo";
import { placeId } from "@/lib/validation";

/** Nomes das fotos do Google por 1 hora (eles expiram; não vão para o banco). */
const namesFor = (googlePlaceId: string, key: string) =>
  unstable_cache(
    async () => {
      const names = await photoNames(key, googlePlaceId);
      // Lista vazia não entra no cache: lança, e a próxima visita pergunta ao Google de novo.
      if (names.length === 0) throw new NoGooglePhotos();
      return names;
    },
    ["gphotos-v2", googlePlaceId],
    { revalidate: 3600 },
  )();

class NoGooglePhotos extends Error {}

/**
 * Foto do Google servida pelo nosso domínio: a chave da API fica no servidor e a
 * CDN da Vercel guarda a resposta por 1 dia, então cada foto custa ~1 chamada por dia,
 * não uma por visita.
 *
 * A CDN guarda por URL completa. Para ninguém furar o cache com ?i=0&x=123 (cada
 * variação seria uma chamada paga), qualquer URL fora do formato exato é
 * redirecionada para a forma canônica, e há teto por IP e teto diário global.
 */
/** 404 sem foto, com o motivo no log da Vercel e no cabeçalho X-Kombin-Photo (para achar a causa sem adivinhar). */
function noPhoto(reason: string, id?: string) {
  console.warn(`foto: sem foto (${reason})`, id ?? "");
  return new NextResponse(null, { status: 404, headers: { "X-Kombin-Photo": reason, "Cache-Control": "no-store" } });
}

export async function GET(request: NextRequest, ctx: RouteContext<"/api/photo/[id]">) {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) return noPhoto("sem GOOGLE_MAPS_API_KEY neste deploy");
  const { id } = await ctx.params;
  if (!placeId.safeParse(id).success) return noPhoto("id inválido");

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
  if (!place) return noPhoto("lugar não encontrado", id);
  if (!place.googlePlaceId) return noPhoto("lugar sem google_place_id", id);
  if (place.status === "rejected") return noPhoto("lugar recusado", id);

  try {
    const names = await namesFor(place.googlePlaceId, key).catch((e) => {
      if (e instanceof NoGooglePhotos) return [];
      throw e;
    });
    const photo = names[index];
    if (!photo) return noPhoto(`Google tem ${names.length} fotos, pediu a ${index}`, id);
    if (!(await allow("google:photo:day", googleDailyLimit()))) return noPhoto("teto diário do Google atingido", id);
    const img = await photoBytes(key, photo.name, small ? 480 : 1000);
    if (!img) return noPhoto("Google recusou o download da foto (veja o log acima)", id);
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
