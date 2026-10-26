import { ChevronRight, Compass, Heart, LogOut, MapPinCheck, Pencil, Shield, Store } from "lucide-react";
import Link from "next/link";
import { signOut, updateName } from "@/app/actions";
import { PlaceTile } from "@/components/PlaceTile";
import { LogoMark } from "@/components/ui/Logo";
import { Page } from "@/components/ui/Page";
import { Avatar, TopBar } from "@/components/ui/TopBar";
import { getCurrentUser } from "@/lib/auth";
import { EMPTY_SIGNALS, getCatalog } from "@/lib/catalog";
import { getRepo } from "@/lib/repo";
import { getSaved } from "@/lib/saved";

export const metadata = { title: "Você · Kombin" };

const EXPLORER_AT = 5;

function Ring({ value, max }: { value: number; max: number }) {
  const r = 30;
  const c = 2 * Math.PI * r;
  const pct = Math.min(1, value / max);
  return (
    <svg viewBox="0 0 72 72" className="size-[4.5rem] -rotate-90" aria-hidden>
      <circle cx="36" cy="36" r={r} fill="none" stroke="rgb(255 255 255 / 0.15)" strokeWidth="7" />
      <circle
        cx="36"
        cy="36"
        r={r}
        fill="none"
        stroke="#34d399"
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - pct)}
        style={{ transition: "stroke-dashoffset 1s var(--ease-out)" }}
      />
    </svg>
  );
}

