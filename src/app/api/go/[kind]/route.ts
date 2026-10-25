import { NextResponse, type NextRequest } from "next/server";
import { DEVICE_COOKIE, PENDING_REVIEW_COOKIE } from "@/lib/device-cookie";
import { getOccasion } from "@/lib/occasions";
import { getRepo } from "@/lib/repo";
import type { LeadKind } from "@/lib/types";

/**
 * "Botão de ouro": registra o clique (é o número que vendemos ao restaurante)
 * e redireciona para o WhatsApp com mensagem pronta, ou para o mapa.
 *   /api/go/whatsapp?p=<placeId>&o=<ocasião>&c=<compat>
 *   /api/go/directions?p=<placeId>&o=<ocasião>
 */
export async function GET(request: NextRequest, ctx: RouteContext<"/api/go/[kind]">) {
  const { kind } = await ctx.params;
  if (kind !== "whatsapp" && kind !== "directions") {
    return NextResponse.json({ error: "tipo inválido" }, { status: 404 });
  }
  const sp = request.nextUrl.searchParams;
  const place = await getRepo().getPlace(sp.get("p") ?? "");
  if (!place) return NextResponse.json({ error: "lugar não encontrado" }, { status: 404 });

  const occasion = getOccasion(sp.get("o") ?? "") ?? null;
  const compat = Number(sp.get("c"));

  let target: string;
  if (kind === "whatsapp") {
    if (!place.whatsapp) return NextResponse.redirect(new URL(`/l/${place.id}`, request.url));
    const text = occasion
      ? `Oi! Vi vocês no Kombin${compat > 0 ? ` com ${compat}% de compatibilidade` : ""} para "${occasion.name}". Tem mesa hoje?`
      : "Oi! Vi vocês no Kombin. Tem mesa hoje?";
    target = `https://wa.me/${place.whatsapp}?text=${encodeURIComponent(text)}`;
  } else {
    const q = new URLSearchParams({ api: "1", query: place.name });
    if (place.googlePlaceId) q.set("query_place_id", place.googlePlaceId);
    else if (place.lat != null) q.set("query", `${place.lat},${place.lng}`);
    target = `https://www.google.com/maps/search/?${q}`;
  }

  const deviceId = request.cookies.get(DEVICE_COOKIE)?.value ?? "sem-cookie";
  await getRepo()
    .logLead(place.id, occasion?.slug ?? null, kind as LeadKind, deviceId)
    .catch((e) => console.error("lead não registrado", e));

  const res = NextResponse.redirect(target);
  res.cookies.set(
    PENDING_REVIEW_COOKIE,
    JSON.stringify({ p: place.id, o: occasion?.slug ?? null, t: Date.now() }),
    { maxAge: 60 * 60 * 24 * 3, path: "/", sameSite: "lax" },
  );
  return res;
}
