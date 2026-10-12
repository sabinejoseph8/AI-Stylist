-- Approved seven-day detailed receipts; minimal retired IDs until account deletion.
begin;
create table stylist_private.retired_media_ids (
 id uuid primary key,
 user_id uuid not null references auth.users(id) on delete cascade
);
revoke all on stylist_private.retired_media_ids from public,anon,authenticated,service_role;
insert into stylist_private.retired_media_ids(id,user_id)
 select id,user_id from stylist_private.media_deletion_receipts;
create function stylist_private.record_retired_media_id() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 insert into stylist_private.retired_media_ids(id,user_id) values(new.id,new.user_id);
 return new;
end $$;
revoke all on function stylist_private.record_retired_media_id() from public,anon,authenticated,service_role;
create trigger receipt_retired_id after insert on stylist_private.media_deletion_receipts
 for each row execute function stylist_private.record_retired_media_id();
create or replace function stylist_private.reject_deleted_media_id() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if exists(select 1 from stylist_private.retired_media_ids where id=new.id) then
 raise exception 'image id retired' using errcode='23505'; end if;
 return new;
end $$;
create function public.stylist_expire_media_receipts(p_limit integer default 100)
returns integer language plpgsql security definer set search_path='' as $$
declare removed integer;
begin
 if p_limit is null or p_limit<1 or p_limit>1000 then raise exception 'invalid cleanup limit'; end if;
 with expired as (
 select id from stylist_private.media_deletion_receipts
 where created_at <= statement_timestamp()-interval '7 days'
 order by created_at,id limit p_limit for update skip locked
 ), deleted as (
 delete from stylist_private.media_deletion_receipts r using expired e where r.id=e.id returning r.id
 ) select count(*) into removed from deleted;
 return removed;
end $$;
revoke all on function public.stylist_expire_media_receipts(integer) from public,anon,authenticated;
grant execute on function public.stylist_expire_media_receipts(integer) to service_role;
-- Expired evidence cannot establish deletion, even before maintenance runs.
create or replace function public.stylist_read_media_operation(p_id uuid,p_owner uuid)
returns jsonb language sql stable security definer set search_path='' as $$
 select coalesce(
 (select jsonb_build_object('id',id,'ownerId',user_id,'key',storage_key,'checksum',checksum,'state',state,'deletionToken',deletion_token) from public.stylist_media_assets where id=p_id and user_id=p_owner),
 (select jsonb_build_object('id',id,'ownerId',user_id,'key',storage_key,'checksum',null,'state','deleted','deletionToken',deletion_token) from stylist_private.media_deletion_receipts where id=p_id and user_id=p_owner and created_at>statement_timestamp()-interval '7 days'));
$$;
commit;
