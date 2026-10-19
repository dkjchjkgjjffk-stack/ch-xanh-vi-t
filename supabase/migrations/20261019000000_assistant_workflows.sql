-- Allow only admins to read price sync history for the assistant dashboard.
grant select on public.price_sync_runs to authenticated;
drop policy if exists "Admins can read price sync history" on public.price_sync_runs;
create policy "Admins can read price sync history"
  on public.price_sync_runs
  for select
  to authenticated
  using (public.has_role((select auth.uid()), 'admin'::public.app_role));

-- The secret assistant_price_sync_token is provisioned separately in Supabase Vault.
-- Keep the existing scheduled token intact; accept either private token server-side.
create or replace function public.is_valid_price_sync_token(p_token text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select p_token is not null
    and exists (
      select 1
      from vault.decrypted_secrets
      where name in ('price_sync_token', 'assistant_price_sync_token')
        and decrypted_secret = p_token
    );
$function$;
