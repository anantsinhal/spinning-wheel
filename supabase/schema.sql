create extension if not exists pgcrypto;

create table if not exists public.vouchers (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  prize text not null,
  generated_at timestamptz not null,
  expires_at timestamptz not null,
  status text not null default 'ACTIVE',
  redeemed_at timestamptz null
);

create index if not exists vouchers_code_idx on public.vouchers (code);
