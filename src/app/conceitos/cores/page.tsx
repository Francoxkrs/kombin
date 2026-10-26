import { OCCASIONS, type OccasionId } from "../data";
import { CoresHome } from "./CoresHome";

export default async function CoresPage({ searchParams }: PageProps<"/conceitos/cores">) {
  const { o } = await searchParams;
  const initial = OCCASIONS.find((x) => x.id === o)?.id ?? "encontro";
  return <CoresHome initial={initial as OccasionId} />;
}
