-- Local preparation. Caller must authorize owner before using a server credential.
begin;
create function public.stylist_read_media_operation(p_id uuid,p_owner uuid)
returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('id',id,'ownerId',user_id,'key',storage_key,'checksum',checksum,'state',state,'deletionToken',deletion_token)
 from public.stylist_media_assets where id=p_id and user_id=p_owner;
$$;
revoke all on function public.stylist_read_media_operation(uuid,uuid) from public,anon,authenticated;
grant execute on function public.stylist_read_media_operation(uuid,uuid) to service_role;
commit;
