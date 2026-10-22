-- Add covering indexes for remaining foreign keys found by Supabase advisor.
-- Safe/idempotent: creates indexes only; does not change or delete application data.
create index if not exists admin_monitoring_events_user_id_idx
  on public.admin_monitoring_events (user_id);

create index if not exists customer_interactions_created_by_idx
  on public.customer_interactions (created_by)
  where created_by is not null;

create index if not exists customers_created_by_idx
  on public.customers (created_by)
  where created_by is not null;
