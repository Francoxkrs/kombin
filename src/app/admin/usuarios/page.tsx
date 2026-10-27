import { requireAdmin } from "@/lib/auth";
import { getRepo } from "@/lib/repo";
import { setRole } from "../actions";
import { Confirm } from "../Confirm";
import { dateBR } from "../format";

export default async function AdminUsers({ searchParams }: PageProps<"/admin/usuarios">) {
  const me = await requireAdmin();
  const q = String((await searchParams).q ?? "").trim().toLowerCase();
  const users = await getRepo().listUsers();
  const shown = q
    ? users.filter((u) => [u.name, u.email].some((v) => v?.toLowerCase().includes(q)))
    : users;
  const admins = users.filter((u) => u.role === "admin").length;

  return (
    <>
      <p className="text-[15px] text-muted">
        {users.length} contas, {admins} {admins === 1 ? "admin" : "admins"}. Quem está em ADMIN_EMAILS na Vercel é admin
        mesmo sem o papel aqui.
      </p>
      <form className="mt-4">
        <input
          name="q"
          defaultValue={q}
          placeholder="Nome ou e-mail"
          aria-label="Buscar conta"
          className="h-14 w-full rounded-2xl bg-surface px-4 text-[16px] outline-none placeholder:text-muted focus:ring-2 focus:ring-ipe"
        />
      </form>
      <ul className="mt-4 space-y-3">
        {shown.slice(0, 100).map((u) => {
          const label = u.name ?? u.email ?? "Sem nome";
          return (
            <li key={u.id} className="rounded-2xl bg-surface p-5 text-[15px]">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-[18px] font-semibold">{u.name ?? "Sem nome"}</p>
                  {u.email && <p className="truncate text-muted">{u.email}</p>}
                </div>
                {u.role === "admin" && (
                  <span className="shrink-0 rounded-full bg-ipe px-2.5 py-1 text-[13px] font-semibold text-on-ipe">admin</span>
                )}
              </div>
              <p className="mt-2 text-[14px] text-muted">
                Entrou em {dateBR(u.createdAt)}
                {u.lastSignIn && `, último acesso ${dateBR(u.lastSignIn)}`}. {u.reviews}{" "}
                {u.reviews === 1 ? "avaliação" : "avaliações"}.
                {u.owns.length > 0 && ` Dono de ${u.owns.join(", ")}.`}
              </p>
              {u.id !== me.id && (
                <div className="mt-3">
                  <Confirm
                    label={u.role === "admin" ? "Tirar admin" : "Tornar admin"}
                    warning={
                      u.role === "admin"
                        ? `${label} perde o acesso a este painel.`
                        : `${label} vai poder aprovar lugares, mudar donos e dar admin para outras pessoas.`
                    }
                    confirm={u.role === "admin" ? "Tirar admin" : "Tornar admin"}
                    action={setRole}
                    fields={{ userId: u.id, role: u.role === "admin" ? "user" : "admin", label }}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}
