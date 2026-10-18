-- Only users with the server-managed admin role can review and publish listings.
drop policy if exists "Admins can review all listings" on public.listings;
create policy "Admins can review all listings"
  on public.listings for select
  to authenticated
  using (public.has_role((select auth.uid()), 'admin'::public.app_role));

drop policy if exists "Admins can moderate listings" on public.listings;
create policy "Admins can moderate listings"
  on public.listings for update
  to authenticated
  using (public.has_role((select auth.uid()), 'admin'::public.app_role))
  with check (public.has_role((select auth.uid()), 'admin'::public.app_role));
