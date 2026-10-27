/**
 * Ação que pede um segundo toque: o primeiro abre o aviso, o segundo envia.
 * Sem JavaScript (details/summary), então funciona antes da página hidratar.
 */
export function Confirm({
  label,
  warning,
  confirm,
  action,
  fields,
  reason,
}: {
  label: string;
  warning: string;
  confirm: string;
  action: (formData: FormData) => Promise<void>;
  fields: Record<string, string>;
  /** Mostra um campo de motivo que vai para o histórico. */
  reason?: boolean;
}) {
  return (
    <details className="group">
      <summary className="press inline-flex h-11 cursor-pointer list-none items-center rounded-full bg-soft px-4 text-[15px] group-open:bg-foreground group-open:text-background">
        {label}
      </summary>
      <form action={action} className="mt-2 rounded-2xl bg-soft p-4 text-[15px]">
        {Object.entries(fields).map(([k, v]) => (
          <input key={k} type="hidden" name={k} value={v} />
        ))}
        <p className="leading-snug">{warning}</p>
        {reason && (
          <input
            name="reason"
            maxLength={200}
            placeholder="Motivo (opcional, fica no histórico)"
            className="mt-3 h-12 w-full rounded-xl bg-surface px-3 text-[15px] outline-none placeholder:text-muted focus:ring-2 focus:ring-ipe"
          />
        )}
        <div className="mt-3 flex gap-2">
          <button className="press flex h-11 items-center rounded-full bg-danger px-4 font-semibold text-on-ipe">
            {confirm}
          </button>
        </div>
      </form>
    </details>
  );
}
