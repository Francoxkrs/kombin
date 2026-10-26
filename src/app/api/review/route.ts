import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { CATALOG_TAG } from "@/lib/catalog";
import { DEVICE_COOKIE, PENDING_REVIEW_COOKIE, REVIEWED_COOKIE } from "@/lib/device-cookie";
import { getCurrentUser } from "@/lib/auth";
import { getRepo } from "@/lib/repo";
import { savedTag } from "@/lib/saved";
import type { Noise, SpendBand } from "@/lib/types";

/*
 * Avaliação relâmpago. É uma rota (e não server action) de propósito: gravar
 * cookies numa server action recarrega a página e fecharia a tela de recompensa.
 */

export interface MicroReviewBody {
  placeId: string;
  occasion: string | null;
  spend: SpendBand;
  cover: boolean;
  noise: Noise;
  /** Check-in feito no navegador: só o resultado chega, nunca a localização. */
  verifiedVisit?: boolean;
}

/** "Como chegar" conta como visita se foi clicado entre meia hora e três dias antes da avaliação. */
const DIRECTIONS_MIN_MINUTES = 30;
const DIRECTIONS_MAX_HOURS = 72;

const COOKIE_OPTS = { maxAge: 60 * 60 * 24 * 365, path: "/", sameSite: "lax" as const };

/** Grava a avaliação e devolve quantas este aparelho já fez (para a recompensa). */
export async function POST(request: NextRequest) {
  const b = (await request.json().catch(() => null)) as MicroReviewBody | null;
  const valid =
    b &&
    [1, 2, 3, 4].includes(b.spend) &&
    [1, 2, 3].includes(b.noise) &&
    typeof b.cover === "boolean" &&
    typeof b.placeId === "string";
  if (!valid) return NextResponse.json({ error: "avaliação inválida" }, { status: 400 });

  const repo = getRepo();
  if (!(await repo.getPlace(b.placeId))) {
    return NextResponse.json({ error: "lugar não encontrado" }, { status: 404 });
  }

  const user = await getCurrentUser();
  const reviewed = (request.cookies.get(REVIEWED_COOKIE)?.value ?? "").split(",").filter(Boolean);
  // Com conta: uma por pessoa por lugar (a nova substitui). Sem conta: uma por aparelho.
  let verified = false;
  if (user || !reviewed.includes(b.placeId)) {
    const deviceId = request.cookies.get(DEVICE_COOKIE)?.value ?? "sem-cookie";
    verified =
      b.verifiedVisit === true ||
      (deviceId !== "sem-cookie" &&
        (await repo
          .clickedDirections(b.placeId, deviceId, DIRECTIONS_MIN_MINUTES, DIRECTIONS_MAX_HOURS)
          .catch(() => false)));
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
