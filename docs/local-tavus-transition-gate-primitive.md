## Prepared signed-proof follow-up, 16 October 2026

The current primitive requires one explicit `prepare_finish()` before `finish()`; it no longer creates an implicit nonce while finishing. Original gate inspection remains available between those steps. Signed inspection retention and an actual signed process-verifier boundary are prepared in docs/local-tavus-prepared-finish-proof.md. Original adoption, mandatory protected publication and production Node integration remain open. Verification below preserves the earlier marker checkpoint.

# Local original transition-gate primitive

This is disabled lower-layer preparation. It creates no listener, account grant, provider call, spending, hosted change or production permission. The protected startup/HTTP candidate is not yet connected to this primitive.

## Lock and intent evidence

The context acquires replay, then its configured witness. It does not hold SQLite while asking another process to perform the native transaction. Before yielding to its caller, it durably creates an owner-only marker bound to the captured full original plan ID/digest, expected and target native metadata, replay scope, expiry and complete immutable replay-record digest. Native tokens stay out of the marker.

Ordinary replay mutation, inspection and witness bootstrap reject a retained marker. Only the original live handle can inspect under its already-held lock. Its description or a copied Python object cannot recreate that identity. Inspections preserve rows, capacity and expiry, may advance the durable clock, grant no write/resume permission and never reuse a challenge. Their local budget is bounded at 64, without resetting a journal allowance.

## Configured witness and interrupted updates

The witness head includes both the journal and marker, with a distinct hash domain. Advance the witness before creating or removing the local marker and before changing the observed replay clock. A split result stays held rather than rebasing or resetting the witness.

With the preserved pin, restoring only the replay folder cannot silently remove an unfinished marker. Independence of that witness is assumed in this disposable model, not established by keeping a second local folder. Unpinned restoration and coordinated privileged restoration remain negative boundaries.

## Original completion

The original handle prepares a one-use nonce first, then calls its captured proof source at finish with that same prepared record. Finish without preparation and duplicate preparation hold the handle. A separate mandatory configured verifier receives copies of the original descriptor, plan and evidence. Its result must match the exact operation, target and challenge; a boolean, altered result or missing verifier cannot release the gate. Check monotonic time, original marker and complete replay state around callbacks. Concurrent/reentrant calls refuse before starting another proof. Hold during a pending proof prevents late completion.

Known verified completion advances the configured witness, removes the marker and syncs the directory. Unknown removal/sync outcomes hold the original handle even when the marker is already absent. No missing file or stored description reconstructs its finish permission. A process bridge must exit the context and release the lock before emitting a successful finish acknowledgment.

## Earlier verified marker checkpoint

- 35 new operations cases cover original/copy identities, read-only inspection, clocks, capacity, cancellation, concurrent finish, malformed proof results, partial writes, witness splits and one-sided restore.
- Separate processes compete for the real file lock. Killing a holder releases the OS lock while leaving its marker. Native SQLite renewal commits while the replay/witness gate is held; the old native token cannot subsequently reserve replay.
- A process lost after native COMMIT leaves a marker and does not reapply the transaction. Actual native changes before finish are detected by the configured structural proof port.
- All 559 operations tests pass with ResourceWarning as error. The six affected replay/witness foundation suites pass 116 checks; 19 local Memory checks pass.

The new proof ports use fake crypto explicitly. The prior 2,447-test full foundation result at d60b850 predates this change and was not rerun. TypeScript/client source and SQL contracts are unchanged; their prior build/type/PostgreSQL results are historical, not fresh results for this primitive.

## Measured integration budget

The complete synthetic two-turn HTTP exchange across renewal was rerun successfully after this change. It uses 127 of the authority journal's fixed 128 request records. This was a temporary measurement on the existing full exchange; its source was restored afterward.

A new independent signed finish-read round would exceed that budget. Prepare the original finish nonce before the final signed inspection, preserve that exact gate-bound proof privately across consumed/adopted handoff processing, and verify the original proof at finish within its unchanged deadline. A separate prepare-nonce phase lets gate-aware replay inspection continue before final completion; blocking the child waiting for finish proof must not force a reentrant inspection deadlock. Do not cache unrelated observations, accept a summary boolean, omit existing before/after checks, reset records or enlarge the cap. This ordering still needs implementation and tests.

## Required integration before publication

1. Add a private Node IPC port with original object identity, strict bounded frames and hard supervision capped by the unchanged eight-second operation/native/application limits. Backend clock checks alone do not terminate a stalled caller.
2. Verify pinned signed full native state and authority completion through the existing original transaction/receipt contract. A callback returning the structural result shape is not proof of authentication or private adoption.
3. Carry the gate from before authority advance through native COMMIT, reconciliation and original consumed/adopted startup or renewal handoff. Gate-aware inspection must use that original handle, with no raw-file fallback.
4. Require successful context exit/finish acknowledgment before branding the protected HTTP owner or releasing renewed output. Lost replies remain held without retries or financial refunds.
5. Require every participating writer to use the shared gate. An actual negative test demonstrates that an unfenced native writer can change state after the configured verifier returns, while this primitive alone still reports finish. Its receipt is not publication permission.
6. Retain immediate temporary-note Clear/End while keeping durable markers, replay and spending evidence. Finish the complete conversation/HTTP tests across adoption, cancellation and crashes before claiming integration acceptance.

No phase or production criterion closes. Independent administration/restore floors, universal writer coverage, production clocks and actual provider/device acceptance remain open.
