-- Wipes ALL data tied to one test email address, so you can reuse it:
-- the auth identity, their business profile row, and their leave/
-- provisioning requests (cascade from the auth identity). Safe to run
-- repeatedly.
--
-- Does NOT delete files they uploaded to provisioning-attachments --
-- Supabase blocks raw SQL DELETE against storage.objects ("Use the Storage
-- API instead"). Leftover files are harmless (private bucket, orphaned once
-- the DB row is gone); to remove them too: Dashboard -> Storage ->
-- provisioning-attachments -> the folder named after their old auth user
-- id -> Delete.
--
-- Usage: change target_email below, then run in Supabase SQL Editor.

do $$
declare
  target_email text := 'your-test-email@example.com';  -- <-- change this
  target_auth_id uuid;
begin
  select id into target_auth_id from auth.users where email = target_email;

  delete from public.users where email = target_email;

  if target_auth_id is not null then
    delete from auth.users where id = target_auth_id;  -- cascades to leave_requests / provisioning_requests
  end if;

  raise notice 'Cleared all records for %', target_email;
end $$;
