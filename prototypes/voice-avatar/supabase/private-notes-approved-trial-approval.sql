-- UNAPPLIED, deliberately fails by default. A separately recorded human
-- decision is required for each new ID. Never reset or amend a consumed record.
begin;
do $$
declare approved_id text := NULL;
begin
 if approved_id is null or approved_id !~ '^[A-Za-z0-9_-]{1,80}$' then raise exception 'Explicit reviewed private-trial approval is required';end if;
 lock table stylist_notes_trial_private.allowance in share mode;
 lock table stylist_notes_trial_private.approved_trials in exclusive mode;
 if exists(select 1 from stylist_notes_trial_private.allowance where ledger->'approval'->>'id'=approved_id)
 or exists(select 1 from stylist_notes_trial_private.approved_trials where approval_id=approved_id) then raise exception 'Existing private-trial history must be preserved';end if;
 insert into stylist_notes_trial_private.approved_trials(approval_id,ledger) values(approved_id,jsonb_build_object('version',1,'purpose','notes-only-private-trial','approval',jsonb_build_object('id',approved_id,'cents',200,'maxSeconds',85,'maxTurns',2,'maxExtractions',64,'maxInputTokens',1000000,'maxOutputTokens',2048),'reservation',null));
end;$$;
commit;
