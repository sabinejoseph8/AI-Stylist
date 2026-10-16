## Deferred binding follow-up, 16 October 2026

The configured Node port now refuses the pre-entry commit shape and binds only its original confirmed admission once. Migrated process tests enter before authority advancement and execute a real SQLite commit with a connection-allocated correlation record. Nineteen gate cases and 22 continuation checks pass; final full regression passes 2,504 tests across 182 files. General startup/renewal handoff publication integration, PostgreSQL identity/renewal, witness-pin composition and hosted acceptance remain open. See local-tavus-deferred-transaction-gate.md. Earlier pre-entry-commit descriptions below are historical.

## Original admission follow-up, 16 October 2026

The signed bridge now retains its original admission and exposes one private server-side claim after successful confirmation, with exact captured scope, clock/expiry/cancellation checks and reentrancy protection. Twenty new cases pass within 72 focused checks. This implements the original-reference part of step 4 only. Deferred gate binding, actual committed receipts, adoption/publication ordering and native PostgreSQL renewal remain open. See local-tavus-original-database-admission.md. No COMMIT or resume guarantee follows from the new claim.

# Next integration: bind the actual transaction to the already-open gate

Local implementation notes, 16 October 2026. This is a continuation of the approved disabled local preparation. It authorizes no provider calls, hosted changes, spending or activation. The current Node gate tests do not yet establish this sequence.

## Required sequence

1. Capture the immutable native plan and scope. Open the original replay gate before authority advancement or database transaction work.
2. Advance authority through the existing authenticated adapter. Begin the database transaction under the established replay-then-database lock order.
3. Obtain the transaction ID from that connection's authenticated identity proof. Bind the authority claim to that exact command and connection. Never preallocate a synthetic transaction ID for this path.
4. Retain the original admission object privately in the signed database bridge. A copied JSON admission must not recreate its identity. Confirmation must validate the same connection, command and claim before any private claim becomes available.
5. Bind that original admission's transaction ID and claim to the already-open gate once. This requires a deferred commit context, replacing the current Node setup's pre-entry `commit` field. No HTTP body, generic observer result or marker file may choose that context.
6. Commit and close the same database connection. Unknown commit, close or reconciliation outcomes hold without reapplying the mutation. Retain the original post-commit/reconciled result through the process protocol rather than reconstructing it from public status.
7. Use the gate's prepared nonce in the existing final signed authority/database/authority inspection. Verify the database's complete committed snapshot, exact original transaction/claim and current owner, not just a reduced projection.
8. Keep the original signed inspection through the original startup permit or consumed renewal handoff. Finish the original gate with that inspection, await verified acknowledgment and clean context exit, then publish/adopt the protected owner.

## Existing contracts to extend

- `local-cvi-database-authority-bridge.ts` already verifies the authenticated transaction binding and authority execution claim. Preserve its original returned admission privately and expose a one-use server-only claim after successful confirmation. Capture the plan, pins, principal and deadline before callbacks.
- `local_cvi_database_adapter.py` already returns only after commit and close; its result still lacks the private original admission/claim handoff needed here. Extend the local composition without learning provenance from a copied public result.
- `local-cvi-transition-port.ts` currently captures an expected commit before entry. Replace that assumption with a mandatory original deferred binding. Do not leave an alternate raw-record or preallocated-ID path in protected composition.
- `local-cvi-startup-checkpoint.ts` already retains the exact prepared signed inspection, once. Reuse it rather than adding another authority read round.
- `local-cvi-checkpoint-credentials.ts` currently calls a synchronous transition finish hook. A process-backed finish needs an awaited hook and must refuse cancellation or lost replies before updating the adopted owner.
- `local-cvi-startup-envelope.ts` registers the owner only after its checks. The mandatory wrapper must additionally require the original gate to have completed; a fake callback or copied status must not brand an HTTP owner.

The separate PostgreSQL signed bridge currently excludes native renewal. Preserve that refusal until the actual local SQL renewal contract and permissions are implemented and tested. Do not silently use the older lease, a reduced target or a raw write instead.

## Evidence that must be added

- Actual connection-derived transaction IDs and claims across commit and close, with full-state comparison afterward.
- Refusal of copied, substituted, unconfirmed, expired or already-claimed admissions.
- Crash/cancellation at gate creation, authority advance, transaction admission, commit, reconciliation, private adoption and finish acknowledgment.
- No protected owner publication after uncertain completion, even if the persistent marker is absent.
- Ordinary replay readers block/refuse; only the original transient gate can inspect under its held lock.
- Complete HTTP exchanges before and after renewal, retaining the fixed 128-row authority cap and all permanent evidence. The existing measured baseline consumes 127 rows, so no new verification round is available.

Independent restore floors, witness-pin composition, universal participating-writer coverage, production clocks and actual provider/device acceptance remain separate unverified gates. No production criterion is closed by this design.
