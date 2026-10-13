-- UNAPPLIED rollback preparation. Never discard initialized approval/history.
begin;
do $$ begin
 if exists(select 1 from stylist_notes_trial_private.allowance) then
  raise exception 'Private notebook history requires review';
 end if;
end $$;
drop function public.stylist_private_notes_trial_read();
drop function public.stylist_private_notes_trial_change(jsonb,jsonb);
drop schema stylist_notes_trial_private cascade;
commit;
