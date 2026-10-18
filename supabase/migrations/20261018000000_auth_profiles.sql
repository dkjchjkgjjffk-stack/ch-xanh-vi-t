-- Minimal, secure account foundation for Chợ Xanh Việt.
-- This migration must be applied to the connected Supabase project before using accounts.

do $$
begin
  create type public.app_role as enum ('admin', 'seller', 'buyer');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text not null default '',
  province text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null default 'buyer',
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;

revoke all on public.profiles from anon;
revoke all on public.user_roles from anon;
grant select, update on public.profiles to authenticated;
grant select on public.user_roles to authenticated;

drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()));

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

drop policy if exists "Users can read their own roles" on public.user_roles;
create policy "Users can read their own roles"
  on public.user_roles for select to authenticated
  using (user_id = (select auth.uid()));

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  );
$$;

revoke all on function public.has_role(uuid, public.app_role) from public;
grant execute on function public.has_role(uuid, public.app_role) to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role)
  values (new.id, 'buyer'::public.app_role)
  on conflict (user_id, role) do nothing;

  return new;
end;
$$;

-- Use a project-specific trigger name and never replace an existing project trigger.
do $
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'on_auth_user_created_choxanhviet'
      and tgrelid = 'auth.users'::regclass
      and not tgisinternal
  ) then
    create trigger on_auth_user_created_choxanhviet
      after insert on auth.users
      for each row execute procedure public.handle_new_user();
  end if;
end $;

comment on table public.profiles is 'Thông tin hồ sơ do chính người dùng quản lý; không chứa mật khẩu.';
comment on table public.user_roles is 'Vai trò do backend quản lý. Không cấp quyền INSERT/UPDATE/DELETE cho người dùng thông thường.';
