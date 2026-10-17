-- Vai trò
create type public.app_role as enum ('admin', 'seller', 'buyer');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id = _user_id and role = _role) $$;

create policy "Xem vai trò của mình" on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "Admin quản lý vai trò" on public.user_roles for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- Hồ sơ
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text not null default '',
  province text not null default '',
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "Xem hồ sơ của mình" on public.profiles for select to authenticated
  using (id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "Sửa hồ sơ của mình" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), coalesce(new.raw_user_meta_data->>'phone', ''));
  insert into public.user_roles (user_id, role)
  values (new.id, case when new.raw_user_meta_data->>'role' = 'seller' then 'seller'::app_role else 'buyer'::app_role end);
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Sản phẩm vật tư
create table public.products (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid,
  name text not null,
  category text not null check (category in ('phan-bon','thuoc-bvtv','dung-cu','vat-tu')),
  price numeric not null check (price >= 0),
  unit text not null,
  icon text not null default '📦',
  image_url text,
  description text not null default '',
  manufacturer text not null default '',
  registration text not null default '',
  verify_status text not null default 'seller' check (verify_status in ('verified','seller','none')),
  verify_note text,
  seller_name text not null,
  seller_phone text not null,
  seller_address text not null default '',
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  is_sample boolean not null default false,
  created_at timestamptz not null default now()
);
grant select on public.products to anon;
grant select, insert, update, delete on public.products to authenticated;
grant all on public.products to service_role;
alter table public.products enable row level security;
create policy "Ai cũng xem sản phẩm đã duyệt" on public.products for select to anon, authenticated using (status = 'approved');
create policy "Người bán xem sản phẩm của mình" on public.products for select to authenticated using (seller_id = auth.uid());
create policy "Admin xem tất cả sản phẩm" on public.products for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Người bán thêm sản phẩm" on public.products for insert to authenticated
  with check (seller_id = auth.uid() and (public.has_role(auth.uid(), 'seller') or public.has_role(auth.uid(), 'admin')));
create policy "Người bán sửa sản phẩm của mình" on public.products for update to authenticated
  using (seller_id = auth.uid()) with check (seller_id = auth.uid());
create policy "Người bán xóa sản phẩm của mình" on public.products for delete to authenticated using (seller_id = auth.uid());
create policy "Admin sửa sản phẩm" on public.products for update to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "Admin xóa sản phẩm" on public.products for delete to authenticated using (public.has_role(auth.uid(), 'admin'));

-- Tin đăng
create table public.listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  type text not null check (type in ('ban','mua')),
  title text not null,
  crop text not null,
  icon text not null default '🌾',
  image_url text,
  quantity text not null,
  price_text text not null,
  province text not null,
  contact_name text not null,
  phone text not null,
  description text not null default '',
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  is_sample boolean not null default false,
  created_at timestamptz not null default now()
);
grant select on public.listings to anon;
grant select, insert, update, delete on public.listings to authenticated;
grant all on public.listings to service_role;
alter table public.listings enable row level security;
create policy "Ai cũng xem tin đã duyệt" on public.listings for select to anon, authenticated using (status = 'approved');
create policy "Xem tin của mình" on public.listings for select to authenticated using (user_id = auth.uid());
create policy "Admin xem tất cả tin" on public.listings for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Thành viên đăng tin" on public.listings for insert to authenticated with check (user_id = auth.uid());
create policy "Sửa tin của mình" on public.listings for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Xóa tin của mình" on public.listings for delete to authenticated using (user_id = auth.uid());
create policy "Admin sửa tin" on public.listings for update to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "Admin xóa tin" on public.listings for delete to authenticated using (public.has_role(auth.uid(), 'admin'));

-- Chỉ admin đổi trạng thái duyệt / xác minh
create or replace function public.guard_moderation()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() is null or public.has_role(auth.uid(), 'admin') then return new; end if;
  new.status := 'pending';
  if tg_op = 'INSERT' then
    new.is_sample := false;
    if tg_table_name = 'products' then
      if new.verify_status = 'verified' then new.verify_status := 'seller'; end if;
      new.verify_note := null;
    end if;
  else
    new.is_sample := old.is_sample;
    if tg_table_name = 'products' then
      if new.verify_status = 'verified' and (old.verify_status <> 'verified' or new.manufacturer <> old.manufacturer or new.registration <> old.registration) then
        new.verify_status := 'seller';
      end if;
      new.verify_note := case when new.verify_status = 'verified' then old.verify_note else null end;
    end if;
  end if;
  return new;
