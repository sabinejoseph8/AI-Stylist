-- Local preparation: owned-item saved look subset. Retail source snapshots follow.
begin;
create table public.stylist_saved_looks (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 label text not null check(length(btrim(label)) between 1 and 120),
 revision bigint not null default 1 check(revision>0),
 save_consent_at timestamptz not null default now(),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(id,user_id)
);
create table public.stylist_saved_look_items (
 look_id uuid not null,
 user_id uuid not null,
 position integer not null check(position between 0 and 19),
 asset_id uuid not null,
 label text not null check(length(btrim(label)) between 1 and 120),
 primary key(look_id,position),
 foreign key(look_id,user_id) references public.stylist_saved_looks(id,user_id) on delete cascade,
 foreign key(asset_id,user_id) references public.stylist_media_assets(id,user_id),
 unique(look_id,asset_id)
);
create index stylist_saved_looks_owner on public.stylist_saved_looks(user_id);
create index stylist_saved_look_items_owner on public.stylist_saved_look_items(user_id);
alter table public.stylist_saved_looks enable row level security;
alter table public.stylist_saved_looks force row level security;
alter table public.stylist_saved_look_items enable row level security;
alter table public.stylist_saved_look_items force row level security;
revoke all on public.stylist_saved_looks,public.stylist_saved_look_items from public,anon,authenticated;
grant select on public.stylist_saved_looks,public.stylist_saved_look_items to authenticated;
create policy look_owner_read on public.stylist_saved_looks for select to authenticated using ((select auth.uid())=user_id);
create policy look_item_owner_read on public.stylist_saved_look_items for select to authenticated using ((select auth.uid())=user_id);
create function public.stylist_save_owned_look(p_label text,p_items jsonb,p_consent boolean,p_id uuid default null,p_expected_revision bigint default 0)
returns public.stylist_saved_looks language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); result public.stylist_saved_looks; item jsonb; position integer:=0; asset uuid;
begin
 if actor is null then raise exception 'unauthenticated' using errcode='42501'; end if;
 if p_consent is distinct from true or p_label is null or length(btrim(p_label)) not between 1 and 120 then raise exception 'invalid explicit save' using errcode='22023'; end if;
 if p_items is null or jsonb_typeof(p_items)<>'array' then raise exception 'invalid items' using errcode='22023'; end if;
 if jsonb_array_length(p_items) not between 1 and 20 then raise exception 'invalid item count' using errcode='22023'; end if;
 if p_id is null then
  if p_expected_revision is distinct from 0 then raise exception 'stale revision' using errcode='40001'; end if;
  insert into public.stylist_saved_looks(user_id,label) values(actor,btrim(p_label)) returning * into result;
 else
  update public.stylist_saved_looks set label=btrim(p_label),revision=revision+1,updated_at=now(),save_consent_at=now() where id=p_id and user_id=actor and revision=p_expected_revision returning * into result;
  if not found then raise exception 'record unavailable or stale' using errcode='40001'; end if;
  delete from public.stylist_saved_look_items where look_id=p_id and user_id=actor;
 end if;
 for item in select value from jsonb_array_elements(p_items) loop
  if jsonb_typeof(item)<>'object' then raise exception 'invalid component' using errcode='22023'; end if;
  if (select count(*) from jsonb_object_keys(item))<>2 or not item ?& array['assetId','label'] or jsonb_typeof(item->'assetId')<>'string' or jsonb_typeof(item->'label')<>'string' or length(btrim(item->>'label')) not between 1 and 120 then raise exception 'invalid component' using errcode='22023'; end if;
  asset:=(item->>'assetId')::uuid;
  if not exists(select 1 from public.stylist_media_assets where id=asset and user_id=actor) then raise exception 'asset unavailable' using errcode='42501'; end if;
  insert into public.stylist_saved_look_items(look_id,user_id,position,asset_id,label) values(result.id,actor,position,asset,btrim(item->>'label'));
  position:=position+1;
 end loop;
 return result;
end $$;
revoke all on function public.stylist_save_owned_look(text,jsonb,boolean,uuid,bigint) from public,anon;
grant execute on function public.stylist_save_owned_look(text,jsonb,boolean,uuid,bigint) to authenticated;
commit;
