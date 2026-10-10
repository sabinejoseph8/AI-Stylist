-- UNAPPLIED rollback preparation. Refuses to delete any initialized allowance.
-- No CASCADE: unexpected dependencies abort the transaction for review.
begin;
do $$
begin
 if exists(select 1 from stylist_notebook_private.allowance) then
  raise exception 'Initialized notebook allowance must be preserved; rollback requires review';
 end if;
end;
$$;
drop function public.stylist_notebook_allowance_read();
drop function public.stylist_notebook_allowance_change(jsonb,jsonb);
drop function stylist_notebook_private.read_ledger();
drop function stylist_notebook_private.change_ledger(jsonb,jsonb);
drop table stylist_notebook_private.allowance;
drop function stylist_notebook_private.valid_transition(jsonb,jsonb);
drop function stylist_notebook_private.valid_ledger(jsonb);
drop schema stylist_notebook_private;
commit;
