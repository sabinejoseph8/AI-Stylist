# Refresh encryption key operations

Status: local rehearsal only. No production key is provisioned and no rotation job is enabled.

## Required ordering before activation

1. Provision a distinct new 32-byte key privately, with a new key identifier. Do not reuse an identifier with different bytes. Keep the old key available in every process that may read its envelopes.
2. Deploy the overlapping keyring to readers before selecting the new active writer key. The codec supports at most four keys. A running codec copies its supplied key material; mutating the caller's buffers does not reconfigure that process.
3. Select the new active key for subsequent writes. Existing rows remain encrypted with their original key. The current implementation has no bulk re-encryption command. Normal authorized refresh completion writes the next generation under the active key; this is not permission to refresh credentials solely to migrate keys.
4. Before retiring any key, independently inventory all remaining envelopes, including held, rotating, expired records, replicas and recovery backups. The current metadata discovery RPC does not expose key IDs and cannot prove that retirement is safe. A service-only per-key count contract is now prepared and rehearsed locally (migration 20). It provides point-in-time primary-database counts only; verify concurrent writers and backup dependencies separately before any retirement.
5. Resolve remaining old-key records through an approved migration or confirmed session cleanup. Never clear uncertainty or delete a record just to make inventory empty.
6. Verify replacement processes can read new envelopes after restart. Only retire an old key once the live and backup retention procedure is approved and the inventory evidence is complete. Keep key values out of logs, source control and public documentation.

## Evidence

The isolated PostgreSQL rehearsal uses in-memory fixture keys. It checks overlapping-key reads, fenced next-generation writes under the new key, actual database restart and replacement-store reads with only the new key. Premature retirement cannot decrypt the old row and leaves its ownership blocked rather than releasing a credential. This does not prove production key provisioning, complete inventory, backup retirement or live provider behavior.

## Remaining limitations

Key retirement is operationally incomplete. There is no production key manager, durable migration cursor, approved backup purge policy or cross-system inventory endpoint. A key lost before migration can make stored refresh credentials unrecoverable; recovery requires separately confirmed session cleanup and reauthentication. No seamless recovery promise is made.


## Secret-free key usage inventory, 12 October 2026

Prepared migration 20 and a disconnected bounded store method for per-key counts: total, ready, rotating, held and expired. All ownership rows are included regardless of session state or expiry. Only the service role can call the SQL function. No account IDs, ciphertext, nonces, tags or credentials are returned. Strict shape/count validation rejects errors and malformed data as unconfirmed rather than zero.

All 424 foundation tests across 52 files, type checking and build pass. Isolated PostgreSQL checks verify ordinary-role denial, exact counts, empty-key usage, invalid identifiers, rotating usage during key transition and a held expired record. The full database composition passes with fixture keys and synthetic provider responses. No hosted migration or production key was used. This is point-in-time primary-database evidence only: concurrent writers and backup key dependencies prevent treating zero as automatic retirement permission.

Exact next action: consolidate private Memory with the 424-test checkpoint, then audit remaining local account preparation against the activation checklist. Task 2c and phase gates remain open.
