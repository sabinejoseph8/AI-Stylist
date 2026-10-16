## Later local persistence rehearsal

See docs/local-tavus-transaction-contract.md for one-use service projections, validated atomic commits and disposable SQLite/fresh-process evidence. The SQLite bridge is test-only; real authenticated grants, signed transport, hosted persistence and independent rollback protection remain unimplemented. No production database choice or hosted change follows.

# Local restricted CVI history updates

Sabine approved local preparation/tests on 15 October 2026, with no new spending or hosted changes. This is a disconnected signed in-memory authority and pure transition validator. It is not a hosted service, database migration, production role grant or actual Tavus integration.

## Allowed operations

The earlier generic authority accepted arbitrary digest changes, so an authorized writer could erase semantic history at a higher epoch. The new model recomputes each proposed history from current authoritative state and a strict domain command. It signs applied only when the caller's target digest matches that recomputed state and the expected epoch/head still match.

| Trusted fixture role | Read current head | Reserve request | Consume owned reservation | Retire/activate credential |
| --- | --- | --- | --- | --- |
| Observer | Yes | No | No | No |
| Replay writer for current generation/boot | Yes | Yes | Yes | No |
| Credential rotator | Yes | No | No | Yes |

Roles, principal, store and scope come from a captured service-side connection grant. Incoming commands cannot supply or upgrade them. This role model is not actual authenticated transport or database privilege enforcement.

### reserve

The strict command contains type, requestDigest and receiptDigest. The authority appends a reserved record bound to the current credential generation and trusted opaque principal. Request and receipt digests must be fresh across all generations, the lifetime request cap must have room, and no unresolved reservation may exist. No existing record is deleted or overwritten.

### consume

The strict command contains type, requestDigest and receiptDigest. Exactly one currently reserved row must match both digests, the current generation and the same trusted principal that reserved it. It changes only that row to spent with a nondecreasing timestamp. Repeat consumption, another principal, another credential generation or an incorrect receipt is refused.

Consumption records one-use permission, not actual playback, provider finality, deletion or billing completion. A legitimately authorized writer can consume its own reservation; the separate styling validator is still required before speech. This authority does not independently judge outfit semantics or what the customer heard.

### rotate

The strict command contains type, previous generation, new credential-binding digest and new boot digest. Only the rotator can use it. Previous must equal current generation count; credential/boot digests cannot repeat; the fixed generation cap must have room. Old credential records become inactive and a new record is appended. All replay records, caps, scope and absolute expiry remain unchanged.

A held old-generation reservation is not cleared by rotation. Neither the retired writer nor the replacement credential can consume it, so it remains a conservative hold requiring separately justified reconciliation. No automatic cleanup or reconciliation operation is added.

## State and commit invariants

The aggregate fixture stores immutable identity/scope/expiry/limits, monotonic mutation time and epoch, append-only credential history and append-only request history. The epoch equals the number of credential appends plus request appends/consumptions. Schemas, types, ownership, uniqueness, state transitions, bounds and invariants are rechecked for every proposal.

There are no delete, replace, prune, restore, refund, rebase, limit-change, expiry-extension or generic write operations. Extra fields are refused. A valid-looking command with a reset/stale target digest cannot commit: the server derives the permitted target independently from current state. Mutating a caller's role descriptor or snapshot cannot change the captured authority.

The in-memory model performs compare, validate and commit synchronously before signing. Competing proposals from the same expected head cannot both apply. Lost signing/transport acknowledgment is treated as uncertain by the signed client; committed state remains and no retry/refund follows. Actual crash-safe persistence is not implemented.

The existing signed protocol now carries an optional strict flat domain command on an advance. Canonical request hashing sorts nested command keys so the signature binds the command independently of field insertion order. The old generic fixture remains as a comparison model and retains its negative malicious-writer test; only the restricted model enforces these rules.

## Local endpoint evidence

59 new foundation tests comprise 53 domain/protocol cases and six endpoint compositions. They test unauthorized roles, actor/store/scope substitution, immutable grants, stale credentials, arbitrary resets, target mismatch, stale local projection, principal-specific consumption, lifetime caps, credential reuse, concurrent appends/rotations, malformed commands, clocks, lost acknowledgments and canonical command binding.

Endpoint compositions require signed current-head checks around a restricted reserve and consume. Observer writes, retired credentials, bad receipts, expiry and lost reserve acknowledgments prevent drafting or text handoff while preserving conservative evidence. Signer keys are ephemeral test keys generated in memory, never saved or used by a provider.

All 1,685 foundation tests across 144 files, 331 operations tests with ResourceWarning as error, type checking/build, four encryption checks and 16 local Memory checks pass. The older isolated hosted-schema restore checkpoint and physical-device checks were not rerun.

## Remaining implementation requirements

- The authority snapshot and trusted connect method are fixture inspection/setup APIs, not public routes. Real mutually authenticated identities, least-privilege grants and administrative separation remain to be implemented and proven.
- State is in memory. Independently protected durable storage, preserved floors/pins, atomic transactions, restart/failover behavior and rollback-resistant operational recovery remain unproven. Recreating a local authority from old state is not prevented by these domain rules.
- The aggregate combines credential and replay history under one root for the experiment. This is a local candidate, not a change to the agreed production architecture. The compatibility pin's history-kind namespace does not grant cross-store access.
- Test clients compute proposals from trusted fixture snapshots and a shared synthetic clock. A real service-only projection/read interface and authoritative timestamp contract must be designed before implementing the network adapter. No full snapshots are delivered to a customer browser here.
- Policy limits and metadata fields are synthetic fixture choices, not new production retention/spending decisions. No actual customer principal, credential, note, photo or audio is stored.
- Domain validation does not close the gap after the final authority check, recall buffered media, confirm provider cleanup or prove real Tavus request/voice compatibility.
- The existing permanent experiment spending ledger is separate and untouched. These request/credential rules do not fund or activate a trial.

No hosted changes, provider calls, real account/credential operations, additional spending, permanent backup runtime/ledger or scheduler changes occurred. ElevenLabs remains excluded. The $51 allocation, old held trial records, production requirements and task-completion counts are unchanged. Local Memory is updated only; no GitHub or hosted Memory publication.

## Exact next action

Specify a disabled persistence/transaction adapter contract for these allowed operations, including authenticated role mapping, service-only projection timestamps, immutable policy fields, independently protected floors and conservative failure/reconciliation semantics. Review any proposed real backend against approved hosting and financial limits before credentials, hosted changes or a live trial are activated.
