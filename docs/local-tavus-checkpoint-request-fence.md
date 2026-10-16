## Continuity follow-up, 16 October 2026

[Current-owner continuity](local-tavus-current-owner-continuity.md) closes the exact-checkpoint limitation in the disabled startup path. A registered native write by the same owner can now continue; a prepared reply tied to an older state is suppressed and its verified live reservation settled without refund. The historical exact-checkpoint helper below is not a fallback. Production and real notebook/provider integration remain open.

# Local full-state request fence

Authorized local preparation only, 16 October 2026. No provider requests, real credentials, listener, spending or hosted changes.

## Implemented behavior

The disabled startup path now requires a current checkpoint around every separate credential proof. The concrete composed endpoint has no optional inspection or credential-only fallback. It captures the exact admitted operation/revision, credential lease and explicit owner expiry in trusted server configuration. Checks reject changed, missing, expired, canceled or unknown state. Once held, the old guard cannot retry itself into readiness.

These checks run at the existing endpoint boundaries: before parsing/preparing the request, before durable delivery consumption and after consumption before output bytes. A transition during credential work is caught by another full-state inspection. If admission commits but credential rotation fails, an already-constructed composed old endpoint refuses the next request. Its temporary notes are cleared. A transition after request consumption suppresses output and does not refund the attempt.

Startup and per-request timeouts are now separate. Time spent setting up an owner cannot silently reduce every later request's configured allowance. This does not extend an owner lease: owner expiration is enforced independently before and after asynchronous checks. The admission acknowledgment must explicitly provide a nonexpired owner bound no later than the credential binding expiry.

## Native writer identity correction

The previous admission rehearsal hashed the complete request into the native writer owner. Review found that native writes require the configured actor digest, so the admitted lease could not make a normal styling-state write. Admission now keeps that configured identity and puts a domain-separated commitment to the complete request into the native boot record. The separate random lease token is still chosen once by the trusted planner. A real authenticated SQLite styling-state write under the admitted lease now passes. Credential and native boot namespaces remain explicitly separate.

## Local tests

28 new cases include the composed request fence, checkpoint substitutions, missing required ports, credential failure, expiry at asynchronous boundaries, cancellation, port capture, owner-expiry acknowledgment checks, final startup proof changes and separate request timeout behavior. Actual signed-service/SQLite/credential/replay compositions verify old-owner refusal, suppressed output after consumption, no draft on missing authority, temporary-note cleanup and a native styling-state write.

The earlier standalone credential-only helper remains a disconnected negative test. It can still respond when used without the new composition; it is not mounted in a live route. This rehearsal does not establish universal all-writer protection.

Final regression: 2,113 foundation tests across 162 files, 475 operations tests with ResourceWarning as error, type checking/build, four encryption checks and 16 local Memory checks. All cases pass, including the explicit negative same-owner-progress case.

## Remaining scope and exact next action

The fence currently pins one exact checkpoint. A legitimate write by the same owner advances state and is therefore held too. A passing negative integration case explicitly demonstrates that limit. The backend write is valid; continuing its endpoint still needs a trusted refresh/owner-inspection path. Do not treat checkpoint pinning as completion of a multi-turn styling flow or automatically loosen it to accept arbitrary higher revisions.

Exact next local action: verify current active ownership across authorized same-owner state advances. Bind generation, native owner, boot, expiry, trusted registry and revision floor; refuse replaced, fenced, expired, uncertain, unknown-registry or rolled-back state. Test one endpoint through a native styling-state write while still denying the replaced owner. Keep actual hosted/provider activation gated.

Point checks cannot recall already-delivered bytes or establish atomicity across independent stores. The observer transaction labels remain fixture markers, keys/services remain colocated, and native durable marker recovery, independent floors, production clocks/transport and hosted grants remain open. Local writer leases retain their bounded rehearsal durations; renewal and real consultation lifetime are unverified. No phase or launch criterion closes; allocation remains $51.
