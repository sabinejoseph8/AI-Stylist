# Task 2b acceptance audit

11 October 2026. Scope: the current repository at af33545, approved plan and local-only Task 2b exception. This is an evidence audit, not Phase 2 completion or a security certification.

| Requirement | Current evidence | Remaining acceptance |
| --- | --- | --- |
| Versioned owner-scoped data protections | Fifteen ordered migrations; isolated PostgreSQL checks include direct-write denial, foreign identities, revision races and upgrade compatibility | Apply/review the authorized hosted chain only after its gates; real customer token checks |
| Wardrobe, preferences and saved looks | Controlled SQL writes, reference protection, source-backed retail history, atomic mixed saves and SQL-backed TypeScript fixtures | Real account identity, UI integration and hosted lifecycle |
| Private photo storage | Actual disposable Storage API owner/public/foreign checks, signed expiry and legacy migration preservation | Actual hosted Storage configuration and device acceptance |
| Account-bound image delivery | Disconnected bounded read handler; actual local SQL/Storage bytes and simulated identity; 215 foundation checks overall | Real Auth/session revocation, hosted caches and request-lifecycle deletion race acceptance |
| Safe image processing | Six isolated Linux resource scenarios and sanitizer fixtures | Enforce and verify limits on intended hosting before customer upload activation |
| Lost media acknowledgments | SQL-backed lifecycle reconciliation checks; unknown state remains pending | Real transport/provider/coordinator recovery acceptance |
| Deletion receipt retention | Approved seven-day policy, migration 014, time-bound proof, concurrent bounded cleanup, minimal retired IDs and account cascade | Hosted cleanup schedule, monitoring and actual deletion verification |
| One simultaneous consultation | Migration 015, independent SQL claim/start/heartbeat/end races, prepared adapter and lost-acknowledgment checks | Real Auth, coordinator/provider fencing and verified cleanup integration |
| Continuous checks | GitHub workflow covers foundation/prototype and isolated SQL suites; current local foundation tests, types/build and integration rehearsals pass | Actual Storage/resource rehearsals are local evidence, not currently CI or hosted acceptance |
| Phase 2 sign-in/callback/sign-out/linking tests | Assigned to Task 2c; real account implementation remains absent | Needs the Phase 1 exit or an explicit new sequencing exception |
| Manual Phase 2 customer checks and review | Task 2a visual review accepted; full phase checks remain unchecked | Real accounts, phone checks and phase-wide code review after implementation |

No additional mandatory local Task 2b implementation gap was identified by this audit. This does not close Task 2b: hosted protection and real identity acceptance are missing. Independent new preparation must respect the existing plan gates. Phase 1 still needs Tavus recovery clarification, remaining live-note/cleanup acceptance, privacy decisions and newly authorized paid testing; no provider allowance remains.

## Next decision

A request for local-only Task 2c preparation has been presented to Sabine. Until she answers, do not implement Task 2c, configure OAuth, migrate hosted Supabase or start paid tests. If approved, prepare the account boundary and simulated acceptance tests first; real account setup and provider credentials remain separate actions. If declined, retain the Phase 1 gate and identify the concrete outstanding Phase 1 business/provider actions.
