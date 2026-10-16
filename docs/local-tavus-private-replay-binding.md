# Local original private replay handoffs

This is disabled local preparation, not live activation or completion of the broader owner-fenced contract. No provider call, real credential, hosted change or new spending is included.

## Original startup permission

A successful durable startup admission now retains its original execution lease in an internal WeakMap keyed by the original public permit object. The public permit still contains no private token or lease. An internal one-use claim checks the exact original input, unchanged public permit, proof expiry, monotonic observation and live cancellation state before transferring that private lease.

JSON, object copies, persisted observer state and another port cannot reconstruct this identity. Claiming the same original permit twice does not grant another binding. Losing the original handoff across a process restart remains a held outcome, not an automatic lease-recovery path.

## Credential-bound private port

`createLocalOwnedReplayPort` captures the actual credential binding. Both the binding digest and the absolute application cap are derived from those same primitives, rather than accepting an independently chosen cap. The port exposes only replay methods and its store ID; internal controls require its original object identity.

Before binding, reserve/consume refuse. Once bound, backend calls receive a private copy of the original native lease and retained revision floor through trusted server configuration. Requests remain restricted to the original replay scope. A consume requires this instance's original reservation acknowledgment; inspected or reconstructed receipts cannot replace it. Attempts and pending state are not refunded.

Cancellation, unknown results and failed binding/adoption hold this port. Holding it aborts active local work and drops its private lease reference. It does not prove remote termination, erase durable records or revoke every other possible grant. Backend completion may remain uncertain, so original durable evidence is preserved.

The backend is trusted server configuration. The factory's object identity does not independently prove that an arbitrary backend implements physical native locking; the actual integration fixture uses the previously tested guarded Python/native path.

## Original renewal adoption

A renewal handoff retains the new private lease internally. Replay adoption requires the original handoff after the current-owner guard has consumed it. A separate one-use replay claim checks the exact before-state and deadline, without exposing a token on the public handoff. Unconsumed or copied handoffs cannot adopt.

The private port refuses adoption while work is busy or a reservation is pending. The new grant must retain native store, policy, generation, owner and boot, rotate its token, strictly advance expiry and remain within the unchanged credential-bound application cap. Native expiry remains enforced independently of the longer application cap.

## Actual exchange and timing evidence

A disposable controller binds the original startup permit before public cloning, then adopts the original consumed renewal in the continuation finish hook. The actual endpoint completes guarded reserve/consume on both sides of native renewal. The backend's new token is required after renewal even before the old expiry.

An initial near-expiry exchange correctly refused when only 250 ms remained for the signed write checks. The verified exchange runs earlier in the valid window, with separate expiry/refusal coverage. No native lease maximum, timer or application cap was increased. Controlled local clocks and a passing exchange do not establish production latency or an 85-second consultation.

## Remaining mandatory composition

This layer is not yet required by every general startup/HTTP composition. The next change must preserve the original permit before cloning, bind it through the private layer, adopt only the original consumed renewal, retire the private port on startup failure/End, and reject a plain port before privileged work. Existing lower fixture helpers are not activation authority.

After that migration, the transition-wide replay/authority gate and persistent original-operation marker remain required. Independent administration/restore floors, universal writer coverage, production clocks and actual provider/device acceptance stay open. No phase or launch criterion closes.

## Verification

Final verification passes 2,434 foundation tests across 176 files, 518 operations tests with ResourceWarning as error, TypeScript checking/build, four encryption checks and 19 refreshed local Memory checks. No SQL contract changed; the prior 556-check PostgreSQL result was not rerun. Fifteen focused cases cover original/copy identities, replayed claims, scope/cap substitution, pending work, cancellation, expiry, original receipt ownership and the actual endpoint exchange. Earlier failed timing scenarios are not counted as passed.
