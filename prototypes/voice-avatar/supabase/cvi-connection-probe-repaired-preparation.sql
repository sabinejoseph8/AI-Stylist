-- Prepared for the separately approved repaired trial, 18 October 2026. Not applied.
-- Review only; do not rerun or use as an automatic initializer.
-- Review backup schema proof before applying. No runtime seed/reset capability.
begin;
do $$begin
 if public.stylist_connection_probe_read()->'reservation'->>'state' is distinct from 'ended' then
 raise exception 'Previous probe must be verified ended';end if;
end;$$;
create schema stylist_connection_probe_repaired_private;
revoke all on schema stylist_connection_probe_repaired_private from public,anon,authenticated,service_role;
create function stylist_connection_probe_repaired_private.valid_record(doc jsonb)
returns boolean language plpgsql immutable set search_path='' as $$
declare r jsonb;
begin
 if jsonb_typeof(doc) is distinct from 'object' or
 (select count(*) from jsonb_object_keys(doc))<>7 or
 doc - 'reservation' is distinct from '{"version":1,"purpose":"cvi-connection-only","approvalId":"cvi-connection-only-repaired-20261018","additionalCents":0,"maxRooms":1,"maxSeconds":300}'::jsonb then return false;end if;
 r:=doc->'reservation';
 if r='null'::jsonb then return true;end if;
 if jsonb_typeof(r) is distinct from 'object' or (select count(*) from jsonb_object_keys(r))<>3
 or not(r ?& array['id','state','roomId']) or jsonb_typeof(r->'id') is distinct from 'string'
 or (r->>'id' ~ '^[A-Za-z0-9_-]{1,100}$') is not true
 or jsonb_typeof(r->'state') is distinct from 'string' or r->>'state' not in ('reserved','held','ended')
 or not(r->'roomId'='null'::jsonb or (jsonb_typeof(r->'roomId')='string' and r->>'roomId' ~ '^[A-Za-z0-9_-]{1,100}$'))
 or (r->>'state'='ended' and r->'roomId'='null'::jsonb) then return false;end if;
 return true;
exception when others then return false;
end;$$;
create function stylist_connection_probe_repaired_private.valid_transition(a jsonb,b jsonb)
returns boolean language plpgsql immutable set search_path='' as $$
declare r jsonb;s jsonb;
begin
 if not stylist_connection_probe_repaired_private.valid_record(a) or not stylist_connection_probe_repaired_private.valid_record(b)
 or a-'reservation' is distinct from b-'reservation' then return false;end if;
 r:=a->'reservation';s:=b->'reservation';
 if s='null'::jsonb then return false;end if;
 if r='null'::jsonb then return s->>'state'='reserved' and s->'roomId'='null'::jsonb;end if;
 if r->>'id' is distinct from s->>'id' or r->>'state'<>'reserved' then return false;end if;
 if r->'roomId'<>'null'::jsonb and r->'roomId' is distinct from s->'roomId' then return false;end if;
 if s->>'state'='reserved' then return r->'roomId'='null'::jsonb and s->'roomId'<>'null'::jsonb;end if;
 if s->>'state'='ended' then return r->'roomId'<>'null'::jsonb and r->'roomId'=s->'roomId';end if;
 return s->>'state'='held';
end;$$;
create table stylist_connection_probe_repaired_private.allowance (
 singleton boolean primary key check(singleton),
 record jsonb not null check(stylist_connection_probe_repaired_private.valid_record(record))
);
alter table stylist_connection_probe_repaired_private.allowance enable row level security;
revoke all on table stylist_connection_probe_repaired_private.allowance from public,anon,authenticated,service_role;
create function public.stylist_connection_probe_repaired_read()
returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb;
begin
 select record into strict result from stylist_connection_probe_repaired_private.allowance where singleton;
 return result;
end;$$;
create function public.stylist_connection_probe_repaired_change(expected jsonb,replacement jsonb)
returns boolean language plpgsql security definer set search_path='' as $$
declare current_record jsonb;
begin
 select record into strict current_record from stylist_connection_probe_repaired_private.allowance where singleton for update;
 if current_record is distinct from expected or stylist_connection_probe_repaired_private.valid_transition(current_record,replacement) is not true
 then raise exception 'Connection probe admission requires review';end if;
 update stylist_connection_probe_repaired_private.allowance set record=replacement where singleton;
 return true;
end;$$;
revoke all on function stylist_connection_probe_repaired_private.valid_record(jsonb),stylist_connection_probe_repaired_private.valid_transition(jsonb,jsonb) from public,anon,authenticated,service_role;
revoke all on function public.stylist_connection_probe_repaired_read(),public.stylist_connection_probe_repaired_change(jsonb,jsonb) from public,anon,authenticated,service_role;
grant execute on function public.stylist_connection_probe_repaired_read(),public.stylist_connection_probe_repaired_change(jsonb,jsonb) to service_role;
-- No initializer available to service_role. Exactly one separately approved row.
insert into stylist_connection_probe_repaired_private.allowance values(true,'{"version":1,"purpose":"cvi-connection-only","approvalId":"cvi-connection-only-repaired-20261018","additionalCents":0,"maxRooms":1,"maxSeconds":300,"reservation":null}');
commit;
