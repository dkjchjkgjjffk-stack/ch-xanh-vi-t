-- Secure listing submission: all new user-submitted listings start pending review.
alter table public.listings enable row level security;

revoke all on public.listings from anon;
grant select, insert, update, delete on public.listings to authenticated;

drop policy if exists "Published listings are visible" on public.listings;
create policy "Published listings are visible"
  on public.listings for select
  to anon, authenticated
  using (
    status = 'approved'
    or (auth.uid() is not null and user_id = (select auth.uid()))
  );

drop policy if exists "Users can submit their own listings for review" on public.listings;
create policy "Users can submit their own listings for review"
  on public.listings for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and is_sample = false
    and status = 'pending'
  );

drop policy if exists "Users can update their own pending listings" on public.listings;
create policy "Users can update their own pending listings"
  on public.listings for update
  to authenticated
  using (user_id = (select auth.uid()) and status = 'pending')
  with check (user_id = (select auth.uid()) and status = 'pending' and is_sample = false);

drop policy if exists "Users can delete their own pending listings" on public.listings;
create policy "Users can delete their own pending listings"
  on public.listings for delete
  to authenticated
  using (user_id = (select auth.uid()) and status = 'pending' and is_sample = false);

comment on table public.listings is 'Tin nông sản do người dùng gửi; tin mới ở trạng thái pending để chờ kiểm duyệt.';
