# Original paired reconciliation: evidence boundaries

Local preparation, 16 October 2026. This map describes the frozen candidate in `/private/tmp/ai-stylist-paired-stage`, patch `prepared-owner-pair-a41c342a3194.patch`. Its full regression is running in original session 79137. It is not merged or activated. Consult DEVELOPMENT_PROGRESS.md for the current result before treating this snapshot as current.

## What must remain true

| Requirement | Source boundary | Evidence and scope |
| --- | --- | --- |
| Capture the original complete previous/target state and command before privileged work | `local-cvi-owner-pair.ts`, `local-cvi-gated-execution.ts` | Existing full-state and producer tests verify captured inputs, complete metadata/projections and refusal before advancement. Pair tests refuse copied/mismatched configuration before planning. |
| Commit the original authenticated transaction and claim before reconciliation | `local-cvi-database-authority-bridge.ts`, concrete SQLite driver | Existing producer tests use actual disposable SQLite transactions. New paired reconciliation cases change transaction/claim observations after actual COMMIT and refuse publication. SQLite correlation markers are not PostgreSQL xids. |
| Compare the complete committed state, including grant and receipt history | `local-cvi-full-state-reconciliation.ts` | Full-state tests reject substitutions even when reduced projections match. The paired grant-history case verifies refusal through the protected startup path after actual COMMIT. |
| Require signed reconciliation and a fresh completed read | `local-cvi-full-state-reconciliation.ts`, `local-cvi-startup-admission.ts` | Existing cancellation, lost-read, signature and concurrency cases preserve durable results and refuse retry. Paired lifetime cases reject stale or late proof without activating credentials. |
| Finish the original held gate before owner publication or renewed output | `local-cvi-checkpoint-credentials.ts`, `local-cvi-startup-owner.ts` | Genuine paired complete journey verifies both original gate contexts finish, preserves notes and replay records, and stays at exactly 127 of 128 authority records. Lower signed-finish fault tests separately verify copies, cancellation and End. |
| Require the original configured admission/replay/checkpoint/credential/clock objects | `local-cvi-owner-pair.ts` | Seventeen pair checks and nine mandatory startup checks cover copies, mismatches, direct admission without a claim, duplicate controllers, credential failure and retirement. Objects are privately paired; generic lower harnesses cannot publish the protected identity. |
| Preserve legitimate same-owner state progress without accepting changed known targets | Read-only captured reference feed | Pair cases use actual native state progression and signed verification, and reject replacement of an already-known target before draft or replay reservation. The feed cannot authorize a write. |
| Preserve permanent and uncertain evidence on failure | Native authority, original gate, replay ledger | Three paired post-COMMIT mismatch cases verify pending authority, actual committed grant, no credentials/output/retry, ordinary inspection refusal under the held gate and byte-for-byte unchanged replay ledger. No automatic repair is implied. |
| Suppress stale output and clear temporary notes on edits, Clear, End or expiry | Notebook/transcript/HTTP composition | Four genuine paired notebook checks and four genuine paired lifetime checks exercise the actual protected entry. Reserved evidence may finish as spent; neither state may be deleted, refunded or made reusable. |

## Final focused results by scope

These results cover distinct files. They are not a single full regression result.

| Suite | Final passing cases | Boundary |
| --- | ---: | --- |
| `cvi-owner-pair.test.ts` | 17 | Genuine paired factory and protected entry |
| `cvi-mandatory-owned-startup.test.ts` | 9 | Genuine paired protected startup |
| `cvi-original-gate-publication.test.ts` | 6 | One genuine paired complete journey; five explicitly unbranded signed-finish fault contracts |
| `cvi-lifetime-integration.test.ts` | 8 | Four genuine paired lifetime cases; four retained unbranded lifetime contracts |
| `cvi-paired-notebook-safety.test.ts` | 4 | Genuine paired notebook and HTTP entry |
| `cvi-paired-reconciliation.test.ts` | 3 | Genuine paired startup with actual COMMIT and intentionally invalid observation |
| Eight other migrated lower protocol suites | 138 | Native/replay/notebook/HTTP contracts using test-only identities; not protected publication evidence |

The focused scope comprises 38 genuine paired cases and 147 lower contract cases. The broader run initially failed two newly written notebook assertions about reserved-to-spent transitions. The final four-case notebook rerun passes with exact terminal-state checks. The three-case reconciliation suite initially requested inspection through a deliberately held gate; the final rerun instead asserts that refusal and compares the untouched disposable ledger. Both corrections preserve the security requirements. Do not report the earlier failed runs as passed.

## What this does not prove

- No live Tavus request/event ordering, interruption behavior, transcript fidelity or device playback was exercised.
- Model/account transports and customer identity in these paired fixtures are simulated. No production authentication or model eligibility is established.
- The local SQLite execution path and the earlier isolated PostgreSQL permission/transaction rehearsal are distinct. This candidate does not establish original gate-to-PostgreSQL-to-owner composition or hosted grants.
- Independent witness administration, restore floors and all-writer coverage are still open. Local files and fixture `protected` flags do not establish those guarantees.
- Synthetic clocks do not establish production timing or session cost.
- No full phase, production criterion, launch approval, new spending or hosted change follows from this evidence.

## Integration decision

Wait for the terminal result of original full regression session 79137. If it passes, apply only the exact source/test patch to the main workspace, verify matching hashes and main focused/type/build checks, then update the current evidence and archive source. Preserve both old and isolated workspaces. Do not copy stale staged documents or generated Memory assets.
