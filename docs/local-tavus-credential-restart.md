## Later local rollback witness rehearsal

See docs/local-tavus-rollback-witness.md for conditional rejection of journal/checkpoint rollback against separately preserved witness state. The witness is a local simulation of independent protection. Rolling back all journals and witnesses remains undetectable, and no hosted authority is activated. The older unprotected fixture limitations below remain valid.

# Local credential invalidation at CVI restart

Sabine approved local preparation/tests on 15 October 2026, with no new spending or hosted changes. Only synthetic public test credentials and disposable journals are used. No real Tavus credential is generated, stored, rotated or revoked.

## Lifecycle candidate

`startLocalCviCredentialEndpoint` requires a replay port and credential authority. Before constructing an endpoint, it requests a compare-and-swap activation from the previously observed generation to the next generation, with a fresh credential-binding digest and fresh boot digest. It checks the exact committed acknowledgment. Missing storage, reused credential/boot, competing/stale activation, unknown acknowledgment, failure or timeout creates no endpoint. There is no retry or fallback to the previous credential.

The fixture authority binds a fixed origin/conversation/expiry scope and preserves all generation records. Each successful activation marks earlier generations inactive. Credential and boot digests cannot be reused, and the scope/absolute expiry cannot be extended by rotation. History is bounded to 16 synthetic generations; reaching the bound holds rather than pruning history. Those numbers are local resource limits, not a new production privacy or spending policy.

The endpoint captures its lease immutably. It requires current authority:

1. After request authentication, before replay reservation, body reading or draft work.
2. Immediately before spending its reply permission.
3. After spending, before the final notes/cancellation check and SSE byte handoff.

Each acknowledgment must match store, scope, credential-binding digest, boot digest, generation and observed server time, with active=true. Caller prompts/headers cannot activate or select a generation. No raw credential, prompt, note or body is sent to the authority.

The separate authority journal uses existing owner-only locked/fsynced pending/checkpoint primitives in new temporary folders only. Time observations are preserved when they advance, without extending expiry. Missing history, malformed state, partial write, clock rollback or unknown authority blocks the owner. Boot activation is a trusted startup operation, never an HTTP route or client command.

## Relationship to replay and notes

The credential store does not clear replay counts, held requests or old reservations. Tests compose through a TEST-ONLY scope adapter so both generations share the existing replay journal and lifetime cap. New credentials do not unblock an unresolved reserved request. A spent old request cannot be retried with the new credential. New flows start with empty, unconfirmed notes; credential activation does not reconstruct or confirm customer context.

The adapter normalizes the replay journal binding to a stable scope and rebinds acknowledgments to the current request's credential digest. This is disconnected fixture glue. It does not prove an atomic production transaction between the two stores, worker fencing or provider quiescence.

## Test evidence

43 new foundation tests comprise 15 fresh-process/lifecycle cases and 28 authority/startup cases. They cover fresh startup before serving, old bearer/old lease refusal, immutable leases, missing/mismatched/late acknowledgments, activation timeout, competing rotations, interrupted writes at every stage, missing state, retired credential/boot reuse, rotation while a reply waits and rotation during consumed permission. Fifteen new operations tests cover clocks, history bounds, schemas, substitution, write failures and preservation of retired records.

All 1,557 foundation tests across 139 files, 308 operations tests with ResourceWarning as error, type checking/build, four encryption checks and 16 local Memory checks pass. No physical device or provider acceptance is claimed. The older isolated hosted-schema restore checkpoint was not rerun.

## Remaining boundaries

- Process exit alone is not a revocation event. Startup must successfully commit a fresh generation through the new gate before serving. An old worker loses authority after that commit, on its subsequent checks. The earlier low-level factories remain disconnected fixtures and do not independently detect OS restarts.
- Coordinated rollback of both valid authority files can restore an old active generation. A negative test demonstrates it. Production needs independently protected monotonic authority; a checksum is not that authority.
- Revocation cannot recall text/audio already delivered. There is also a cross-process gap after the last authority acknowledgment and before byte handoff. Tests show refusal at the three specified checkpoints, not an absolute atomic revocation or downstream flush guarantee.
- Already issued provider work can continue after abort. Authority checks are not proof of provider cleanup, final billing or old session termination.
- No production credential provisioning, secure delivery to Tavus, key rotation policy, metadata retention policy, hosted transaction adapter or automatic real-service startup is implemented. Fixture secrets and boot IDs are public constants, unsuitable as real credentials.
- Actual Tavus request/header/retry correlation, transcript-to-notes integration, checked speech/fallback, non-ElevenLabs voice and live device behavior remain unverified.

The $51 allocation and historical held trial records are unchanged. No account, hosted setting, support message, paid call, private credential, permanent backup runtime/ledger or scheduler was touched. Local Memory only is refreshed; no GitHub or hosted publication occurs. Phase/task completion counts and production requirements are unchanged.

## Exact next action

Review the disconnected composition of startup generation, shared replay admission and permanent experiment reservation, including independent rollback authority and current-notes ownership. Prepare a live readiness matrix and bounded cost proposal only after actual Tavus request and permitted voice/account capabilities can be established. Private activation, hosted changes and provider spending require separate authorization.
