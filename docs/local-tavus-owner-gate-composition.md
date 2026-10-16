# Next local integration: original gate through owner publication

Implementation notes, 16 October 2026. This continues authorized local preparation. It is not completed implementation, deployment approval or a new acceptance gate. Preserve the PRD, existing read/deadline limits and all production acceptance requirements.

## Preserve the existing read sequence

The complete two-turn/renewal baseline already uses 127 of the fixed 128 authority records. Replace the existing last inspection with the prepared final inspection. Do not add another authority read round, drop earlier checks, reset records or shorten the exchange.

Only the final inspection uses the gate's prepared challenge domains. Earlier inspections must keep their independent fresh challenges. Reusing the prepared domains for both checks around the credential proof would repeat challenges and must refuse.

## Concrete source changes

| Existing source | Required integration |
| --- | --- |
| `local-cvi-startup-admission.ts` | Capture the original execution result before public cloning. Retain its original gate and committed/reconciled receipt in the private permit record. Validate the public lease independently. A plain reconstructed lease cannot substitute for this private context. |
| `local-cvi-owner-continuation.ts` | Retain the same original execution context with the one-use renewal handoff. Keep original consumption and replay-adoption checks. The consumed handoff must still identify the same operation, target and gate. |
| `local-cvi-owned-replay.ts` | During the transition, inspect through that original held gate rather than reacquiring its lock. Match the immutable application/native/physical replay scope. Retirement must hold/close the active gate without deleting uncertain markers or permanent evidence. |
| `local-cvi-checkpoint-credentials.ts` | Preserve the original last signed inspection privately before cloning its public summary. First inspection remains fresh and ordinary; last inspection uses the prepared domains once. Await original gate finish before returning renewed owner state. The async await boundary is already implemented, but its structural hook is not proof of mandatory gate composition. |
| `local-cvi-startup-envelope.ts` | Complete the same original startup gate after all credential/native checks and before protected registration. Cancellation, expiry, a lost reply or failure after private binding must retire the controller and temporary flow. |
| `local-cvi-startup-owner.ts` | Require the paired original gated admission/replay context before privileged work and protected publication. A fake finish callback, plain port or copied status must not brand an HTTP owner. Keep legacy lower-contract harnesses explicitly disconnected. |

The producer must enter the gate before authority advancement, retain its original confirmed admission, commit and close the same connection, and preserve the original committed receipt. A generic observation or public success record does not recreate that producer context. Final signed verification must still match the exact original transaction, claim and complete target.

## Renewal prerequisite

Local renewal is now prepared and passes 638 isolated PostgreSQL checks, including the continuous six-step sequence. Its original gate-to-PostgreSQL-to-owner composition is still incomplete. Preserve the tested renewal restrictions when wiring that producer. Restrict it to the rotator and full-state execution path; keep direct reduced writes revoked. Verify same owner/generation/boot, a new token hash, advancing expiry, unchanged domain content and the exact original connection/claim. Do not silently reuse the old lease or weaken the target to its reduced projection.

Use the existing reproducible local harness in `tools/operations/rehearse-cvi-transactions.py`, with its opt-in synthetic flags, pinned cached PostgreSQL image, `--pull=never`, `--network none`, temporary storage and cleanup. Do not touch hosted credentials, production containers or backup runtime/schedules. Current PostgreSQL evidence remains historical until an actual new run succeeds.

## Required evidence

Test original startup and consumed-renewal handoffs, copied/expired/substituted contexts, failure at each commit/adoption/finish boundary, ordinary readers blocked by the held gate, immediate End/Clear, and complete HTTP exchanges before and after renewal. Publication must follow verified finish and actual context exit; absence of a marker alone never restores permission.

Witness-pin composition, independently protected restore floors, universal participating-writer coverage, production clocks and live provider/device acceptance remain separate open requirements. This design does not claim that a local folder, SQLite marker or fixture protected flag proves hosted isolation.
