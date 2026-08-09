-- Migration 002: Supabase Auth integration, department-scoped RLS, login audit log.
-- Run this in the Supabase SQL Editor for your EXISTING UserForge project
-- (schema.sql already reflects this as the full fresh-install state, for
-- anyone setting up a brand new project instead). Safe to re-run.

alter table public.users
  add column if not exists auth_user_id uuid references auth.users(id) on delete set null;

create unique index if not exists users_auth_user_id_idx on public.users (auth_user_id)
  where auth_user_id is not null;

-- Lets an RLS policy check "what department is the CALLING user in" without
-- recursively re-applying RLS to that same lookup. SECURITY DEFINER runs as
-- the function owner, bypassing RLS for just this one lookup -- the
-- standard Supabase pattern for "visibility based on a column in the same
-- table". See https://supabase.com/docs/guides/database/postgres/row-level-security#use-security-definer-functions
create or replace function public.current_user_department()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select department from public.users where auth_user_id = auth.uid() limit 1;
$$;

-- Replace the old "anon has full access" policy. Real users now
-- authenticate via Supabase Auth (magic-link invite -> they set their own
-- password) and can only see users in their own department. All writes
-- (create/update/delete/bulk-import) go through server-side API routes
-- using the service_role key, which bypasses RLS entirely and needs no
-- policy of its own.
drop policy if exists "Allow anon full access" on public.users;

drop policy if exists "Authenticated users see their own department" on public.users;
create policy "Authenticated users see their own department" on public.users
  for select
  to authenticated
  using (department = public.current_user_department());

-- Login/logout audit trail. No anon/authenticated policies are defined on
-- purpose: only the service_role key (used server-side, behind the admin
-- token or a verified Supabase session -- see api/record-login.js and
-- api/admin-audit-log.js) can read or write this table.
create table if not exists public.login_audit (
  id bigint generated always as identity primary key,
  user_email text not null,
  event text not null check (event in ('login', 'logout')),
  occurred_at timestamptz not null default now()
);

create index if not exists login_audit_occurred_at_idx on public.login_audit (occurred_at desc);

alter table public.login_audit enable row level security;
