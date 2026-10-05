-- Run this once in the Supabase SQL Editor.
create table if not exists public.wheel_config (
  id text primary key,
  prizes jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.wheel_config enable row level security;

-- Server-side service-role access is used by the Next.js API.
-- No public client policy is needed for this table.
