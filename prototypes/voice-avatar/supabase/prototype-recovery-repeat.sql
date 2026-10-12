-- Separately approved 12 October 2026. Apply once, only after eleven preserved attempts with verified ended initial room and unused replacement.
-- Does not reserve rooms or start calls. Existing eleven records are immutable.
begin;
lock table public.stylist_prototype_budget in exclusive mode;
do $$ declare existing jsonb; begin
 select ledger into strict existing from public.stylist_prototype_budget where singleton=true;
 if jsonb_array_length(existing->'runs') <> 11 or existing ? 'recoveryRepeat'
 or existing->'recoveryTrial' is distinct from '{"approvedOn":"2026-10-12","baseAttempts":9,"extraAttempts":2,"cents":400,"seconds":600,"purpose":"replacement-room-resume","totalBudgetCents":2900}'::jsonb
 or exists(select 1 from jsonb_array_elements(existing->'runs') with ordinality t(r,n) where n<=10 and r->'closed' is distinct from 'true'::jsonb)
 or existing->'runs'->9->'started' is distinct from 'true'::jsonb or not(existing->'runs'->9 ? 'room')
 or existing->'runs'->10->'started' is distinct from 'false'::jsonb or existing->'runs'->10->'closed' is distinct from 'false'::jsonb or existing->'runs'->10 ? 'room'
 then raise exception 'Recovery amendment requires verified ended initial and unused replacement'; end if;
end $$;
alter table public.stylist_prototype_budget drop constraint stylist_prototype_budget_ledger_check;
alter table public.stylist_prototype_budget add constraint stylist_prototype_budget_ledger_check
 check(ledger->>'version'='1' and jsonb_typeof(ledger->'runs')='array' and jsonb_array_length(ledger->'runs') in (11,13));
update public.stylist_prototype_budget set ledger=ledger || '{"recoveryRepeat":{"approvedOn":"2026-10-12","baseAttempts":11,"extraAttempts":2,"cents":400,"seconds":600,"purpose":"replacement-room-repeat","totalBudgetCents":3300}}'::jsonb where singleton=true;
create or replace function public.stylist_prototype_budget_change(expected jsonb,replacement jsonb)
returns boolean language plpgsql security definer set search_path='' as $$
declare current_ledger jsonb; old_count integer; new_count integer; i integer; r jsonb; previous jsonb;
begin
 select ledger into strict current_ledger from public.stylist_prototype_budget where singleton=true for update;
 if current_ledger is distinct from expected then raise exception 'Ledger changed'; end if;
 old_count:=jsonb_array_length(current_ledger->'runs'); new_count:=jsonb_array_length(replacement->'runs');
 if current_ledger->'recoveryRepeat' is distinct from '{"approvedOn":"2026-10-12","baseAttempts":11,"extraAttempts":2,"cents":400,"seconds":600,"purpose":"replacement-room-repeat","totalBudgetCents":3300}'::jsonb
 or (replacement-'runs') is distinct from (current_ledger-'runs') or jsonb_typeof(replacement->'runs') is distinct from 'array'
 or new_count not in (11,13) or new_count<old_count then raise exception 'Invalid recovery ledger'; end if;
 for i in 0..10 loop
  if replacement->'runs'->i is distinct from current_ledger->'runs'->i then raise exception 'History changed'; end if;
 end loop;
 if new_count=13 then
  for i in 11..12 loop
   r:=replacement->'runs'->i;
   if jsonb_typeof(r) is distinct from 'object' or r->'cents' is distinct from '200'::jsonb or r->'seconds' is distinct from '300'::jsonb
   or r->>'kind' is distinct from 'recovery' or jsonb_typeof(r->'closed') is distinct from 'boolean' or jsonb_typeof(r->'started') is distinct from 'boolean'
   or jsonb_typeof(r->'id') is distinct from 'string' or coalesce(r->>'id','') !~ '^[a-f0-9-]{36}$' or (r-'id'-'cents'-'seconds'-'kind'-'closed'-'started'-'room')<>'{}'::jsonb
   or (r ? 'room' and (jsonb_typeof(r->'room') is distinct from 'string' or coalesce(r->>'room','') !~ '^[a-zA-Z0-9_-]{1,100}$' or r->'started'<>'true'::jsonb))
   then raise exception 'Invalid room reservation'; end if;
   if exists(select 1 from jsonb_array_elements(replacement->'runs') with ordinality t(v,n) where n<>i+1 and v->>'id'=r->>'id') then raise exception 'Duplicate reservation'; end if;
   if old_count=11 then
    if r->'closed'<>'false'::jsonb or r->'started'<>'false'::jsonb or r ? 'room' then raise exception 'Pair must reserve before use'; end if;
   else
    previous:=current_ledger->'runs'->i;
    if (r-'room'-'closed'-'started') is distinct from (previous-'room'-'closed'-'started')
    or (previous->'closed'='true'::jsonb and r is distinct from previous)
    or (previous->'started'='true'::jsonb and r->'started'<>'true'::jsonb)
    or (previous ? 'room' and r->'room' is distinct from previous->'room')
    then raise exception 'Reservation changed'; end if;
    if previous->'started'='false'::jsonb and r->'started'='true'::jsonb then
     if r->'closed'<>'false'::jsonb or r ? 'room' then raise exception 'Claim separately'; end if;
     if i=12 and (current_ledger->'runs'->11->'closed'<>'true'::jsonb or not(current_ledger->'runs'->11 ? 'room')) then raise exception 'Initial room not closed'; end if;
    end if;
   end if;
  end loop;
 end if;
 update public.stylist_prototype_budget set ledger=replacement where singleton=true;
 return true;
end $$;
revoke all on function public.stylist_prototype_budget_change(jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.stylist_prototype_budget_change(jsonb,jsonb) to service_role;
commit;
