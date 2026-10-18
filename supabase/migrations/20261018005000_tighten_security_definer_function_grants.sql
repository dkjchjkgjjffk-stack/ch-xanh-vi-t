-- Match the production Supabase hardening applied on 2026-10-18.
-- Trigger functions should only run as triggers; clients must not invoke them over RPC.
revoke all on function public.handle_new_user() from public;
revoke all on function public.handle_new_user() from anon;
revoke all on function public.handle_new_user() from authenticated;

-- The app calls has_role only after sign-in.
revoke all on function public.has_role(uuid, public.app_role) from public;
revoke all on function public.has_role(uuid, public.app_role) from anon;
grant execute on function public.has_role(uuid, public.app_role) to authenticated;
