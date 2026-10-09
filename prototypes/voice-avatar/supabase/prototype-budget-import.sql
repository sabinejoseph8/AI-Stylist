-- One-time import of the six existing closed reservations. Never resets a row.
begin;
create or replace function public.stylist_prototype_budget_import(ledger_seed jsonb)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  if ledger_seed->>'version' is distinct from '1'
     or jsonb_typeof(ledger_seed->'runs') is distinct from 'array'
     or jsonb_array_length(ledger_seed->'runs') <> 6
     or exists(select 1 from jsonb_array_elements(ledger_seed->'runs') r where r->>'closed' is distinct from 'true' or r->>'cents' is distinct from '200' or r->>'seconds' is distinct from '300') then
    raise exception 'Expected six closed historical reservations';
  end if;
  insert into public.stylist_prototype_budget(singleton,ledger) values(true,ledger_seed);
  return true;
end;
$$;
revoke all on function public.stylist_prototype_budget_import(jsonb) from public,anon,authenticated;
grant execute on function public.stylist_prototype_budget_import(jsonb) to service_role;
commit;
