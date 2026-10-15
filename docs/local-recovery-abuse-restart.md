# Local recovery abuse and restart rehearsal

15 October 2026. Authorized scope: local tests and preparation, no new spending, real accounts or hosted changes.

## Result

**The isolated admission model preserves synthetic guess/send counts and unresolved operations across fresh processes.** It refuses further simulated provider work after missing/damaged state, uncertain outcomes or interrupted updates. It is not installed in the customer application and does not resolve the recovery-purpose compatibility question.

Implementation: tools/operations/local_recovery_abuse.py. Evidence: tools/operations/test_local_recovery_abuse.py. Only the test module imports the rehearsal; no active backup runner or account host does.

## Tested design

| Boundary | Rehearsal behavior |
|---|---|
| Identity data | Accepts only explicit fixture-subject identifiers. Stores no email, code, password, JWT or provider response. Real identity mapping is outside this model. |
| Policy | Explicit fixture limits and policy digest, bound to one store ID. There is no default customer policy or automatic window reset. |
| Reservation | A nonblocking process lock serializes checking and recording. The reservation and checkpoint are saved before the callback runs. Lock contention refuses admission. |
| Guess limits | All reserved verification attempts count, including rejected, canceled, successful and uncertain outcomes. New attempt IDs, resend generations and process restarts do not refund them. |
| Resends | A per-subject send cap and interval precede the callback. A resend advances the generation without resetting the cumulative guess count; earlier generations are refused. |
| Shared protection | A cumulative fixture-wide cap prevents switching fixture subjects from avoiding the overall allowance. One unresolved operation blocks further work globally. |
| Expiry/time | Superseded/expired code generations, expired policy and backward timestamps are refused. Time passage does not unlock unresolved work. |
| Completion | Only the exact reserved operation can settle once. Uncertain outcome or cleanup retains a held record. An asserted late success cannot automatically release a held operation. |
| Restart | New child processes load existing private files only. Missing ledger, checkpoint or lock never triggers automatic initialization. |
| Interrupted update | A durable pending marker remains through each write stage. A failed reservation write prevents callback execution; a failed completion write cannot report success. |

The journal uses owner-only files, an advisory process lock, fsync and a SHA-256 checkpoint. Every read validates version, policy/store binding, record shapes, ordered generations, timestamps, caps and terminal unresolved states. Symbolic links and shared permissions are refused. The existing local evidence helper is reused without changing it.

## Evidence

**37 new cases** bring the Python operations suite from 208 to **245 passing tests**, with ResourceWarning treated as an error. The suite includes actual fresh child processes and eight competing processes claiming the last available guess. The callback only appends a fixed synthetic call marker; it sends no email or provider request. Disposable directories are removed after each case.

Checks cover repeated guesses, resend caps/intervals, unchanged counts after restart/resend/time passage, replaced/expired generations, shared caps, operation replay, cancellation, known and unknown outcomes, confirmed and uncertain cleanup, crashes before/after callback, every journal update stage, disk-write failures, missing/corrupt/truncated/shared/symlink state, policy/store mismatch, malformed history, lock contention, clock reversal and expiry.

Regression evidence also passes: **1,307 foundation tests across 129 files**, type checking, production build, four encryption tests and 16 local Memory checks. The separate 183-check database/photo restore drill is historical evidence and was not rerun for this change. No live provider/device/hosted acceptance is implied by these totals.

## Explicit limits

- The checkpoint detects accidental damage, interrupted writes and a one-sided rollback. It is not authenticated against someone who can rewrite the files and checksum. A dedicated negative test confirms that restoring both files to a valid older pair is **not detected**. Production needs independently protected monotonic evidence and recovery procedures before using restored abuse state.
- Fixture caps are three guesses, two sends, twelve total operations, a ten-unit resend interval and a fifty-unit code lifetime. Time units and epoch are synthetic. These deliberately small values exercise boundaries; they are not approved customer limits, retention periods or lockout promises.
- This is a single-host, advisory-lock model with a conservative global unresolved-work hold. It does not establish hosted/distributed durability, throughput, provider behavior, identity canonicalization, privacy retention, account-enumeration protection or end-to-end cancellation of remote work.
- The TypeScript recovery candidate's process-local maps/holds are unchanged. This Python ledger is a separate local rehearsal, not a connected admission port or proof that the application now survives a restart. It grants no reset/sign-in authority.
- Explicit fixture initialization only works in an empty disposable directory. There is no automatic reseed, refund, held-record release or production migration. A malicious administrator restoring/replacing the whole fixture is outside its protection.

## Next action

Prepare the receiving-browser binding and the durable admission-port contract locally, keeping the existing strict recovery-purpose check. Before customer composition, determine authoritative identifier/clock/evidence ownership, approve actual policy/retention decisions and establish cleanup/restart reconciliation. Provider-purpose compatibility, exact hosted ingress/log handling, sender, cross-device acceptance and independent recovery authority remain open. B03/B04 and all phase/acceptance checkboxes stay unchanged. No hosted Memory/GitHub publication, credential/runtime/scheduler change, support message or spending occurred.
