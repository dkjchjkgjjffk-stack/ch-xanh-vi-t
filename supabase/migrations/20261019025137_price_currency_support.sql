alter table public.prices
  add column if not exists currency text not null default 'VND';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'prices_currency_check'
      and conrelid = 'public.prices'::regclass
  ) then
    alter table public.prices
      add constraint prices_currency_check
      check (currency in ('VND', 'USD', 'USC'));
  end if;
end $$;