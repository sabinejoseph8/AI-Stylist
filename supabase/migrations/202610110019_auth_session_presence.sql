-- Prepared locally only. Authoritative primary database lookup, separate from authorization.
begin;
create function public.stylist_auth_session_presence(p_owner uuid,p_session uuid)
returns text language plpgsql stable security definer set search_path='' as $$
declare actual_owner uuid;
begin
 if p_owner is null or p_session is null then raise exception 'Session scope required'; end if;
 select user_id into actual_owner from auth.sessions where id=p_session;
 if not found then return 'absent'; end if;
 if actual_owner=p_owner then return 'present'; end if;
 return 'mismatch';
end;
$$;
revoke all on function public.stylist_auth_session_presence(uuid,uuid) from public,anon,authenticated;
grant execute on function public.stylist_auth_session_presence(uuid,uuid) to service_role;
commit;
