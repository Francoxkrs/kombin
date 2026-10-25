-- Kombin: esquema inicial do MVP.
-- Rode no SQL Editor do Supabase (ou `supabase db push`).
--
-- Regra dos termos do Google: guardamos o place_id para sempre, e lat/lng
-- por no máximo 30 dias (coords_refreshed_at; o script `npm run refresh` atualiza).
-- Nota, fotos e reviews do Google NÃO são guardadas: são buscadas ao vivo.

create extension if not exists pgcrypto;

create table places (
  id uuid primary key default gen_random_uuid(),
  google_place_id text unique,
  name text not null,
  category text,
  neighborhood text,
  address text,
  lat double precision,
  lng double precision,
  coords_refreshed_at timestamptz,
  whatsapp text,               -- só dígitos, com DDI: 5567999999999
  instagram text,
  cover_url text,              -- foto própria (restaurante ou time), tem prioridade sobre a do Google
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  seed_spend smallint check (seed_spend between 1 and 4),
  seed_noise smallint check (seed_noise between 1 and 3),
  seed_cover boolean,
  vibe jsonb not null default '{}'::jsonb,  -- {"encontro": 9.5, "pagode": 3}
  ai_summary text,
  ai_aesthetic numeric(3, 1),
  ai_model text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index places_status_idx on places (status);

create table micro_reviews (
  id bigint generated always as identity primary key,
  place_id uuid not null references places (id) on delete cascade,
  device_id text not null,
  occasion text,
  spend smallint not null check (spend between 1 and 4),
  cover boolean not null,
  noise smallint not null check (noise between 1 and 3),
  created_at timestamptz not null default now()
);

create index micro_reviews_place_idx on micro_reviews (place_id);

create view place_signals as
select
  place_id,
  count(*)::int as reviews,
  avg(spend)::float8 as spend_avg,
  avg(noise)::float8 as noise_avg,
  avg(case when cover then 1 else 0 end)::float8 as cover_ratio
from micro_reviews
group by place_id;

create table decision_sessions (
  code text primary key,
  occasion text not null,
  place_ids uuid[] not null,
  created_at timestamptz not null default now()
);

create table decision_votes (
  session_code text not null references decision_sessions (code) on delete cascade,
  device_id text not null,
  place_id uuid not null references places (id) on delete cascade,
  voter_name text,
  created_at timestamptz not null default now(),
  primary key (session_code, device_id)
);

-- Cada clique em "Reservar via WhatsApp" ou "Como chegar".
-- É o número que mostramos ao dono do restaurante no upsell.
create table lead_clicks (
  id bigint generated always as identity primary key,
  place_id uuid not null references places (id) on delete cascade,
  occasion text,
  kind text not null check (kind in ('whatsapp', 'directions')),
  device_id text not null,
  created_at timestamptz not null default now()
);

create index lead_clicks_place_time_idx on lead_clicks (place_id, created_at);

-- O app acessa o banco só pelo servidor (service role). RLS ligado e
-- leitura pública apenas dos lugares aprovados, para nada vazar pela chave anon.
alter table places enable row level security;
alter table micro_reviews enable row level security;
alter table decision_sessions enable row level security;
alter table decision_votes enable row level security;
alter table lead_clicks enable row level security;

create policy "lugares aprovados são públicos" on places
  for select using (status = 'approved');
