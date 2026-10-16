## Durable replay follow-up, 16 October 2026

Startup and continuation now require fresh durable replay inspection, including retained pending evidence across new coordinators. This complements the volatile idle flag but does not establish all-writer quiescence. See [replay inspection](local-tavus-replay-inspection.md) and the next [owner-fenced mutation contract](local-tavus-owner-fenced-replay-contract.md). No production acceptance or hosted change is implied.

## Local HTTP composition follow-up, 16 October 2026

The authenticated notebook/transcript and static-header HTTP path now coordinates idle adoption through a verified context transition. Incoming HTTP work is refused before replay admission; bounded notebook input resumes using the adopted pin. Authenticated Clear/End have a separate immediate cleanup path. See [continuing HTTP evidence](local-tavus-continuing-http.md). The original next-action and test-count sections below describe earlier checkpoints. Durable cross-store pending evidence, production clocks and real provider acceptance remain open.

# Local authenticated owner continuation

Disabled local server composition only. No route, scheduler, provider call, account credential, deployment or spending is activated.

## What changes

A successfully started owner may adopt a native renewal at an idle boundary. Its endpoint object, credential binding, notebook flow and replay storage remain the same. The native grant retains its owner, boot and generation while rotating its private writer token. The guard adopts the new expiry and signed revision only through the original one-use in-memory handoff.

| Boundary | Behavior |
| --- | --- |
| Request or proof already active | Refuse continuation before mutation |
| Unresolved native reservation | Refuse continuation, including after cancellation |
| Original owner expired | Hold; never revive it from a newer grant |
| Application cap reached | No renewal is needed or attempted; the existing owner remains bounded by that cap |
| Unknown commit or adoption | Hold the owner; retain native state and replay evidence |
| Valid idle continuation | Invalidate prepared text, verify exact new state and adopt once |

## Required evidence

1. The old guard verifies the current owner and endpoint credential before beginning the transition.
2. A separate continuation port binds the original lease, credential binding digest and immutable application cap. It verifies a fresh signed authority baseline.
3. The trusted planner creates an exact `renew` intent with bounded duration and a new token selected once. The mandatory adapter must complete the claimed native transaction and reconciliation.
4. Another fresh signed authority read must match the exact target at the expected revision.
5. The guard independently inspects the new complete owner checkpoint before and after another endpoint credential proof.
6. The original transient handoff is consumed before the old owner's expiry and evidence deadline. Copies, altered scope, replay, cancellation or backward observation time do not authorize adoption.

The native lease stays private inside the continuation port. It advances internally only when the handoff is consumed, supporting later distinct renewals without recovering a token from stored history. The application cap is clamped into each request even if the native domain cap is later. Nothing increases the eight-second grant maximum or chooses a production consultation duration.

## Output and replay handling

An open session is distinct from draft readiness: pending extraction does not end the owner or clear newer notes. Only an ended session invalidates that lifecycle check. The styling flow invalidates prepared text before the native call and again before adoption. Old request-version records remain stale after the revision advances. A new successful turn uses the same endpoint and retained replay records; an earlier request ID stays refused.

Idle means more than no current HTTP request. The endpoint records whether reserve or consume work has an unresolved outcome. Canceling a prepared response does not clear that evidence, refund its reservation or permit a lease change. In-flight or unresolved HTTP work must finish safely or remain held; this implementation does not transparently renew through it.

Incoming requests during adoption cannot use the paused guard. A concurrent higher-level HTTP wrapper may conservatively hold the consultation if it cannot classify that result. Provider request scheduling, wrapper-level coordination and a renewal scheduler remain unimplemented.

## Evidence limits

Tests compose actual local signatures, authority state, SQLite transitions, credential/replay journals and full checkpoint inspection with controlled clocks. Account identity, observer transaction labels and model behavior remain fixtures. This is not a real SQL commit-identity proof, independently administered recovery service or live Tavus acceptance.

The PostgreSQL contract still refuses renewal. The unsettled flag is instance-local. Cold-start admission does not inspect every historical replay reservation; persistent replay still blocks unsafe delivery, but universal cross-store startup/adoption quiescence is not proved. Production clock mapping, universal writer fencing, independently protected restore floors, native observer markers, transport correlation and physical-device acceptance remain open. No provider buffer flush, deletion, billing finalization or remote cancellation guarantee is implied.

## Verified local evidence

- 2,352 foundation tests across 171 files pass, including 18 new continuation cases.
- 489 operations tests pass with ResourceWarning treated as an error.
- Type checking, build, four encryption checks and 16 local Memory checks pass.
- The final focused run passes 79 cases across continuation, current-owner and notebook context.
- PostgreSQL's prior 556-check result is unchanged and was not rerun for this TypeScript-only composition change.

An intermediate full run was stopped to fix the session-lifetime/readiness distinction; it is not counted as a passing run. The corrected full suite completed successfully. No phase task or production acceptance criterion closes.

## Next action

Connect the continuing owner to the actual authenticated notebook/transcript and static-header HTTP composition. Test complete exchanges across renewal, preserve note and body/turn replay state, and classify requests that arrive during adoption without reconstructing permission or clearing newer input. Keep real activation, financial/privacy and hosted acceptance gates closed.
