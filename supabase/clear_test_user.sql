-- Wipes ALL data tied to one test email address, so you can reuse it:
-- the auth identity, their business profile row, their leave/provisioning
-- requests (cascade from the auth identity), and any files they uploaded
-- to the provisioning-attachments bucket. Safe to run repeatedly.
--
-- Usage: change target_email below, then run in Supabase SQL Editor.

do $$
declare
  target_email text := 'your-test-email@example.com';  -- <-- change this
  target_auth_id uuid;
begin
  select id into target_auth_id from auth.users where email = target_email;

  if target_auth_id is not null then
    delete from storage.objects
    where bucket_id = 'provisioning-attachments'
      and (storage.foldername(name))[1] = target_auth_id::text;
  end if;

  delete from public.users where email = target_email;

  if target_auth_id is not null then
    delete from auth.users where id = target_auth_id;  -- cascades to leave_requests / provisioning_requests
  end if;

  raise notice 'Cleared all records for %', target_email;
end $$;
