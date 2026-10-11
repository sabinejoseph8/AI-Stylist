-- Local preparation only. Server RPCs require separately verified owner authorization.
begin;
alter table public.stylist_media_assets add column state text not null default 'ready' check(state in ('staged','ready','deleting'));
alter table public.stylist_media_assets add column checksum text check(checksum ~ '^[a-f0-9]{64}$');
alter table public.stylist_media_assets add column deletion_token uuid;
alter table public.stylist_media_assets add constraint media_deletion_state check((state='deleting')=(deletion_token is not null));
create function stylist_private.guard_media_reference() returns trigger language plpgsql security definer set search_path='' as $$
declare asset_state text;
begin
 select state into asset_state from public.stylist_media_assets where id=new.asset_id and user_id=new.user_id for share;
 if asset_state is distinct from 'ready' then raise exception 'asset unavailable' using errcode='42501'; end if;
 return new;
end $$;
revoke all on function stylist_private.guard_media_reference() from public,anon,authenticated;
create trigger wardrobe_media_ready before insert or update of asset_id,user_id on public.stylist_wardrobe_items for each row execute function stylist_private.guard_media_reference();
create trigger look_media_ready before insert or update of asset_id,user_id on public.stylist_saved_look_items for each row execute function stylist_private.guard_media_reference();
create function public.stylist_stage_media(p_id uuid,p_owner uuid,p_checksum text,p_width integer,p_height integer)
returns boolean language plpgsql security definer set search_path='' as $$
begin
 if p_id is null or p_owner is null or p_checksum is null or p_checksum !~ '^[a-f0-9]{64}$' or p_width is null or p_height is null or p_width not between 1 and 8192 or p_height not between 1 and 8192 or p_width::bigint*p_height>16000000 then raise exception 'invalid staged image' using errcode='22023'; end if;
 insert into public.stylist_media_assets(id,user_id,storage_key,content_type,width,height,state,checksum)
 values(p_id,p_owner,p_owner::text||'/'||p_id::text||'.webp','image/webp',p_width,p_height,'staged',p_checksum);
 return true;
end $$;
create function public.stylist_commit_media(p_id uuid,p_owner uuid,p_checksum text)
returns boolean language plpgsql security definer set search_path='' as $$
begin
 update public.stylist_media_assets set state='ready',revision=revision+1 where id=p_id and user_id=p_owner and checksum=p_checksum and state='staged';
 if not found then raise exception 'staged image unavailable' using errcode='40001'; end if;
 return true;
end $$;
create function public.stylist_begin_media_delete(p_id uuid,p_expected_revision bigint,p_confirm boolean)
returns jsonb language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); asset public.stylist_media_assets; token uuid:=gen_random_uuid();
begin
 if actor is null then raise exception 'unauthenticated' using errcode='42501'; end if;
 if p_confirm is distinct from true then raise exception 'confirmation required' using errcode='22023'; end if;
 select * into asset from public.stylist_media_assets where id=p_id and user_id=actor for update;
 if not found or asset.state<>'ready' or asset.revision is distinct from p_expected_revision then raise exception 'asset unavailable or stale' using errcode='40001'; end if;
 if exists(select 1 from public.stylist_wardrobe_items where asset_id=p_id and user_id=actor) or exists(select 1 from public.stylist_saved_look_items where asset_id=p_id and user_id=actor) then raise exception 'asset referenced' using errcode='23503'; end if;
 update public.stylist_media_assets set state='deleting',deletion_token=token,revision=revision+1 where id=p_id;
 return jsonb_build_object('key',asset.storage_key,'deletionToken',token);
end $$;
create function public.stylist_finish_media_delete(p_id uuid,p_owner uuid,p_token uuid)
returns boolean language plpgsql security definer set search_path='' as $$
begin
 delete from public.stylist_media_assets where id=p_id and user_id=p_owner and state='deleting' and deletion_token=p_token;
 if not found then raise exception 'deletion claim unavailable' using errcode='40001'; end if;
 return true;
end $$;
revoke all on function public.stylist_stage_media(uuid,uuid,text,integer,integer),public.stylist_commit_media(uuid,uuid,text),public.stylist_finish_media_delete(uuid,uuid,uuid) from public,anon,authenticated;
grant execute on function public.stylist_stage_media(uuid,uuid,text,integer,integer),public.stylist_commit_media(uuid,uuid,text),public.stylist_finish_media_delete(uuid,uuid,uuid) to service_role;
revoke all on function public.stylist_begin_media_delete(uuid,bigint,boolean) from public,anon;
grant execute on function public.stylist_begin_media_delete(uuid,bigint,boolean) to authenticated;
commit;
