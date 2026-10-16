## Local HTTP composition follow-up, 16 October 2026

The authenticated notebook/transcript and static-header HTTP path now coordinates idle adoption through a verified context transition. Incoming HTTP work is refused before replay admission; bounded notebook input resumes using the adopted pin. Authenticated Clear/End have a separate immediate cleanup path. See [continuing HTTP evidence](local-tavus-continuing-http.md). The original next-action and test-count sections below describe earlier checkpoints. Durable cross-store pending evidence, production clocks and real provider acceptance remain open.

## Continuation follow-up, 16 October 2026

Local native renewal and explicit authenticated idle adoption are now implemented separately from startup/request deadlines. Neither chooses a production duration nor raises the eight-second grant maximum or original application cap. Busy/unsettled responses do not renew, and pending note extraction is distinct from an ended session. See [owner continuation](local-tavus-owner-continuation.md). HTTP coordination, restart-wide replay quiescence and real provider acceptance remain open; the original evidence below is historical.

# Local CVI deadlines and initial writer lifetime

This is disabled local preparation using synthetic data. No provider call, hosted change, spending, credential lookup or production duration decision is included.

## Separate limits

| Limit | Meaning | Enforcement |
| --- | --- | --- |
| Startup deadline | Time allowed to return a verified new owner | One-use coordinator, cancellation and absolute clock checks |
| Request deadline | Time allowed for one admission or reply, including waiting for its consumer | Native and HTTP wrapper timers plus absolute clock checks |
| Initial writer lease | Verified native grant expiry | Signed admission and fresh current-owner inspections |
| Consultation cap | Absolute bound supplied by the server owner | Binding and every owner/request check |

The optional startup `writerLeaseMs` requests an initial lease of at most 8,000 ms from admission issue time, clamped to the consultation cap. Omitting it preserves the original startup-bound lease. It never changes the native eight-second maximum. The arithmetic helper returns upper bounds and all permission flags false. The backend can issue a shorter grant; its actual expiry wins.

A lease can outlive the startup RPC, but an acknowledgment arriving after that RPC deadline returns no owner. A committed grant remains recorded without retry or credential activation. The original consultation cap cannot slide. This does not implement lease renewal or an 85-second consultation.

## Deadline fix

A direct logical-clock check showed that a prepared reply could be read after its request deadline before the timer callback ran. Both boundaries now record an absolute operation expiry. They check it around body reads, asynchronous fences and reservation work, and before output. The HTTP wrapper checks before reading the upstream reply, so it cannot spend delivery merely because its own timer is late.

Expired work cannot clear or replace a newer active operation. Unknown reservation outcomes remain held. A known committed consumption remains spent even when output is withheld. Timers still cancel stalled waits, while clock checks stop work when callbacks are delayed. Abort cannot prove that an already-running backend write did not commit, nor prove remote termination, deletion or billing finalization.

## Evidence scope

Tests use controlled logical clocks, local signing/SQLite fixtures and simulated account, transcript-admission and model outcomes. The full foundation run passes 2,320 tests across 169 files, including 184 cases in the five affected deadline/lifetime files. Operations (475 tests with ResourceWarning as error), TypeScript checking, build, four encryption checks and 16 local Memory checks also pass. The earlier 556-check PostgreSQL result was not rerun here; no SQL contract changed. They cover fresh signed inspection after startup expiry, refusal at actual writer expiry, stale signed observations, a post-deadline committed grant, delayed timers and body/admission work crossing a request deadline. These are not wall-clock service guarantees or native Tavus acceptance.

## Remaining work

Continued ownership needs an authenticated native transaction mechanism, fresh signed evidence, immutable consultation cap, fencing and one-use claims. It must refuse expired or unknown owners across crash/restart and preserve both body and turn replay guards. Extending an in-memory timer is insufficient. Independent administration and restore floors, all-writer fencing, provider transport/correlation, real model behavior and device acceptance remain open. No phase or launch criterion closes.
