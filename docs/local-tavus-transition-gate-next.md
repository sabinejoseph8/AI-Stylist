# Next local step: retain the replay gate across owner transitions

This is a local design, not implemented permission or a hosted change. Mandatory private startup and consumed-renewal binding are prepared. The separate authority can still advance after a signed snapshot unless participating transitions hold the same replay gate.

## Original operation and lock lifetime

1. Prepare the immutable native plan using the existing signed authority bridge. Capture the full original plan internally; persistent evidence contains its digest, operation ID, replay scope, expected full-state digest and target digest, not a lease token.
2. Acquire the replay/witness gate before any authority advance. Use replay then SQLite lock order consistently. The gate process holds replay while the existing native adapter acquires and releases SQLite for its transaction. Do not hold a SQLite transaction and ask another process to acquire it.
3. Durably create a transition marker before authority advance. Existing reserve/consume and startup inspection refuse a retained marker unless the caller holds the original live gate capability. A fresh process cannot recreate this capability from the marker.
4. Keep the gate through authority advance, native COMMIT, full-state reconciliation, original private handoff consumption and authenticated owner adoption. No second authority operation may use this gate.
5. Release only after verified finish of that same original operation. Cancellation, process loss, unknown save/commit results and lost finish replies retain the marker. Do not reapply, refund, reconstruct a lease or clear uncertain evidence automatically.

## Inspection while the gate is held

Ordinary inspection must continue acquiring the replay gate and checking markers. The original transition needs a separate bounded inspection method on its transient capability, so it can read the same journal under its existing lock without attempting a reentrant lock.

That method still checks exact replay scope, a fresh caller challenge, deadline and immutable original operation. It exposes only read-only snapshot evidence and cannot reserve, consume, release or finish a different operation. It must not become an HTTP-selectable mode or raw-write fallback.

## Completion ordering

The protected owner must not be registered for HTTP before gate completion. Original startup/renewal handoffs need an explicit finish hook tied to the same transient gate. The shared envelope can call that hook, but only the mandatory wrapper may brand the resulting owner.

A known successful finish removes its marker durably before releasing the lock. A crash between those steps must not produce a second handoff: original permit/renewal claims remain one-use. A missing success reply still holds the controller, even if inspection later shows no pending marker.

## Required local tests

- Separate processes compete for reserve, consume, startup and renewal without reversed locks or deadlock.
- Old tokens and same-generation pre-renewal workers cannot write after adoption.
- Marker creation, authority advance, native COMMIT, reconciliation, private adoption and marker removal each have cancellation/process-loss cases.
- Copied, reconstructed, substituted, expired or already-finished capabilities cannot inspect under the gate or finish it.
- Ordinary inspection after restart reports retained uncertainty and never releases another operation's gate.
- Clear and End immediately remove temporary notebook data without clearing transition, replay or spending evidence.
- The complete HTTP exchange still works on each side of successful renewal, with all existing capacities and deadlines retained.

Independent administration, coordinated restore protection, universal writer coverage and production timing remain separate acceptance gates. A participating fixture is not proof that every hosted writer follows this protocol.
