import { NextResponse, type NextRequest } from "next/server";
import { DEVICE_COOKIE, PENDING_REVIEW_COOKIE, REVIEWED_COOKIE } from "@/lib/device-cookie";
import { getRepo } from "@/lib/repo";
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
}

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

  const reviewed = (request.cookies.get(REVIEWED_COOKIE)?.value ?? "").split(",").filter(Boolean);
  // Uma avaliação por lugar por aparelho: evita alguém inflar um lugar.
  if (!reviewed.includes(b.placeId)) {
    await repo.addMicroReview({
      placeId: b.placeId,
      occasion: b.occasion,
      spend: b.spend,
      cover: b.cover,
      noise: b.noise,
      deviceId: request.cookies.get(DEVICE_COOKIE)?.value ?? "sem-cookie",
    });
    reviewed.push(b.placeId);
  }

  const res = NextResponse.json({ total: reviewed.length });
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