end; $$;
create trigger products_guard before insert or update on public.products for each row execute function public.guard_moderation();
create trigger listings_guard before insert or update on public.listings for each row execute function public.guard_moderation();

-- Yêu thích
create table public.favorites (
  user_id uuid not null,
  listing_id uuid not null references public.listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);
grant select, insert, delete on public.favorites to authenticated;
grant all on public.favorites to service_role;
alter table public.favorites enable row level security;
create policy "Quản lý yêu thích của mình" on public.favorites for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Bảng giá
create table public.prices (
  id uuid primary key default gen_random_uuid(),
  crop text not null,
  unit text not null,
  province text not null,
  price numeric not null check (price >= 0),
  price_date date not null default current_date,
  source text not null check (length(trim(source)) > 0),
  updated_by uuid,
  created_at timestamptz not null default now()
);
grant select on public.prices to anon;
grant select, insert, update, delete on public.prices to authenticated;
grant all on public.prices to service_role;
alter table public.prices enable row level security;
create policy "Ai cũng xem bảng giá" on public.prices for select to anon, authenticated using (true);
create policy "Admin quản lý giá" on public.prices for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- Đơn hàng
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null,
  full_name text not null,
  phone text not null,
  address text not null,
  total numeric not null,
  status text not null default 'new' check (status in ('new','confirmed','shipping','done','cancelled')),
  payment_method text not null default 'cod',
  payment_status text not null default 'unpaid',
  created_at timestamptz not null default now()
);
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid,
  seller_id uuid,
  name text not null,
  price numeric not null,
  qty int not null check (qty > 0)
);
grant select on public.orders, public.order_items to authenticated;
grant all on public.orders, public.order_items to service_role;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

create or replace function public.is_order_seller(_order uuid, _user uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.order_items where order_id = _order and seller_id = _user) $$;

create policy "Người mua xem đơn của mình" on public.orders for select to authenticated using (buyer_id = auth.uid());
create policy "Người bán xem đơn có hàng của mình" on public.orders for select to authenticated using (public.is_order_seller(orders.id, auth.uid()));
create policy "Admin xem tất cả đơn" on public.orders for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Xem dòng đơn liên quan" on public.order_items for select to authenticated
  using (seller_id = auth.uid() or public.has_role(auth.uid(), 'admin')
    or exists (select 1 from public.orders o where o.id = order_items.order_id and o.buyer_id = auth.uid()));

create or replace function public.place_order(_items jsonb, _full_name text, _phone text, _address text)
returns uuid language plpgsql security definer set search_path = public
as $$
declare _order uuid; _total numeric := 0; _it jsonb; _p public.products; _qty int;
begin
  if auth.uid() is null then raise exception 'Cần đăng nhập'; end if;
  if jsonb_array_length(_items) = 0 then raise exception 'Giỏ hàng trống'; end if;
  if length(trim(_full_name)) = 0 or length(trim(_phone)) < 9 or length(trim(_address)) = 0 then raise exception 'Thiếu thông tin nhận hàng'; end if;
  insert into public.orders (buyer_id, full_name, phone, address, total) values (auth.uid(), _full_name, _phone, _address, 0) returning id into _order;
  for _it in select * from jsonb_array_elements(_items) loop
    _qty := (_it->>'qty')::int;
    if _qty is null or _qty < 1 or _qty > 1000 then raise exception 'Số lượng không hợp lệ'; end if;
    select * into _p from public.products where id = (_it->>'product_id')::uuid and status = 'approved';
    if not found then raise exception 'Sản phẩm không còn bán'; end if;
    insert into public.order_items (order_id, product_id, seller_id, name, price, qty) values (_order, _p.id, _p.seller_id, _p.name, _p.price, _qty);
    _total := _total + _p.price * _qty;
  end loop;
  update public.orders set total = _total where id = _order;
  return _order;
end; $$;
revoke execute on function public.place_order(jsonb, text, text, text) from anon, public;
grant execute on function public.place_order(jsonb, text, text, text) to authenticated;

