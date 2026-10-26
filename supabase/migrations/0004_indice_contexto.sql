-- Índice mais inteligente: visita confirmada pesa em dobro e o app aprende com as buscas.

-- Visita confirmada: a pessoa fez check-in no raio do lugar (a conta é feita no
-- navegador; só o "sim" chega aqui, nunca a localização) ou clicou em "Como chegar"
-- algumas horas antes de avaliar.
alter table micro_reviews add column if not exists verified boolean not null default false;

-- Médias ponderadas: avaliação com visita confirmada vale 2, as outras 1.
-- Colunas novas ficam no fim para o "create or replace" aceitar.
create or replace view place_signals as
select
  place_id,
  count(*)::int as reviews,
  sum(spend * w)::float8 / sum(w) as spend_avg,
  sum(noise * w)::float8 / sum(w) as noise_avg,
  sum(case when cover then w else 0 end)::float8 / sum(w) as cover_ratio,
  count(*) filter (where verified)::int as verified,
  sum(w)::float8 as weight
from (
  select place_id, spend, noise, cover, verified, case when verified then 2 else 1 end as w
  from micro_reviews
) r
group by place_id;

-- Buscas: o que a pessoa filtrou em cada ocasião. Alimenta o "Seu estilo" do índice
-- e as métricas de uso. Sem localização: origem (lat/lng) nunca é gravada.
create table if not exists search_log (
  id bigint generated always as identity primary key,
  user_id uuid references profiles (id) on delete cascade,
  device_id text not null,
  occasion text not null,
  cuisine text,
  budget smallint check (budget between 1 and 4),
  party text,
  neighborhood text,
  tags text[] not null default '{}',
  quiet boolean not null default false,
  no_cover boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists search_log_user_idx on search_log (user_id, created_at desc) where user_id is not null;
create index if not exists search_log_device_idx on search_log (device_id, created_at desc);
create index if not exists lead_clicks_device_idx on lead_clicks (device_id, created_at desc);

-- Só o servidor (chave secreta) lê e grava.
alter table search_log enable row level security;
