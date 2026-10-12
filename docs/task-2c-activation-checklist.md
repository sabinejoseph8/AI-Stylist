# Task 2c activation checklist

Status: preparation only. This checklist authorizes no provider setup, hosted migration, email, sign-in or paid call.

## Current boundary

The account preview uses sample adapters. Prepared password, recovery, sign-out and refresh HTTP factories are not registered as routes. Verified tokens and generated keys in tests establish local contracts, not live Supabase configuration. Local Task 2b and Task 2c exceptions do not waive the Phase 1 exit or hosted acceptance gates.

## Ready local follow-up

| Work | Required evidence |
| --- | --- |
| Reset screen review | Accepted: Sabine confirmed all seven steps worked/readable. Retain this result separately from the earlier eight-step account review |
| Session adoption | Local evidence: shared adoption/discard lifecycle and actual loopback disconnect cleanup pass with simulated provider/storage. Real provider revocation evidence remains required |
| Refresh persistence | Local evidence: AES-256-GCM encrypted ownership bound to owner/session/generation/expiry, service-only SQL fencing, uncertainty and database restart checks pass. Actual hosted schema, private key provisioning and provider rotation still need acceptance |
| Account route composition | Local evidence: isolated loopback HTTP verifies password and stored-refresh delivery, origin/Host refusal and disconnect cleanup with synthetic adapters. Target HTTPS, proxy configuration and hosted providers remain unverified |
| Regression review | Run the full foundation suite, type checking and build after composition; keep phase-wide review open until the actual phase scope is ready |

## Requires a hosted/account activation decision

1. Confirm Phase 1 exit or an explicit sequencing exception before changing the live Supabase account configuration or applying prepared customer migrations.
2. Identify the correct Supabase project and record public identifiers only. Keep secret credentials in private server configuration.
3. Inspect actual signing keys, Auth session schema and current-session lookup permissions. Rehearsed synthetic Auth schemas do not prove the hosted schema.
4. Verify exact application origin and callback allowlists. Reject wildcard or caller-selected redirects. Validate cookie behavior over HTTPS on the target browser.
5. Configure email/password confirmation, recovery sender and approved templates. Verify sender/DNS, recovery delivery, bounce behavior, abuse limits and non-enumerating public replies with synthetic accounts.
6. Obtain Google and Apple credentials through the account owner. Record credential owner, expiry and renewal procedure without recording secret values. Verify both successful and canceled callbacks.
7. Inspect actual identity-linking defaults and test duplicate/unverified identities without merging customer records. Any customer-facing linking policy needs Sabine's business decision.
8. Resolve same-browser versus cross-device recovery before promising either. The local recovery flow currently requires its bound browser transaction; a generic emailed URL alone is not accepted recovery authority.
9. Verify real refresh rotation, exact session revocation, old-token denial, failed delivery cleanup, concurrent requests and server restart recovery. A closed browser or cleared cookie does not prove remote revocation.
10. Complete the Phase 2 manual checks and phase review before checking Task 2c or Phase 2 complete. Keep spending/provider-attempt limits intact.

## Evidence recording

For each live check, record the deployed commit, environment, timestamp, synthetic scenario, expected/observed outcome and cleanup result. Record failures and unresolved remote cleanup explicitly. Exclude tokens, passwords, email addresses, recordings and private account IDs from public artifacts. Reference private evidence by a sanitized label when necessary.

## Pending customer decisions

- Whether hosted Task 2b/2c may begin before Phase 1 finishes.
- Recovery behavior across devices and after server restart.
- Any explicit account-linking or recovery policy that changes approved customer behavior.

Routine local engineering continues independently. This checklist is not a request to supply credentials in chat.


Refresh encryption preparation now has an AES-256-GCM codec tested with fixture data. Activation also requires approved private key provisioning, a bounded rotation/retirement procedure, durable service-only storage, generation fencing and reconciliation. Never commit a production encryption key or refresh envelope containing real account data.


Migration 17 now rehearses service-only ownership and generation/lease fencing with synthetic PostgreSQL records, including a real restart. It is local preparation only. Codec/RPC/application integration and actual hosted Auth remain unverified.


## Supabase provider contract audit, 11 October 2026

Reviewed official refresh, session and sign-out documentation against the prepared account lifecycle; findings and primary links are in docs/task-2c-provider-contract-audit.md. Failed-delivery cleanup must target the exact current session explicitly, since a default sign-out scope can affect other devices. Signature validity alone is not remote session authority. Provider refresh reuse exceptions do not authorize blind retries. Local envelope expiry is not provider refresh expiry, and valid-JWT requirements leave expired/ambiguous cleanup authority as an unresolved adapter case.

No runtime change or new provider test occurred in this audit. The last verified foundation run remains 394 tests across 46 files with type checking/build passing; no new run is claimed. No hosted configuration, real credential, paid call or customer session was used. Task 2c and phase acceptance remain open.

Exact next action: prepare a disconnected, explicitly injected provider adapter with isolated operation state, explicit refresh input and local-session cleanup scope; use simulated responses to test malformed data, cancellation and uncertain revocation. Audit exact pinned SDK error semantics before any live enablement. Do not promise seamless refresh after access expiry or change customer session lifetime without an agreed contract.


## Provider HTTP, bridge and database composition, 11 October 2026

Extended the isolated PostgreSQL rehearsal through the actual provider HTTP operations, provider bridge, encryption/store, staged rotation, verified-session lifecycle and HTTP Request/Response factory. Provider fetch is injected synthetic HTTP, so no remote provider was contacted. Four scenarios pass: verified adoption; committed rotation with lost acknowledgment and confirmed synthetic cleanup; malformed provider response retaining a rotating claim; refused logout retaining storage and setting the account coordinator's cleanup hold. Exact provider request counts confirm no automatic retries. Synthetic teardown confirmations dispose fixture records only and are not remote revocation evidence.

