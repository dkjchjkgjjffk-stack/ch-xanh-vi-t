-- Admins can review and update order workflow statuses. Payment state must be verified separately.
grant update on public.orders to authenticated;
drop policy if exists "Admins can manage orders" on public.orders;
create policy "Admins can manage orders" on public.orders for all to authenticated
using (public.has_role((select auth.uid()), 'admin'::public.app_role))
with check (public.has_role((select auth.uid()), 'admin'::public.app_role));
create or replace function public.touch_order_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;
revoke all on function public.touch_order_updated_at() from public;
revoke all on function public.touch_order_updated_at() from anon;
revoke all on function public.touch_order_updated_at() from authenticated;
drop trigger if exists orders_touch_updated_at on public.orders;
create trigger orders_touch_updated_at before update on public.orders for each row execute function public.touch_order_updated_at();
