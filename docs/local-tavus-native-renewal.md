# Local native writer renewal

Disabled local preparation only. No provider calls, hosted changes, real credentials, deployment, spending or production duration decision.

## Transaction contract

Renewal is a distinct `renew` intent available only to the configured rotator through the mandatory signed authority adapter. It includes the original live lease, a bounded duration and a new token selected once by the trusted planner. It cannot choose another owner, boot, generation or session cap.

Under the SQLite write lock, the native operation:

1. Verifies the exact active grant, token hash, owner, boot, generation and unexpired interval.
2. Reads the absolute domain expiry from the native session state.
3. Bounds the requested expiry to that cap and at most eight seconds from issue time. The expiry must strictly advance.
4. Selects a different token and checks the original lease again before mutation, rejecting expiry or backward time during work.
5. Atomically replaces the current grant's token hash, issue time and expiry, and advances the observed clock.
6. Validates the new grant before commit.

The owner, boot and generation stay unchanged. The old token immediately stops working, including before its former expiry. The current row is updated; old grant tokens are not retrievable from it. Signed authority operations retain the aggregate transitions and consumed execution claims. This is not an append-only copy of every historical grant row or a financial ledger change.

## Mandatory evidence

The planner captures the exact full baseline and target without committing. A renewal changes the complete aggregate even though the generation and reduced head floor stay equal. The existing adapter requires authenticated advance, one-use execution claim, fresh pending proof, exact SQLite target, reconciliation and a fresh completed read before returning the new capability. Missing or invalid evidence has no direct-write fallback.

A failed or lost acknowledgment can leave renewal committed. It does not restore the old token, refund a claim, return the new token from an observer API or permit replay of the original plan. Read-only recovery can reconcile the durable target without recreating a writer handoff. One-sided restores remain refused against the independently current fixture authority; coordinated restores are still an unresolved boundary.

## Integration limits

This does not renew the composed startup owner, its immutable current-owner pin, the HTTP wrapper or a live Tavus consultation. Those consumers must obtain and adopt an exact authenticated continuation while preventing concurrent old output. They must preserve body/turn replay guards and the application consultation cap, which may be earlier than native domain expiry. No automatic scheduler, retries or longer lifetime is activated.

The PostgreSQL transaction proposal still supports only activation, apply, fence and release. It must refuse renewal before consuming an execution claim. No SQL permission or hosted adapter is expanded by this local operation.

The native unit tests use controlled advancing clocks. Mandatory process composition uses a test-owned fixed transaction clock per operation with fresh signed evidence; it does not prove production deadline mapping while a database transaction awaits remote evidence. Native clock administration, independent restore floors, universal fencing, provider transport and device acceptance remain open.

## Current evidence

Seventy focused foundation cases, 489 operations tests with ResourceWarning as error, TypeScript checking/build and four encryption checks pass. Fourteen native cases cover token rotation, expiry/fencing/replacement, incorrect fields/roles/durations, fixed cap, locked-work time changes and fresh-connection persistence. Signed process tests cover exact aggregate reconciliation, competing plans, replay, lost replies, crashes, one-sided restore and old-endpoint refusal. The disposable PostgreSQL rehearsal passes 556 checks for the existing four-operation contract, with networking disabled. Final regression passes 2,334 foundation tests across 170 files and 16 local Memory checks.

## Next action

Compose authenticated renewal with the current-owner guard using a one-use transition handoff, exact before/after full-state evidence and the original consultation cap. Cancel old prepared output before adopting the new pin, retain replay history, and hold unknown commit/adoption outcomes. Test expiry, concurrent requests, restarts and lost acknowledgments before considering any live activation.
