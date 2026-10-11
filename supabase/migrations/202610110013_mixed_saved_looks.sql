-- Local preparation only. The service must supply prevalidated source snapshots and a verified owner.
begin;
alter table public.stylist_saved_look_items alter column asset_id drop not null;
alter table public.stylist_saved_look_items add column retail_history_id uuid;
alter table public.stylist_saved_look_items add constraint one_look_item_source
 check ((asset_id is not null) <> (retail_history_id is not null));
alter table public.stylist_saved_look_items add constraint retail_history_same_owner
 foreign key(retail_history_id,user_id) references public.stylist_retail_history(id,user_id);
create unique index retail_history_single_look on public.stylist_saved_look_items(retail_history_id) where retail_history_id is not null;
create or replace function stylist_private.guard_media_reference() returns trigger language plpgsql security definer set search_path='' as $$
declare asset_state text;
begin
 if new.asset_id is null then return new; end if;
 select state into asset_state from public.stylist_media_assets where id=new.asset_id and user_id=new.user_id for share;
 if asset_state is distinct from 'ready' then raise exception 'asset unavailable' using errcode='42501'; end if;
 return new;
end $$;
create function stylist_private.clean_retail_history_reference() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if old.retail_history_id is not null then
  delete from public.stylist_retail_history where id=old.retail_history_id and user_id=old.user_id;
 end if;
 return old;
end $$;
revoke all on function stylist_private.clean_retail_history_reference() from public,anon,authenticated;
create trigger retail_history_reference_removed after delete on public.stylist_saved_look_items
 for each row execute function stylist_private.clean_retail_history_reference();

create function public.stylist_save_mixed_look(p_owner uuid,p_label text,p_items jsonb,p_consent boolean,
 p_id uuid default null,p_expected_revision bigint default 0)
returns public.stylist_saved_looks language plpgsql security definer set search_path='' as $$
declare result public.stylist_saved_looks; item jsonb; position integer:=0; history uuid;
begin
 if p_owner is null or p_consent is distinct from true or p_label is null or length(btrim(p_label)) not between 1 and 120 or
  p_items is null or jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items) not between 1 and 20 then
  raise exception 'invalid explicit save' using errcode='22023';
 end if;
 if p_id is null then
  if p_expected_revision is distinct from 0 then raise exception 'stale revision' using errcode='40001'; end if;
  insert into public.stylist_saved_looks(user_id,label) values(p_owner,btrim(p_label)) returning * into result;
 else
  update public.stylist_saved_looks set label=btrim(p_label),revision=revision+1,updated_at=now(),save_consent_at=now()
   where id=p_id and user_id=p_owner and revision=p_expected_revision returning * into result;
  if not found then raise exception 'record unavailable or stale' using errcode='40001'; end if;
  delete from public.stylist_saved_look_items where look_id=p_id and user_id=p_owner;
 end if;
 for item in select value from jsonb_array_elements(p_items) loop
  if jsonb_typeof(item)<>'object' or not (item ? 'kind') or not (item ? 'label') or
   jsonb_typeof(item->'label')<>'string' or length(btrim(item->>'label')) not between 1 and 120 then
   raise exception 'invalid component' using errcode='22023';
  end if;
  if item->>'kind'='owned' then
   if (select count(*) from jsonb_object_keys(item))<>3 or not item ? 'assetId' or jsonb_typeof(item->'assetId')<>'string' then
    raise exception 'invalid owned component' using errcode='22023'; end if;
   insert into public.stylist_saved_look_items(look_id,user_id,position,asset_id,label)
    values(result.id,p_owner,position,(item->>'assetId')::uuid,btrim(item->>'label'));
  elsif item->>'kind'='retail' then
   if (select count(*) from jsonb_object_keys(item))<>3 or not item ? 'snapshot' or jsonb_typeof(item->'snapshot')<>'object' then
    raise exception 'invalid retail component' using errcode='22023'; end if;
   history:=public.stylist_store_retail_history(p_owner,item->'snapshot');
   insert into public.stylist_saved_look_items(look_id,user_id,position,retail_history_id,label)
    values(result.id,p_owner,position,history,btrim(item->>'label'));
  else raise exception 'invalid component kind' using errcode='22023';
  end if;
  position:=position+1;
 end loop;
 return result;
end $$;
revoke all on function public.stylist_save_mixed_look(uuid,text,jsonb,boolean,uuid,bigint) from public,anon,authenticated;
grant execute on function public.stylist_save_mixed_look(uuid,text,jsonb,boolean,uuid,bigint) to service_role;
-- Retail snapshots are written only inside the atomic mixed-look transaction.
revoke execute on function public.stylist_store_retail_history(uuid,jsonb) from service_role;
commit;
