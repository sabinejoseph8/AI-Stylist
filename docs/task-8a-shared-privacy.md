# Shared consultation sample privacy

## Scope

Local Tasks 7c and 8a preparation only. The injected shared-consultation App now uses the existing Profile privacy controls. Default startup remains the ordinary sample app. No customer account, hosted export/deletion, microphone, camera, provider or storage upload is connected.

## Sources and clear behavior

| Selected category | Export source | Clear behavior |
| --- | --- | --- |
| Current session | Seven accepted view fields and their confirmation states, explicit reference metadata and normalized local PNG/WebP photo copies | Await the original view's Clear acknowledgment and its refreshed current state; hide temporary notes/photos immediately |
| Saved preferences | Only explicitly copied color, style, budget and look-type values | Clear that separate sample memory; current session notes stay unchanged |
| Wardrobe | Explicitly saved local owned-item copies | Remove only Wardrobe copies and their selection |
| Saved looks | Explicitly saved illustrated sample records | Remove only saved looks; session notes and reference photos are not exported with them |
| Shopping | Explicit sample-list entries | Remove only that list; no retailer cart or purchase exists |

Session export is refused while the view is busy, held, ended, input-unavailable or processing input, or while its photo is loading/being confirmed. Prepared copies invalidate on view/input/photo changes. An asynchronous photo encoder cannot publish after Clear. The projection includes no internal lease/version proofs, blob URLs or account/provider credential sources.

## Confirmed asynchronous clearing

LocalPrivacy accepts a synchronous clear source or an explicitly asynchronous one. The Profile button always awaits the confirmed path. A synchronous caller refuses an asynchronous selection before any category mutation. Busy clearing stays busy through source invalidation; the waiting message is not replaced by an ordinary export-change message.

Selected categories are captured and processed in canonical order. Only a true asynchronous acknowledgment counts as success. Failure, source replacement or the existing eight-second bound stops further categories. A late acknowledgment cannot continue clearing the next category or replace the failure message. Already successful clears are not rolled back. Cancellation of export does not claim to cancel an in-flight clear.

The confirmation stays visible with disabled actions until completion; focus returns to the clear action afterward. Keep cancels before work starts. Download requires a separate explicit action, and downloaded files remain independent copies after app clearing. These are local sample controls, not evidence of account/provider deletion.

## Verification

Source checkpoint: bdf0881.

- Final composed run: 91 tests across 11 suites, original session 52993, exit zero, 38.47 seconds. It includes all three WebKit journeys and the ordinary preview regression.
- Main independently passes 87 tests/seven suites, session 54877, exit zero; TypeScript and client build pass.
- Actual SQL/browser run: session 24832, exit zero; competing start and late-result expiry remain refused. The only later change before final composition was the additional ordinary-preview browser test.
- Original pair: 40/128 authority records. Shared privacy browser: 70/128. Existing candidate and input browser journeys: 126/128 and 88/128. Actual global SQL browser: 84/128, 45 SQL calls. All release zero protected outputs.
- Browser downloads only selected session/preferences JSON, including the actual normalized photo; verifies Keep, delayed Clear status, disabled confirmation, focus return and separate saved-look/preference retention.
- Contracts cover pending/unverified export refusal, note/photo replacement, late encoder cancellation, false/thrown/timed-out cleanup, source replacement and independent categories.
- Initial ordinary-preview test failed because its selector matched both notebook and nested camera summaries: 90 passed/one failed, session 59872, exit one. That result is retained. Final test targets the top-level notebook disclosure. No product guard was weakened.

Evidence is preserved in source-checkpoints/shared-privacy-final2-composed-20261017.json and its log, shared-privacy-main-20261017.log and shared-privacy-sql-browser-20261017.*. The exact nine-file patch and per-file hashes are retained.

## Complete regression and remaining work

The complete regression for source bdf0881 passed in original session 64418: exit zero, 2,760 tests / 203 suites passed, four intentional browser skips, 1,959.06 seconds. All 580 frozen inputs match the executed stage and main at collection. Evidence: source-checkpoints/shared-privacy-full-bdf0881.json and .log. Later source increments have separate verification; this result is scoped to bdf0881.

The next independent local integration is explicitly saving a shared owned reference to sample Wardrobe, then retrieving and confirming its photo through the same original context. Shared controls currently lack that bridge. Preparation must use the separate Wardrobe stage; original-pair/browser checks wait until the active full regression is terminal. All real identity/media/source/persistence/privacy/device and launch criteria stay open. Completion remains 5/41, production acceptance 0/21 and allocation $51.
