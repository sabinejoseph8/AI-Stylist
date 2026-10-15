## Later local signed authority contract

See docs/local-tavus-history-authority-contract.md for authenticated fresh-read and conditional-update protocol tests. Signing and independent authority protection remain separate requirements. No real independent backend is selected or activated; authority/floor rollback and malicious generic-writer semantics remain explicit limits.

# Local CVI history rollback witness rehearsal

Sabine approved local preparation/tests on 15 October 2026, with no new spending or hosted changes. This is a disconnected model of an independently preserved authority. The actual witnesses are separate disposable local folders, so their independent protection is an explicit test assumption, not an established production capability.

## Threat and protection boundary

The earlier journals could not detect coordinated rollback of both ledger and checksum files. The protected fixture now requires a separately preserved witness for each replay/credential journal. Each witness binds a pinned witness identity, journal identity, journal kind, increasing epoch and SHA-256 digest of the exact current journal bytes.

Restoring an older valid journal/checkpoint pair no longer passes a protected operation if that witness remains current. The same comparison rejects local edits with a recomputed checksum, swapped journal/witness identities and stale witness reads. There is no cache of a previously acceptable head, automatic rebase or bootstrap during admission.

The witness contains only identities, epoch and digest. It receives no bearer secret, request body, styling note, audio or photo. It is not a provider receipt or final-billing/deletion acknowledgment.

## Conservative write ordering

Protected fixture operations use a consistent lock order: journal lock, then witness lock. Both locks stay held through comparison, mutation and acknowledgment.

1. Read the witness and verify exact current journal digest and pinned identities.
2. Validate the existing journal schema and proposed request, credential or time transition.
3. Persist the witness's next epoch and proposed new journal digest first.
4. Persist the corresponding journal/checkpoint under the existing pending-marker protocol.
5. Return the original exact endpoint acknowledgment only after both writes finish.

This is not a cross-store atomic transaction. It deliberately trades availability for refusal: a crash after witness advancement can leave the witness ahead of the journal, and admission remains held. Failure inside either pending/checkpoint sequence also remains held. No automatic repair, retry, refund, counter reset, rollback acceptance or history pruning is provided.

The epoch increases only on actual journal changes. Credential checks at unchanged time still read and compare the current witness; advancing time persists both the new clock and witness. Expiry and generation/replay caps do not extend.

## Local composition

The journal models accept an explicitly injected witness reference. Existing unprotected modes remain historical comparison fixtures and retain their old negative rollback tests. A new test-only protected bridge requires a witness reference and never falls back when it is missing. It runs fresh Python operations through the same TypeScript endpoint credential/replay ports, preserving exact acknowledgment validation and current-note/cancellation checks.

Protected fixture bootstrap is explicit and allowed only for an empty witness folder against a newly prepared valid journal. Its pinned identities/reference are supplied from trusted fixture setup, never an HTTP request. Bootstrap cannot overwrite or rebase an existing witness. Protected reads/admission never create missing state.

No application entry point imports the bridge or witness store. No real credential, financial ledger, account, backup runtime, scheduler or hosted resource is accessed. The prior stable-scope replay adapter remains test glue; real Tavus request correlation and production cross-store semantics are unverified.

## Evidence

17 new foundation tests use fresh Node/Python processes to exercise protected success/replay, coordinated replay rollback, coordinated credential rollback, both histories rolled back together, missing witnesses, rollback after approval/during delivery, competing workers, stale witness data and interrupted witness/journal writes at every stage. The actual endpoint emits no outfit text on those protected refusal paths.

23 new operations tests cover partial/complete journal rollback, preserved caps and unresolved holds, clock rollback, identity/kind substitution, malformed/missing/shared/symlink witness state, recomputed local checksum, no-op witness stability, disk failure and bootstrap refusal.

All 1,574 foundation tests across 140 files, 331 operations tests with ResourceWarning as error, type checking/build, four encryption tests and 16 local Memory checks pass. The older isolated hosted-schema restore checkpoint and physical-device checks were not rerun.

## What remains unproven

- Rolling back the witness together with its journal still succeeds. Both an operations negative test and an endpoint negative test demonstrate this. Local folders with the same machine/account permissions are not genuinely independent authorities.
- The current code does not establish a trusted external service, protected hardware counter, signed current response, freshness challenge, immutable retention or administrative privilege separation. No such provider/configuration is selected or activated.
- Independently preserved identities and current head are essential. Replacing the witness reference or creating a new empty authority is not permitted recovery. A checksum cannot authenticate a privileged writer who can change all state.
- Filesystem lock/fsync tests do not establish every real disk/power-loss/distributed-worker guarantee. The asymmetric commit can leave a permanent hold; reconciliation requires independently justified evidence and is not implemented here.
- Current authority checks still have the previously documented gap before final byte handoff. This does not recall buffered audio, prove provider quiescence, restore notes or establish full CVI compatibility.
- This journal is request/credential evidence only. It does not activate or replace the existing permanent experiment spending ledger.

Production rollout therefore stays blocked on actual independent authority and the existing live/provider/privacy/spending gates. The $51 allocation and historical held reservations are untouched. Requirements, checklist counts and production architecture are unchanged. Local Memory only is updated; no GitHub or hosted publication occurs.

## Exact next action

Specify the independently protected authority contract and operational ownership needed for real deployment, including pinned identities, fresh head reads, compare-and-swap transitions, privilege separation, unavailable-authority refusal and reconciliation. Review that contract against the existing approved hosting and spending limits before selecting or activating any hosted adapter. Continue to distinguish this conditional local proof from production rollback protection.
