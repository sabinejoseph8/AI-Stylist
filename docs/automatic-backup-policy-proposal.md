# Proposed automatic-backup budget

Status: budget design approved by Sabine on 15 October 2026; sole-use account confirmed. One private allowance is initialized. Initial empty-source database scheduling is active after separate scope approval and backup checks. Full customer/photo recovery remains unaccepted.

## Why a decision is needed

The current transport requires fresh dashboard usage within five minutes. An unattended Mac runner cannot satisfy that requirement with the restricted account interface established so far. The proposed alternative changes financial admission, so it needs Sabine's approval before use. It does not remove the existing guard or authorize spending.

## Proposed limits

| Control | Proposed bound |
|---|---|
| Run frequency | At most one attempt every 12 hours, including failures |
| Run duration of policy | At most 30 days, or earlier key expiry |
| Encrypted archive | At most 4 MiB per attempt |
| Verification download | Reserve the same 4 MiB per attempt |
| Provider requests | Reserve four against both Class B and C per attempt |
| Stored bytes | Cumulative upper bound below 9 GB |
| Downloaded bytes | Cumulative upper bound below 900 MB |
| Requests | Cumulative upper bound below 2,000 in each class |
| Supabase source exports | Reserve 33 MiB plus 8 KiB per attempt; cumulative ceiling 2 GB of existing included egress |

Counters start from one fresh known usage anchor plus retained reservations and conservative margins. They never reset at midnight, decline after object expiry or refund failed attempts. All budgets are conservative lifetime totals for this bounded policy period, not daily replenishing allowances. No automatic renewal, retries, upgrade, extra provider or new spending is authorized. The earliest exhausted limit stops new work and requires review.

## Preconditions

- Sabine confirms B2 is used only for this backup job, without other clients or writers.
- Sabine approves this change to financial admission.
- Fresh initial account caps, no-payment/free-account status, current usage and retained local history are checked; unknown values block creation.
- Current Supabase included-egress headroom supports the whole reserved source budget without new spending.
- Existing provider account caps stay unchanged. Dashboard/API/other account activity is outside the local runner's enforcement and the service caps remain a second layer; this is not an absolute billing guarantee.
- Source byte, archive byte and four-request bounds must be enforced by the composed runner. The prepared admission helper does not itself enforce a callback's network behavior.
- The permanent runtime, credential permissions, independent recovery-key custody, complete source/restore acceptance, deletion/financial reconciliation and alert path pass their applicable checks before any scheduler is activated.

## Failure behavior

A whole attempt is reserved before its callback. Failed attempts retain all reservations. An unresolved interrupted attempt blocks later work, even after the next scheduled time; it cannot expire into a retry. Clock reversal, expired policy, unexpected/shared/missing state or exhausted limits stop before the callback. A callback-completed record is not a declaration of successful backup or authorization for a monitoring success signal.

## Current evidence

Nine synthetic policy cases pass; the operations suite is 148 tests. No real cumulative policy database, scheduler, new transfer, account setting or provider call was created by this preparation. The existing fresh-usage transport and all historical ledgers remain unchanged.
