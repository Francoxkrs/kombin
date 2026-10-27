-- Painel de administração: histórico de tudo o que um admin muda (aprovar, rejeitar,
-- editar, mudar papel, revogar dono). Serve de auditoria antes de abrir o painel
-- para mais gente da equipe.

create table if not exists admin_log (
  id bigint generated always as identity primary key,
  actor_id uuid references profiles (id) on delete set null,
  actor_name text,
  action text not null,
  target text,
  detail text,
  created_at timestamptz not null default now()
);

create index if not exists admin_log_time_idx on admin_log (created_at desc);
create index if not exists search_log_time_idx on search_log (created_at desc);
create index if not exists micro_reviews_place_time_idx on micro_reviews (place_id, created_at desc);

-- Só o servidor (chave secreta) lê e grava, como as outras tabelas desde a 0004.
alter table admin_log enable row level security;
revoke all on admin_log from anon, authenticated;
