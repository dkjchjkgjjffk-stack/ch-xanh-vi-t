-- Bổ sung ghi chú đơn hàng và cập nhật hàm đặt hàng (phần còn thiếu của nền tảng đơn hàng).
alter table public.orders add column if not exists buyer_note text not null default '';
alter table public.orders add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'orders_buyer_note_length'
  ) then
    alter table public.orders add constraint orders_buyer_note_length check (length(buyer_note) <= 1000);
  end if;
end $$;

drop function if exists public.place_order(text, text, text, jsonb);

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

create or replace function public.touch_order_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;
revoke all on function public.touch_order_updated_at() from public;
revoke all on function public.touch_order_updated_at() from anon;
revoke all on function public.touch_order_updated_at() from authenticated;
drop trigger if exists orders_touch_updated_at on public.orders;
create trigger orders_touch_updated_at before update on public.orders for each row execute function public.touch_order_updated_at();

grant update on public.orders to authenticated;