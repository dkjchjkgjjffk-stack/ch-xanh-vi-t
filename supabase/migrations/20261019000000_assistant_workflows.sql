-- See deployment step: assistant token is injected from Vault during setup.
-- Allow only admins to read price sync history for the assistant dashboard.
grant select on public.price_sync_runs to authenticated;
drop policy if exists "Admins can read price sync history" on public.price_sync_runs;
create policy "Admins can read price sync history"
  on public.price_sync_runs
  for select
  to authenticated
  using (public.has_role((select auth.uid()), 'admin'::public.app_role));

-- Separate server-to-server token for the assistant; keep the scheduled token intact.
select vault.create_secret(
  'SET_VIA_SECURE_DEPLOYMENT_STEP',
  'assistant_price_sync_token',
  'Private token used only by the Hai Tay Phat assistant to request a price refresh'
);

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
