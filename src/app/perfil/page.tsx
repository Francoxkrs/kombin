import { ChevronRight, Pencil } from "lucide-react";
import Link from "next/link";
import { signOut, updateName } from "@/app/actions";
import { CityHero } from "@/components/CityHero";
import { PlaceFrame } from "@/components/PlacePoster";
import { Page } from "@/components/ui/Page";
import { BTN_IPE, BTN_LIGHT } from "@/components/ui/styles";
import { Avatar, TopBar } from "@/components/ui/TopBar";
import { getCurrentUser } from "@/lib/auth";
import { getCatalog } from "@/lib/catalog";
import { getRepo } from "@/lib/repo";
import { getSaved } from "@/lib/saved";
import { placePhotos } from "@/lib/screen";

export const metadata = { title: "Você · Kombin" };

const EXPLORER_AT = 5;

function Row({ title, hint, children }: { title: string; hint?: string; children?: React.ReactNode }) {
  return (
    <span className="flex min-h-16 items-center gap-4 py-2">
      <span className="min-w-0 flex-1">
        <span className="block text-[17px] font-medium">{title}</span>
        {hint && <span className="block text-[15px] text-muted">{hint}</span>}
      </span>
      {children ?? <ChevronRight className="size-5 text-muted" strokeWidth={2} />}
    </span>
  );
}

export default async function ProfilePage({ searchParams }: PageProps<"/perfil">) {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <Page>
        <CityHero>
          <h1 className="title text-[48px]">Seus lugares, num lugar só</h1>
        </CityHero>
        <main className="flex-1 px-5 pt-5 pb-28">
          <p className="max-w-[34ch] text-[17px] leading-snug text-muted">
            Guarde o que quer conhecer, marque onde já foi e ganhe o selo Explorador de Campo Grande.
          </p>
          <Link href="/entrar?next=/perfil" transitionTypes={["nav-forward"]} className={`${BTN_IPE} mt-7 w-full`}>
            Entrar ou criar conta
          </Link>
          <Link href="/painel" className="mt-5 inline-flex h-11 items-center text-[15px] text-muted underline underline-offset-4">
            Tenho um restaurante
          </Link>
        </main>
      </Page>
    );
  }

  const list = (await searchParams).lista === "fui" ? "been" : "want";
  const repo = getRepo();
  const [{ byId, places }, saved, reviews, owned] = await Promise.all([
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
      <main className="flex-1 pb-28">
        <section className="flex items-center gap-4 px-5 pt-4">
          <Avatar name={user.name} url={user.avatarUrl} size={72} />
          <div className="min-w-0 flex-1">
            <form action={updateName} className="group flex items-center gap-2">
              <input
                id="perfil-nome"
                name="name"
                defaultValue={user.name}
                aria-label="Seu nome"
                maxLength={40}
                className="title min-w-0 flex-1 bg-transparent text-[34px] outline-none"
              />
              <label htmlFor="perfil-nome" className="grid size-11 place-items-center text-muted group-focus-within:hidden" aria-hidden>
                <Pencil className="size-4" strokeWidth={2} />
              </label>
              <button className="press hidden h-11 rounded-full bg-ipe px-4 text-[15px] font-semibold text-on-ipe group-focus-within:block">
                Salvar
              </button>
            </form>
            <p className="truncate text-[15px] text-muted">{user.email}</p>
          </div>
        </section>

        <dl className="mt-8 grid grid-cols-3 px-5">
          {[
            { n: saved.want.length, l: "Quero ir" },
            { n: saved.been.length, l: "Já fui" },
            { n: reviews, l: reviews === 1 ? "Avaliação" : "Avaliações" },
          ].map((s) => (
            <div key={s.l} className="flex flex-col-reverse">
              <dt className="mt-1 text-[15px] text-muted">{s.l}</dt>
              <dd className="title text-[48px] tabular-nums">{s.n}</dd>
            </div>
          ))}
        </dl>

        <section className="mt-9 px-5">
          <h2 className="title text-[28px]">{explorer ? "Explorador de Campo Grande" : "Rumo ao selo Explorador"}</h2>
          <div className="mt-4 flex gap-1" aria-hidden>
            {Array.from({ length: EXPLORER_AT }, (_, i) => (
              <span key={i} className={`h-2 flex-1 rounded-full ${i < reviews ? "bg-ipe" : "bg-soft"}`} />
            ))}
          </div>
          <p className="mt-3 text-[15px] leading-snug text-muted">
            {explorer
              ? `${reviews} avaliações. Suas dicas deixam o índice mais certeiro.`
              : `${reviews} de ${EXPLORER_AT} avaliações. Cada uma leva três toques depois de uma saída.`}
            {places.length > 0 && ` Você já foi a ${saved.been.length} dos ${places.length} lugares do Kombin.`}
          </p>
        </section>

        <nav className="mt-10 flex gap-6 px-5" aria-label="Suas listas">
          {[
            { key: "want", label: `Quero ir (${saved.want.length})`, href: "/perfil" },
            { key: "been", label: `Já fui (${saved.been.length})`, href: "/perfil?lista=fui" },
          ].map((t) => (
            <Link
              key={t.key}
              href={t.href}
              replace
              scroll={false}
              aria-current={t.key === list ? "page" : undefined}
              className={`flex h-11 flex-col justify-center text-[17px] ${t.key === list ? "font-semibold" : "text-muted"}`}
            >
              {t.label}
              <span className={`mt-1 h-[3px] w-full ${t.key === list ? "bg-ipe" : "bg-transparent"}`} />
            </Link>
          ))}
        </nav>

        {shown.length === 0 ? (
          <div className="px-5 pt-5">
            <p className="max-w-[32ch] text-[17px] leading-snug text-muted">
              {list === "want" ? "Toque no coração de um lugar para guardar aqui." : "Quando você avalia um lugar, ele entra aqui."}
            </p>
            <Link href="/" className={`${BTN_LIGHT} mt-5 w-full`}>
              Descobrir lugares
            </Link>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-1">
            {shown.map((p, i) => (
              <PlaceFrame key={p.id} id={p.id} name={p.name} photos={placePhotos(p)} saved={wantSet.has(p.id)} loggedIn eager={i < 4} />
            ))}
          </div>
        )}

        <section className="mt-10 px-5">
          <Link href="/painel" className="block">
            <Row
              title={owned.length > 0 ? "Painel do restaurante" : "Tem um restaurante?"}
              hint={owned.length > 0 ? "Aparições, cliques e edição da página" : "Reivindique a página e veja os clientes que chegam"}
            />
          </Link>
          {user.isAdmin && (
            <Link href="/admin" className="block">
              <Row title="Admin do Kombin" hint="Importar lugares, revisar e aprovar donos" />
            </Link>
          )}
          <form action={signOut}>
            <button className="block w-full text-left text-muted">
              <Row title="Sair">
                <span />
              </Row>
            </button>
          </form>
        </section>
      </main>
    </Page>
  );
}
