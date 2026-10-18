-- Cover the updated_by foreign key for efficient joins and deletes.
create index if not exists prices_updated_by_idx on public.prices (updated_by);
