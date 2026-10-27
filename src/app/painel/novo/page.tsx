import { Page } from "@/components/ui/Page";
import { BTN_IPE, INPUT_ON_SURFACE, TEXTAREA_ON_SURFACE } from "@/components/ui/styles";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Panel, Shell } from "@/components/workspace/Shell";
import { requireUser } from "@/lib/auth";
import { CUISINES } from "@/lib/cuisines";
import { requestNewPlace } from "../actions";

export const metadata = { title: "Cadastrar restaurante · Kombin" };

const field = `${INPUT_ON_SURFACE} mt-2`;

export default async function NewPlaceRequest({ searchParams }: PageProps<"/painel/novo">) {
  await requireUser("/painel/novo");
  const sp = await searchParams;
  const name = typeof sp.nome === "string" ? sp.nome.slice(0, 80) : "";
  const error =
    sp.erro === "limite"
      ? "Você já mandou vários pedidos hoje. Tente amanhã ou fale com a gente."
      : sp.erro
        ? "Confira o nome e o contato (telefone com DDD)."
        : "";

  return (
    <Page>
      <Shell
        area="Painel do restaurante"
        title="Cadastrar meu restaurante"
        root="/painel"
        nav={[{ href: "/painel", label: "Voltar ao painel" }]}
      >
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <Panel>
            <form action={requestNewPlace} className="space-y-5 text-[15px]">
              {error && <p className="rounded-xl bg-danger/15 p-3 text-danger">{error}</p>}
              <div className="grid gap-5 md:grid-cols-2">
                <label className="block md:col-span-2">
                  Nome da casa
                  <input name="name" required minLength={2} maxLength={80} defaultValue={name} className={field} />
                </label>
                <label className="block">
                  Bairro
                  <input name="neighborhood" maxLength={60} placeholder="Ex.: Jardim dos Estados" className={field} />
                </label>
                <label className="block">
                  Endereço
                  <input name="address" maxLength={160} placeholder="Rua, número" className={field} />
                </label>
                <label className="block">
                  WhatsApp da casa (opcional)
                  <input name="whatsapp" inputMode="tel" placeholder="67 99999-9999" className={field} />
                </label>
                <label className="block">
                  Instagram (opcional)
                  <input name="instagram" placeholder="@suacasa" className={field} />
                </label>
              </div>
              <fieldset>
                <legend className="mb-2">Tipo de comida</legend>
                <div className="flex flex-wrap gap-1.5">
                  {CUISINES.map((c) => (
                    <label key={c.slug} className="flex items-center gap-2 rounded-full bg-soft px-3 py-2">
                      <input type="checkbox" name="cuisines" value={c.slug} />
                      {c.label}
                    </label>
                  ))}
                </div>
              </fieldset>
              <label className="flex items-center gap-3 rounded-2xl bg-soft p-4">
                <input type="checkbox" name="opening" value="1" className="size-5" />
                <span>
                  <span className="block font-medium">Estou abrindo agora</span>
                  <span className="block text-[14px] text-muted">A casa ainda vai inaugurar ou abriu há pouco.</span>
                </span>
              </label>
              <div className="grid gap-5 md:grid-cols-2">
                <label className="block">
                  Seu telefone para confirmarmos
                  <input name="contact" required minLength={8} maxLength={80} inputMode="tel" placeholder="67 99999-9999" className={field} />
                </label>
                <label className="block">
                  Seu cargo e algo que comprove (opcional)
                  <textarea name="message" rows={2} maxLength={500} placeholder="Sou o dono. CNPJ 00.000.000/0001-00" className={`${TEXTAREA_ON_SURFACE} mt-2`} />
                </label>
              </div>
              <SubmitButton className={`${BTN_IPE} w-full md:w-auto`}>Enviar pedido</SubmitButton>
            </form>
          </Panel>

          <Panel title="O que acontece depois">
            <ol className="space-y-4 text-[15px] leading-snug text-ink-2">
              <li>
                <b className="block font-semibold text-foreground">1. A gente confere</b>
                Ligamos ou mandamos mensagem no telefone que você deixou. Costuma levar até 2 dias úteis.
              </li>
              <li>
                <b className="block font-semibold text-foreground">2. Você monta a página</b>
                Com o painel liberado, você põe foto, cardápio, WhatsApp e o recado da casa.
              </li>
              <li>
                <b className="block font-semibold text-foreground">3. A casa entra no app</b>
                Aparece nas ocasiões em que combina. Gasto, couvert e barulho vêm de quem for.
              </li>
            </ol>
          </Panel>
        </div>
      </Shell>
    </Page>
  );
}