-- Ảnh (kho riêng tư, xem qua đường dẫn có thời hạn)
create policy "Xem ảnh" on storage.objects for select to anon, authenticated using (bucket_id = 'images');
create policy "Tải ảnh vào thư mục của mình" on storage.objects for insert to authenticated
  with check (bucket_id = 'images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Xóa ảnh của mình" on storage.objects for delete to authenticated
  using (bucket_id = 'images' and (storage.foldername(name))[1] = auth.uid()::text);

-- DỮ LIỆU MẪU
insert into public.products (name, category, price, unit, icon, description, manufacturer, registration, verify_status, seller_name, seller_phone, seller_address, status, is_sample) values
('Phân NPK 16-16-8 (mẫu)','phan-bon',450000,'bao 25kg','🌱','Sản phẩm mẫu minh họa.','Người bán chưa cung cấp','Chưa cung cấp','none','Cửa hàng mẫu A','0900000001','Địa chỉ mẫu, Cần Thơ','approved',true),
('Phân hữu cơ vi sinh (mẫu)','phan-bon',180000,'bao 20kg','🍂','Sản phẩm mẫu minh họa.','Công ty mẫu (người bán khai)','SĐK-MAU-001 (người bán khai)','seller','Cửa hàng mẫu B','0900000002','Địa chỉ mẫu, Đắk Lắk','approved',true),
('Thuốc trừ sâu sinh học (mẫu)','thuoc-bvtv',95000,'chai 500ml','🧴','Sản phẩm mẫu. Luôn đọc kỹ nhãn trước khi dùng thuốc BVTV.','Công ty mẫu (người bán khai)','SĐK-MAU-002 (người bán khai)','seller','Cửa hàng mẫu A','0900000001','Địa chỉ mẫu, Cần Thơ','approved',true),
('Thuốc trừ bệnh nấm (mẫu)','thuoc-bvtv',120000,'gói 100g','🧪','Sản phẩm mẫu minh họa.','Người bán chưa cung cấp','Chưa cung cấp','none','Cửa hàng mẫu B','0900000002','Địa chỉ mẫu, Đắk Lắk','approved',true),
('Bình xịt điện 16 lít (mẫu)','dung-cu',850000,'cái','🚿','Sản phẩm mẫu minh họa.','Người bán chưa cung cấp','Không áp dụng','none','Cửa hàng mẫu A','0900000001','Địa chỉ mẫu, Cần Thơ','approved',true),
('Kéo cắt cành (mẫu)','dung-cu',150000,'cái','✂️','Sản phẩm mẫu minh họa.','Người bán chưa cung cấp','Không áp dụng','none','Cửa hàng mẫu B','0900000002','Địa chỉ mẫu, Đắk Lắk','approved',true),
('Màng phủ nông nghiệp (mẫu)','vat-tu',320000,'cuộn','🎞️','Sản phẩm mẫu minh họa.','Người bán chưa cung cấp','Không áp dụng','none','Cửa hàng mẫu A','0900000001','Địa chỉ mẫu, Cần Thơ','approved',true),
('Ống tưới nhỏ giọt (mẫu)','vat-tu',210000,'cuộn 100m','💧','Sản phẩm mẫu minh họa.','Người bán chưa cung cấp','Không áp dụng','none','Cửa hàng mẫu B','0900000002','Địa chỉ mẫu, Đắk Lắk','approved',true);

insert into public.listings (type, title, crop, icon, quantity, price_text, province, contact_name, phone, description, status, is_sample) values
('ban','Bán lúa tươi vụ mới (tin mẫu)','Lúa gạo','🌾','20 tấn','Thương lượng','An Giang','Nông dân mẫu 1','0900000101','Tin đăng mẫu để xem thử.','approved',true),
('mua','Cần mua cà phê nhân (tin mẫu)','Cà phê','☕','50 tấn','Theo giá thị trường','Đắk Lắk','Thương lái mẫu 1','0900000102','Nhu cầu thu mua mẫu.','approved',true),
('ban','Bán sầu riêng tại vườn (tin mẫu)','Sầu riêng','🍈','5 tấn','Thương lượng','Tiền Giang','Nông dân mẫu 2','0900000103','Tin đăng mẫu.','approved',true),
('ban','Bán thanh long ruột đỏ (tin mẫu)','Thanh long','🐉','3 tấn','Liên hệ','Bình Thuận','Nông dân mẫu 3','0900000104','Tin đăng mẫu.','approved',true),
('mua','Thu mua rau củ cho bếp ăn (tin mẫu)','Rau củ','🥬','200 kg/ngày','Thương lượng','Lâm Đồng','Đơn vị thu mua mẫu','0900000105','Nhu cầu thu mua mẫu.','approved',true),
('ban','Bán tiêu đen phơi khô (tin mẫu)','Tiêu','⚫','2 tấn','Liên hệ','Gia Lai','Nông dân mẫu 4','0900000106','Tin đăng mẫu.','approved',true);