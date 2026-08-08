-- Run this once in the Supabase SQL Editor (Project -> SQL Editor -> New query)
-- for the project you create for UserForge.

create table if not exists public.users (
  id bigint generated always as identity primary key,
  full_name text not null,
  email text not null unique,
  phone text,
  age integer,
  department text,
  role text,
  status text not null default 'Active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists users_email_idx on public.users (email);

alter table public.users enable row level security;

-- NOTE ON SECURITY: this policy grants full read/write access to anyone
-- holding the Supabase "anon" public key, which ships inside the frontend
-- JS bundle by design (that's how Supabase's client-side model works).
-- That's an acceptable tradeoff for a personal/internal admin tool that
-- you don't share publicly. If you ever expose this app's URL to people
-- you don't trust, replace this policy with one scoped to an
-- authenticated role instead -- see https://supabase.com/docs/guides/auth
drop policy if exists "Allow anon full access" on public.users;
create policy "Allow anon full access" on public.users
  for all
  to anon
  using (true)
  with check (true);
