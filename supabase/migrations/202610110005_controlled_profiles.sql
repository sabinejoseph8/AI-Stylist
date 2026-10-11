-- Local preparation only. Initial explicit preference subset; no session payload.
begin;
create function stylist_private.valid_profile(p jsonb) returns boolean language plpgsql immutable set search_path='' as $$
declare field text; term jsonb;
begin
 if p is null or jsonb_typeof(p)<>'object' then return false; end if;
 if (select count(*) from jsonb_object_keys(p))<>6 or not p ?& array['preferredColors','excludedColors','styles','excludedCategories','budgetCents','currency'] then return false; end if;
 if p->>'currency' is distinct from 'USD' then return false; end if;
 if p->'budgetCents'<>'null'::jsonb then
  if jsonb_typeof(p->'budgetCents')<>'number' then return false; end if;
  if (p->>'budgetCents')::numeric < 0 or (p->>'budgetCents')::numeric > 9007199254740991 or trunc((p->>'budgetCents')::numeric)<>(p->>'budgetCents')::numeric then return false; end if;
 end if;
 foreach field in array array['preferredColors','excludedColors','styles','excludedCategories'] loop
  if jsonb_typeof(p->field)<>'array' or jsonb_array_length(p->field)>20 then return false; end if;
  for term in select value from jsonb_array_elements(p->field) loop
   if jsonb_typeof(term)<>'string' or length(btrim(term#>>'{}')) not between 1 and 80 then return false; end if;
  end loop;
  if (select count(*)<>count(distinct lower(btrim(value))) from jsonb_array_elements_text(p->field)) then return false; end if;
 end loop;
 if exists(select 1 from jsonb_array_elements_text(p->'preferredColors') a(value) join jsonb_array_elements_text(p->'excludedColors') b(value) on lower(btrim(a.value))=lower(btrim(b.value))) then return false; end if;
 return true;
end $$;
revoke all on function stylist_private.valid_profile(jsonb) from public,anon,authenticated;
create table public.stylist_profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 preferences jsonb not null check(stylist_private.valid_profile(preferences)),
 revision bigint not null default 1 check(revision>0),
 save_consent_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
alter table public.stylist_profiles enable row level security;
alter table public.stylist_profiles force row level security;
revoke all on public.stylist_profiles from public,anon,authenticated;
grant select on public.stylist_profiles to authenticated;
create policy profile_owner_read on public.stylist_profiles for select to authenticated using ((select auth.uid())=user_id);
-- Transactional invalidation metadata, without preference values or notebook content.
create table stylist_private.profile_changes (
 sequence bigint generated always as identity primary key,
 user_id uuid not null references auth.users(id) on delete cascade,
 revision bigint not null,
 created_at timestamptz not null default now(),
 unique(user_id,revision)
);
revoke all on stylist_private.profile_changes from public,anon,authenticated;
create function public.stylist_save_profile(p_preferences jsonb,p_expected_revision bigint,p_consent boolean)
returns public.stylist_profiles language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); result public.stylist_profiles;
begin
 if actor is null then raise exception 'unauthenticated' using errcode='42501'; end if;
 if p_consent is distinct from true or not stylist_private.valid_profile(p_preferences) then raise exception 'invalid explicit save' using errcode='22023'; end if;
 if p_expected_revision=0 then
  insert into public.stylist_profiles(user_id,preferences) values(actor,p_preferences) on conflict do nothing returning * into result;
 else
  update public.stylist_profiles set preferences=p_preferences,revision=revision+1,save_consent_at=now(),updated_at=now() where user_id=actor and revision=p_expected_revision returning * into result;
 end if;
 if result.user_id is null then raise exception 'stale revision' using errcode='40001'; end if;
 insert into stylist_private.profile_changes(user_id,revision) values(actor,result.revision);
 return result;
end $$;
revoke all on function public.stylist_save_profile(jsonb,bigint,boolean) from public,anon;
grant execute on function public.stylist_save_profile(jsonb,bigint,boolean) to authenticated;
commit;
