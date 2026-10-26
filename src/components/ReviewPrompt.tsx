import { cookies } from "next/headers";
import { PENDING_REVIEW_COOKIE, REVIEWED_COOKIE } from "@/lib/device-cookie";
import { getRepo } from "@/lib/repo";
import { MicroReview } from "./MicroReview";

function isDue(clickedAt: number, delayMin: number): boolean {
  return Date.now() - clickedAt >= delayMin * 60_000;
}

export interface PendingReview {
  p: string;
  o: string | null;
  t: number;
}

/**
 * Depois de um clique em WhatsApp ou Como chegar, na próxima vez que a pessoa
 * abrir o app (passado o intervalo), pergunta "Como foi?". É o substituto da
 * notificação ao sair do local, que um PWA não faz bem.
 */
export async function ReviewPrompt() {
  const jar = await cookies();
  const raw = jar.get(PENDING_REVIEW_COOKIE)?.value;
  if (!raw) return null;

  let pending: PendingReview;
  try {
    pending = JSON.parse(raw);
  } catch {
    return null;
  }

  const repo = getRepo();
  const delayMin = Number(process.env.REVIEW_DELAY_MINUTES ?? 90);
  if (!isDue(pending.t, delayMin)) return null;
  const reviewed = (jar.get(REVIEWED_COOKIE)?.value ?? "").split(",");
  if (reviewed.includes(pending.p)) return null;

  const place = await repo.getPlace(pending.p);
  if (!place) return null;
  return <MicroReview placeId={place.id} placeName={place.name} occasion={pending.o} />;
}
