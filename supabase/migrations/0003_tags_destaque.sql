-- Etiquetas do lugar (música ao vivo, bom pra grupos, área externa...), destaque pago
-- e controle da importação do Google.

alter table places add column if not exists tags text[] not null default '{}';
alter table places add column if not exists featured boolean not null default false;
alter table places add column if not exists imported_at timestamptz;

create index if not exists places_tags_idx on places using gin (tags);
