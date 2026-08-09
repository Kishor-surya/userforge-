-- Migration 003: Leave requests + provisioning (expense) requests.
-- Run this in the Supabase SQL Editor. Safe to re-run.

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

-- Only SELECT is exposed to authenticated users, scoped to their own rows.
-- Inserts (api/submit-leave-request.js) and status changes
-- (api/admin-decide-leave.js) go through service_role server routes, same
-- pattern as the users table -- keeps validation and admin-only status
-- changes centralized instead of relying on RLS write policies.
drop policy if exists "Users view their own leave requests" on public.leave_requests;
create policy "Users view their own leave requests" on public.leave_requests
  for select
  to authenticated
  using (requester_auth_user_id = auth.uid());

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

drop policy if exists "Users view their own provisioning requests" on public.provisioning_requests;
create policy "Users view their own provisioning requests" on public.provisioning_requests
  for select
  to authenticated
  using (requester_auth_user_id = auth.uid());

-- Private storage bucket for provisioning-request attachments. Uploaded and
-- read exclusively through service_role server routes (api/submit-
-- provisioning-request.js uploads; api/attachment-url.js issues short-lived
-- signed URLs after checking the caller owns the request or is admin), so
-- no storage.objects RLS policies are needed -- "public: false" plus zero
-- anon/authenticated policies means nothing but service_role can touch it.
insert into storage.buckets (id, name, public)
values ('provisioning-attachments', 'provisioning-attachments', false)
on conflict (id) do nothing;
