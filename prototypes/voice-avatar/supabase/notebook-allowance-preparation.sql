-- UNAPPLIED preparation only. No initialization, allowance or provider call.
-- Separate from every legacy voice/avatar budget object. Review before applying.
begin;
create schema if not exists stylist_notebook_private;
revoke all on schema stylist_notebook_private from public, anon, authenticated, service_role;

create function stylist_notebook_private.valid_ledger(doc jsonb)
returns boolean language plpgsql immutable security invoker set search_path = '' as $$
declare a jsonb; r jsonb; seen text[] := '{}'; open_count integer := 0; k text; limit_value numeric;
begin
 if jsonb_typeof(doc) is distinct from 'object' or (select count(*) from jsonb_object_keys(doc)) <> 4
    or not (doc ?& array['version','purpose','approval','runs']) or doc->'version' is distinct from '1'::jsonb
    or doc->'purpose' is distinct from '"notes-only-simulation"'::jsonb then return false; end if;
 a := doc->'approval';
 if jsonb_typeof(a) is distinct from 'object' or (select count(*) from jsonb_object_keys(a)) <> 4
    or not (a ?& array['id','attempts','centsPerAttempt','secondsPerAttempt'])
    or jsonb_typeof(a->'id') is distinct from 'string' or (a->>'id') !~ '^[a-zA-Z0-9_-]{1,80}$' then return false; end if;
 foreach k in array array['attempts','centsPerAttempt','secondsPerAttempt'] loop
  if jsonb_typeof(a->k) is distinct from 'number' then return false; end if;
  limit_value := (a->>k)::numeric;
  if limit_value <> trunc(limit_value) or limit_value < 1
     or limit_value > (case k when 'attempts' then 16 when 'centsPerAttempt' then 100000 else 85 end) then return false; end if;
 end loop;
 if jsonb_typeof(doc->'runs') is distinct from 'array' or jsonb_array_length(doc->'runs') > (a->>'attempts')::numeric then return false; end if;
 for r in select value from jsonb_array_elements(doc->'runs') loop
  if jsonb_typeof(r) is distinct from 'object' or (select count(*) from jsonb_object_keys(r)) <> 2
     or not (r ?& array['id','closed']) or jsonb_typeof(r->'id') is distinct from 'string'
     or (r->>'id') !~ '^[a-zA-Z0-9_-]{1,80}$' or jsonb_typeof(r->'closed') is distinct from 'boolean'
     or (r->>'id') = any(seen) then return false; end if;
  seen := array_append(seen,r->>'id');
  if r->'closed' = 'false'::jsonb then open_count := open_count + 1; end if;
 end loop;
 return open_count <= 1;
exception when others then return false;
end;
$$;

create function stylist_notebook_private.valid_transition(previous jsonb, replacement jsonb)
returns boolean language plpgsql immutable security invoker set search_path = '' as $$
declare n integer; m integer; i integer; closures integer := 0; a jsonb; b jsonb;
begin
 if not stylist_notebook_private.valid_ledger(previous) or not stylist_notebook_private.valid_ledger(replacement)
    or previous->'approval' is distinct from replacement->'approval' then return false; end if;
 n := jsonb_array_length(previous->'runs'); m := jsonb_array_length(replacement->'runs');
 if m = n+1 then
  if replacement->'runs'->n->'closed' is distinct from 'false'::jsonb then return false; end if;
  for i in 0..n-1 loop
   if previous->'runs'->i is distinct from replacement->'runs'->i or previous->'runs'->i->'closed' is distinct from 'true'::jsonb then return false; end if;
  end loop;
  return true;
 elsif m = n then
  for i in 0..n-1 loop
   a := previous->'runs'->i; b := replacement->'runs'->i;
   if a is distinct from b then
    if a->'id' is distinct from b->'id' or a->'closed' is distinct from 'false'::jsonb or b->'closed' is distinct from 'true'::jsonb then return false; end if;
    closures := closures + 1;
   end if;
  end loop;
  return closures = 1;
 end if;
 return false;
end;
$$;

create table stylist_notebook_private.allowance (
 singleton boolean primary key default true check(singleton),
 ledger jsonb not null check(stylist_notebook_private.valid_ledger(ledger))
);
alter table stylist_notebook_private.allowance enable row level security;
revoke all on table stylist_notebook_private.allowance from public, anon, authenticated, service_role;

-- Elevation is confined to a private schema; invoker RPC wrappers are below.
create function stylist_notebook_private.read_ledger()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare current_ledger jsonb;
begin
 select ledger into strict current_ledger from stylist_notebook_private.allowance where singleton = true;
 return current_ledger;
end;
$$;
create function stylist_notebook_private.change_ledger(expected jsonb, replacement jsonb)
returns boolean language plpgsql security definer set search_path = '' as $$
declare current_ledger jsonb;
begin
 select ledger into strict current_ledger from stylist_notebook_private.allowance where singleton = true for update;
 if current_ledger is distinct from expected or not stylist_notebook_private.valid_transition(current_ledger,replacement) then
  raise exception 'Notebook allowance requires review';
 end if;
 update stylist_notebook_private.allowance set ledger = replacement where singleton = true;
 return true;
end;
$$;
create function public.stylist_notebook_allowance_read()
returns jsonb language sql security invoker set search_path = '' as $$
 select stylist_notebook_private.read_ledger();
$$;
create function public.stylist_notebook_allowance_change(expected jsonb, replacement jsonb)
returns boolean language sql security invoker set search_path = '' as $$
 select stylist_notebook_private.change_ledger(expected,replacement);
$$;
revoke all on all functions in schema stylist_notebook_private from public, anon, authenticated, service_role;
revoke all on function public.stylist_notebook_allowance_read() from public, anon, authenticated, service_role;
revoke all on function public.stylist_notebook_allowance_change(jsonb,jsonb) from public, anon, authenticated, service_role;
grant usage on schema stylist_notebook_private to service_role;
grant execute on function stylist_notebook_private.read_ledger() to service_role;
grant execute on function stylist_notebook_private.change_ledger(jsonb,jsonb) to service_role;
grant execute on function public.stylist_notebook_allowance_read() to service_role;
grant execute on function public.stylist_notebook_allowance_change(jsonb,jsonb) to service_role;
commit;
