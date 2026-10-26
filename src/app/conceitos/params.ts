import { OCCASIONS, PLACES, ranked, type OccasionId } from "./data";

/** Ocasião e lugar escolhidos na URL (?o=encontro&p=decanter), com padrão sensato. */
export async function pickFromParams(searchParams: Promise<Record<string, string | string[] | undefined>>) {
  const { o, p } = await searchParams;
  const occ = OCCASIONS.find((x) => x.id === o) ?? OCCASIONS[0];
  const place = PLACES.find((x) => x.id === p) ?? ranked(occ.id as OccasionId)[0] ?? PLACES[0];
  return { occ, place };
}
