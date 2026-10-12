-- Local preparation only. Point-in-time counts, not permission to retire a key.
begin;
create function public.stylist_refresh_key_usage(p_key_id text)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 if p_key_id is null or p_key_id !~ '^[A-Za-z0-9_-]{1,64}$' then raise exception 'Invalid key identifier'; end if;
 select jsonb_build_object('key_id',p_key_id,'total',count(*),'ready',count(*) filter(where state='ready'),'rotating',count(*) filter(where state='rotating'),'held',count(*) filter(where state='held'),'expired',count(*) filter(where expires_at_ms <= extract(epoch from statement_timestamp())*1000)) into result
 from stylist_private.refresh_ownership where envelope->>'keyId'=p_key_id;
 return result;
end $$;
revoke all on function public.stylist_refresh_key_usage(text) from public,anon,authenticated;
grant execute on function public.stylist_refresh_key_usage(text) to service_role;
commit;
