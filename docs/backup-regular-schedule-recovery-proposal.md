# One regular scheduled recovery check

Status: prepared locally; not armed or activated. A new operator decision is required by the accepted stop-on-failure policy. The previous one-use start marker remains consumed.

## Observed outcome

The previous forced native start did not acknowledge within 15 seconds. Its uncertainty hold was restored. macOS subsequently ran that same delayed start and exited at the hold: three native executions, latest exit one. The financial ledger still has two old attempts, none active, and no new backup receipt. This proves the delayed start settled at the local hold; it does not prove a new backup or explain the entire native delay.

The installed repair remains source 28ef0fd. Read-only checks verify its manifest, the existing scheduled descriptor, settled native state, local Docker daemon and cached pinned image. No new approval record, hold removal, provider request or process start occurred during preparation.

## Proposed action

1. Record the owner's explicit decision in a fresh owner-only approval, including the exact current hold hash, financial baseline, native execution count and installed repair source. Approval is valid for two hours to arm this step, while the original budget expiry still governs all runs.
2. Recheck the unchanged installed source and descriptor, settled native state, local prerequisites, current hold and financial baseline. Any mismatch refuses before arming.
3. Write an exclusive owner-only consumption marker and flush it before touching the hold. Keep the previous start marker and all financial history.
4. Archive the current hold intact. A crash after consumption retains the marker; an incomplete archive restores a fixed uncertainty hold. Do not retry a consumed authorization.
5. Let the existing regular scheduled check perform the bounded job. Do not call kickstart, reload launchd, change intervals, install code into the permanent runtime, or start a separate process. Scheduling may be delayed; arming is not proof of execution.
6. Observe the new financial attempt and limited-scope receipt. Only an authenticated readback/verified recovery-point receipt and successful monitoring acknowledgment count as success. A native exit or uploaded object alone does not.
7. A verified success permits the previously approved normal schedule. Any failure or uncertainty holds again, with no further retry. No failed reservation is refunded or removed.

## Limits

Existing cumulative free-budget caps and original policy expiry apply unchanged. This permits one new recovery attempt, then the earlier schedule only following verified success. It adds no spending, service, upgrade, credential transfer, customer/photo scope, hosted permission change or general retry authority. Full customer/photo restoration and the recovery targets remain unaccepted.

## Implementation and evidence

`tools/operations/scheduled_backup_rearm.py` is an operator-only helper in the source checkout. Its only apply mode requires the fresh private approval. It never reads provider credentials or writes the financial ledger. It is not installed into the permanent runtime.

Thirteen new synthetic tests and 42 existing affected operations tests pass: **55 total**, original session 61547, exit zero. Cases cover absent/expired/wrong-scope approval, strict attempt limits, settled native state, daemon failure, budget changes during preflight, replay, crashes before and after archival, owner-only records and descriptor verification. No actual rearm or backup occurred. Evidence is retained in source-checkpoints/scheduled-backup-rearm-prepared-20261018.json and its adjacent log.

If approved, re-read all actual state before creating the fresh approval record, run this helper once, preserve the resulting marker/history, and observe the existing job. If approval is absent or refused, leave the current hold untouched and continue independent authorized work.

The complete local operations regression also passes: **587 checks**, original session 28582, exit zero, 18.102 seconds. The CI workflow now declares a credential-free operations unit job; its new regression test failed against the previous workflow and passes after correction. Hosted CI execution of that new job is still pending.

The initial operations CI job exposed a desktop-only Node-path assumption in the separate synthetic package rehearsal. That helper now uses the installed CI runtime when the desktop cache is absent. Four added cases include an actual fallback encryption round-trip. The final complete local suite passes **591 checks** (5638, exit zero), with 98 source/test hashes verified. Corrected CI execution is still pending; the earlier failure remains evidence. This does not change the rearm helper or the permanent runtime.
