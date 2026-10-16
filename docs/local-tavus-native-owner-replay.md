# Local replay writes checked against native ownership

This is disabled local preparation with disposable data. No listener, hosted change, provider call, real credential or new spending is activated. It is the native mutation portion of the broader [owner-fenced replay contract](local-tavus-owner-fenced-replay-contract.md), not completion of that contract.

## Mutation boundary

`local_cvi_owner_replay.py` takes trusted configuration separately from the public replay request. Configuration carries the original private native lease, native store path, replay scope, pinned authority key, reader principal, minimum revision and public-key verifier. The request contains only the existing replay fields. Neither the RPC evidence nor the verifier receives the private lease token.

The adapter captures the configuration and request before invoking callbacks. It locks the replay journal and optional witness, then opens the native SQLite transaction. That lock order is consistent across this path. Inside the native lock it checks the exact current lease, including token hash, owner, boot, generation, issue/expiry and domain scope. It computes the complete logical native aggregate and requests fresh, challenge-bound signed authority evidence.

The public-key verifier requires a read by the pinned observer principal, the exact current aggregate, no pending authority intent and a revision at least the retained floor. A reduced generation/head projection, altered signature, cached nonce, wrong reader or lower revision cannot authorize the write. It does not expose a write or signing capability.

Fresh checks run before preparing the journal mutation, immediately before saving, and after saving. Time is checked around RPC and public-key verification, including expiry while verification runs. The journal preserves its original reservation/consumption and records the observed save time. Native ownership metadata is not modified by replay mutation.

## Unknown outcomes and restarts

Failure before saving returns no acknowledgment and leaves no new reservation. Failure or cancellation after saving preserves the pending or spent record. A subsequent process cannot refund it or repeat it as a fresh request. Journal pending markers and interrupted witness updates remain held through the existing persistence protocol. The adapter never selects the unguarded helper after a failed proof.

Callback mutation tests also cover attempted changes to the original lease/pin, request digest and reply expiry. These values are copied before the callback or verification boundary so a later mutation cannot silently widen authority.

## Actual local composition and remaining gaps

One disabled endpoint fixture captures the original lease directly from its successful native startup execution and uses this guarded process for reserve/consume. It completes a synthetic response and retains the spent record. Other tests pause after an outside ownership check, renew the native grant, then confirm the old worker cannot reserve or consume. Separate native/replay writers cannot enter while the corresponding locks are held.

This does not yet make every general startup/HTTP composition select the protected path. There is no mandatory branded private-lease binding or original-handoff adoption into the replay port. A renewed owner must not reuse a guessed or reconstructed token. Those integrations remain required.

The native transaction prevents a participating SQLite writer from committing during the protected mutation. It does not lock the independently modeled authority service. An authority advance can race after a signed read; repeated reads alone do not serialize that service with journal saving. The next step is a transition-wide replay gate, with a persistent original operation marker, held before authority advance through native commit and authenticated adoption. Unknown transition markers must remain held after restart.

Independent administrative protection, coordinated-restore resistance, universal writer coverage, production clock/deadline mapping and actual provider/device acceptance remain open. A local supervisor bounds the fixture process; arbitrary blocking callbacks do not themselves establish production cancellation guarantees. No final billing, provider deletion or audio-flush guarantee is implied.

## Verification

Final verification passes 2,419 foundation tests across 175 files, including 16 native-owner replay integration cases, and 518 operations tests with ResourceWarning as error. TypeScript/build, four encryption checks and 19 local Memory checks pass. No SQL contract changed; the prior 556-check PostgreSQL result was not rerun in this turn. Structural operations tests use fake crypto explicitly; separate Vitest cases execute actual signatures, process boundaries, native locks and durable journal writes. The earlier stopped regression is not counted as passed. No phase or production acceptance criterion closes.
