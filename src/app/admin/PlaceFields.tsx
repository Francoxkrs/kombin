import { CUISINES } from "@/lib/cuisines";
import { NOISE_LABELS, OCCASIONS, SPEND_LABELS } from "@/lib/occasions";
import { TAGS } from "@/lib/tags";
import type { Place } from "@/lib/types";

const input = "h-12 w-full rounded-xl bg-soft px-3 text-[15px] text-foreground outline-none placeholder:text-muted focus:ring-2 focus:ring-ipe";

/** Campos do lugar no admin (editar ou cadastrar à mão). */
export function PlaceFields({ place }: { place?: Place }) {
  return (
    <div className="grid grid-cols-2 gap-2 text-[15px]">
      <input name="name" required defaultValue={place?.name} placeholder="Nome" className={`${input} col-span-2`} />
      <input name="category" defaultValue={place?.category ?? ""} placeholder="Categoria (ex.: Pizzaria)" className={input} />
      <input name="neighborhood" defaultValue={place?.neighborhood ?? ""} placeholder="Bairro" className={input} />
      <input name="address" defaultValue={place?.address ?? ""} placeholder="Endereço" className={`${input} col-span-2`} />
      <input name="whatsapp" defaultValue={place?.whatsapp ?? ""} placeholder="WhatsApp (67 99999-9999)" className={input} />
      <input name="googlePlaceId" defaultValue={place?.googlePlaceId ?? ""} placeholder="Google place_id (opcional)" className={input} />
      <input name="coverUrl" defaultValue={place?.coverUrl ?? ""} placeholder="URL de foto própria (opcional)" className={`${input} col-span-2`} />

      <fieldset className="col-span-2">
        <legend className="mb-1 text-muted">Tipo de comida</legend>
        <div className="flex flex-wrap gap-1.5">
          {CUISINES.map((c) => (
            <label key={c.slug} className="flex items-center gap-1.5 rounded-full bg-soft px-3 py-1.5">
              <input type="checkbox" name="cuisines" value={c.slug} defaultChecked={place?.cuisines.includes(c.slug)} />
              {c.label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="col-span-2">
        <legend className="mb-1 text-muted">Etiquetas</legend>
        <div className="flex flex-wrap gap-1.5">
          {TAGS.map((t) => (
            <label key={t.slug} className="flex items-center gap-1.5 rounded-full bg-soft px-3 py-1.5">
              <input type="checkbox" name="tags" value={t.slug} defaultChecked={place?.tags.includes(t.slug)} />
              {t.label}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="col-span-2 flex items-center gap-2 rounded-xl bg-soft px-3 py-3">
        <input type="checkbox" name="featured" value="1" defaultChecked={place?.featured} />
        Destaque pago (aparece marcado no Descobrir)
      </label>

      <fieldset className="col-span-2">
        <legend className="mb-1 text-muted">Vibe por ocasião (0 a 10; vazio = não aparece na ocasião)</legend>
        <div className="grid grid-cols-3 gap-1.5">
          {OCCASIONS.map((o) => (
            <label key={o.slug} className="text-[13px] text-muted">
              {o.name}
              <input
                name={`vibe_${o.slug}`}
                inputMode="decimal"
                defaultValue={place?.vibe[o.slug] ?? ""}
                className={input}
              />
            </label>
          ))}
        </div>
      </fieldset>

      <select name="seedSpend" defaultValue={place?.seedSpend ?? ""} className={input}>
        <option value="">Gasto ?</option>
        {Object.entries(SPEND_LABELS).map(([v, label]) => (
          <option key={v} value={v}>{label}</option>
        ))}
      </select>
      <select name="seedNoise" defaultValue={place?.seedNoise ?? ""} className={input}>
        <option value="">Barulho ?</option>
        {Object.entries(NOISE_LABELS).map(([v, label]) => (
          <option key={v} value={v}>{label}</option>
        ))}
      </select>
      <select
        name="seedCover"
        defaultValue={place?.seedCover == null ? "" : place.seedCover ? "1" : "0"}
        className={`${input} col-span-2`}
      >
        <option value="">Couvert ?</option>
        <option value="0">Sem couvert</option>
        <option value="1">Tem couvert</option>
      </select>
    </div>
  );
}
