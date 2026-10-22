-- Avoid re-evaluating auth.uid() for every row in admin analytics policies.
drop policy if exists "Admins can read monitoring events" on public.admin_monitoring_events;
create policy "Admins can read monitoring events"
  on public.admin_monitoring_events
  for select to authenticated
  using (
    exists (
      select 1
      from public.user_roles ur
      where ur.user_id = (select auth.uid())
        and ur.role = 'admin'::public.app_role
    )
  );

drop policy if exists "Admins can write own monitoring events" on public.admin_monitoring_events;
create policy "Admins can write own monitoring events"
  on public.admin_monitoring_events
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1
      from public.user_roles ur
      where ur.user_id = (select auth.uid())
        and ur.role = 'admin'::public.app_role
    )
  );

drop policy if exists "Admins can read website analytics" on public.website_analytics_events;
create policy "Admins can read website analytics"
  on public.website_analytics_events
  for select to authenticated
  using (public.has_role((select auth.uid()), 'admin'::public.app_role));
