import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import type { z } from "zod";
import { CATALOG_TAG } from "@/lib/catalog";
import { DEVICE_COOKIE, PENDING_REVIEW_COOKIE, REVIEWED_COOKIE } from "@/lib/device-cookie";
import { getCurrentUser } from "@/lib/auth";
import { allow, ipFrom, LIMITS, tooMany } from "@/lib/rate-limit";
import { getRepo } from "@/lib/repo";
import { readJson } from "@/lib/request";
import { savedTag } from "@/lib/saved";
import { microReviewBody } from "@/lib/validation";

/*
 * Avaliação relâmpago. É uma rota (e não server action) de propósito: gravar
 * cookies numa server action recarrega a página e fecharia a tela de recompensa.
 */

export type MicroReviewBody = z.infer<typeof microReviewBody>;

const COOKIE_OPTS = {
  maxAge: 60 * 60 * 24 * 365,
  path: "/",
  sameSite: "lax" as const,
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
};

/** "Como chegar" conta como visita se foi clicado entre meia hora e três dias antes da avaliação. */
const DIRECTIONS_MIN_MINUTES = 30;
const DIRECTIONS_MAX_HOURS = 72;

/** Grava a avaliação e devolve quantas este aparelho já fez (para a recompensa). */
export async function POST(request: NextRequest) {
  const body = await readJson(request, microReviewBody);
  if (!body.ok) return body.response;
  const b = body.data;

  const deviceId = request.cookies.get(DEVICE_COOKIE)?.value;
  // O proxy dá o cookie na primeira página: sem ele é chamada direta, não alguém usando o app.
  if (!deviceId) return NextResponse.json({ error: "abra o app e tente de novo" }, { status: 400 });

  const repo = getRepo();
  const place = await repo.getPlace(b.placeId);
  if (!place || place.status !== "approved") {
    return NextResponse.json({ error: "lugar não encontrado" }, { status: 404 });
  }

  const user = await getCurrentUser();
  const ip = ipFrom(request.headers);
  const allowed =
    (await allow(`review:ip:${ip}`, LIMITS.reviewIp)) &&
    (!user || (await allow(`review:user:${user.id}`, LIMITS.reviewUser)));
  if (!allowed) return tooMany();

  const reviewed = (request.cookies.get(REVIEWED_COOKIE)?.value ?? "").split(",").filter(Boolean);
  // Com conta: uma por pessoa por lugar (a nova substitui). Sem conta: uma por aparelho
  // por semana, garantida pelo índice único do banco (o cookie é só para não perguntar de novo).
  let verified = false;
  if (user || !reviewed.includes(b.placeId)) {
    verified =
      b.verifiedVisit === true ||
      (await repo
        .clickedDirections(b.placeId, deviceId, DIRECTIONS_MIN_MINUTES, DIRECTIONS_MAX_HOURS)
        .catch(() => false));
    await repo.addMicroReview({
      userId: user?.id ?? null,
      placeId: b.placeId,
      occasion: b.occasion,
      spend: b.spend,
      cover: b.cover,
      noise: b.noise,
      deviceId,
      verified,
    });
    if (!reviewed.includes(b.placeId)) reviewed.push(b.placeId);
  }
  if (user) {
    await repo.setSaved(user.id, b.placeId, "been", true);
    revalidateTag(savedTag(user.id), { expire: 0 });
  }
  // As médias da galera entram no índice; a próxima visita já vê (sem esperar o cache vencer).
  revalidateTag(CATALOG_TAG, "max");

  const total = user ? await repo.countUserReviews(user.id) : reviewed.length;
  const res = NextResponse.json({ total, loggedIn: !!user, verified });
  res.cookies.set(REVIEWED_COOKIE, reviewed.slice(-200).join(","), COOKIE_OPTS);
  res.cookies.delete(PENDING_REVIEW_COOKIE);
  return res;
}

/** "Acabei não indo": descarta a pergunta pendente. */
export async function DELETE() {
  const res = new NextResponse(null, { status: 204 });
  res.cookies.delete(PENDING_REVIEW_COOKIE);
  return res;
}
