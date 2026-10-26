import { OCCASIONS, type OccasionId } from "../data";
import { ComandaHome } from "./ComandaHome";

export default async function ComandaPage({ searchParams }: PageProps<"/conceitos/comanda">) {
  const { o } = await searchParams;
  const initial = OCCASIONS.find((x) => x.id === o)?.id ?? "encontro";
  return <ComandaHome initial={initial as OccasionId} />;
}
