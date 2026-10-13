-- UNAPPLIED. Append-only approval identities for separately authorized trials.
-- The first singleton allowance and every avatar record remain untouched.
begin;
create table stylist_notes_trial_private.approved_trials (
 approval_id text primary key check(approval_id ~ '^[A-Za-z0-9_-]{1,80}$'),
 ledger jsonb not null check(stylist_notes_trial_private.valid_ledger(ledger) and ledger->'approval'->>'id'=approval_id)
);
alter table stylist_notes_trial_private.approved_trials enable row level security;
revoke all on table stylist_notes_trial_private.approved_trials from public,anon,authenticated,service_role;
create function stylist_notes_trial_private.read_approved_trial(approved_id text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb;
begin
 select ledger into strict result from stylist_notes_trial_private.approved_trials where approval_id=approved_id;
 return result;
end;$$;
create function stylist_notes_trial_private.change_approved_trial(approved_id text,expected jsonb,replacement jsonb)
returns boolean language plpgsql security definer set search_path='' as $$
declare current_ledger jsonb;
begin
 select ledger into strict current_ledger from stylist_notes_trial_private.approved_trials where approval_id=approved_id for update;
 if current_ledger is distinct from expected or stylist_notes_trial_private.valid_transition(current_ledger,replacement) is not true
 or replacement->'approval'->>'id' is distinct from approved_id then raise exception 'Notebook allowance requires review';end if;
 update stylist_notes_trial_private.approved_trials set ledger=replacement where approval_id=approved_id;
 return true;
end;$$;
create function public.stylist_private_notes_trial_read_approved(approved_id text)
returns jsonb language sql security invoker set search_path='' as $$select stylist_notes_trial_private.read_approved_trial(approved_id);$$;
create function public.stylist_private_notes_trial_change_approved(approved_id text,expected jsonb,replacement jsonb)
returns boolean language sql security invoker set search_path='' as $$select stylist_notes_trial_private.change_approved_trial(approved_id,expected,replacement);$$;
revoke all on function stylist_notes_trial_private.read_approved_trial(text),stylist_notes_trial_private.change_approved_trial(text,jsonb,jsonb) from public,anon,authenticated,service_role;
revoke all on function public.stylist_private_notes_trial_read_approved(text),public.stylist_private_notes_trial_change_approved(text,jsonb,jsonb) from public,anon,authenticated,service_role;
grant execute on function stylist_notes_trial_private.read_approved_trial(text),stylist_notes_trial_private.change_approved_trial(text,jsonb,jsonb) to service_role;
grant execute on function public.stylist_private_notes_trial_read_approved(text),public.stylist_private_notes_trial_change_approved(text,jsonb,jsonb) to service_role;
commit;
