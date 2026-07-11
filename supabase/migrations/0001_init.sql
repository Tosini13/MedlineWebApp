-- ---------------------------------------------------------------------------
-- MedlineWebApp initial schema
-- Domain: medical timelines ("lines") -> dated "events" -> attached "documents".
-- Security: owner-scoped Row Level Security is the source of truth for access.
-- ---------------------------------------------------------------------------

create extension if not exists pgcrypto;

-- Event categories. Values intentionally match the legacy MedlineMobile codes so
-- historical data can be migrated 1:1; human-readable labels live in the UI layer.
do $$
begin
  if not exists (select 1 from pg_type where typname = 'event_type') then
    create type public.event_type as enum ('MA', 'O', 'MT', 'S', 'other');
  end if;
end
$$;

-- Keeps updated_at fresh on any row mutation.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- lines
-- ---------------------------------------------------------------------------
create table if not exists public.lines (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  description text check (char_length(description) <= 2000),
  color text not null default '#0E7C86' check (color ~ '^#[0-9a-fA-F]{6}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists lines_owner_id_idx on public.lines (owner_id);

drop trigger if exists lines_set_updated_at on public.lines;
create trigger lines_set_updated_at
  before update on public.lines
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- events
-- ---------------------------------------------------------------------------
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  line_id uuid not null references public.lines (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  event_date timestamptz not null,
  description text check (char_length(description) <= 5000),
  type public.event_type not null default 'other',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists events_line_id_idx on public.events (line_id);
create index if not exists events_line_date_idx on public.events (line_id, event_date desc);

drop trigger if exists events_set_updated_at on public.events;
create trigger events_set_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- documents (normalised from the legacy `documents[]` array on events)
-- ---------------------------------------------------------------------------
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 300),
  storage_path text not null unique,
  mime_type text,
  size bigint check (size is null or size >= 0),
  created_at timestamptz not null default now()
);

create index if not exists documents_event_id_idx on public.documents (event_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.lines enable row level security;
alter table public.lines force row level security;
alter table public.events enable row level security;
alter table public.events force row level security;
alter table public.documents enable row level security;
alter table public.documents force row level security;

-- lines: direct ownership.
drop policy if exists "lines_select_own" on public.lines;
create policy "lines_select_own" on public.lines
  for select using (owner_id = (select auth.uid()));

drop policy if exists "lines_insert_own" on public.lines;
create policy "lines_insert_own" on public.lines
  for insert with check (owner_id = (select auth.uid()));

drop policy if exists "lines_update_own" on public.lines;
create policy "lines_update_own" on public.lines
  for update using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

drop policy if exists "lines_delete_own" on public.lines;
create policy "lines_delete_own" on public.lines
  for delete using (owner_id = (select auth.uid()));

-- events: ownership resolved through the parent line.
drop policy if exists "events_select_own" on public.events;
create policy "events_select_own" on public.events
  for select using (
    exists (
      select 1 from public.lines l
      where l.id = events.line_id and l.owner_id = (select auth.uid())
    )
  );

drop policy if exists "events_insert_own" on public.events;
create policy "events_insert_own" on public.events
  for insert with check (
    exists (
      select 1 from public.lines l
      where l.id = events.line_id and l.owner_id = (select auth.uid())
    )
  );

drop policy if exists "events_update_own" on public.events;
create policy "events_update_own" on public.events
  for update using (
    exists (
      select 1 from public.lines l
      where l.id = events.line_id and l.owner_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.lines l
      where l.id = events.line_id and l.owner_id = (select auth.uid())
    )
  );

drop policy if exists "events_delete_own" on public.events;
create policy "events_delete_own" on public.events
  for delete using (
    exists (
      select 1 from public.lines l
      where l.id = events.line_id and l.owner_id = (select auth.uid())
    )
  );

-- documents: ownership resolved through event -> line.
drop policy if exists "documents_select_own" on public.documents;
create policy "documents_select_own" on public.documents
  for select using (
    exists (
      select 1 from public.events e
      join public.lines l on l.id = e.line_id
      where e.id = documents.event_id and l.owner_id = (select auth.uid())
    )
  );

drop policy if exists "documents_insert_own" on public.documents;
create policy "documents_insert_own" on public.documents
  for insert with check (
    exists (
      select 1 from public.events e
      join public.lines l on l.id = e.line_id
      where e.id = documents.event_id and l.owner_id = (select auth.uid())
    )
  );

drop policy if exists "documents_delete_own" on public.documents;
create policy "documents_delete_own" on public.documents
  for delete using (
    exists (
      select 1 from public.events e
      join public.lines l on l.id = e.line_id
      where e.id = documents.event_id and l.owner_id = (select auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- Audit log (write-only from the client's perspective; populated via triggers)
-- ---------------------------------------------------------------------------
create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid,
  action text not null check (action in ('INSERT', 'UPDATE', 'DELETE')),
  entity text not null check (entity in ('line', 'event', 'document')),
  entity_id uuid,
  at timestamptz not null default now()
);

create index if not exists audit_log_actor_idx on public.audit_log (actor_id, at desc);

alter table public.audit_log enable row level security;

-- Users may read their own audit trail; inserts happen only through the
-- security-definer trigger below, never directly from clients.
drop policy if exists "audit_select_own" on public.audit_log;
create policy "audit_select_own" on public.audit_log
  for select using (actor_id = (select auth.uid()));

create or replace function public.record_audit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  entity_name text;
  target_id uuid;
begin
  entity_name := tg_argv[0];
  if tg_op = 'DELETE' then
    target_id := old.id;
  else
    target_id := new.id;
  end if;

  insert into public.audit_log (actor_id, action, entity, entity_id)
  values (auth.uid(), tg_op, entity_name, target_id);

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists lines_audit on public.lines;
create trigger lines_audit
  after insert or update or delete on public.lines
  for each row execute function public.record_audit('line');

drop trigger if exists events_audit on public.events;
create trigger events_audit
  after insert or update or delete on public.events
  for each row execute function public.record_audit('event');

drop trigger if exists documents_audit on public.documents;
create trigger documents_audit
  after insert or update or delete on public.documents
  for each row execute function public.record_audit('document');
