# Local recovery reconciliation after a crash

15 October 2026. Authorized scope: local synthetic tests and disposable journals, with no new spending or hosted changes.

## Result

Unfinished recovery work can be **retired** in the local model only after separately authenticated fixture evidence establishes fencing and cleanup. Retirement is not password-reset success. It issues no browser cookie, resets no password, restores no capability and refunds no guess/send reservation. A fresh email generation and fresh worker/browser context are required for another attempt, subject to the same remaining cumulative limits.

No reconciliation path was mounted in the application. The existing signed recovery-purpose verifier, original held flags and hosted activation gates are unchanged.

## Evidence contract

| Requirement | Local model check |
|---|---|
| Exact operation | Both witnesses bind store ID, policy digest, operation, subject, generation and the current record/whole-ledger digests. |
| Independent roles | A fencing witness and cleanup witness use two distinct injected test HMAC keys. Role-specific fields and signatures are checked exactly. |
| Fencing | The witness must attest that old workers are fenced and old browser/capability permissions retired. |
| Cleanup | The separate witness must attest that provider processing is final, correlated sessions are absent and all created work is accounted for. Unknown/false status stays blocked. |
| Ordering | Cleanup binds the exact fencing witness digest and is issued no earlier than it. Both must follow the stored checkpoint and remain fresh. |
| External authority | Both epochs must match the independently supplied trusted fence epoch, not a value chosen from the witnesses or rolled-back journal. |
| Atomicity | State and evidence are rechecked under the journal lock before retirement. Concurrent state changes require new evidence. |
| Replay | Evidence IDs and fence epochs are one-use across retirement history. Old operation IDs remain consumed. |

Evidence validation accepts bounded, fixed-shape scalar metadata before computing signatures. The journal stores only the retirement timestamp, previous phase, epoch, witness IDs and combined evidence digest. It stores no authority key, signature, password, email, code, JWT or real session identity.

The HMAC attestations are **synthetic test authorities**, not Tavus/OpenAI/Supabase signatures or a new production proof format. Their truthfulness is assumed by the fixture. The model does not make unavailable provider guarantees available. If processing finality, session correlation or actual fencing cannot be independently established, the operation must remain unresolved.

## State and recovery behavior

The existing reserved, resetting and held phases can become retired after validated evidence. Completed/rejected/retired records cannot be reconciled again. Retirement preserves the original kind, generation, timestamp, operation ID and policy; all records continue to count. The retired generation cannot be used for verification again. A subsequent send advances the generation and still consumes the original send allowance.

A late reset claim or completion for the retired operation is refused. A stale in-memory reset capability therefore cannot acquire a new durable reset claim. This does not undo a password request already sent before fencing. The cleanup authority must establish quiescence for such work before retirement. Existing in-memory cleanup holds are not cleared; fresh workers are used after independently established fencing.

Reconciliation may clean up an expired policy's unresolved operation, but it never extends that policy or grants new admission. If a retirement write is interrupted or fails, the durable pending marker remains and fresh processes refuse further work. No automatic repair, reseed, refund or unknown-outcome retry is introduced.

## Implementation and tests

- tools/operations/local_recovery_reconciliation.py: standalone local reconciliation model with injected fixture trust and a trusted external epoch.
- tools/operations/local_recovery_abuse.py: validates retirement audit metadata and invalidates retired generations without deleting counters.
- tools/operations/test_local_recovery_reconciliation.py: **25 new operations tests**.
- apps/foundation/tests/recovery-admission-restart.test.ts: **5 new foundation tests**, using the test-only bridge and fresh Node/Python processes.

Tests cover valid retirement from every unresolved phase; missing, forged, stale, future, wrong-role and mismatched evidence; false/unknown cleanup or fencing; stale snapshots; reordered proof; replayed IDs/epochs; concurrent reconcilers; unchanged guess/send caps and policy expiry; missing/damaged checkpoints; disk failure; and crashes at every retirement-write stage.

Fresh-process probes retire simulated verification/password crashes, refuse the old generation, require a fresh send, then admit a separate new attempt if allowance remains. Both retired and new attempts remain counted. A stale in-memory capability cannot start password work after retirement. Signed unknown provider-finality evidence and interrupted checkpoints leave fresh processes blocked.

All **1,371 foundation tests across 133 files**, type checking/build, **278 operations tests** with ResourceWarning treated as an error, four encryption tests and 16 local Memory checks pass. No actual account, email, provider, physical browser/device or customer password was used. The earlier 183-check database/photo restore drill is unchanged historical evidence.

## Limits and next action

The local journal is still checksummed rather than authenticated against a privileged writer. An independently preserved current fence epoch rejects old reconciliation witnesses after local rollback, as tested. This does **not** provide full admission protection against coordinated rollback of both journal/checkpoint files or compromise of the external authority itself. A real backend must independently preserve current monotonic evidence and verify retirement authority before permitting admission. The stored digest alone cannot recreate or independently authenticate the original witnesses.

Production also needs real operation/session correlation, truthful provider-finality and worker-fencing contracts, authoritative clock/identity ownership, transaction/privilege verification, evidence retention decisions and actual restoration testing. Public support replies have not supplied every required guarantee. Incoming proof-URL logging, ingress, sender, provider-purpose compatibility and hosted/device acceptance remain open. No phase or acceptance checkbox is closed.

Exact next local action: review the storage-adapter fencing and transaction specification, including authoritative retirement reads and missing-evidence refusal. Keep real provider/hosted activation separately gated. Project memory and the local Memory snapshot are updated; GitHub/hosted Memory, all credentials, permanent backup runtime/ledgers/scheduler and spending are unchanged.