All 402 foundation tests across 48 files, type checking and build pass. The full isolated SQL/composition rehearsal passes, and Docker inspection finds no rehearsal containers or volumes remaining. No hosted configuration, real credential or paid activity was used.

Known gap found by this composition: refused cleanup after adoption retains a ready database record while the cleanup hold is process-local. Another server process could attempt refresh. Before activation, quarantine the matching durable ownership generation without deleting it or rotating a provider credential. Cancellation, stale generations and unknown quarantine acknowledgments must stay conservative. This is an implementation gap, not an approved production behavior.

Exact next action: implement fenced durable quarantine for failed adopted-session cleanup and prove refusal persists across database restart and replacement coordinator. Then consolidate private Memory beyond its 387-test checkpoint. Task 2c and all live/phase acceptance gates remain incomplete.


## Durable adopted-session cleanup quarantine, 11 October 2026

Fixed the ready-record gap found in the combined rehearsal. Discard now inspects adopted ownership, claims its exact next generation and requests a durable hold before calling remote revocation. The claim itself blocks competing refresh if the hold acknowledgment is lost. Cleanup records its quarantine lease and removes only its matching generation/lease after confirmed revocation. Provider refusal leaves the credential stored and held; no provider rotation occurs during quarantine. A refused/stale claim never authorizes removal of a different generation. No new SQL migration or hosted change is needed; this reuses existing fenced claim/hold operations.

All 402 foundation tests across 48 files, type checking and build pass. Updated simulated lifecycle/loopback fixtures exercise the extra quarantine operations. The actual isolated PostgreSQL pipeline confirms refused provider cleanup leaves generation 2 held, then restarts the database and constructs a replacement store: the hold remains and claiming generation 2 is refused. Other SQL/composition scenarios pass. Disposable database containers/volumes were removed and verified absent. Provider calls remain synthetic.

Limits: if database inspection or claiming cannot be confirmed before remote cleanup, durable quarantine is not proven; process-local uncertainty remains and production reconciliation still needs explicit handling. The restart result proves the confirmed quarantine path, not every outage path. Task 2c and live/phase acceptance remain open.

Exact next action: test lost quarantine acknowledgments, stale competing generations and database failure during cleanup, then document the remaining reconciliation contract. Consolidate private Memory with the resulting evidence beyond its 387-test publication. No real provider, hosted activation or paid activity is authorized by this local fix.


## Cleanup uncertainty and competing-generation evidence, 11 October 2026

Extended the actual isolated PostgreSQL pipeline with lost quarantine-claim and lost hold acknowledgments. A committed claim with lost acknowledgment remains rotating; a committed hold with lost acknowledgment remains held. In both cases refused provider cleanup retains storage, an actual database restart preserves the state, and a replacement store cannot claim that generation. Synthetic provider request counts confirm no retries. Fixture teardown removes records using explicit synthetic confirmation only; it does not resolve a real remote session.

All 404 foundation tests across 48 files, type checking and build pass. Two new focused tests confirm unavailable inspection never removes ownership and a newer competing generation is neither quarantined nor deleted. The complete SQL/composition rehearsal passes. Disposable containers and volumes are verified absent. No real provider, hosted configuration or paid call was used.

Known outage behavior: an inspection exception exits cleanup before provider revocation is attempted. This avoids an unsupported cleanup success claim but can leave remote state active and the record ready. The current local hold is not a durable reconciliation plan for a database outage. Keep activation blocked on this failure path; do not describe all uncertain cleanup as durably quarantined.

Exact next action: improve cleanup to attempt bounded remote revocation even when quarantine inspection fails, while reporting uncertainty and retaining ownership unless scope and revocation are confirmed. Test that failure path and cancellation explicitly. Then consolidate private Memory, whose last publication is the 387-test checkpoint. Task 2c and phase gates remain incomplete.


## Cleanup outage revocation attempt and cancellation, 11 October 2026

Fixed quarantine inspection/claim/hold exceptions suppressing remote cleanup: quarantine now has its own guarded block, so an uncanceled cleanup still attempts the bounded provider revocation. Failed final inspection/removal remains false. Already canceled cleanup starts no storage or provider work; cancellation during revocation prevents removal even if a late adapter returns true. Cleanup remains deduplicated, and no automatic retry is added.

All 406 foundation tests across 48 files, type checking and build pass. Updated outage test confirms one revocation attempt despite inspection exceptions and no unsupported removal. Two new tests cover pre-canceled cleanup and cancellation during revocation. The complete isolated PostgreSQL/provider composition, lost-acknowledgment and restart scenarios still pass. Disposable containers/volumes were verified absent. All provider responses remain synthetic; no hosted change, real credential or paid call occurred.

Remaining limit: simultaneous database unavailability and unconfirmed provider revocation cannot establish durable quarantine or remote termination. This fix attempts revocation but does not resolve that distributed failure. Cleanup remains unconfirmed, account adoption stays unavailable in that coordinator, and live activation still requires a durable reconciliation mechanism and its failure evidence. Do not claim outage recovery complete.

Exact next action: consolidate private Memory with the 406-test checkpoint and recorded remaining distributed-cleanup risk, then prepare a disconnected trusted reconciliation path with explicit scope and evidence, without silently retrying rotation or resetting uncertain ownership. Task 2c and phase gates remain open.
