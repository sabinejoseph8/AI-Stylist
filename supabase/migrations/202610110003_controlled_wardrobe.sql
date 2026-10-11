-- Local preparation. Explicit save only; never pass notebook payloads here.
begin;
create table public.stylist_wardrobe_items (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 asset_id uuid not null,
 label text not null check (length(btrim(label)) between 1 and 120),
 revision bigint not null default 1 check (revision > 0),
 save_consent_at timestamptz not null default now(),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 foreign key (asset_id,user_id) references public.stylist_media_assets(id,user_id),
 unique(id,user_id)
);
create index stylist_wardrobe_owner on public.stylist_wardrobe_items(user_id);
alter table public.stylist_wardrobe_items enable row level security;
alter table public.stylist_wardrobe_items force row level security;
revoke all on public.stylist_wardrobe_items from public,anon,authenticated;
grant select on public.stylist_wardrobe_items to authenticated;
create policy wardrobe_owner_read on public.stylist_wardrobe_items for select to authenticated
 using ((select auth.uid())=user_id);
create function public.stylist_save_wardrobe(p_asset uuid,p_label text,p_consent boolean,p_id uuid default null,p_expected_revision bigint default 0)
returns public.stylist_wardrobe_items language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); result public.stylist_wardrobe_items;
begin
 if actor is null then raise exception 'unauthenticated' using errcode='42501'; end if;
 if p_consent is distinct from true then raise exception 'explicit save required' using errcode='22023'; end if;
 if p_label is null or length(btrim(p_label)) not between 1 and 120 then raise exception 'invalid label' using errcode='22023'; end if;
 -- Same generic failure for absent and another customer's asset.
 if not exists(select 1 from public.stylist_media_assets where id=p_asset and user_id=actor) then raise exception 'asset unavailable' using errcode='42501'; end if;
 if p_id is null then
  if p_expected_revision is distinct from 0 then raise exception 'stale revision' using errcode='40001'; end if;
  insert into public.stylist_wardrobe_items(user_id,asset_id,label) values(actor,p_asset,btrim(p_label)) returning * into result;
 else
  update public.stylist_wardrobe_items set asset_id=p_asset,label=btrim(p_label),revision=revision+1,updated_at=now(),save_consent_at=now()
   where id=p_id and user_id=actor and revision=p_expected_revision returning * into result;
  if not found then raise exception 'record unavailable or stale' using errcode='40001'; end if;
 end if;
 return result;
end $$;
revoke all on function public.stylist_save_wardrobe(uuid,text,boolean,uuid,bigint) from public,anon;
grant execute on function public.stylist_save_wardrobe(uuid,text,boolean,uuid,bigint) to authenticated;
commit;
