-- Timewise initial schema. Run this in Supabase Dashboard → SQL Editor.
-- Safe to run once on a fresh project.

create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  timezone text not null default 'UTC',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is
  'Per-user settings. Isolated by RLS; web and mobile share this table.';

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  color text not null,
  sort_order int not null default 0,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  constraint categories_name_not_empty check (char_length(trim(name)) > 0),
  constraint categories_color_hex check (color ~ '^#[0-9a-fA-F]{6}$')
);

create index categories_user_id_idx on public.categories (user_id, sort_order);

create table public.time_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete restrict,
  title text not null,
  started_at timestamptz not null,
  ended_at timestamptz not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint time_entries_title_not_empty check (char_length(trim(title)) > 0),
  constraint time_entries_valid_range check (ended_at > started_at)
);

create index time_entries_user_started_idx on public.time_entries (user_id, started_at desc);
create index time_entries_category_idx on public.time_entries (category_id);

create table public.ai_insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  period_start date not null,
  period_end date not null,
  insight_type text not null default 'weekday_weekend',
  content jsonb not null,
  created_at timestamptz not null default now(),
  constraint ai_insights_type_check check (insight_type in ('weekday_weekend'))
);

create index ai_insights_user_created_idx on public.ai_insights (user_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute procedure public.set_updated_at();

create trigger time_entries_set_updated_at
  before update on public.time_entries
  for each row
  execute procedure public.set_updated_at();

create or replace function public.seed_default_categories(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.categories (user_id, name, color, sort_order, is_default)
  values
    (p_user_id, 'Work', '#2563eb', 0, true),
    (p_user_id, 'Personal', '#7c3aed', 1, true),
    (p_user_id, 'Health', '#059669', 2, true),
    (p_user_id, 'Sleep', '#6366f1', 3, true),
    (p_user_id, 'Learning', '#d97706', 4, true),
    (p_user_id, 'Social', '#db2777', 5, true),
    (p_user_id, 'Other', '#78716c', 6, true);
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id)
  values (new.id);
  perform public.seed_default_categories(new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.time_entries enable row level security;
alter table public.ai_insights enable row level security;

create policy profiles_select_own on public.profiles
  for select to authenticated using (user_id = auth.uid());

create policy profiles_insert_own on public.profiles
  for insert to authenticated with check (user_id = auth.uid());

create policy profiles_update_own on public.profiles
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy categories_select_own on public.categories
  for select to authenticated using (user_id = auth.uid());

create policy categories_insert_own on public.categories
  for insert to authenticated with check (user_id = auth.uid());

create policy categories_update_own on public.categories
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy categories_delete_own on public.categories
  for delete to authenticated using (user_id = auth.uid() and not is_default);

create policy time_entries_select_own on public.time_entries
  for select to authenticated using (user_id = auth.uid());

create policy time_entries_insert_own on public.time_entries
  for insert to authenticated with check (user_id = auth.uid());

create policy time_entries_update_own on public.time_entries
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy time_entries_delete_own on public.time_entries
  for delete to authenticated using (user_id = auth.uid());

create policy ai_insights_select_own on public.ai_insights
  for select to authenticated using (user_id = auth.uid());

create policy ai_insights_insert_own on public.ai_insights
  for insert to authenticated with check (user_id = auth.uid());

grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.categories to authenticated;
grant select, insert, update, delete on public.time_entries to authenticated;
grant select, insert on public.ai_insights to authenticated;
