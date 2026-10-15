# Local independent CVI history authority contract

Status: local preparation and simulated tests, approved by Sabine on 15 October 2026. No external authority, account, credential provisioning, provider call, hosted change or spending is activated. This contract is a technical experiment, not an approved production architecture or complete Tavus integration.

## Purpose and trust boundary

The previous rollback witness model depended on a current authority that ordinary application-file rollback could not reset. This candidate defines how a client can authenticate a fresh authority reply and submit a conditional update. It does not establish that such an independent service is deployed, eligible or protected.

`apps/foundation/src/server/local-cvi-history-authority.ts` has no transport implementation, listener, SDK, environment access or file persistence. Only tests import it. Its injected port represents an authenticated, independently operated authority. Test fixtures generate ephemeral Ed25519 key pairs in memory, never save or publish signer material, and implement a synthetic linearizable head store. The role restriction is a fixture flag, not real account/privilege enforcement.

## Pinned configuration

A trusted configuration supplies authority ID, journal/store ID, journal kind (replay or credentials), key ID and Ed25519 public key. Unknown keys are not discovered from a reply or accepted through trust-on-first-use. Caller configuration is captured immutably. Real key provisioning/rotation and protection of these pins require separate secure operational configuration; none is performed here.

The independently preserved current epoch/floor and relevant journal digest must be available across restart. A signing key alone does not preserve those values. Admission callers must compare their exact local journal bytes with a fresh head, rather than accepting whichever old head a rolled-back application supplies.

## Wire requests

All requests contain only bounded metadata:

| Field | Meaning |
| --- | --- |
| version | Fixed contract version 1 |
| action | read or advance |
| authorityId, storeId, kind | Exact pinned authority and journal scope |
| challenge | Fresh 32-byte random challenge encoded as hex |
| issuedAt, expiresAt | Server-observed local request deadline |
| minimumEpoch | Independently preserved lower bound |
| expectedEpoch, expectedHead | Advance only: exact previously read head |
| nextHead | Advance only: proposed journal SHA-256 digest |

No bearer credential, account email, raw request ID, styling note, audio, photo, body or private key is included. Local test identifiers and the 128-issued-capability bound are fixture resource limits, not a production metadata-retention or financial policy.

## Signed responses

The response envelope has exactly body and signature. The body binds version, authority ID, store ID, kind, pinned key ID, challenge, SHA-256 of the complete canonical request, epoch, head, state and result. Ed25519 signatures use sorted-key canonical JSON over these flat scalar fields and a fixed-length hex encoding.

A read succeeds only with a valid signature, exact challenge/request/scope binding, active state and read result. An advance succeeds only with applied result, exact next epoch (previous plus one) and requested target digest. Client-observed epoch rollback and same-epoch conflicting heads are refused. A separately supplied exact expected local digest must match before admission. A fresh challenge rejects replay of previously signed envelopes; it does not prove that a dishonest authority is reading linearizable storage.

## Client lifecycle and update rules

1. Obtain a fresh authenticated head against the preserved minimum epoch and local digest.
2. Retain a short-lived immutable read capability owned by that client. Clones, forged values, expired capabilities and capabilities from another client cannot authorize its update method.
3. Consume that capability before issuing an advance. The authority must atomically compare both expected epoch and head, then commit the next head and epoch before acknowledging.
4. Competing writers cannot both replace the same head. A stale/conflicting or read-only fixture update is refused.
5. Apply the corresponding local journal change only after an exact committed authority acknowledgment, following the previous conservative witness-first ordering.
6. Before text release, read fresh authority again and compare current history, notes and cancellation state.

Only one exchange per client runs at a time. There is no automatic retry, bootstrap, refund, history pruning, key discovery or outage fallback. A transport error, malformed/mismatched/unsigned reply, unavailable/held authority, conflict, bad clock, timeout or lost acknowledgment leaves that client held. Concurrent invalid input cannot permit an already pending read to return authority after the hold.

If an update commits but its acknowledgment is lost, the client reports no success and does not retry. A separately created client can inspect a fresh current head for diagnosis. That read does not reconcile the old attempt, refund spending, reconstruct a missing journal or prove which worker performed an identical target transition. Recovery remains a separate evidence-controlled operation.

## Required backend and operating controls

These are requirements for any future real adapter, not proven capabilities of a selected service:

- Current-head reads and compare-and-swap must be linearizable and durable across crash/failover, with documented restore behavior.
- Ordinary app operators/runtime credentials must not delete, truncate, roll back, replace identities, lower epochs, rotate signer pins or restore old authority backups. Authority administration and recovery require a separate trusted control boundary.
- Read-only identity must not write. Writer identities must be limited to the correct journal/operation, with no generic administrative capabilities. Actual authenticated roles are required; a claimed role string is insufficient.
- For malicious-writer protection, the authority must validate domain transitions (reservation append, consumption, generation retirement and nondecreasing limits/counters). Opaque digest CAS by itself cannot validate those semantics.
- Pinned identities, signer-key lifecycle, independently preserved floors and authority recovery must remain valid if the application Mac and all its files are lost/restored. A second folder under the same account does not meet this requirement.
- Fresh signed replies must be produced only after authoritative reads/commits, not by a blind signing proxy or stale cache. Request challenges must not be reused as retry authorization.
- Unavailable state holds admission. Witness-ahead/local-write-failed recovery requires independently verified evidence; no automatic rebase is permitted.
- Metadata retention, access review, incident response and the financial/hosting fit need review before activation. This local contract approves none of those policies or charges.

## Test evidence

52 new foundation cases include 46 client/protocol cases and six endpoint compositions. They cover signature/key/scope substitution, replayed envelopes, stale epochs/forks, read capabilities, immutable metadata, competing compare-and-swap, read-only/held fixture roles, clock/deadline/cap bounds, missing authority, committed-but-lost acknowledgments, forged final replies and stale-history refusal before draft/delivery. Review fixed a pending-read hold race and overflowing deadline arithmetic, with regression tests.

All 1,626 foundation tests across 142 files, 331 operations tests with ResourceWarning as error, type checking/build, four encryption checks and 16 local Memory checks pass. The older isolated hosted-schema restore checkpoint and physical-device checks were not rerun.

The endpoint compositions use signed protocol exchanges and synthetic reserve/spend transitions. They do not implement a production disk/network adapter. Earlier real-process file-journal and witness tests remain separate evidence.

Two explicit negative cases remain:

- Resetting authority state and giving a fresh client a rolled-back floor allows old signed history again. Independent preservation is an assumption to fulfill operationally, not something Ed25519 solves.
- An authorized generic digest writer can advance to a new epoch containing an old semantic head. Valid signatures and increasing epoch do not prevent count/history erasure by a malicious authorized writer. Domain transition validation and restricted privileges are required.

No actual remote cancellation, provider finality, downstream playback flush, original heard-audio offset, production authentication or full-CVI latency/compatibility is established. Existing Tavus/private-test gates, ElevenLabs exclusion, $51 allocation and held experiment records are unchanged. Product/design requirements and task completion counts are unchanged; local Memory is updated without publishing GitHub or the hosted Memory site.

## Exact next action

Specify and simulate allowed domain transitions and least-privilege operations for replay and credential history, then map them to a proposed independently protected backend under the existing hosting/spending approvals. Any real adapter, credential operation, hosted setting or paid Tavus trial must pass its existing authorization gates before activation. Do not describe this signed contract as a deployed independent authority.
