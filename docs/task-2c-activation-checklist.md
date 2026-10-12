# Task 2c activation checklist

Status: preparation only. This checklist authorizes no provider setup, hosted migration, email, sign-in or paid call.

## Current boundary

The account preview uses sample adapters. Prepared password, recovery, sign-out and refresh HTTP factories are not registered as routes. Verified tokens and generated keys in tests establish local contracts, not live Supabase configuration. Local Task 2b and Task 2c exceptions do not waive the Phase 1 exit or hosted acceptance gates.

## Ready local follow-up

| Work | Required evidence |
| --- | --- |
| Reset screen review | Accepted: Sabine confirmed all seven steps worked/readable. Retain this result separately from the earlier eight-step account review |
| Session adoption | Define the trusted adapter's ownership transfer, failed response delivery and cleanup contract before attaching a real provider; prove cancellation and partial adoption with simulated storage |
| Refresh persistence | Choose a server-held representation bound to signed owner/session. Never put refresh material in browser JSON, logs, project memory or public Git. Prove rotation fencing, rollback/uncertainty holds and restart handling locally before hosted use |
| Account route composition | Install only into an isolated test server with explicit simulated adapters first; verify actual HTTP origin, cookie and response-disconnect behavior. Current Request/Response tests are not that evidence |
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
