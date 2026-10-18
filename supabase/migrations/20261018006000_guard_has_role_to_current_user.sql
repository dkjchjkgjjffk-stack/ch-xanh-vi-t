-- Prevent authenticated users from using has_role to inspect another user's roles.
-- The app and RLS policies may check the caller's own role only.
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when (select auth.uid()) is null or (select auth.uid()) <> _user_id then false
    else exists (
      select 1
      from public.user_roles
      where user_id = _user_id
        and role = _role
    )
  end;
$$;

revoke all on function public.has_role(uuid, public.app_role) from public;
revoke all on function public.has_role(uuid, public.app_role) from anon;
grant execute on function public.has_role(uuid, public.app_role) to authenticated;
