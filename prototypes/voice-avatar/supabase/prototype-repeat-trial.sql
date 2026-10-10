-- Apply once after the separately approved automatic capture repeat trial. Preserve all history.
begin;
lock table public.stylist_prototype_budget in exclusive mode;
do $$
declare existing jsonb;
begin
  select ledger into strict existing from public.stylist_prototype_budget where singleton=true;
  if jsonb_array_length(existing->'runs') <> 8 or existing ? 'repeatTrial'
     or exists(select 1 from jsonb_array_elements(existing->'runs') r where r->>'closed' is distinct from 'true')
     or not(existing ? 'automaticTrial') then raise exception 'Repeat allowance requires eight closed historical attempts'; end if;
end $$;
alter table public.stylist_prototype_budget drop constraint stylist_prototype_budget_ledger_check;
alter table public.stylist_prototype_budget add constraint stylist_prototype_budget_ledger_check
 check(ledger->>'version' = '1' and jsonb_typeof(ledger->'runs') = 'array' and
   (jsonb_array_length(ledger->'runs') <= 8 or (jsonb_array_length(ledger->'runs') = 9 and ledger->'repeatTrial' = '{"approvedOn":"2026-10-09","baseAttempts":8,"extraAttempts":1,"cents":200,"seconds":300,"source":"reserve","purpose":"automatic-capture-repeat","totalBudgetCents":2500}'::jsonb)));
update public.stylist_prototype_budget set ledger = ledger || jsonb_build_object('repeatTrial','{"approvedOn":"2026-10-09","baseAttempts":8,"extraAttempts":1,"cents":200,"seconds":300,"source":"reserve","purpose":"automatic-capture-repeat","totalBudgetCents":2500}'::jsonb) where singleton=true;
create or replace function public.stylist_prototype_budget_change(expected jsonb, replacement jsonb)
returns boolean language plpgsql security definer set search_path = '' as $$
declare current_ledger jsonb; i integer;
begin
  select ledger into strict current_ledger from public.stylist_prototype_budget where singleton = true for update;
  if current_ledger is distinct from expected then raise exception 'Ledger changed; review required'; end if;
  if replacement->>'version' is distinct from '1' or jsonb_typeof(replacement->'runs') is distinct from 'array'
     or jsonb_array_length(replacement->'runs') < jsonb_array_length(current_ledger->'runs')
     or jsonb_array_length(replacement->'runs') > (case when current_ledger->'repeatTrial' = '{"approvedOn":"2026-10-09","baseAttempts":8,"extraAttempts":1,"cents":200,"seconds":300,"source":"reserve","purpose":"automatic-capture-repeat","totalBudgetCents":2500}'::jsonb then 9 else 8 end)
     or jsonb_array_length(replacement->'runs') > jsonb_array_length(current_ledger->'runs') + 1
     or (replacement - 'runs') is distinct from (current_ledger - 'runs') then
    raise exception 'Invalid ledger change';
  end if;
  -- Existing records cannot be removed, reordered, refunded or reopened.
  for i in 0..jsonb_array_length(current_ledger->'runs')-1 loop
    if ((replacement->'runs'->i) - 'room' - 'closed') is distinct from ((current_ledger->'runs'->i) - 'room' - 'closed')
       or ((current_ledger->'runs'->i->>'closed') = 'true' and (replacement->'runs'->i->>'closed') is distinct from 'true')
       or (current_ledger->'runs'->i ? 'room' and replacement->'runs'->i->>'room' is distinct from current_ledger->'runs'->i->>'room') then
      raise exception 'Existing reservation changed';
    end if;
  end loop;
  update public.stylist_prototype_budget set ledger = replacement where singleton = true;
  return true;
end;
$$;

revoke all on function public.stylist_prototype_budget_change(jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.stylist_prototype_budget_change(jsonb,jsonb) to service_role;
commit;
select jsonb_array_length(ledger->'runs')=8 as history_preserved,
       ledger ? 'repeatTrial' as repeat_allowance_applied,
       (select relrowsecurity from pg_class where oid='public.stylist_prototype_budget'::regclass) as rls_enabled
from public.stylist_prototype_budget where singleton=true;
