# Local durable replay inspection

Prepared under the existing local-only authorization. No listener, paid/provider call, real credential, hosted change or permanent backup runtime is activated.

## What changes

The replay journal now supplies a fresh, scope-bound snapshot for startup and native owner continuation. It reports record counts, pending/spent counts, capacity, expiry, observed clock and a journal digest. A caller-generated random challenge binds each response to its read. The response grants no write, activation, renewal, signing or resume permission.

The Python backend uses the existing journal lock, private-file validation, pending-write markers and checksum checks. It retains every reservation and spent record. Advancing the observed clock is persisted through the existing journal protocol, but records, capacity and expiry are unchanged. A configured witness is checked and updated; an unknown write or witness mismatch is held without repair.

The TypeScript inspector captures its port, checks the exact response shape/scope/challenge and validates counts, fixed capacity and monotonic time/history. Pending, exhausted, malformed, missing, cached, canceled and late evidence refuses further progress. Reads have bounded deadlines; completed reads remove cancellation listeners. Strong startup requires inspection explicitly, with no lower-level fallback.

## Startup and continuation

Startup checks the journal before native admission, after native admission and after final credential/owner proof. An unresolved reservation is detected by a newly constructed coordinator using a fresh Python process, even when no in-memory unsettled flag exists. Failure after a committed admission retains that commit and the original pending reservation; it returns no started owner.

Continuation checks before and after authenticated native adoption. A synchronous local flag prevents two continuation controls from racing their reads. A request that becomes busy during the read refuses renewal before mutation. Pending evidence before renewal stops the native port; pending evidence after a committed renewal closes the owner without undoing that commit. Spent history remains usable below capacity and cannot be refunded or replayed.

## Limits that remain open

This is snapshot evidence, not an all-writer quiescence grant. The replay lock is released before a native ownership transition. A nonparticipating writer may change state after the final read. Negative tests demonstrate that an idle snapshot does not exclude a later writer. Repeated snapshots do not close this race.

A current pinned witness detects one-sided journal rollback. Both witness and journal are colocated local fixtures; restoring both can still reproduce an older idle snapshot. A negative test preserves this boundary explicitly. No independent restore floor, administrative separation or production recovery guarantee is claimed.

Next implementation: define an owner-fenced replay transaction contract that holds the replay gate around protected native transitions and validates the exact current owner inside each replay mutation. Establish a consistent lock order and test competing/old writers, aborts and unknown commit results. Keep all live/provider and production acceptance gates closed until that integration and independent administration are proven.

## Verification

Final verification passes 2,403 foundation tests across 174 files, 499 operations tests with ResourceWarning as error, TypeScript/build, four encryption checks and 19 local Memory checks. The focused run passes 131 startup/continuation/HTTP/integration cases and 29 inspector unit cases. No SQL changed; the prior 556-check PostgreSQL result was not rerun in this turn. Automated evidence covers fresh challenges, malformed replies, deadlines, canceled reads, pending/exhausted journals, retained spent records, process restarts and native startup/renewal boundaries. No physical-device review is required for this internal-only change; actual provider/device acceptance remains open.
