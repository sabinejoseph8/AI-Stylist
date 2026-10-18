# Task 8a: global admission rehearsal

## Scope

Local preparation only. A disposable PostgreSQL container, two fixed synthetic customers, one loopback browser host and the original paired coordinator are composed together. No customer route, hosted Auth/Storage, provider, microphone, camera or paid request is connected.

## What the new check proves

1. The primary start claims the real SQL global slot and records provider admission before its original coordinator factory may run.
2. While that start is paused before factory construction, an independently bound competing customer receives Busy. Its factory never runs.
3. After releasing the test barrier, exactly one original coordinator is constructed. A repeated primary start also receives Busy.
4. The real sample App reads and edits the first shared notebook through the original view port. The competitor remains refused and the edit stays visible.
5. Trusted fixture SQL expires the global lease. The next browser read hides the old notes. Expiry does not release the provider hold, and a new competitor remains refused.
6. Browser traffic is restricted to the loopback origin; media access throws. Browser storage and protected output journals remain empty. The original authority record cap remains 128.

The browser never chooses SQL owner IDs, lease tokens, fences, clocks or cleanup assertions. Fixed fixture metadata is shared before coordinator construction so the admitted SQL scope and the original native identity match.

## Evidence and limits

Actual SQL/browser run: original session 23600, terminal exit zero. One browser test passed in the complete local data-protection runner. It observed one primary factory, zero competing factories, 13 SQL calls, 26/128 authority records and zero protected outputs. The pinned container has networking disabled and pulling refused. Log and three-file hashes are retained in source-checkpoints/global-admission-sql-browser-20261017.*.

This combines the existing separate SQL and coordinator evidence. It does not prove hosted multi-customer acceptance, real provider cleanup, real account expiry, durable restart admission or live timing. SQL lease expiry is induced by the trusted fixture and the native coordinator retains its existing logical clock. Final cleanup is fixture-only after local resources close; no real provider exists. Task 8a and production acceptance remain open.

## Reproduce locally

Use the installed bundled Node runtime on PATH and existing WebKit executable. Set AI_STYLIST_LOCAL_GLOBAL_ADMISSION=1 and AI_STYLIST_LOCAL_BROWSER_REHEARSAL=1, then run python3 apps/foundation/scripts/check-data-protections.py from the source root. The runner creates and owns its disposable container and passes its ID to the opt-in browser test. Ordinary data-protection and Vitest commands do not silently launch this browser rehearsal.

## Affected regression

The unchanged three-file increment passes 83 checks across nine affected suites, including all three existing WebKit journeys (original session 61825, exit zero, 68.50 seconds). TypeScript and client build pass. Candidate browser records remain 126/128 and input browser records 88/128, both with zero protected outputs. No full current-source regression is claimed for this test-only increment. Source checkpoint: 87360bd.

After merge, main independently passes 75 checks across four suites (43094, exit zero, 17.29 seconds), and TypeScript passes.
