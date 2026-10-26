-- Kombin: endurecimento de segurança (auditoria de out/2026).
-- Rode no SQL Editor do Supabase depois da 0003. Pode rodar mais de uma vez.
--
-- Modelo de acesso: o app grava e lê tudo PELO SERVIDOR, com a chave secreta
-- (service_role, que ignora RLS), depois de validar o pedido e conferir o limite
-- de requisições. A chave pública (anon/publishable) vai para o navegador e só
-- serve para o login. Por isso as políticas abaixo liberam só leitura; nenhuma
-- escrita pela chave pública é permitida, nem para quem está logado. Isso é mais
-- restrito que "logado pode inserir": um INSERT direto pela chave pública pularia
-- a validação e o limite do servidor.

-- ---------- 1. RLS ligado em todas as tabelas ----------
alter table places enable row level security;
alter table micro_reviews enable row level security;
alter table decision_sessions enable row level security;
alter table decision_votes enable row level security;
alter table lead_clicks enable row level security;
alter table profiles enable row level security;
alter table saved_places enable row level security;
alter table place_owners enable row level security;
alter table place_claims enable row level security;
alter table place_impressions enable row level security;

-- ---------- 2. Chave pública: nada de escrita, em nenhuma tabela ----------
-- Defesa em profundidade: mesmo que alguém crie uma política de escrita por engano,
-- sem o privilégio da tabela o Postgres recusa antes de olhar a política.
revoke insert, update, delete, truncate, references, trigger
  on all tables in schema public from anon, authenticated;
revoke usage, select, update on all sequences in schema public from anon, authenticated;
-- Tabelas que o navegador nunca precisa ler.
revoke select on decision_sessions, decision_votes, lead_clicks, place_claims, place_impressions, place_owners
  from anon, authenticated;
-- Tabelas criadas no futuro também nascem sem escrita pela chave pública.
alter default privileges in schema public
  revoke insert, update, delete, truncate on tables from anon, authenticated;

-- ---------- 3. Políticas de leitura ----------
-- Lugares: só os aprovados são públicos. Ninguém altera ou apaga pela chave pública
-- (não existe política de UPDATE/DELETE e o privilégio foi revogado acima).
drop policy if exists "lugares aprovados são públicos" on places;
create policy "lugares aprovados são públicos" on places
  for select to anon, authenticated using (status = 'approved');

-- Perfil: cada um lê só o próprio.
drop policy if exists "perfil próprio" on profiles;
create policy "perfil próprio" on profiles
  for select to authenticated using ((select auth.uid()) = id);

-- Listas "Quero ir" / "Já fui": cada um lê só as suas (IDOR).
drop policy if exists "listas próprias" on saved_places;
create policy "listas próprias" on saved_places
  for select to authenticated using ((select auth.uid()) = user_id);

-- Avaliações: cada um lê só as suas. O público vê só as médias (place_signals,
-- lida pelo servidor); a avaliação crua tem device_id e não vai para a chave pública.
drop policy if exists "avaliações próprias" on micro_reviews;
create policy "avaliações próprias" on micro_reviews
  for select to authenticated using ((select auth.uid()) = user_id);

-- ---------- 4. View de médias sem furar o RLS ----------
-- View comum roda com os direitos do dono (postgres) e ignorava o RLS de micro_reviews.
alter view place_signals set (security_invoker = true);
revoke all on place_signals from anon, authenticated;

-- ---------- 5. Funções ----------
alter function public.add_impressions(uuid[], text) set search_path = '';
revoke execute on function public.add_impressions(uuid[], text) from public, anon, authenticated;

-- Nome vindo do cadastro é texto livre do usuário: corta em 40 caracteres.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, name, avatar_url)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)), 40),
    left(new.raw_user_meta_data ->> 'avatar_url', 500)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- ---------- 6. Limites de tamanho e valores (o servidor já valida; o banco garante) ----------
-- NOT VALID: vale para o que entrar daqui em diante, sem travar por dado antigo.
alter table micro_reviews drop constraint if exists micro_reviews_occasion_len;
alter table micro_reviews add constraint micro_reviews_occasion_len check (char_length(occasion) <= 40) not valid;
alter table micro_reviews drop constraint if exists micro_reviews_device_len;
alter table micro_reviews add constraint micro_reviews_device_len check (char_length(device_id) <= 64) not valid;
alter table decision_votes drop constraint if exists decision_votes_name_len;
alter table decision_votes add constraint decision_votes_name_len check (char_length(voter_name) <= 30) not valid;
alter table decision_votes drop constraint if exists decision_votes_device_len;
alter table decision_votes add constraint decision_votes_device_len check (char_length(device_id) <= 64) not valid;
alter table decision_sessions drop constraint if exists decision_sessions_places_len;
alter table decision_sessions add constraint decision_sessions_places_len check (cardinality(place_ids) between 2 and 3) not valid;
alter table place_claims drop constraint if exists place_claims_len;
alter table place_claims add constraint place_claims_len
  check (char_length(contact) <= 80 and char_length(coalesce(message, '')) <= 500) not valid;
alter table profiles drop constraint if exists profiles_name_len;
alter table profiles add constraint profiles_name_len check (char_length(name) <= 40) not valid;
alter table lead_clicks drop constraint if exists lead_clicks_device_len;
alter table lead_clicks add constraint lead_clicks_device_len check (char_length(device_id) <= 64) not valid;

-- ---------- 7. Uma avaliação por aparelho, por lugar, por semana ----------
-- Com conta já vale uma por pessoa por lugar (micro_reviews_user_place_idx, a nova
-- substitui a antiga). Sem conta, a trava era só um cookie que o próprio navegador
-- controla; agora o banco recusa a segunda do mesmo aparelho na mesma semana.
alter table micro_reviews add column if not exists created_week date
  generated always as (date_trunc('week', created_at at time zone 'America/Campo_Grande')::date) stored;

-- Antes do índice único: apaga as repetidas que já existem (fica a mais recente).
delete from micro_reviews a
using micro_reviews b
where a.user_id is null and b.user_id is null
  and a.place_id = b.place_id and a.device_id = b.device_id
  and a.created_week = b.created_week and a.id < b.id;

create unique index if not exists micro_reviews_device_place_week_idx
  on micro_reviews (place_id, device_id, created_week) where user_id is null;

-- ---------- 8. Limite de requisições (rate limit) ----------
-- Janela fixa por chave (ex.: "review:ip:1.2.3.4"). Chamado só pelo servidor.
create table if not exists rate_limits (
  key text not null,
  window_start timestamptz not null,
  hits integer not null default 0,
  primary key (key, window_start)
);
alter table rate_limits enable row level security;
revoke all on rate_limits from anon, authenticated;

create or replace function public.hit_rate_limit(p_key text, p_max integer, p_window_seconds integer)
returns boolean
language plpgsql set search_path = '' as $$
declare
  w timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  n integer;
begin
  insert into public.rate_limits as r (key, window_start, hits)
  values (left(p_key, 200), w, 1)
  on conflict (key, window_start) do update set hits = r.hits + 1
  returning hits into n;
  -- Faxina de vez em quando: janelas com mais de 2 dias não servem para nada.
  if random() < 0.01 then
    delete from public.rate_limits where window_start < now() - interval '2 days';
  end if;
  return n <= p_max;
end;
$$;
revoke execute on function public.hit_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.hit_rate_limit(text, integer, integer) to service_role;

-- ---------- 9. Fotos de capa: só imagem de verdade, até 2 MB ----------
-- O Storage recusa no upload, mesmo que alguém pule o servidor.
update storage.buckets
set file_size_limit = 2097152,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'covers';
