import Link from "next/link";
import { signOut, updateName } from "@/app/actions";
import { Avatar, Header } from "@/components/Header";
import { PlaceRow } from "@/components/PlaceRow";
import { requireUser } from "@/lib/auth";
import { getRepo } from "@/lib/repo";

export const metadata = { title: "Seu perfil · Kombin" };

const EXPLORER_AT = 5;

export default async function ProfilePage({ searchParams }: PageProps<"/perfil">) {
  const user = await requireUser("/perfil");
  const list = (await searchParams).lista === "fui" ? "been" : "want";
  const repo = getRepo();
  const [places, reviews, owned] = await Promise.all([
    repo.listSaved(user.id, list),
    repo.countUserReviews(user.id),
    repo.ownedPlaces(user.id),
  ]);
  const explorer = reviews >= EXPLORER_AT;

  return (
    <>
      <Header back={{ href: "/", label: "Início" }} />
      <main className="flex-1 space-y-7 px-5 pt-4 pb-12">
        <section className="flex items-center gap-4">
          <Avatar name={user.name} url={user.avatarUrl} size={64} />
          <div className="min-w-0 flex-1">
            <form action={updateName} className="flex items-center gap-2">
              <input
                name="name"
                defaultValue={user.name}
                aria-label="Seu nome"
                maxLength={40}
                className="min-w-0 flex-1 bg-transparent text-2xl font-bold tracking-tight outline-none focus:underline"
              />
              <button className="text-xs text-muted underline">salvar</button>
            </form>
            <p className="truncate text-sm text-muted">{user.email}</p>
          </div>
        </section>

        <section className="rounded-3xl bg-foreground p-5 text-background">
          <div className="flex items-center justify-between">
            <p className="font-bold">{explorer ? "Explorador de Campo Grande" : "Rumo ao selo Explorador"}</p>
            <span className="text-sm opacity-70">
              {reviews}/{EXPLORER_AT}
            </span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/15">
            <div
              className="h-full rounded-full bg-white"
              style={{ width: `${Math.min(100, (reviews / EXPLORER_AT) * 100)}%` }}
            />
          </div>
          <p className="mt-2 text-sm opacity-70">
            {explorer
              ? `${reviews} avaliações. Suas dicas ajudam a galera a escolher.`
              : "Cada avaliação de 3 toques depois de uma saída conta."}
          </p>
        </section>

        <section>
          <nav className="mb-3 flex gap-2">
            {[
              { key: "want", label: "Quero ir", href: "/perfil" },
              { key: "been", label: "Já fui", href: "/perfil?lista=fui" },
            ].map((t) => (
              <Link
                key={t.key}
                href={t.href}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${t.key === list ? "bg-foreground text-background" : "bg-surface"}`}
              >
                {t.label}
              </Link>
            ))}
          </nav>
          {places.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-line p-5 text-center text-sm text-muted">
              {list === "want"
                ? "Toque em “Quero ir” na página de um lugar para guardar aqui."
                : "Lugares que você marcou como visitados aparecem aqui."}
            </p>
          ) : (
            <ul className="space-y-2">
              {places.map((p) => (
                <li key={p.id}>
                  <PlaceRow place={p} href={`/l/${p.id}`} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-2">
          <Link href="/painel" className="block rounded-2xl bg-surface p-4">
            <p className="font-semibold">{owned.length > 0 ? "Painel do restaurante" : "Tem um restaurante?"}</p>
            <p className="text-sm text-muted">
              {owned.length > 0
                ? `${owned.length} ${owned.length === 1 ? "lugar" : "lugares"}: veja quantas vezes apareceu e quantos clientes chamaram.`
                : "Reivindique a página e veja quantos clientes o Kombin te manda."}
            </p>
          </Link>
          {user.isAdmin && (
            <Link href="/admin" className="block rounded-2xl bg-surface p-4 font-semibold">
              Admin do Kombin
            </Link>
          )}
          <form action={signOut}>
            <button className="w-full py-3 text-sm text-muted underline">Sair</button>
          </form>
        </section>
      </main>
    </>
  );
}
