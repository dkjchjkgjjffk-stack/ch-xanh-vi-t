-- Privacy-conscious visitor analytics for Hai Tay Phat.
create table if not exists public.website_analytics_events (
  id bigint generated always as identity primary key,
  visitor_id text not null,
  session_id text not null,
  event_type text not null check (event_type in ('page_view','click')),
  page_path text not null,
  page_title text,
  referrer_host text,
  device_type text not null default 'unknown',
  browser text not null default 'unknown',
  operating_system text not null default 'unknown',
  screen_width integer,
  screen_height integer,
  language text,
  timezone text,
  event_label text,
  event_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists website_analytics_created_at_idx on public.website_analytics_events (created_at desc);
create index if not exists website_analytics_session_idx on public.website_analytics_events (session_id, created_at);
create index if not exists website_analytics_path_idx on public.website_analytics_events (page_path, created_at desc);
alter table public.website_analytics_events enable row level security;
drop policy if exists "Public can submit website analytics" on public.website_analytics_events;
create policy "Public can submit website analytics" on public.website_analytics_events
  for insert to anon, authenticated
  with check (
    length(visitor_id) between 16 and 80
    and length(session_id) between 16 and 80
    and length(page_path) <= 500
    and event_type in ('page_view','click')
    and coalesce(screen_width,0) between 0 and 10000
    and coalesce(screen_height,0) between 0 and 10000
  );
drop policy if exists "Admins can read website analytics" on public.website_analytics_events;
create policy "Admins can read website analytics" on public.website_analytics_events
  for select to authenticated
  using (public.has_role(auth.uid(), 'admin'::public.app_role));
