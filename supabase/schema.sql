-- Run this once in the Supabase SQL Editor (Project -> SQL Editor -> New query)
-- for a BRAND NEW UserForge project. If you already ran an earlier version
-- of this file, use the numbered migration_00N_*.sql files instead --
-- this file reflects the full current state, not an incremental diff.

create table if not exists public.users (
  id bigint generated always as identity primary key,
  full_name text not null,
  email text not null unique,
  phone text,
  age integer,
  department text,
  role text,
  status text not null default 'Active',
  auth_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists users_email_idx on public.users (email);
create unique index if not exists users_auth_user_id_idx on public.users (auth_user_id)
  where auth_user_id is not null;

alter table public.users enable row level security;

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

-- SECURITY MODEL:
-- - Real users authenticate via Supabase Auth (a magic-link invite email;
--   they set their own password, which this app never sees or stores) and
--   can only SELECT users in their own department.
-- - There is deliberately NO anon-role policy: the public anon key (which
--   ships in the browser bundle by necessity) grants zero direct table
--   access. All writes -- create/update/delete/bulk-import -- go through
--   server-side /api routes using the service_role key, which bypasses RLS
--   entirely and needs no policy of its own. Those routes enforce their own
--   authorization (admin token, or GitHub Action author-association check).
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

-- Leave requests.
create table if not exists public.leave_requests (
  id bigint generated always as identity primary key,
  requester_auth_user_id uuid not null references auth.users(id) on delete cascade,
  requester_email text not null,
  requester_name text not null,
  start_date date not null,
  end_date date not null,
  reason text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  admin_reason text,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint leave_requests_date_order check (end_date >= start_date)
);

create index if not exists leave_requests_requester_idx on public.leave_requests (requester_auth_user_id);
create index if not exists leave_requests_status_idx on public.leave_requests (status);

alter table public.leave_requests enable row level security;

create policy "Users view their own leave requests" on public.leave_requests
  for select
  to authenticated
  using (requester_auth_user_id = auth.uid());

-- Provisioning (expense) requests.
create table if not exists public.provisioning_requests (
  id bigint generated always as identity primary key,
  requester_auth_user_id uuid not null references auth.users(id) on delete cascade,
  requester_email text not null,
  requester_name text not null,
  category text not null check (category in (
    'stationary', 'access', 'transportation', 'medical', 'food', 'accommodation', 'gift_card'
  )),
  description text,
  amount_spent numeric(12, 2) not null check (amount_spent >= 0),
  claimed_amount numeric(12, 2) not null check (claimed_amount >= 0),
  approved_amount numeric(12, 2),
  rejected_amount numeric(12, 2),
  attachment_path text,
  attachment_filename text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  admin_reason text,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists provisioning_requests_requester_idx on public.provisioning_requests (requester_auth_user_id);
create index if not exists provisioning_requests_status_idx on public.provisioning_requests (status);
create index if not exists provisioning_requests_category_idx on public.provisioning_requests (category);

alter table public.provisioning_requests enable row level security;

create policy "Users view their own provisioning requests" on public.provisioning_requests
  for select
  to authenticated
  using (requester_auth_user_id = auth.uid());

-- Private storage bucket for provisioning-request attachments -- see the
-- note in migration_003_leave_and_provisioning.sql for why no
-- storage.objects RLS policies are needed.
insert into storage.buckets (id, name, public)
values ('provisioning-attachments', 'provisioning-attachments', false)
on conflict (id) do nothing;
