-- ---------------------------------------------------------------------------
-- User health profiles (optional account-level information)
-- Security: one row per auth user, owner-scoped RLS.
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  date_of_birth date,
  blood_type text check (blood_type is null or char_length(blood_type) <= 10),
  emergency_contact text check (emergency_contact is null or char_length(emergency_contact) <= 500),
  medicaments text check (medicaments is null or char_length(medicaments) <= 2000),
  chronic_health_issues text check (chronic_health_issues is null or char_length(chronic_health_issues) <= 2000),
  lock_screen_summary text check (lock_screen_summary is null or char_length(lock_screen_summary) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.profiles force row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (user_id = (select auth.uid()));

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (user_id = (select auth.uid()));

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- API role grants (matches 0003_api_grants.sql pattern)
-- ---------------------------------------------------------------------------
grant select, insert, update, delete on public.profiles to authenticated;
