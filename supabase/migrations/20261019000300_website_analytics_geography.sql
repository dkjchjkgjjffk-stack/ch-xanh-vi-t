-- Add approximate IP-based geography supplied by Cloudflare edge metadata.
alter table public.website_analytics_events
  add column if not exists country_code text,
  add column if not exists country_name text,
  add column if not exists region text,
  add column if not exists city text;
create index if not exists website_analytics_geo_idx
  on public.website_analytics_events (country_name, region, city, created_at desc);
