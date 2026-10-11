-- Local preparation: minimal durable proof for a lost finalization acknowledgment.
begin;
create table stylist_private.media_deletion_receipts (
 id uuid primary key,
 user_id uuid not null references auth.users(id) on delete cascade,
 storage_key text not null,
 deletion_token uuid not null,
 created_at timestamptz not null default now()
);
revoke all on stylist_private.media_deletion_receipts from public,anon,authenticated,service_role;
create function stylist_private.reject_deleted_media_id() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if exists(select 1 from stylist_private.media_deletion_receipts where id=new.id) then raise exception 'image id retired' using errcode='23505'; end if;
 return new;
end $$;
revoke all on function stylist_private.reject_deleted_media_id() from public,anon,authenticated;
create trigger media_id_retired before insert on public.stylist_media_assets for each row execute function stylist_private.reject_deleted_media_id();
create or replace function public.stylist_finish_media_delete(p_id uuid,p_owner uuid,p_token uuid)
returns boolean language plpgsql security definer set search_path='' as $$
declare asset public.stylist_media_assets;
begin
 select * into asset from public.stylist_media_assets where id=p_id and user_id=p_owner and state='deleting' and deletion_token=p_token for update;
 if not found then raise exception 'deletion claim unavailable' using errcode='40001'; end if;
 insert into stylist_private.media_deletion_receipts(id,user_id,storage_key,deletion_token) values(asset.id,asset.user_id,asset.storage_key,asset.deletion_token);
 delete from public.stylist_media_assets where id=asset.id;
 return true;
end $$;
create or replace function public.stylist_read_media_operation(p_id uuid,p_owner uuid)
returns jsonb language sql stable security definer set search_path='' as $$
 select coalesce(
 (select jsonb_build_object('id',id,'ownerId',user_id,'key',storage_key,'checksum',checksum,'state',state,'deletionToken',deletion_token) from public.stylist_media_assets where id=p_id and user_id=p_owner),
 (select jsonb_build_object('id',id,'ownerId',user_id,'key',storage_key,'checksum',null,'state','deleted','deletionToken',deletion_token) from stylist_private.media_deletion_receipts where id=p_id and user_id=p_owner));
$$;
commit;
