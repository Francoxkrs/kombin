-- Contas (Supabase Auth), listas do cliente, painel do restaurante e tipo de comida.

-- Tipo de comida (pizza, japonesa, hamburguer...). Slugs em src/lib/cuisines.ts.
alter table places
  add column cuisines text[] not null default '{}',
  add column menu_url text;

create index places_cuisines_idx on places using gin (cuisines);

-- Perfil público de cada conta. Criado automaticamente no primeiro login.
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text,
  avatar_url text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Listas do cliente: "Quero ir" e "Já fui".
create table saved_places (
  user_id uuid not null references profiles (id) on delete cascade,
  place_id uuid not null references places (id) on delete cascade,
  list text not null check (list in ('want', 'been')),
  created_at timestamptz not null default now(),
  primary key (user_id, place_id, list)
);

create index saved_places_place_idx on saved_places (place_id);

-- Micro-reviews: com conta, vale uma por pessoa por lugar (a mais recente substitui).
alter table micro_reviews add column user_id uuid references profiles (id) on delete set null;
create unique index micro_reviews_user_place_idx on micro_reviews (place_id, user_id) where user_id is not null;

alter table decision_sessions add column created_by uuid references profiles (id) on delete set null;

-- Donos de restaurante e pedidos de reivindicação (o admin aprova).
create table place_owners (
  place_id uuid not null references places (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (place_id, user_id)
);

create table place_claims (
  id bigint generated always as identity primary key,
  place_id uuid not null references places (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  contact text not null,
  message text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create unique index place_claims_open_idx on place_claims (place_id, user_id) where status = 'pending';

-- Quantas vezes o lugar apareceu no top 3 de cada ocasião, por dia.
-- É o "você apareceu 400 vezes para Encontro" do painel do restaurante.
create table place_impressions (
  place_id uuid not null references places (id) on delete cascade,
  occasion text not null,
  day date not null default (now() at time zone 'America/Campo_Grande')::date,
  count integer not null default 0,
  primary key (place_id, occasion, day)
);

create function public.add_impressions(place_ids uuid[], occ text) returns void
language sql as $$
  insert into public.place_impressions (place_id, occasion, day, count)
  select unnest(place_ids), occ, (now() at time zone 'America/Campo_Grande')::date, 1
  on conflict (place_id, occasion, day) do update set count = public.place_impressions.count + 1;
$$;

revoke execute on function public.add_impressions(uuid[], text) from public, anon, authenticated;

-- Fotos próprias dos restaurantes (enviadas pelo painel).
insert into storage.buckets (id, name, public)
values ('covers', 'covers', true)
on conflict (id) do nothing;

-- O app grava tudo pelo servidor. RLS ligado; cada pessoa só lê o que é dela pela chave pública.
alter table profiles enable row level security;
alter table saved_places enable row level security;
alter table place_owners enable row level security;
alter table place_claims enable row level security;
alter table place_impressions enable row level security;

create policy "perfil próprio" on profiles for select using (auth.uid() = id);
create policy "listas próprias" on saved_places for select using (auth.uid() = user_id);
