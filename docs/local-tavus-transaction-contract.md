# Local CVI persistence and transaction adapter contract

Sabine approved local preparation/tests on 15 October 2026, with no new spending or hosted changes. The contract remains disconnected. SQLite is a disposable test fixture, not a selection of the production database or a change to approved Supabase/Render hosting.

## Service-only interface

The adapter captures a trusted actor, pinned store/policy identity and independently preserved minimum domain epoch. The port must be bound to that authenticated actor by the real backend. Neither the request body nor a claimed role string may select the actor.

| Operation | Contract |
| --- | --- |
| project | Read current authoritative metadata under a transaction; issue a bounded, one-use projection |
| commit | Accept only that projection's metadata and a strict reserve, consume or rotate command |
| committed acknowledgment | Bind store/policy, previous epoch/head, next epoch/head and authoritative mutation time |

A projection includes exact store, immutable policy digest, current epoch/head, authoritative issue/expiry time, opaque token and service-only current snapshot. The snapshot contains synthetic history metadata, not customer notes, audio or photos. It is never served to a customer browser in this rehearsal.

The TypeScript wrapper checks the complete projection schema, scope/current actor, pinned policy, domain invariants, digest, epoch floor and lifetime. It freezes a private copy and grants a local one-use capability. Cloned, cross-client, expired or malformed projections cannot authorize the wrapper. Observer roles cannot obtain a write projection.

Commit submits no replacement snapshot. Its payload contains only the exact projection metadata and strict command. A successful acknowledgment is checked against the expected previous head and next epoch, and the expected next state is recomputed using its authoritative timestamp. Unknown, missing, mismatched, timed-out, stale or lost acknowledgment holds the client without automatic retry or refund. A local weak capability is not a substitute for durable server token checking.

## Required transaction sequence

A real backend must perform these steps within one durable, serializable/linearizable transaction:

1. Resolve the authenticated principal and read the current stored history, immutable policy and observed clock.
2. Validate the current snapshot with the same domain rules, not the caller's snapshot.
3. Verify the stored projection token, issuing principal, policy, expected epoch/head and lifetime. Role and credential generation must still be current.
4. Consume the known projection; stale/invalid semantic attempts must not create new permission.
5. Recompute the allowed domain transition with an authoritative mutation timestamp. Never accept an arbitrary replacement hash/state.
6. Persist the new snapshot, head/epoch, observed clock and token consumption atomically.
7. Return committed only after durable commit. An error/timeout after submission may mean it committed; do not infer rollback from a missing acknowledgment.

The wrapper's acknowledgment checks rely on the port being authenticated and truthful. This contract does not itself verify a network signature, create database grants or establish remote durability. Mapping these operations into the existing signed independent-authority protocol is still required before real activation.

## Disposable SQLite rehearsal

`tools/operations/local_cvi_transaction.py` uses new owner-only temporary folders/databases, SQLite DELETE journals, synchronous=FULL, BEGIN IMMEDIATE and nonblocking lock contention. Existing databases open with mode=rw; missing state is not recreated. Explicit fixture bootstrap refuses a nonempty directory.

While the transaction lock is held, a fresh Node process executes the actual TypeScript domain validator against the just-read snapshot and trusted fixture actor/clock. It computes the new state inside the transaction. There is no generic replacement/update API in the bridge. Reads and writes validate schema, policy/head consistency and monotonic observed time. State, head and consumed projection commit together.

Projection tokens are random synthetic capabilities bound to a digest of the trusted actor. Issued/used projection records persist across processes, with a lifetime fixture cap of 128 and a 1,000-time-unit lease capped by policy expiry. Used and expired records are not pruned/refunded. These fixture limits are not production retention or spending decisions.

A deliberately refused semantic/conflict attempt consumes its known token and leaves history unchanged. Malformed metadata or a different principal cannot consume another actor's token. Fixture inspection returns metadata for tests only and is not a public application operation.

## Crash and refusal semantics

