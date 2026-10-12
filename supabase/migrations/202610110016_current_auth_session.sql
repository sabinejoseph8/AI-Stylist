-- Local Task 2c preparation. Reads managed Auth tables; never creates or mutates them.
begin;
create function public.stylist_auth_session_active(p_owner uuid,p_session uuid)
returns boolean language sql stable security definer set search_path='' as $$
 select exists(
  select 1 from auth.sessions s join auth.users u on u.id=s.user_id
  where s.id=p_session and s.user_id=p_owner
   and (s.not_after is null or s.not_after>statement_timestamp())
   and u.deleted_at is null and u.is_anonymous=false
   and (u.banned_until is null or u.banned_until<=statement_timestamp())
 );
$$;
revoke all on function public.stylist_auth_session_active(uuid,uuid) from public,anon,authenticated;
grant execute on function public.stylist_auth_session_active(uuid,uuid) to service_role;
commit;
