# Recovery when the backup Mac is lost

Status: local planning and synthetic tests only, 15 October 2026. No hosted changes, new spending, credential transfer, key rotation or scheduler activation are included.

## Decide what failed first

| Failure | Intended response |
|---|---|
| Mac lost; Supabase and B2 still healthy | Recover administration and the backup runner. Do not overwrite the healthy hosted database. Missing runs should generate the existing email alert. |
| Mac and primary database lost | Keep customer access blocked. Recover an authenticated backup and independent current deletion/financial evidence into isolation first. Hosted recovery requires its existing approval and acceptance gates. |
| Independent evidence unavailable or contradictory | Hold recovery and backup scheduling. Never assume no deletions, no reservations or zero usage. |
| All independent copies or their trust anchors lost | Current local tests cannot establish safe recovery. Escalate; do not invent replacement evidence. |

## Required recovery inventory

This is an inventory of requirements, not a claim that every copy already exists.

| Item | Why it is needed | Current evidence or gap |
|---|---|---|
| Access to password manager and account recovery | Recover access without the old Mac | Separate backup encryption-key copy was confirmed by Sabine. Access from a replacement device is unverified. Never place keys in this document. |
| Backup encryption key with matching key ID | Authenticate and decrypt the actual archive | Password-manager copy confirmed; replacement-device retrieval and actual B2 recovery remain unverified. |
| B2 account access, exact object locator/version, encrypted archive and manifest | Find and verify a permitted recovery point | Bounded upload/readback was verified earlier. An independently recoverable inventory of locators is not yet established. Local receipts alone are insufficient after losing the Mac. |
| Current deletion and account-removal evidence | Prevent older photos/accounts reappearing | Local process-restart fixture passes. Independent off-Mac authority and its loss/rollback contract are not established. |
| Complete spending/reservation history and current usage evidence | Preserve holds, quotas and no-retry limits | Durable local budget passes crash/restart tests. Recovery after loss of its sole local copy is unverified. Preserve existing authoritative hosted trial records; never substitute an older database dump. |
| Trusted latest checkpoint for the same project | Reject a validly signed but older evidence copy | Synthetic pinned-checkpoint tests pass. Production authority, authenticated retrieval, latest-state discovery and rollback resistance remain open. |
| Reviewed source commit, runtime manifest, migration/schema versions | Rebuild known software and detect incompatible recovery points | Public source is in GitHub. This does not recover private credentials, archives, receipts or counters. |
| Existing monitoring access and recovery procedure | Detect missed backups and restart reporting honestly | Failure/stalled-run emails were confirmed earlier. Do not send success merely because a new Mac starts. |

Do not copy private inventories or keys into GitHub, the Memory site, screenshots or support messages. A storage account holding archives is not automatically an independent authority for latest deletion or financial state.

## Ordered recovery checklist

1. Record the incident and classify the loss. Preserve existing holds and limits. Do not reset the scheduler, counters or reservation history.
2. Recover account access privately. Any credential rotation, new access, hosted change or extra spending still needs its existing authorization. No such action is performed by this plan.
3. Inventory independently recovered material and determine what is missing. If the hosted database remains healthy, preserve it.
4. Authenticate the permitted archive using the recovered matching key. Check project, source/schema versions, capture time, retention expiry and all member digests. A checksum alone is not authentication.
5. Obtain the independent latest deletion/account and spending evidence for the same project and selected archive/capture time. Verify its trusted sequence/checkpoint and time relationship to the backup. Conflicting, missing or stale evidence holds recovery.
6. Restore only into an isolated environment. Replay later deletions before customer access checks and preserve all reserved/held/completed financial records without refund or new allowance.
7. Verify row isolation, anonymous denial, expired sessions, references, surviving photos, deletion exclusion and financial history. Any failed or unknown result prevents later steps.
8. Record evidence and review the existing hosted-restoration and launch gates. This local plan never enables customer access.
9. Resume backup scheduling only after recovering complete admission history and current financial evidence, verifying the configured scope and expiry, and confirming no old runner can compete. Never turn a missing ledger into a new allowance.

## Local test contract

`local_mac_loss_recovery.py` is a disconnected planning fixture. It requires a matching archive authentication key, signed synthetic evidence, an externally supplied latest checkpoint, a permitted age and ordered isolated checks. It has no provider transport, credential loader, hosted target, scheduler or customer-release action.

A fresh replacement process reads mock backup/evidence/password-manager stores after the temporary old-Mac directory is removed. Tests reject missing copies/keys, altered archives, expiry, older signed evidence, equal-sequence conflicts, wrong projects, future evidence, financial refunds and failed/unknown stages. Retained reservation IDs/states reach the simulated spending stage intact. This fixture uses HMAC for synthetic authentication checks; the real backup remains AES-GCM and is not changed.

These are local simulations, not an actual lost-Mac or hosted restore drill. Passing injected stage callbacks does not prove managed database/Storage operations. A signature does not prove freshness if the supplied authority itself is rolled back. Simultaneous loss of all stores, trust-anchor recovery, machine compromise and power-loss durability remain unverified.

## Test evidence

All 208 operations tests, including 18 Mac-loss admission cases, and four encryption tests pass. The earlier 183-check local database/photo drill remains applicable; this planning change does not alter its implementation.

## Remaining acceptance work

Full Task 8d remains open. Before customer recovery can be accepted, establish the production independent evidence authority and recoverable object inventory, then rehearse the actual managed restore and deletion/financial reconciliation. The approved 24-hour recovery-point and 48-hour restoration targets remain planning targets, not customer promises.
