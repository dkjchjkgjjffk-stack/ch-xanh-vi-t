-- Real product catalog: seller ownership, public approved-only reads and admin moderation.
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 2 and 180),
  category text not null check (category in ('phan-bon','thuoc-bvtv','dung-cu','vat-tu')),
  price numeric(14,2) not null check (price > 0),
  unit text not null check (length(trim(unit)) between 1 and 60),
  description text not null default '',
  icon text not null default '📦',
  image_url text,
  manufacturer text not null default 'Người bán chưa cung cấp',
  registration text not null default 'Chưa cung cấp',
  seller_name text not null,
  seller_phone text not null,
  seller_address text not null default '',
  seller_id uuid references auth.users(id) on delete set null,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  is_sample boolean not null default false,
  verify_status text not null default 'none' check (verify_status in ('verified','seller','none')),
  verify_note text,
  created_at timestamptz not null default now()
);
alter table public.products enable row level security;
revoke all on public.products from anon, authenticated;
grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;
drop policy if exists "Public can read approved real products" on public.products;
create policy "Public can read approved real products" on public.products for select to anon, authenticated using (status='approved' and is_sample=false);
drop policy if exists "Sellers can read their own products" on public.products;
create policy "Sellers can read their own products" on public.products for select to authenticated using (seller_id=(select auth.uid()));
drop policy if exists "Sellers can submit their own products" on public.products;
create policy "Sellers can submit their own products" on public.products for insert to authenticated with check (seller_id=(select auth.uid()) and status='pending' and is_sample=false and verify_status in ('none','seller'));
drop policy if exists "Sellers can edit their own pending products" on public.products;
create policy "Sellers can edit their own pending products" on public.products for update to authenticated using (seller_id=(select auth.uid()) and status='pending') with check (seller_id=(select auth.uid()) and status='pending' and is_sample=false);
drop policy if exists "Sellers can delete their own pending products" on public.products;
create policy "Sellers can delete their own pending products" on public.products for delete to authenticated using (seller_id=(select auth.uid()) and status='pending');
drop policy if exists "Admins can manage product moderation" on public.products;
create policy "Admins can manage product moderation" on public.products for all to authenticated using ((select public.has_role((select auth.uid()),'admin'::public.app_role))) with check ((select public.has_role((select auth.uid()),'admin'::public.app_role)));
create index if not exists products_public_catalog_idx on public.products(category,created_at desc) where status='approved' and is_sample=false;
create index if not exists products_seller_status_idx on public.products(seller_id,status,created_at desc);
comment on table public.products is 'Danh mục vật tư do người bán gửi và quản trị viên duyệt. Nhãn xác minh không tự bảo đảm hàng thật.';
