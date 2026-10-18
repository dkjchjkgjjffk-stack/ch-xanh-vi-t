-- Verified, dated agricultural price observations. Prices are public to read and admin-managed.
create table if not exists public.prices (
  id uuid primary key default gen_random_uuid(),
  crop text not null check (length(trim(crop)) between 1 and 100),
  province text not null check (length(trim(province)) between 1 and 100),
  unit text not null default 'kg' check (length(trim(unit)) between 1 and 30),
  price numeric(14,2) not null check (price > 0),
  price_date date not null default current_date,
  source text not null check (length(trim(source)) between 3 and 500),
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (crop, province, price_date)
);

alter table public.prices enable row level security;
revoke all on public.prices from anon, authenticated;
grant select on public.prices to anon, authenticated;
grant insert, update, delete on public.prices to authenticated;

drop policy if exists "Anyone can read published crop prices" on public.prices;
create policy "Anyone can read published crop prices"
  on public.prices for select to anon, authenticated
  using (true);

drop policy if exists "Admins can add crop prices" on public.prices;
create policy "Admins can add crop prices"
  on public.prices for insert to authenticated
  with check (
    updated_by = (select auth.uid())
    and (select public.has_role((select auth.uid()), 'admin'::public.app_role))
  );

drop policy if exists "Admins can update crop prices" on public.prices;
create policy "Admins can update crop prices"
  on public.prices for update to authenticated
  using ((select public.has_role((select auth.uid()), 'admin'::public.app_role)))
  with check (
    updated_by = (select auth.uid())
    and (select public.has_role((select auth.uid()), 'admin'::public.app_role))
  );

drop policy if exists "Admins can delete crop prices" on public.prices;
create policy "Admins can delete crop prices"
  on public.prices for delete to authenticated
  using ((select public.has_role((select auth.uid()), 'admin'::public.app_role)));

create index if not exists prices_date_province_idx
  on public.prices (price_date desc, province, crop);

comment on table public.prices is 'Giá nông sản có ngày cập nhật và nguồn; chỉ quản trị viên được ghi.';
