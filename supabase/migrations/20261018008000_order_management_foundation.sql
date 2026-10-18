-- Core order foundation for Chợ Xanh Việt.
-- Customers can submit orders without a payment gateway; payment stays unpaid until configured/verified.
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references auth.users(id) on delete restrict,
  full_name text not null check (length(trim(full_name)) between 2 and 150),
  phone text not null check (length(trim(phone)) between 9 and 30),
  address text not null check (length(trim(address)) between 5 and 500),
  status text not null default 'pending' check (status in ('pending','confirmed','shipping','completed','cancelled')),
  payment_method text not null default 'cod' check (payment_method in ('cod','bank_transfer','online')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid','pending','paid','failed','refunded')),
  total numeric(14,2) not null default 0 check (total >= 0),
  buyer_note text not null default '' check (length(buyer_note) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  seller_id uuid references auth.users(id) on delete set null,
  name text not null check (length(trim(name)) between 1 and 180),
  price numeric(14,2) not null check (price > 0),
  qty integer not null check (qty between 1 and 10000),
  created_at timestamptz not null default now()
);
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
revoke all on public.orders from anon;
revoke all on public.order_items from anon;
grant select, insert on public.orders to authenticated;
grant select on public.order_items to authenticated;
create index if not exists orders_buyer_created_idx on public.orders (buyer_id, created_at desc);
create index if not exists order_items_order_idx on public.order_items (order_id);
create index if not exists order_items_seller_idx on public.order_items (seller_id, created_at desc);
create or replace function public.is_order_seller(_order uuid, _user uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select (select auth.uid()) = _user and exists (select 1 from public.order_items oi where oi.order_id = _order and oi.seller_id = _user);
$$;
revoke all on function public.is_order_seller(uuid, uuid) from public;
revoke all on function public.is_order_seller(uuid, uuid) from anon;
grant execute on function public.is_order_seller(uuid, uuid) to authenticated;
drop policy if exists "Buyers and sellers can view relevant orders" on public.orders;
create policy "Buyers and sellers can view relevant orders" on public.orders for select to authenticated using (buyer_id = (select auth.uid()) or public.is_order_seller(id, (select auth.uid())));
drop policy if exists "Buyers and sellers can view relevant order items" on public.order_items;
create policy "Buyers and sellers can view relevant order items" on public.order_items for select to authenticated using (exists (select 1 from public.orders o where o.id = order_id and o.buyer_id = (select auth.uid())) or seller_id = (select auth.uid()));
create or replace function public.place_order(_full_name text, _phone text, _address text, _items jsonb, _buyer_note text default '')
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := (select auth.uid()); v_order uuid; v_total numeric(14,2) := 0; v_item jsonb; v_product public.products%rowtype; v_qty integer;
begin
  if v_user is null then raise exception 'Bạn cần đăng nhập để đặt hàng.'; end if;
  if length(trim(coalesce(_full_name,''))) < 2 or length(trim(_full_name)) > 150 then raise exception 'Họ tên không hợp lệ.'; end if;
  if trim(coalesce(_phone,'')) !~ '^[+0-9(). -]{9,30}$' then raise exception 'Số điện thoại không hợp lệ.'; end if;
  if length(trim(coalesce(_address,''))) < 5 or length(trim(_address)) > 500 then raise exception 'Địa chỉ giao hàng không hợp lệ.'; end if;
  if length(coalesce(_buyer_note,'')) > 1000 then raise exception 'Ghi chú quá dài.'; end if;
  if jsonb_typeof(_items) <> 'array' or jsonb_array_length(_items) < 1 or jsonb_array_length(_items) > 100 then raise exception 'Giỏ hàng không hợp lệ.'; end if;
  create temporary table if not exists order_items_stage(product_id uuid, qty integer) on commit drop;
  truncate table order_items_stage;
  for v_item in select value from jsonb_array_elements(_items) loop
    begin v_product.id := (v_item->>'id')::uuid; v_qty := (v_item->>'qty')::integer;
    exception when others then raise exception 'Sản phẩm hoặc số lượng không hợp lệ.'; end;
    if v_qty < 1 or v_qty > 10000 then raise exception 'Số lượng sản phẩm không hợp lệ.'; end if;
    insert into order_items_stage values (v_product.id, v_qty);
  end loop;
  if exists (select 1 from order_items_stage group by product_id having count(*) > 1) then raise exception 'Giỏ hàng có sản phẩm trùng lặp.'; end if;
  for v_item in select jsonb_build_object('id', product_id, 'qty', qty) from order_items_stage loop
    select * into v_product from public.products where id = (v_item->>'id')::uuid and status = 'approved' and is_sample = false for share;
    if not found then raise exception 'Một sản phẩm không còn được bán. Vui lòng tải lại giỏ hàng.'; end if;
    v_qty := (v_item->>'qty')::integer; v_total := v_total + v_product.price * v_qty;
  end loop;
  insert into public.orders (buyer_id, full_name, phone, address, buyer_note, total) values (v_user, trim(_full_name), trim(_phone), trim(_address), trim(coalesce(_buyer_note,'')), v_total) returning id into v_order;
  for v_item in select jsonb_build_object('id', product_id, 'qty', qty) from order_items_stage loop
    select * into v_product from public.products where id = (v_item->>'id')::uuid;
    insert into public.order_items (order_id, product_id, seller_id, name, price, qty) values (v_order, v_product.id, v_product.seller_id, v_product.name, v_product.price, (v_item->>'qty')::integer);
  end loop;
  return v_order;
end;
$$;
revoke all on function public.place_order(text, text, text, jsonb, text) from public;
revoke all on function public.place_order(text, text, text, jsonb, text) from anon;
grant execute on function public.place_order(text, text, text, jsonb, text) to authenticated;
comment on table public.orders is 'Đơn hàng thật; thanh toán chưa tích hợp tự động nên mặc định chưa thanh toán.';
comment on table public.order_items is 'Dòng sản phẩm và giá chốt tại thời điểm đặt hàng.';
