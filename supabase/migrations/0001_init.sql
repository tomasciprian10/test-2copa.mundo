-- World Cup 2026 — esquema inicial para Supabase.
-- Modelo elegido: login con email + contraseña, pools compartidos (multijugador)
-- y resultados de partidos globales (los ve/edita cualquier usuario autenticado).
--
-- Cómo aplicarlo:
--   A) Supabase CLI:  supabase db push   (o supabase migration up)
--   B) A mano:        copiá/pegá este archivo en el SQL Editor del dashboard y ejecutá.

-- ---------------------------------------------------------------------------
-- Tablas
-- ---------------------------------------------------------------------------

-- Ediciones de resultados: overrides que se mergean sobre el JSON base,
-- una fila por partido (match_id = "k97", "g12", etc.). Compartidas por todos.
create table if not exists public.result_edits (
  match_id   text primary key,
  doc        jsonb not null,                       -- { score, goals1, goals2 }
  updated_by uuid references auth.users(id) default auth.uid(),
  updated_at timestamptz not null default now()
);

-- Pools de apuestas. Guardamos el objeto completo del pool como documento JSON
-- (participantes, pronósticos y fases que cuentan) para minimizar el cambio de
-- código en el front. Compartidos: cualquier usuario autenticado ve/edita.
create table if not exists public.pools (
  id         text primary key,
  name       text,
  doc        jsonb not null,                       -- { id, name, participants, predictions, scopeRounds }
  owner      uuid references auth.users(id) default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- updated_at automático
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists result_edits_touch on public.result_edits;
create trigger result_edits_touch before update on public.result_edits
  for each row execute function public.touch_updated_at();

drop trigger if exists pools_touch on public.pools;
create trigger pools_touch before update on public.pools
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- Regla: solo usuarios logueados. Cualquier autenticado puede leer y escribir
-- (modelo "liga de amigos" compartida). Anónimos: sin acceso.
-- ---------------------------------------------------------------------------
alter table public.result_edits enable row level security;
alter table public.pools        enable row level security;

-- result_edits
drop policy if exists "edits_select" on public.result_edits;
create policy "edits_select" on public.result_edits
  for select to authenticated using (true);

drop policy if exists "edits_insert" on public.result_edits;
create policy "edits_insert" on public.result_edits
  for insert to authenticated with check (true);

drop policy if exists "edits_update" on public.result_edits;
create policy "edits_update" on public.result_edits
  for update to authenticated using (true) with check (true);

drop policy if exists "edits_delete" on public.result_edits;
create policy "edits_delete" on public.result_edits
  for delete to authenticated using (true);

-- pools
drop policy if exists "pools_select" on public.pools;
create policy "pools_select" on public.pools
  for select to authenticated using (true);

drop policy if exists "pools_insert" on public.pools;
create policy "pools_insert" on public.pools
  for insert to authenticated with check (true);

drop policy if exists "pools_update" on public.pools;
create policy "pools_update" on public.pools
  for update to authenticated using (true) with check (true);

-- Borrar un pool: solo el que lo creó (evita que un amigo borre el pool de otro).
-- Si preferís que cualquiera pueda borrar, cambiá la condición por `using (true)`.
drop policy if exists "pools_delete" on public.pools;
create policy "pools_delete" on public.pools
  for delete to authenticated using (owner = auth.uid());

-- ---------------------------------------------------------------------------
-- Realtime: que los cambios de un amigo aparezcan en vivo en los demás.
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'result_edits'
  ) then
    alter publication supabase_realtime add table public.result_edits;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'pools'
  ) then
    alter publication supabase_realtime add table public.pools;
  end if;
end $$;
