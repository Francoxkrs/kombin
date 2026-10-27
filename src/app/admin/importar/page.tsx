import { SubmitButton } from "@/components/ui/SubmitButton";
import { BTN_IPE, BTN_LIGHT } from "@/components/ui/styles";
import { requireAdmin } from "@/lib/auth";
import { ESSENTIALS, QUERIES } from "@/lib/ingest/google";
import { getRepo } from "@/lib/repo";
import { createPlace, removeDemoPlaces } from "../actions";
import { ImportPanel } from "../ImportPanel";
import { PlaceFields } from "../PlaceFields";

// A importação e o vibe-check rodam como server actions desta página.
export const maxDuration = 60;

export default async function AdminImport() {
  await requireAdmin();
  const repo = getRepo();
  const [queue, demo] = await Promise.all([repo.placesWithoutVision().then((l) => l.length), repo.countDemoPlaces()]);
  return (
    <div className="max-w-3xl space-y-8">
      {demo > 0 && (
        <form action={removeDemoPlaces} className="rounded-2xl bg-surface p-5">
          <p className="text-[18px] font-semibold text-ipe">Há {demo} lugares fictícios no banco</p>
          <p className="mt-1 text-[15px] leading-snug text-ink-2">
            São os lugares de teste (Adega Lume, Varanda do Samba...), sem foto e com WhatsApp falso. Apague antes de
            divulgar o app.
          </p>
          <button className={`${BTN_LIGHT} mt-4 w-full`}>Apagar lugares fictícios</button>
        </form>
      )}
      <ImportPanel
        queries={QUERIES.map((q) => q.label)}
        essentials={ESSENTIALS}
        hasGoogleKey={!!process.env.GOOGLE_MAPS_API_KEY}
        hasVision={!!(process.env.GEMINI_API_KEY || process.env.ANTHROPIC_API_KEY)}
        visionQueue={queue}
      />
      <form id="novo" action={createPlace} className="scroll-mt-20 space-y-4 rounded-2xl bg-surface p-5">
        <p className="text-[18px] font-semibold">Cadastrar lugar à mão</p>
        <p className="text-[15px] leading-snug text-muted">
          Entra direto como aprovado. Dê nota de vibe só para as ocasiões em que ele deve aparecer.
        </p>
        <PlaceFields />
        <SubmitButton className={`${BTN_IPE} w-full`}>Cadastrar</SubmitButton>
      </form>
    </div>
  );
}