- Before COMMIT: SQLite recovery preserves the old whole domain state. The already issued projection record remains. Uncommitted token consumption rolls back too, so the server row may still be issued. The wrapper has consumed its local capability and remains held; it does not retry.
- After COMMIT, before acknowledgment: the entire new state and used token survive. The caller reports no success and stays held. It never releases speech on an unknown result.
- A missing/corrupt/shared database, invalid policy, stale generation, bad clock or lock conflict refuses work. No bootstrap, rebase, automatic resend, new allowance or history reset follows.
- This store does not make irreversible provider calls. No external work is allowed before durable reservation acknowledgment. Consumption is permission bookkeeping, not evidence of playback, provider cleanup or final billing.

## Evidence

54 new foundation tests comprise 33 wrapper-contract cases, 17 SQLite/fresh-process cases and four endpoint compositions. They cover exact schemas/acknowledgments, one-use/cross-client capabilities, role and policy binding, clock/expiry, immutable snapshots, competing writes, stale projections, missing/corrupt/private-file checks, strict numeric types, unknown commits, refusal of raw replacement history, bootstrap refusal and database rollback boundaries.

Fresh processes exercise actual SQLite crash recovery before/after commit. Endpoint compositions verify durable reservation before drafting and durable consumption before byte handoff. Lost acknowledgment, credential retirement on another connection and database disappearance prevent text delivery. A test-helper response-field mismatch was corrected; strict production-side field refusal stayed intact.

All 1,739 foundation tests across 147 files pass with two workers; 331 operations tests with ResourceWarning as error, type checking/build, four encryption checks and 16 local Memory checks pass. The first fully parallel run passed 1,738/1,739 tests and failed one existing HTTP-disconnect timing check. All 12 tests in that file passed isolated, then the complete suite passed with --maxWorkers=2. The original timing failure is recorded; its cause was not established and no fix to that unrelated source/test is claimed.

The SQLite backend and pure validator are reached only through test bridges. No application entry point imports this persistence adapter or opens the fixture database. No real account, key, URL, voice, photo or provider is used. The older isolated hosted-schema restore checkpoint and physical-device checks were not rerun.

## Unresolved production requirements

- SQLite durability/locking in this fixture does not prove hosted database failover, power-loss behavior, independent administration or rollback resistance. Restoring the whole database can restore old history. A preserved domain epoch floor detects tested history rollback; losing/restoring the floor too permits it again.
- The domain epoch does not cover every projection-row-only mutation. Independent preservation must cover the whole authority and token bookkeeping, not only the domain head. No generic SQLite backup is accepted as that independent authority.
- Trusted actor/clock and Node validator path are fixture configuration, never HTTP fields. Real mutually authenticated transport, least-privilege table/function grants, authoritative clock agreement and secure service-only projection delivery remain unimplemented.
- The backend must enforce validated operations with no direct runtime table-replacement, deletion, role upgrade, cap/expiry change or authority restore privileges. Tests do not establish actual role isolation.
- Cancellation cannot undo an already submitted commit. A fresh diagnostic read is not proof of the old operation's ownership or permission to retry/refund. Reconciliation remains evidence-controlled and unimplemented.
- Credential startup/independent signing/floors, current styling notes, final handoff races and Tavus request/voice/playback compatibility remain separate integration gates.
- The permanent experiment spending ledger is untouched. Projection/transaction counters do not authorize a paid attempt or increase the $51 allocation.

Product/design requirements, approved hosting, provider exclusions and task completion counts are unchanged. No hosted settings, private credentials, permanent backup runtime/ledger or scheduler changed. Local Memory only is refreshed; GitHub and hosted Memory publication remain off.

## Exact next action

Review a concrete disabled hosted-adapter proposal for transaction procedures, actor/grant mapping, signed acknowledgment transport and independently protected floors/token history within approved hosting/spending. Identify any required security/financial/privacy decisions before real credentials, hosted changes or a provider trial. Do not mount the disposable SQLite bridge as an application service.
