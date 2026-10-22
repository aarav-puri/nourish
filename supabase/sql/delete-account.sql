-- Nourish - self-service account deletion for the iOS app.
--
-- Run this once in the Supabase SQL Editor (Dashboard > SQL Editor).
-- The app calls it as POST /rest/v1/rpc/delete_my_account with the signed-in
-- person's access token. It removes every row they own and then the auth
-- user itself. The app deletes their avatar through the Storage API first,
-- since Supabase does not allow deleting storage objects from SQL.

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Not signed in' using errcode = '28000';
  end if;

  delete from public.scanned_products where user_id = uid;
  delete from public.ai_insights where user_id = uid;
  if to_regclass('public.ai_usage') is not null then
    execute 'delete from public.ai_usage where user_id = $1' using uid;
  end if;

  delete from auth.users where id = uid;
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
