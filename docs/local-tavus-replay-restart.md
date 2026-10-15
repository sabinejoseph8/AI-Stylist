# Local CVI replay protection across restarts

Sabine approved local preparation/tests on 15 October 2026, with no new spending or hosted changes. This is a disconnected experiment, not a hosted endpoint or new production policy.

## Implemented contract

The local endpoint now accepts a metadata-only replay port. The explicit `createLocalCviRestartEndpoint` factory requires that port and refuses missing storage rather than falling back to the earlier volatile Set. The original factory remains a disconnected volatile fixture unless a port is explicitly supplied.

A server-owned binding digest covers fixed origin, conversation, injected high-entropy fixture credential and expiry. The request ID is hashed before storage. The port sees only store identity, those two digests, server time and an opaque receipt. It receives no bearer credential, request body, prompt, styling notes, audio or customer identifier.

1. After authentication and before body/draft work, reserve the request durably.
2. Require an exact committed acknowledgment matching store, binding, request digest, time, status and opaque receipt.
3. Buffer and independently check the complete reply as before.
4. When response bytes are actually requested, atomically spend the receipt before releasing text.
5. Require the exact spent acknowledgment, then recheck cancellation, expiry and current notes before handing bytes to the response stream.

A missing, malformed, mismatched, failed, late or timed-out acknowledgment releases no text. There is no retry/refund/reseed. If a timeout occurred after a write committed, its evidence stays conservative. Consumed permission is not a heard-reply, playback-end, provider-cleanup, billing-finality or deletion acknowledgment.

## Disposable journal

`tools/operations/local_cvi_replay.py` uses the existing owner-only file, nonblocking flock, fsync, pending-marker and checksum/checkpoint primitives in new temporary fixture folders only. It never opens an existing account, backup runtime, credential, financial ledger or hosted database. Fixture preparation must be explicit and cannot overwrite an existing folder.

The journal binds store and conversation configuration, preserves an absolute fixture expiry and monotonic observed clock, and retains at most 64 requests (or a smaller injected fixture cap). Each record has only request digest, opaque receipt, reserved/spent state and timestamps. Reserve and spend are serialized across processes. Duplicate IDs and consumed receipts are permanently refused within the preserved fixture history. Counts do not refund on failure, cancellation or restart.

A reserved request blocks all subsequent reservations, including new IDs, until it is spent through its original exact receipt. A crash during body/draft/check or before consumption therefore holds future work. No automatic reconciliation or recovery capability is introduced. A crash after spending but before delivery keeps that ID spent, even if no bytes reached the caller. New IDs after a spent record may be admitted; this is request replay evidence, not revocation of every old conversation credential or proof the earlier worker/provider is quiescent.

Missing/invalid/shared/symlink state, checksum mismatch, one-sided rollback, interrupted writes, disk errors, expiry and clock rollback refuse future work. A leftover pending marker is not repaired or deleted by admission.

## Evidence

42 new foundation tests comprise 19 real-process cases and 23 port/acknowledgment cases. Fresh Node workers and Python storage processes test success/replay, crash after reservation, crash after spend before output, concurrent workers, the last remaining slot, interrupted reserve/spend writes at each durable stage, missing/damaged state and unchanged counts. Injected-port cases prove ordering, exact acknowledgment binding, metadata privacy, canceled late acknowledgments and correction during consumption. Missing replay storage cannot silently choose volatile operation.

15 new operations cases test replay receipts, unresolved holds, caps, clock/expiry, store/binding/request/receipt substitution, invalid schemas, disk error markers, one-sided rollback, symlinks and private schema. Tests use public synthetic credentials and disposable folders, then remove them. No live provider or physical device is contacted.

All 1,514 foundation tests across 137 files, 293 operations tests (ResourceWarning treated as error), type checking/build, four encryption tests and 16 local Memory checks pass. The older 183-check isolated hosted-schema restore checkpoint was not rerun. No manual check is claimed for this server-only fixture.

## Explicit limits

- Coordinated rollback of both valid files is still accepted, demonstrated by a negative test. A checksum is not an independent monotonic authority or protection against a privileged writer. The SHA digest of high-entropy credential binding is not a public credential and should not be exposed; low-entropy real secrets are not acceptable.
- The journal does not revoke a previously issued credential or authenticate Tavus itself. Store identity/configuration must be preserved independently. A new empty store with a new identity is not a permissible history reset.
- Recreating the owner does not reconstruct styling notes. Actual current confirmed context, durable experiment admission, fresh/revoked-on-restart credentials, consultation fencing and production history/retention remain separate gates.
- Storage primitives are shared test helpers, not a production backend with demonstrated crash/power-loss/backup restoration guarantees. No distributed hosted adapter or independently protected retirement authority is implemented.
- Tavus request-ID, retry, transcript and header compatibility is still unverified. Repeated content under distinct IDs is not identified by this request-ID journal. Physical playback may continue after approved text has left our app.
- Production request metadata retention has not been selected by these fixture counts/expiry. Existing financial limits, seven-day backup privacy policy, provider exclusions and held trial reservations are unchanged.

## Exact next action

Review a disconnected consultation-owner lifecycle that invalidates old credentials after restart and preserves authoritative experiment admission before any live activation. Define how current notes are recovered or explicitly cleared. Then verify actual account/full-CVI capabilities and permitted non-ElevenLabs voice, prepare a bounded trial cost and obtain financial/private activation approval. Do not mount this fixture as a live endpoint.
