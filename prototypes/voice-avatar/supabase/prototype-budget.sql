-- Task 1b private experiment ledger only. No audio, photos or conversation text.
-- Apply only to the confirmed AI Stylist test project, never an unrelated project.
-- Seed separately from the existing private ledger. Missing data blocks all tests.
begin;
create table if not exists public.stylist_prototype_budget (
  singleton boolean primary key default true check(singleton),
  ledger jsonb not null check(ledger->>'version' = '1' and jsonb_typeof(ledger->'runs') = 'array' and jsonb_array_length(ledger->'runs') <= 6)
);
alter table public.stylist_prototype_budget enable row level security;
revoke all on table public.stylist_prototype_budget from public, anon, authenticated, service_role;

create or replace function public.stylist_prototype_budget_read()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare current_ledger jsonb;
begin
  select ledger into strict current_ledger from public.stylist_prototype_budget where singleton = true;
  return current_ledger;
end;
$$;
create or replace function public.stylist_prototype_budget_change(expected jsonb, replacement jsonb)
returns boolean language plpgsql security definer set search_path = '' as $$
declare current_ledger jsonb; i integer;
begin
  select ledger into strict current_ledger from public.stylist_prototype_budget where singleton = true for update;
  if current_ledger is distinct from expected then raise exception 'Ledger changed; review required'; end if;
  if replacement->>'version' is distinct from '1' or jsonb_typeof(replacement->'runs') is distinct from 'array'
     or jsonb_array_length(replacement->'runs') < jsonb_array_length(current_ledger->'runs')
     or jsonb_array_length(replacement->'runs') > 6
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
revoke all on function public.stylist_prototype_budget_read() from public, anon, authenticated;
revoke all on function public.stylist_prototype_budget_change(jsonb,jsonb) from public, anon, authenticated;
grant execute on function public.stylist_prototype_budget_read() to service_role;
grant execute on function public.stylist_prototype_budget_change(jsonb,jsonb) to service_role;
commit;
