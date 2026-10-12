-- Local preparation only: bounded service-only metadata discovery, never credential export.
begin;
create function public.stylist_list_refresh_candidates(p_after uuid,p_limit integer)
returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb;
begin
 if p_limit is null or p_limit<1 or p_limit>100 then raise exception 'Invalid discovery limit'; end if;
 select coalesce(jsonb_agg(to_jsonb(candidate) order by candidate.session_id),'[]'::jsonb) into result
 from (select owner_id,session_id,generation,expires_at_ms,state,lease_id
       from stylist_private.refresh_ownership
       where p_after is null or session_id>p_after order by session_id limit p_limit) candidate;
 return result;
end $$;
revoke all on function public.stylist_list_refresh_candidates(uuid,integer) from public,anon,authenticated;
grant execute on function public.stylist_list_refresh_candidates(uuid,integer) to service_role;
commit;
