-- Complete the Supabase objects used by the live app.
-- This migration is applied by `supabase db push`; Drizzle migrations are not.
-- Favorites belong to the signed-in user and reference real listings only.
create table if not exists public.favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);

alter table public.favorites enable row level security;
revoke all on public.favorites from anon;
grant select, insert, delete on public.favorites to authenticated;

drop policy if exists "Users manage their own favorites" on public.favorites;
create policy "Users manage their own favorites"
  on public.favorites
  for all
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Listing/product forms upload to the Supabase Storage bucket named "images".
-- Public read is intentional for marketplace listing photos; uploads and deletes
-- are restricted to the authenticated user's UUID-prefixed folder.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'images',
  'images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set public = true,
    file_size_limit = 5242880,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Marketplace images are publicly readable" on storage.objects;
create policy "Marketplace images are publicly readable"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'images');

drop policy if exists "Users upload images to own folder" on storage.objects;
create policy "Users upload images to own folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Users update images in own folder" on storage.objects;
create policy "Users update images in own folder"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Users delete images in own folder" on storage.objects;
create policy "Users delete images in own folder"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

comment on table public.favorites is 'Tin yêu thích của từng người dùng; người dùng chỉ được quản lý danh sách của mình.';
