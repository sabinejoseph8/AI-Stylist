## Durable replay follow-up, 16 October 2026

Startup and continuation now require fresh durable replay inspection, including retained pending evidence across new coordinators. This complements the volatile idle flag but does not establish all-writer quiescence. See [replay inspection](local-tavus-replay-inspection.md) and the next [owner-fenced mutation contract](local-tavus-owner-fenced-replay-contract.md). No production acceptance or hosted change is implied.

# Local conversation exchanges across renewal

Disabled local composition only. No real voice/model/provider request, hosted change, credential lookup, deployment or spending.

## Connected path

The authenticated notebook's native owner pin now changes through the original renewal handoff. Ordinary pin reads cannot make that change. The guard checks the candidate complete state and endpoint credential, consumes its transient authorization, then the notebook claims that consumed handoff once before adopting the new pin.

The same notebook, transcript source, HTTP adapter, credential binding and replay journals remain in use. Input epoch and revision keep their original meaning; a native lease renewal does not invent a customer turn or confirm a preference.

## Coordination

- HTTP continuation checks the bound application identity before beginning. The notebook verifies live identity throughout the candidate checks. Subsequent HTTP requests still reauthorize their input.
- While continuation is active, new HTTP recommendation requests receive a known busy refusal before body or turn permission is spent. This does not refund or replay a previously admitted request.
- Ordinary notebook commands arriving during the native transaction wait through a bounded gate. The coordinator retains an inspection slot so waiting reads cannot starve completion.
- After verified adoption, commands resolve the current pin inside the serialized inspection, avoiding a captured old expiry.
- A caller explicitly requesting an old pin is refused without closing newer notes. A changed or invalid actual backend proof still holds the context.
- Busy or unresolved HTTP delivery cannot start renewal. Unknown native commit/adoption and revoked identity hold output and preserve technical evidence.

The gate is volatile. It is not independently durable startup quiescence across the native, credential and replay stores. Existing journal replay protections remain required after a restart.

## Privacy and limits

Unsaved notebook notes and transcript text remain session memory. Authenticated Clear/End use a dedicated cleanup slot and do not wait for a native lease read or transition. End immediately closes memory and releases waiting work as refused. A native transaction already in progress may still commit; its result remains held and cannot reopen that session. Observed expiry uses the existing cleanup boundary. No profile, photo or conversation storage is added. A failed owner transition clears its volatile context through the existing hold behavior without erasing native claims or reservations.

These tests use actual local signatures, SQLite transitions and protected journals with synthetic account, transport admission and model responses. Native observer transaction labels remain fixtures. Controlled clocks do not prove latency, native production clock mapping, independent restore floors, universal writer fencing or real Tavus behavior.

The integration fixture uses the existing configurable eight-second transcript deadline to allow local process/signature work during adoption. The production default remains unchanged. No renewal scheduler, provider retries, room lifecycle change or new trial allowance is activated.

## Verified local evidence

- 2,365 foundation tests across 172 files pass, including 13 new continuing-HTTP cases.
- 489 operations tests pass with ResourceWarning as an error.
- Type checking, build, four encryption checks and 16 local Memory checks pass.
- The updated notebook suite passes 25 cases, including immediate Clear and late-read safety.
- No SQL contract changed. The earlier 556-check PostgreSQL result was not rerun in this turn.

No phase task or production criterion is marked complete from these local results.

## Next action

Verify durable pending-reservation evidence for startup/adoption instead of inferring cross-store quiescence from the in-memory idle flag. Preserve exact original claims, monotonic floors and native/HTTP limits. Continue documenting remaining real transport, hosting, privacy, financial and device acceptance gates before proposing activation.
