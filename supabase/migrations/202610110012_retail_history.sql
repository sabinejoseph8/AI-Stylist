-- Local preparation only. The server must validate approved source policy before calling this RPC.
begin;
create table public.stylist_retail_history (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 source_id text not null check(source_id ~ '^[A-Za-z0-9_-]{1,80}$'),
 product_id text not null check(product_id ~ '^[A-Za-z0-9_-]{1,80}$'),
 variant_id text not null check(variant_id ~ '^[A-Za-z0-9_-]{1,80}$'),
 name text not null check(length(btrim(name)) between 1 and 160),
 category text not null check(length(btrim(category)) between 1 and 80),
 size text check(size is null or length(btrim(size)) between 1 and 60),
 price_cents integer check(price_cents is null or price_cents between 0 and 10000000),
 currency text not null check(currency='USD'),
 country text not null check(country='US'),
 product_url text not null check(length(product_url) between 9 and 2048 and product_url like 'https://%'),
 image_url text not null check(length(image_url) between 9 and 2048 and image_url like 'https://%'),
 image_rights_reference text not null check(length(btrim(image_rights_reference)) between 1 and 200),
 checked_at_ms bigint not null check(checked_at_ms>=0),
 source_updated_at_ms bigint check(source_updated_at_ms is null or source_updated_at_ms between 0 and checked_at_ms),
 status text not null default 'saved-history' check(status='saved-history'),
 created_at timestamptz not null default now(),
 unique(id,user_id)
);
create index stylist_retail_history_owner on public.stylist_retail_history(user_id);
alter table public.stylist_retail_history enable row level security;
alter table public.stylist_retail_history force row level security;
revoke all on public.stylist_retail_history from public,anon,authenticated,service_role;
grant select on public.stylist_retail_history to authenticated;
create policy retail_history_owner_read on public.stylist_retail_history for select to authenticated
 using ((select auth.uid())=user_id);

create function public.stylist_store_retail_history(p_owner uuid,p_snapshot jsonb)
returns uuid language plpgsql security definer set search_path='' as $$
declare result uuid;
begin
 if p_owner is null or p_snapshot is null or jsonb_typeof(p_snapshot)<>'object' or
  (select count(*) from jsonb_object_keys(p_snapshot))<>14 or
  not p_snapshot ?& array['sourceId','productId','variantId','name','category','size','priceCents','currency','country','productUrl','image','checkedAt','sourceUpdatedAt','status'] or
  jsonb_typeof(p_snapshot->'status')<>'string' or p_snapshot->>'status'<>'saved-history' or jsonb_typeof(p_snapshot->'image')<>'object' or
  (select count(*) from jsonb_object_keys(p_snapshot->'image'))<>2 or
  not (p_snapshot->'image') ?& array['url','rightsReference'] or
  jsonb_typeof(p_snapshot->'sourceId')<>'string' or jsonb_typeof(p_snapshot->'productId')<>'string' or
  jsonb_typeof(p_snapshot->'variantId')<>'string' or jsonb_typeof(p_snapshot->'name')<>'string' or
  jsonb_typeof(p_snapshot->'category')<>'string' or
  not (jsonb_typeof(p_snapshot->'size') in ('string','null')) or
  not (jsonb_typeof(p_snapshot->'priceCents') in ('number','null')) or
  jsonb_typeof(p_snapshot->'currency')<>'string' or jsonb_typeof(p_snapshot->'country')<>'string' or
  jsonb_typeof(p_snapshot->'productUrl')<>'string' or
  jsonb_typeof(p_snapshot->'image'->'url')<>'string' or
  jsonb_typeof(p_snapshot->'image'->'rightsReference')<>'string' or
  jsonb_typeof(p_snapshot->'checkedAt')<>'number' or
  not (jsonb_typeof(p_snapshot->'sourceUpdatedAt') in ('number','null')) then
  raise exception 'retail history unavailable' using errcode='22023';
 end if;
 insert into public.stylist_retail_history(user_id,source_id,product_id,variant_id,name,category,size,price_cents,currency,country,product_url,image_url,image_rights_reference,checked_at_ms,source_updated_at_ms)
 values(p_owner,p_snapshot->>'sourceId',p_snapshot->>'productId',p_snapshot->>'variantId',p_snapshot->>'name',p_snapshot->>'category',p_snapshot->>'size',
  (p_snapshot->>'priceCents')::integer,p_snapshot->>'currency',p_snapshot->>'country',p_snapshot->>'productUrl',p_snapshot->'image'->>'url',
  p_snapshot->'image'->>'rightsReference',(p_snapshot->>'checkedAt')::bigint,(p_snapshot->>'sourceUpdatedAt')::bigint)
 returning id into result;
 return result;
end $$;
revoke all on function public.stylist_store_retail_history(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.stylist_store_retail_history(uuid,jsonb) to service_role;
commit;
