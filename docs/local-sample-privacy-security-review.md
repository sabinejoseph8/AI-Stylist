# Local sample privacy and security review

15 October 2026. Scope: the complete local sample application, generated fixtures and simulated account forms. No paid calls, real accounts, hosted changes or credential use.

## Findings and fixes

### Volatile account/reset fields on page exit

Account and reset forms cleared on submission, mode changes or unmount, but had no page-exit or cached-return clearing boundary. Added a shared lifecycle binding for `pagehide` and persisted `pageshow`.

The boundary erases input values synchronously before page-exit rendering can pause, clears controlled React state, cancels pending local flows and rejects late account/reset completion. Cached return clears again. It does not log out a hosted account, revoke a provider credential or claim remote deletion. Account status remains subject to independent server verification.

A disposable browser fixture verified empty account fields and cleared reset drafts with simulated page-exit/cached-return events. The fixture's on-page report checks actual input values. Unit tests force late simulated sign-in/reset completion and confirm cancellation prevents identity/reset reuse. Actual browser history cache behavior across engines/devices remains unverified.

### Decoder error details

The image normalization helper could propagate a decoder exception to its caller, although the current reference model already displayed a fixed message. The helper now rejects with `Photo unavailable` while preserving bitmap/canvas cleanup. A sentinel-error regression proves decoder details do not escape that boundary.

## Checks completed

| Area | Evidence |
|---|---|
| Sample source reachability | Recursive local entry-import check finds no browser persistence, remote transport, raw console calls or HTML-insertion sinks in reachable application source. Disconnected connected-account modules are outside this sample-entry claim. This is a static heuristic, not a dependency or browser-extension security audit. |
| Browser storage | The disposable fixture observed zero localStorage entries, sessionStorage entries and IndexedDB databases for this local origin while made-up account drafts were present. No storage values or account identifiers were recorded. |
| Form lifecycle | Browser fixture reported synchronous clearing on exit and cached return. Late account/reset results and reset reuse are rejected by focused tests. |
| Malformed image | Browser rejected an HTML-like file presented as PNG, displayed a fixed error and preserved the previously confirmed generated reference. |
| Markup-like description | React displayed the description as text. No injected image with source `x` appeared; actual preview images remained local blob URLs. |
| Image bounds and cleanup | Existing dimension/header, size, decode timeout, late-bitmap and canvas-release regressions pass. Decoder failures now have an explicit redaction test. |
| Export/clear boundaries | Existing cancellation, stale-source, timeout, category-scoped clear, single-use download and composed late-photo-export tests pass in the full suite. No new export was sent to a server. |
| Production output | Build excludes the lifecycle fixture controls and test sentinels. Test fixtures are not production entry points. |
| Client errors | Browser error log was empty after the verified fixture actions. |

Seven new tests bring the foundation suite to 1,267 passing tests across 127 files. Type checking and production build pass. Screenshots and generated input files stay outside Git. No permanent backup runtime, private allowance or hosted configuration changed.

## Remaining limits

This is a local review, not penetration-test certification or production privacy acceptance. Clearing volatile fields does not promise forensic memory erasure, deletion of downloaded files, password-manager autofill data, browser/OS caches, provider retention or backups. Real browser-cache/device behavior, hosted cookies/authentication, production logging/crash reporting, provider cleanup and deployment headers retain their existing acceptance gates.

Full phase completion stays unchanged at 5 of 41 tasks. The hosted Memory site is not republished under this no-hosted-changes scope.
