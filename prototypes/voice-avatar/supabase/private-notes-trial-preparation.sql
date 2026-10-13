-- UNAPPLIED preparation only. No initialization, allowance or provider call.
-- Separate from every legacy voice/avatar budget object. Review before applying.
begin;
create schema if not exists stylist_notes_trial_private;
revoke all on schema stylist_notes_trial_private from public, anon, authenticated, service_role;

create function stylist_notes_trial_private.valid_ledger(doc jsonb)
returns boolean language plpgsql immutable security invoker set search_path = '' as $$
declare a jsonb; r jsonb;
begin
 if jsonb_typeof(doc) is distinct from 'object' or (select count(*) from jsonb_object_keys(doc)) <> 4
 or not (doc ?& array['version','purpose','approval','reservation']) or doc->'version' is distinct from '1'::jsonb
 or doc->'purpose' is distinct from '"notes-only-private-trial"'::jsonb then return false; end if;
 a := doc->'approval'; r := doc->'reservation';
 if jsonb_typeof(a) is distinct from 'object' or jsonb_typeof(a->'id') is distinct from 'string'
 or (a->>'id') !~ '^[A-Za-z0-9_-]{1,80}$'
 or a-'id' is distinct from '{"cents":200,"maxSeconds":85,"maxTurns":2,"maxExtractions":64,"maxInputTokens":1000000,"maxOutputTokens":2048}'::jsonb then return false; end if;
 if r = 'null'::jsonb then return true; end if;
 return jsonb_typeof(r) = 'object' and (select count(*) from jsonb_object_keys(r)) = 2
 and r ?& array['id','state'] and jsonb_typeof(r->'id') = 'string' and (r->>'id') ~ '^[A-Za-z0-9_-]{1,80}$'
 and jsonb_typeof(r->'state') = 'string' and r->>'state' in ('reserved','transport-closed','held');
exception when others then return false;
end;
$$;
create function stylist_notes_trial_private.valid_transition(previous jsonb, replacement jsonb)
returns boolean language plpgsql immutable security invoker set search_path = '' as $$
begin
 if not stylist_notes_trial_private.valid_ledger(previous) or not stylist_notes_trial_private.valid_ledger(replacement)
 or previous->'approval' is distinct from replacement->'approval' then return false; end if;
 if previous->'reservation' = 'null'::jsonb then
  return coalesce(replacement->'reservation'->>'state' = 'reserved',false);
 end if;
 return coalesce(previous->'reservation'->>'state' = 'reserved'
 and replacement->'reservation'->>'state' in ('held','transport-closed')
 and previous->'reservation'->'id' = replacement->'reservation'->'id',false);
end;
$$;

create table stylist_notes_trial_private.allowance (
 singleton boolean primary key default true check(singleton),
 ledger jsonb not null check(stylist_notes_trial_private.valid_ledger(ledger))
);
alter table stylist_notes_trial_private.allowance enable row level security;
revoke all on table stylist_notes_trial_private.allowance from public, anon, authenticated, service_role;

-- Elevation is confined to a private schema; invoker RPC wrappers are below.
create function stylist_notes_trial_private.read_ledger()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare current_ledger jsonb;
begin
 select ledger into strict current_ledger from stylist_notes_trial_private.allowance where singleton = true;
 return current_ledger;
end;
$$;
create function stylist_notes_trial_private.change_ledger(expected jsonb, replacement jsonb)
returns boolean language plpgsql security definer set search_path = '' as $$
declare current_ledger jsonb;
begin
 select ledger into strict current_ledger from stylist_notes_trial_private.allowance where singleton = true for update;
 if current_ledger is distinct from expected or stylist_notes_trial_private.valid_transition(current_ledger,replacement) is not true then
  raise exception 'Notebook allowance requires review';
 end if;
 update stylist_notes_trial_private.allowance set ledger = replacement where singleton = true;
 return true;
end;
$$;
create function public.stylist_private_notes_trial_read()
returns jsonb language sql security invoker set search_path = '' as $$
 select stylist_notes_trial_private.read_ledger();
$$;
create function public.stylist_private_notes_trial_change(expected jsonb, replacement jsonb)
returns boolean language sql security invoker set search_path = '' as $$
 select stylist_notes_trial_private.change_ledger(expected,replacement);
$$;
revoke all on all functions in schema stylist_notes_trial_private from public, anon, authenticated, service_role;
revoke all on function public.stylist_private_notes_trial_read() from public, anon, authenticated, service_role;
revoke all on function public.stylist_private_notes_trial_change(jsonb,jsonb) from public, anon, authenticated, service_role;
grant usage on schema stylist_notes_trial_private to service_role;
grant execute on function stylist_notes_trial_private.read_ledger() to service_role;
grant execute on function stylist_notes_trial_private.change_ledger(jsonb,jsonb) to service_role;
grant execute on function public.stylist_private_notes_trial_read() to service_role;
grant execute on function public.stylist_private_notes_trial_change(jsonb,jsonb) to service_role;
commit;
