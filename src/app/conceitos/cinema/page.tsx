import { OCCASIONS, type OccasionId } from "../data";
import { CinemaHome } from "./CinemaHome";

export default async function CinemaPage({ searchParams }: PageProps<"/conceitos/cinema">) {
  const { o } = await searchParams;
  const initial = OCCASIONS.find((x) => x.id === o)?.id ?? "encontro";
  return <CinemaHome initial={initial as OccasionId} />;
}
