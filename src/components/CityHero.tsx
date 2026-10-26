import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getCatalog } from "@/lib/catalog";
import { rankPlaces } from "@/lib/match";
import { ANY_OCCASION } from "@/lib/occasions";
import { placePhotos } from "@/lib/screen";
import { Photo } from "./ui/Photo";
import { ROUND_LIGHT } from "./ui/styles";

/**
 * Abertura das telas sem lugar (entrar, perfil): a foto de uma casa de verdade de Campo Grande,
 * a que mais combina no geral, com o nome dela. O texto da tela vai por cima, embaixo.
 */
export async function CityHero({ back, children }: { back?: string; children: React.ReactNode }) {
  const { places, signals } = await getCatalog();
  const top = rankPlaces(places, signals, ANY_OCCASION)[0]?.place;
  const photos = top ? placePhotos(top) : [];

  return (
    <div className="relative h-[48svh] min-h-[340px]">
      <Photo src={photos[0] ?? null} fallbacks={photos.slice(1)} blurhash={top?.coverUrl ? top.coverBlurhash : null} alt="" className="absolute inset-0" eager />
      <div className="scrim-top absolute inset-x-0 top-0 h-28" />
      <div className="scrim-bottom absolute inset-x-0 bottom-0 h-3/4" />
      <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-4 px-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
        {back ? (
          <Link href={back} transitionTypes={["nav-back"]} aria-label="Voltar" className={ROUND_LIGHT}>
            <ArrowLeft className="size-5" strokeWidth={2} />
          </Link>
        ) : (
          <span />
        )}
        {top && (
          <Link href={`/l/${top.id}`} className="truncate text-[14px] text-foreground/85">
            Na foto: {top.name}
          </Link>
        )}
      </div>
      <div className="absolute inset-x-0 bottom-0 px-5 pb-6">{children}</div>
    </div>
  );
}
