-- Migration 004: admin login rate limiting + structured email delivery log.
-- Run this in the Supabase SQL Editor. Safe to re-run.

create table if not exists public.admin_login_attempts (
  id bigint generated always as identity primary key,
  ip text not null,
  succeeded boolean not null,
  attempted_at timestamptz not null default now()
);

create index if not exists admin_login_attempts_ip_time_idx
  on public.admin_login_attempts (ip, attempted_at desc);

alter table public.admin_login_attempts enable row level security;
-- No policies: only service_role (api/admin-login.js) ever touches this table.

create table if not exists public.email_log (
  id bigint generated always as identity primary key,
  recipient text not null,
  email_type text not null,
  sent boolean not null,
  error text,
  sent_at timestamptz not null default now()
);

create index if not exists email_log_sent_at_idx on public.email_log (sent_at desc);

alter table public.email_log enable row level security;
-- No policies: only service_role (api/_userCreation.js) ever touches this table.
