-- Daily todos. Run in Supabase SQL Editor after the initial migration.

create table if not exists public.todos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  done boolean not null default false,
  local_date date not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint todos_title_not_empty check (char_length(trim(title)) > 0)
);

create index if not exists todos_user_date_idx
  on public.todos (user_id, local_date, sort_order);

drop trigger if exists todos_set_updated_at on public.todos;
create trigger todos_set_updated_at
  before update on public.todos
  for each row
  execute procedure public.set_updated_at();

alter table public.todos enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'todos' and policyname = 'todos_select_own'
  ) then
    create policy todos_select_own on public.todos
      for select to authenticated using (user_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'todos' and policyname = 'todos_insert_own'
  ) then
    create policy todos_insert_own on public.todos
      for insert to authenticated with check (user_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'todos' and policyname = 'todos_update_own'
  ) then
    create policy todos_update_own on public.todos
      for update to authenticated
      using (user_id = auth.uid())
      with check (user_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'todos' and policyname = 'todos_delete_own'
  ) then
    create policy todos_delete_own on public.todos
      for delete to authenticated using (user_id = auth.uid());
  end if;
end $$;

grant select, insert, update, delete on public.todos to authenticated;
