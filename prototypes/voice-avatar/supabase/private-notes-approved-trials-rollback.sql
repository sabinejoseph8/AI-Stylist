-- UNAPPLIED. Rollback is allowed only before any separately approved row exists.
begin;
do $$begin if exists(select 1 from stylist_notes_trial_private.approved_trials) then raise exception 'Existing private-trial history must be preserved';end if;end;$$;
drop function public.stylist_private_notes_trial_read_approved(text),public.stylist_private_notes_trial_change_approved(text,jsonb,jsonb);
drop function stylist_notes_trial_private.read_approved_trial(text),stylist_notes_trial_private.change_approved_trial(text,jsonb,jsonb);
drop table stylist_notes_trial_private.approved_trials;
commit;
