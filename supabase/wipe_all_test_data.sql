-- Wipes ALL application data for a fresh start: every leave request, every
-- provisioning request, every uploaded attachment, every user profile row,
-- and every Supabase Auth account created by this app.
--
-- Note: the admin login is NOT a Supabase Auth account -- it's a plain
-- password check against the ADMIN_PASSWORD env var, with no row in any
-- table. There is nothing "admin" to preserve here, so this really does
-- clear everything. Re-run any time you want a clean slate.

begin;

delete from storage.objects where bucket_id = 'provisioning-attachments';
delete from public.leave_requests;
delete from public.provisioning_requests;
delete from public.users;
delete from auth.users;

commit;
