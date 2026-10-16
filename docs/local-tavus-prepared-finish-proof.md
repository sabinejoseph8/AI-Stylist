# Local prepared signed finish proof

This is disabled local preparation. It does not publish a protected owner, create a room, load account credentials, call a provider, change hosting or authorize spending.

## Prepare once, finish later

The original Python gate now requires `prepare_finish()` before `finish()`. It issues one nonce bound to the original operation, scope, target and unchanged expiry. Duplicate preparation or finish without preparation holds the handle. Read-only gate inspection may continue between preparation and finish; the stored marker still contains no native token or reconstructible nonce capability.

The configured proof source/verifier receive copies of the same original prepared record. They cannot replace its challenge or extend its lifetime. Copies, cancellation, clock regression, expiration, unknown completion and process loss retain the existing refusal/uncertainty rules. Ordinary journal reads are never a fallback for inspection under a held gate.

## Exact signed final inspection

The final native inspection derives separate authority-before, database and authority-after challenge domains from the prepared nonce. Existing before/after authority and complete database checks remain. This inspection still consumes exactly two authority request records; offline finish verification adds none.

Only the original successful inspection object and unchanged original server binding can claim its retained signed packet, once. An ordinary summary, JSON copy, copied binding, canceled result or expired proof cannot reconstruct that claim. Retained evidence is private, not attached to the public read-only result.

## Pinned verification

Trusted server configuration supplies the original marker, native plan, writer/reader principals, distinct authority/database public keys, expected active owner and original committed transaction/claim. No pin is selected or learned from incoming proof data.

The verifier checks:

- Exact original operation and full plan/target digests, fixed scope/cap and prepared challenge.
- Real Ed25519 signatures with distinct pinned keys and exact namespace/reader/revision.
- Original transaction ID and claim hash, consumed/protected status and complete native logical state.
- Active generation, owner, boot, original target token hash, issue time and expiry.
- All three challenge domains and timestamps, including the earliest signed-proof expiry.

A validly signed receipt for a different transaction, claim, operation or state still refuses. The returned four-field verification result is not a lease, resume flag, owner identity or permission to publish.

## Process verification

The disposable process bridge captures its verifier context before reporting ready. Later messages carry only the one proof packet and cannot replace pins or native plans. It uses the actual Python gate and this signed verifier. A successful acknowledgment is emitted only after leaving the lock context, and its caller also waits for clean process exit.

Tests exercise real signatures and actual SQLite state. They cover copied claims, invalid scopes/keys, altered but re-signed database evidence, old challenge domains, cancellation/expiry, a later same-owner native write, lost finish replies and a supervised stalled caller. Observer transaction labels remain fixture markers rather than verified hosted SQL identities.

These are signed finish-boundary tests after an existing native startup. They do not yet prove that the gate was mandatory from before native commit through original private adoption and protected publication. The supervised client is currently a test helper, not the configured production-candidate Node gate port. Production clock mapping and all-writer/independent administration coverage remain open.

## Current verification

Final foundation regression passes 2,461 tests across 180 files, including 14 new signed finish-proof cases. All 564 operations tests pass with ResourceWarning as error, including 40 gate cases. TypeScript checking, client build, four encryption checks and 19 refreshed local Memory checks pass. The earlier focused run also passed 42 new/legacy checkpoint cases before the final metadata-clock refinement; the full result covers that final source. No SQL contract changed; the prior 556-check isolated PostgreSQL result was not rerun. Neither broad phase acceptance nor actual provider/device behavior is established.

## Next integration

Create the private supervised Node gate port, preserving original object identity, absolute native/application deadlines and refusal on unknown replies. Connect the prepared final inspector to original startup/consumed-renewal adoption. Keep original signed evidence privately through that adoption, finish with the same packet, and require verified context exit before protected publication. Do not add another authority read round or widen the fixed 128-record cap; the complete two-turn/renewal baseline uses 127 records.

Original transaction/claim provenance, mandatory coverage of every participating writer, independent restore floors and actual provider/device acceptance remain required. Existing spending, privacy and hosted-change limits are unchanged.
