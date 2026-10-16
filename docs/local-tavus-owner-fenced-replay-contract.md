# Next local contract: owner-fenced replay mutations

This is an implementation plan for the next local preparation step, not an activated permission or a verified production guarantee. Existing independent restore, all-writer, financial and provider acceptance gates remain unchanged.

## Problem to close

Fresh replay inspection detects retained pending records but releases its lock before a native owner transition. An old worker may have passed an ownership check before that transition, then write a reservation afterward. Repeating a snapshot check does not make those operations atomic.

## Required participating paths

Use one lock order: replay journal gate, then native SQLite transaction. Reservation and consumption must hold both while validating the exact live native lease, current full-state metadata and fresh signed authority evidence. The trusted server configuration supplies the native store, authority pin and actor. HTTP input must not select these paths, supply a native lease, substitute an inspector or invoke an unfenced write fallback.

Protected startup and renewal must acquire the same replay gate before changing native ownership. They must retain the gate through the committed native transition and the necessary ownership/adoption checks. An original transient gate owner may release it; a restart may inspect persistent transition evidence but must not reconstruct that permission or silently clear an ambiguous marker.

The lease token stays private to the original owner. A stale generation, retired token, different boot, expired lease, changed full-state aggregate, pending authority operation or mismatched scope must refuse the replay mutation inside the locks. A separate signed read outside the critical section is insufficient.

## Crash and concurrency rules

- Persist a transition-intent marker before a protected ownership mutation. Bind it to the original authority operation and replay scope, rather than an arbitrary process identifier.
- A failure before or after native COMMIT must retain enough original evidence to classify the state. Unknown results do not reapply the transition, refund records or mint a replacement handoff.
- A journal save may advance its configured witness before the local write. A split result remains held; do not bootstrap or rebase the witness automatically.
- A competing writer or transition must refuse or wait within a bounded deadline. Never take native then replay locks on another path.
- Clear and End must continue removing temporary notebook data immediately. Cleanup is not permission to clear replay or financial evidence.
- Plain low-level fixture helpers may remain for explicit negative/setup tests, but the composed startup/HTTP candidate must have no unfenced mutation path.

## Required tests before claiming this gap closed

1. A worker pauses after an outside ownership check; renewal completes; its later reserve and consume both refuse inside the gate.
2. Reserve/consume and renewal compete from separate processes. Outcomes respect one lock order and never deadlock or allow stale owner writes.
3. An old token after same-generation renewal, a retired generation and a different boot cannot mutate replay state.
4. Cancellation, timeout and process exit before/after journal write and native COMMIT preserve original pending evidence and cannot create a fresh capability.
5. Native full-state or authority changes during a wait refuse admission. No reduced-state or unsigned fallback exists.
6. Startup/HTTP composition uses the protected path, including both body and turn replay guards. Known busy work refuses before new reservation.
7. One-sided restore is held against the configured authority. Coordinated restore remains a negative boundary until independent storage administration is established.

This plan does not require customer data, a provider call, hosted changes, new spending or changes to the fixed consultation cap.
