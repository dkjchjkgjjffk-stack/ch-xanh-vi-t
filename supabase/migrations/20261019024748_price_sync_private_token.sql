create or replace function public.is_valid_price_sync_token(p_token text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_token is not null
    and p_token = (
      select decrypted_secret
      from vault.decrypted_secrets
      where name = 'price_sync_token'
      limit 1
    );
$$;
revoke all on function public.is_valid_price_sync_token(text) from public, anon, authenticated;
grant execute on function public.is_valid_price_sync_token(text) to service_role;
do $$
begin
  if not exists (select 1 from vault.secrets where name = 'price_sync_token') then
    perform vault.create_secret(encode(extensions.gen_random_bytes(32), 'hex'), 'price_sync_token', 'Private token for scheduled agricultural price synchronization');
  end if;
  if not exists (select 1 from vault.secrets where name = 'price_sync_project_url') then
    perform vault.create_secret('https://syeivjiceluygqvjeblw.supabase.co', 'price_sync_project_url', 'Supabase URL used by the agricultural price schedule');
  end if;
end $$;