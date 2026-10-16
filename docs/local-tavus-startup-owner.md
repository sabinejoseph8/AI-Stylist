# Disabled fresh-owner startup composition

Local preparation only, 16 October 2026. No spending, real credentials, provider requests, listener, hosted changes or activation are included.

## Startup sequence

1. Inspect the committed full-state checkpoint using a new read-only inspector.
2. Require a separate privileged admission bound to the checkpoint, credential and replay stores, previous generation, new boot and binding digests, fresh nonce and deadline.
3. Construct an empty local styling flow. Refuse reused notebook state.
4. Commit a fresh credential generation through the existing mandatory activation port.
5. Inspect the explicitly admitted resulting checkpoint again and check the current credential lease.
6. Only then return a disconnected local endpoint object. Requests still pass the existing current-credential, replay and checked-output boundaries.

Checkpoint consistency alone grants no write, reconcile, sign or resume permission. The coordinator does not reconstruct an original handoff, token or previous conversation. It has no listener, default service connection, key lookup or production import. Every binding remains fixture-only.

## Unknown and changed outcomes

Startup is one-use. Missing admission, mismatched namespace or binding, stale checkpoint, substituted lease, clock reversal, cancellation and timeout remain held. An activation that committed before its reply was lost stays spent. A fresh coordinator cannot silently retry the previous generation. Cancellation or a failed final inspection does not restore the old credential. Late callbacks cannot return an endpoint after the caller received a held result. Startup's deadline is not the lifetime of a successfully returned owner.

Port methods and binding configuration are captured before asynchronous work. Replies are copied and checked for exact shape and correlation. Separate checkpoint, credential and replay namespaces are explicitly bound; this does not make their writes atomic.

## Local evidence

32 focused cases cover ordered startup, refusal of checkpoint-only readiness, invalid permissions/admission/proofs, changed final state, reused notes, method substitution, clock reversal, cancellation and unknown outcomes. Four composition cases use actual signed checkpoint inspection and credential/replay files accessed through fresh Python processes. They demonstrate durable credential retirement, retained old request history, rejection of old bearers and successful synthetic checked output for a fresh request. The privileged admission reply itself is simulated.

Full regression: 2,066 foundation tests across 160 files, 475 operations tests with ResourceWarning as error, type checking/build, four encryption checks and 16 local Memory checks. The unchanged full-state PostgreSQL rehearsal passes 503 checks when rerun separately. It does not implement the new startup admission.

## Limits and next action

Admission is a required trusted server port contract, not an implemented independently durable production authority. The integration fixtures intentionally return a synthetic acknowledgment. There is no independent signing service, production restart floor, cross-store atomicity or all-writer fencing proof. These tests do not establish hosted security, customer readiness, provider behavior or physical-device acceptance. All phase/launch criteria remain open. Allocation remains $51.

Exact next local action: connect the fresh-owner admission contract to the existing authenticated authority and durable transaction boundary in a disposable fixture, proving that an unknown acknowledgment remains spent and that the final checkpoint includes the admitted transition. Preserve real activation, independent administration, account/source/privacy, spending and hosted gates.
