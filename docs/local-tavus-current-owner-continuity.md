# Local current-owner continuity and stale-reply settlement

Authorized local preparation only, 16 October 2026. No spending, real credentials, provider calls, hosted changes or live route.

## From exact checkpoints to verified ownership

The previous fence held every state advance, including a valid write by the same owner. The startup path now requires a separate current-owner observation instead of treating a historical consistency diagnostic as permission to continue.

A native owner pin binds the store, generation, configured writer digest, request-bound native boot, actual expiry and minimum revision. The read-only inspector verifies the existing signed authority/database evidence, complete current state, trusted registry and original fixture operation marker. It then requires one active grant matching the current gate, owner and boot, with the exact expiry and a valid issue/expiry interval. Fenced, replaced, expired, unknown-registry, pending or mismatched state is refused. Historical consistency alone can still be diagnosed after a lease expires, but cannot confirm active ownership.

Every inspection result keeps write, reconcile, sign and resume permissions false. It confirms a previously admitted owner; it creates no owner, write grant, credential, conversation or signing handoff. Startup checks the complete admission acknowledgment and request-bound native boot before activating a fresh credential. There is no checkpoint-only fallback in this current-owner path.

## Monotonic progress and request versions

The guard accepts a higher revision only through the signed full-state inspection and known registry, with the same active owner/generation/boot/expiry. It raises its revision floor and remembers the operation marker. A lower revision, another operation at the same revision or the same operation at a higher revision holds the guard. Checks surround separate credential work and recheck time bounds afterward.

An internal request AbortSignal identifies a single response attempt. Its first successful check records the state revision/operation. If that state changes while text is prepared or delivery is pending, the old reply is invalidated. The valid owner remains available for a new request at the newer state. The interrupted local draft cannot later release its old bytes.

## Settling a known stale attempt

Testing found that discarding a prepared stale reply left its reservation open, blocking the next turn. The endpoint now spends that original live reservation without output only after an explicit verified same-owner stale refusal. The original private receipt is still present in the live handler. It is not reconstructed from storage, retried or refunded. A request already consumed is not consumed twice.

Replaced, expired, canceled or unavailable ownership does not authorize this settlement. Unknown settlement outcomes produce no output, and an unresolved reservation still blocks further admission. No automatic retry or repair is added. The lower credential-only and exact-checkpoint helpers remain disconnected historical tests, not fallbacks in the new startup path.

## Local evidence

36 focused current-owner cases and six additional admission-binding cases cover actual signed-service/SQLite continuity, native state writes, fencing/replacement, expiry, operation/revision floors, owner-pin substitution, missing observation, stale draft suppression, new-turn continuation, single consumption and unknown settlement refusal. One composed endpoint serves before and after a registered authenticated write. Another test updates state after durable consume, suppresses old output, refuses the spent ID and permits a fresh turn.

The existing guard rejects a coordinated older database/authority restore after observing a newer revision. A negative boundary test deliberately recreates only a read-only view using the older public floor: it can still diagnose the old owner as current with every permission false. This demonstrates why the latest floor must survive independently; it does not prove production restart recovery or authorize reconstructing an endpoint.

Final regression: 2,155 foundation tests across 163 files, 475 operations tests with ResourceWarning as error, type checking/build, four encryption checks and 16 local Memory checks. Review and testing fixed the known-stale reservation deadlock before this successful final run. The existing 503-check PostgreSQL rehearsal passed again after the checkpoint-reader change. That run is regression evidence for the previous PostgreSQL path, not proof of this new SQLite owner-flow composition in hosted PostgreSQL.

## Remaining gates and next action

Owner continuity and response-version invalidation are now exercised locally. This does not yet connect actual authenticated customer notebook edits, transcript proposals or confirmations to the native history and prepared styling context. Raw Tavus messages still cannot confirm notes. Real provider compatibility, non-ElevenLabs synthesis, downstream interruption, latency and device acceptance remain open.

The latest floor in this composition is volatile. Services/keys are colocated, observer transaction labels are fixture markers, and universal writer fencing, native durable markers, production clocks/transport, independently protected floors and hosted grants remain unproven. A concurrent change that prevents a stable observation remains held. Local writer-lease duration/renewal is a rehearsal contract, not a real consultation-lifetime promise. Point checks cannot recall already-delivered bytes.

Exact next local action: connect authenticated simulated notebook changes/confirmation to the current-owner styling snapshot and native state version. Test actual seven-field context propagation and stale-content refusal without accepting confirmation from raw conversation messages. Review the documented Tavus request contract before any live proposal; do not invent provider headers as verified behavior. Preserve financial, privacy, account/source and hosted activation gates. No phase or launch criterion closes, and allocation remains $51.
