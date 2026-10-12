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
