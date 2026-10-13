-- UNAPPLIED operator template. Never execute before Sabine's separate financial
-- and security authorization. The NULL deliberately makes the default fail.
-- After authorization, set only approved_id to the recorded, reviewed ID and run
-- once as the database owner. Matching ledger data is not human authorization.
-- This never updates or resets a ledger, and does not touch avatar reservations.
begin;
do $$
declare
 approved_id text := NULL;
begin
 if approved_id is null or approved_id !~ '^[A-Za-z0-9_-]{1,80}$' then
  raise exception 'Explicit reviewed private-trial approval is required';
 end if;
 lock table stylist_notes_trial_private.allowance in exclusive mode;
 if exists(select 1 from stylist_notes_trial_private.allowance) then
  raise exception 'Existing private-trial history must be preserved';
 end if;
 insert into stylist_notes_trial_private.allowance(ledger) values(
  jsonb_build_object('version',1,'purpose','notes-only-private-trial',
   'approval',jsonb_build_object('id',approved_id,'cents',200,'maxSeconds',85,
    'maxTurns',2,'maxExtractions',64,'maxInputTokens',1000000,'maxOutputTokens',2048),
   'reservation',null));
end;
$$;
commit;
