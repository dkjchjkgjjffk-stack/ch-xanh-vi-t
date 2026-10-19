-- Hải Tây Phát CRM: customer records and contact history
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(trim(full_name)) between 2 and 150),
  phone text not null check (char_length(trim(phone)) between 9 and 30),
  phone_normalized text generated always as (
    case
      when regexp_replace(phone, '[^0-9]', '', 'g') like '84%' then '0' || substr(regexp_replace(phone, '[^0-9]', '', 'g'), 3)
      else regexp_replace(phone, '[^0-9]', '', 'g')
    end
  ) stored,
  customer_type text not null default 'retail' check (customer_type in ('retail','wholesale')),
  source text not null default 'store' check (source in ('website','store','facebook','zalo','phone','import','other')),
  address text not null default '' check (char_length(address) <= 500),
  notes text not null default '' check (char_length(notes) <= 3000),
  marketing_consent boolean not null default false,
  consent_recorded_at timestamptz,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customers_phone_normalized_length check (char_length(phone_normalized) between 9 and 12),
  constraint customers_phone_normalized_unique unique (phone_normalized)
);
create index if not exists customers_name_search_idx on public.customers using gin (to_tsvector('simple', full_name));
create index if not exists customers_created_at_idx on public.customers (created_at desc);

create table if not exists public.customer_interactions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  channel text not null check (channel in ('website','store','facebook','zalo','phone','other')),
  interaction_type text not null default 'note' check (interaction_type in ('note','call','message','purchase','follow_up')),
  note text not null check (char_length(trim(note)) between 1 and 2000),
  follow_up_at timestamptz,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);
create index if not exists customer_interactions_customer_date_idx on public.customer_interactions (customer_id, created_at desc);

alter table public.customers enable row level security;
alter table public.customer_interactions enable row level security;
drop policy if exists "Admins can manage customers" on public.customers;
create policy "Admins can manage customers" on public.customers for all to authenticated
  using (public.has_role((select auth.uid()), 'admin'::public.app_role))
  with check (public.has_role((select auth.uid()), 'admin'::public.app_role));
drop policy if exists "Admins can manage customer interactions" on public.customer_interactions;
create policy "Admins can manage customer interactions" on public.customer_interactions for all to authenticated
  using (public.has_role((select auth.uid()), 'admin'::public.app_role))
  with check (public.has_role((select auth.uid()), 'admin'::public.app_role));
grant select, insert, update, delete on public.customers to authenticated;
grant select, insert, update, delete on public.customer_interactions to authenticated;


create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.sync_order_customer()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  insert into public.customers (full_name, phone, address, customer_type, source, created_by)
  values (new.full_name, new.phone, coalesce(new.address, ''), 'retail', 'website', new.buyer_id)
  on conflict (phone_normalized) do nothing;
  return new;
end;
$$;
revoke all on function private.sync_order_customer() from public, anon, authenticated;

drop trigger if exists sync_customer_from_order on public.orders;
create trigger sync_customer_from_order
after insert on public.orders
for each row execute function private.sync_order_customer();

insert into public.customers (full_name, phone, address, customer_type, source, created_by)
select distinct on (
  case when regexp_replace(o.phone, '[^0-9]', '', 'g') like '84%'
    then '0' || substr(regexp_replace(o.phone, '[^0-9]', '', 'g'), 3)
    else regexp_replace(o.phone, '[^0-9]', '', 'g') end
) o.full_name, o.phone, coalesce(o.address, ''), 'retail', 'website', o.buyer_id
from public.orders o
where char_length(case when regexp_replace(o.phone, '[^0-9]', '', 'g') like '84%'
  then '0' || substr(regexp_replace(o.phone, '[^0-9]', '', 'g'), 3)
  else regexp_replace(o.phone, '[^0-9]', '', 'g') end) between 9 and 12
order by
  case when regexp_replace(o.phone, '[^0-9]', '', 'g') like '84%'
    then '0' || substr(regexp_replace(o.phone, '[^0-9]', '', 'g'), 3)
    else regexp_replace(o.phone, '[^0-9]', '', 'g') end,
  o.created_at desc
on conflict (phone_normalized) do nothing;