export default async function ProfilePage({ searchParams }: PageProps<"/perfil">) {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <Page>
        <TopBar right={<span />} />
        <main className="flex flex-1 flex-col justify-center px-6 pb-36 text-center">
          <div className="rise mx-auto">
            <LogoMark size={64} />
          </div>
          <h1 className="rise mt-6 text-4xl leading-[1.05] font-bold tracking-tight" style={{ "--i": 1 } as React.CSSProperties}>
            Seus lugares, num <span className="accent text-[1.12em]">lugar só</span>.
          </h1>
          <p className="rise mx-auto mt-3 max-w-xs text-muted" style={{ "--i": 2 } as React.CSSProperties}>
            Salve o que quer conhecer, marque onde já foi e ganhe o selo Explorador de Campo Grande.
          </p>
          <Link
            href="/entrar?next=/perfil"
            transitionTypes={["nav-forward"]}
            className="press rise mx-auto mt-7 w-full max-w-xs rounded-full bg-foreground py-4 text-sm font-semibold text-background"
            style={{ "--i": 3 } as React.CSSProperties}
          >
            Entrar ou criar conta
          </Link>
          <Link href="/painel" className="mt-4 text-sm font-semibold text-muted underline">
            Tenho um restaurante
          </Link>
        </main>
      </Page>
    );
  }

  const list = (await searchParams).lista === "fui" ? "been" : "want";
  const repo = getRepo();
  const [{ byId, signals, places }, saved, reviews, owned] = await Promise.all([
    getCatalog(),
    getSaved(user.id),
    repo.countUserReviews(user.id),
    repo.ownedPlaces(user.id),
  ]);
  const ids = list === "want" ? saved.want : saved.been;
  const shown = ids.map((id) => byId.get(id)).filter((p) => !!p);
  const explorer = reviews >= EXPLORER_AT;
  const wantSet = new Set(saved.want);

  return (
    <Page>
      <TopBar right={<span />} />
      <main className="flex-1 space-y-7 px-5 pt-2 pb-36">
        <section className="rise flex items-center gap-4">
          <span className="rounded-full ring-4 ring-soft">
            <Avatar name={user.name} url={user.avatarUrl} size={76} />
          </span>
          <div className="min-w-0 flex-1">
            <form action={updateName} className="group flex items-center gap-2">
              <input
                id="perfil-nome"
                name="name"
                defaultValue={user.name}
                aria-label="Seu nome"
                maxLength={40}
                className="display min-w-0 flex-1 bg-transparent text-[2rem] outline-none"
              />
              <label htmlFor="perfil-nome" className="text-muted group-focus-within:hidden" aria-hidden>
                <Pencil className="size-4" strokeWidth={1.5} />
              </label>
              <button className="press hidden rounded-full bg-foreground px-3 py-1.5 text-xs font-bold text-white group-focus-within:block">
                Salvar
              </button>
            </form>
            <p className="truncate text-sm text-muted">{user.email}</p>
          </div>
        </section>

        <section className="grid grid-cols-3 gap-2 text-center">
          {[
            { n: saved.want.length, l: "Quero ir" },
            { n: saved.been.length, l: "Já fui" },
            { n: reviews, l: "Avaliações" },
          ].map((s, i) => (
            <div key={s.l} className="rise rounded-2xl border border-line bg-surface py-4" style={{ "--i": i } as React.CSSProperties}>
              <p className="display text-[1.9rem]">{s.n}</p>
              <p className="mt-1 text-xs font-semibold text-muted">{s.l}</p>
            </div>
          ))}
        </section>

        <section className="flex items-center gap-4 rounded-3xl bg-foreground p-5 text-white">
          <div className="relative grid place-items-center">
            <Ring value={reviews} max={EXPLORER_AT} />
            <Compass className="absolute size-7 text-white" strokeWidth={1.5} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[1.05rem] font-bold">{explorer ? "Explorador de Campo Grande" : "Rumo ao selo Explorador"}</p>
            <p className="mt-1 text-sm text-white/70">
              {explorer
                ? `${reviews} avaliações. Suas dicas deixam o índice mais certeiro.`
                : `${reviews}/${EXPLORER_AT} avaliações. Cada uma leva 3 toques depois de uma saída.`}
            </p>
            {places.length > 0 && (
              <p className="mt-1 text-xs text-white/50">
                Você já foi a {saved.been.length} de {places.length} lugares do Kombin.
              </p>
            )}
          </div>
        </section>

        <section>
          <nav className="mb-4 grid grid-cols-2 gap-1 rounded-2xl border border-line bg-soft p-1">
            {[
              { key: "want", label: `Quero ir · ${saved.want.length}`, href: "/perfil" },
              { key: "been", label: `Já fui · ${saved.been.length}`, href: "/perfil?lista=fui" },
            ].map((t) => (
              <Link
                key={t.key}
                href={t.href}
                replace
                scroll={false}
                className={`rounded-xl py-2.5 text-center text-xs font-semibold transition ${t.key === list ? "bg-foreground text-background shadow-sm" : "text-muted"}`}
              >
                {t.label}
              </Link>
            ))}
          </nav>
          {shown.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-line p-6 text-center">
              {list === "want" ? (
                <Heart className="mx-auto size-7 text-muted" strokeWidth={1.5} />
              ) : (
                <MapPinCheck className="mx-auto size-7 text-muted" strokeWidth={1.5} />
              )}
              <p className="mt-2 text-sm text-muted">
                {list === "want"
                  ? "Toque no coração de um lugar para guardar aqui."
                  : "Quando você avalia um lugar, ele entra aqui."}
              </p>
              <Link href="/" className="press mt-4 inline-block rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-background">
                Descobrir lugares
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-3 gap-y-6">
              {shown.map((p, i) => (
                <PlaceTile
                  key={p.id}
                  place={p}
                  spend={signals.get(p.id)?.spendAvg ?? p.seedSpend ?? EMPTY_SIGNALS.spendAvg}
                  saved={wantSet.has(p.id)}
                  loggedIn
                  index={i % 6}
                />
              ))}
            </div>
          )}
        </section>

        <section className="divide-y divide-line overflow-hidden rounded-3xl border border-line bg-surface">
          <Link href="/painel" className="flex items-center gap-3 p-4">
            <Store className="size-5" strokeWidth={1.5} />
            <span className="min-w-0 flex-1">
              <span className="block font-bold">{owned.length > 0 ? "Painel do restaurante" : "Tem um restaurante?"}</span>
              <span className="block truncate text-sm text-muted">
                {owned.length > 0 ? "Aparições, cliques e edição da página" : "Reivindique a página e veja os clientes que chegam"}
              </span>
            </span>
            <ChevronRight className="size-5 text-muted" strokeWidth={1.5} />
          </Link>
          {user.isAdmin && (
            <Link href="/admin" className="flex items-center gap-3 p-4">
              <Shield className="size-5" strokeWidth={1.5} />
              <span className="flex-1 font-bold">Admin do Kombin</span>
              <ChevronRight className="size-5 text-muted" strokeWidth={1.5} />
            </Link>
          )}
          <form action={signOut}>
            <button className="flex w-full items-center gap-3 p-4 text-left text-muted">
              <LogOut className="size-5" strokeWidth={1.5} /> Sair
            </button>
          </form>
        </section>
      </main>
    </Page>
  );
}
