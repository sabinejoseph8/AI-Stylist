## Captured witness integration in isolated regression, 16 October 2026

Prepared the captured witness integration in /private/tmp/ai-stylist-witness-pair-stage. The protected factory now requires a scoped, separate replay-witness reference and constructs its own fixed bounded replay driver. Caller-selected replay callbacks are refused before work. The original Node gate passes the same captured reference to the Python transition primitive; ordinary inspection and owner-fenced reserve/consume use that reference too. The driver uses captured clocks, an absolute wall deadline, strict frames, original native leases and three fresh signed checks per mutation, with no alternate script, fault flags or raw-write fallback.

Ninety-nine composed checks across nine suites pass before the final two restore additions and separate driver suite; runtime source is unchanged since that run. The final 15 configuration/restore cases pass, as do all nine concrete-driver cases. They cover one-sided replay or witness restoration, removal of a held marker after COMMIT, interrupted witness writes, cancellation/lost proof after saving, stalled callbacks, clock rollback, delayed timer dispatch, oversized frames, native writer exclusion and competing requests. Coordinated restoration of both local stores remains an explicit negative boundary, not a solved guarantee. One newly written concurrency assertion initially attempted ordinary inspection while the actual lock was held; it was corrected to assert that refusal and compare unchanged disposable ledger bytes. No runtime protection was removed. All 570 operations tests pass with ResourceWarning as error. TypeScript and client build pass. The complete two-turn/renewal journey still uses exactly 127 of the fixed 128 authority records.

Full isolated regression is RUNNING in original session 37385, output /private/tmp/ai-stylist-witness-full-regression.log. Source is frozen for that run; 513 source hashes are recorded. The source-only 11-file patch is prepared-captured-witness-a5b0b8b7ab1d.patch, SHA-256 a5b0b8b7ab1db12b85c735162d911a56947d474dfef3a50ed29cfa90cd7e7381, saved in the durable source-checkpoints folder with a clean merge preflight. This candidate is NOT merged and no full candidate result is claimed. Main remains on its verified original-pair source: 2,579 tests across 189 files, 47 independent focused checks and 19 local Memory checks. Existing SQL is unchanged; prior 638 isolated PostgreSQL checks were not rerun.

Product/design were reviewed without scope changes. Full completion stays 5 of 41 tasks and 0 of 21 production criteria; allocation stays $51. No providers, real credentials, spending, hosted changes, support messages or permanent backup runtime changes. Local witness folders still assume independent protection; hosted administration, all-writer coverage, PostgreSQL composition, production clocks and provider/device acceptance remain open.

Exact next action: collect original full regression session 37385; do not duplicate or restart a healthy run. Fix any failure at its actual boundary while preserving original pairing, native/signature/lease checks, immediate temporary-note cleanup, permanent/uncertain records and the complete 127-of-128 journey. After a passing full result, verify all 513 frozen source hashes, merge only the exact source/test patch, run main focused/type/build checks, refresh local Memory and archive verified source. Do not copy stale staged docs or generated Memory. Then audit remaining authorized local work against the actual backlog before selecting the next integration. The goal remains active and incomplete; no user action is required for this local work.

## Original implementation plan

# Next local integration: captured replay witness

Implementation plan, 16 October 2026. Continue in `/private/tmp/ai-stylist-witness-pair-stage`, created from verified main checkpoint `b2cd9cfbee86b249ae82939f962241600413b312`. Main currently passes 2,579 tests across 189 files, 47 independent focused checks, types/build and 19 local Memory checks. That describes the creation checkpoint; the implementation is now staged as recorded above.

## Existing gap

The Python transition primitive already supports a pinned disposable witness and fail-closed split updates. The configured Node gate does not pass that pin. The original owner-pair factory also accepts trusted replay callbacks, so merely adding a witness field to its configuration would not prove those callbacks use the same pin. Complete the concrete participating path rather than attaching a configuration label to a generic callback.

## Concrete changes

1. Capture a validated replay-witness reference before work: absolute separate root, fixed witness ID, matching replay journal ID and kind. Refuse missing, mismatched or nested/same-root configuration in the protected factory before callbacks. This disposable local witness is an assumed independent model, not proof of independent administration.
2. Carry the captured reference through the original Node gate's bounded setup frame to the existing Python transition primitive. Existing lower unpinned contract fixtures may remain explicitly disconnected. Protected factory construction must not select an unpinned fallback.
3. Construct the participating replay backend inside the protected factory. Use a fixed bounded Node/Python driver for inspection and owner-fenced reserve/consume with the captured native/replay roots, physical/application binding, witness reference, public authority pin, reader principal and clock. Remove caller-selected replay execution from this protected factory. No HTTP-supplied roots, verifier/script paths, mode selectors, crash flags, timing arrays or raw-write fallback.
4. Reuse `local_cvi_owner_replay.operate` with its exact three fresh signed checks and the same captured witness. Its subprocess verifier should be a fixed operations artifact calling the existing pure pinned verifier, with bounded input. Current clocks must come from the captured Node clock over strict IPC and hard supervision, not a client timestamp or a caller-selected fixture array. Preserve native lease and application deadlines.
5. Use witness-aware ordinary replay inspection outside transitions. Original transition inspection must continue through its already-held gate, with the same witness configuration, avoiding reentrant locking. Journal/witness lock ordering and existing marker handling remain unchanged.
6. Update only genuine paired fixtures to create a disposable witness and exercise this concrete backend. Keep lower contract tests labelled and disconnected. Do not silently substitute protocol harnesses for protected integration tests.

## Required checks

- Missing/mismatched scope and copied producer objects refuse before planning, authority work, credentials or mutation.
- Complete actual two-turn transcript/notebook/HTTP exchange works across renewal at exactly 127 of the unchanged 128 authority records. Do not add authority reads, reset allowances, remove existing checks or shorten the exchange.
- Known replay records and witness heads remain coherent through inspection, reserve, consume, startup and renewal. All participating paths use the captured reference.
- One-sided restoration cannot remove held transition evidence or reuse spent records when the witness is preserved. Restoring both stores remains an explicit negative boundary.
- Witness/journal interrupted updates remain held without rebase, repair, retry, refund or permission inferred from a missing marker. Reuse actual primitive failure/restore tests; do not add production-selectable fault flags to obtain test coverage.
- Cancellation, malformed/oversized frames, late replies, expired leases, clock rollback, concurrent changes and process loss retain permanent/uncertain evidence and suppress output. Child cleanup must be bounded.
- Preserve all existing original-object, post-COMMIT reconciliation, lifetime, notebook Clear/End and stale-output checks. Run focused tests, operations tests because Python changes, types/build and full isolated regression before merging.

## Scope boundaries

No real credentials, providers, spending, hosted changes, production role changes or permanent backup runtime changes. PostgreSQL composition, independently administered restore floors, universal writer coverage, production clocks and live provider/device acceptance remain open. A local folder and fixture protected flag cannot establish these guarantees. No phase or launch criterion closes from this work.
