# Photo-deletion receipt retention proposal

Approved by Sabine on 11 October 2026. Implemented and tested locally in migration 014. Hosted activation and maintenance scheduling remain gated; no hosted customer receipts exist from this preparation.

## Why a receipt exists

If image deletion succeeds but the response is lost, the app needs a small durable receipt to distinguish completed deletion from an uncertain failure. The current local schema keeps an image ID, account ID, opaque Storage key, deletion token and timestamp. It contains no photo bytes, transcript, notebook values or preferences. Only protected server functions can read an owner's receipt; customer direct table access is revoked.

Migration 014 replaces the earlier until-account-deletion placeholder for detailed receipts. A separate ledger holds only image ID and account ID. Detailed receipts stop proving deletion at the seven-day boundary even if maintenance is delayed. Hosted launch requires a scheduled cleanup and monitoring so expired details are physically removed.

## Approved policy

1. Keep the full technical deletion receipt for seven days after deletion.
2. After seven days, remove the Storage key, deletion token and receipt timestamp. Keep only a retired image ID linked to the account, until account deletion, to prevent that ID from being reused accidentally.
3. Delete the retired-ID record when the account is deleted. Do not keep image bytes, notes or conversations for recovery.
4. A retry after the full receipt has expired must not invent proof of deletion or recreate the old image. Return a safe unavailable/uncertain state if the remaining evidence cannot establish the result.
5. Keep expiration separate from image deletion: purging a technical receipt must never delete a still-used image or authorize new uploads. Do not add a paid service for this work.

Seven days provides a bounded window for delayed retries while limiting detailed technical metadata. This is a proposed engineering/UX tradeoff, not a legal retention recommendation or a promise about provider backups.

## Local implementation and remaining activation

- Add a minimal owner-scoped retired-ID ledger and preserve the existing no-reuse trigger.
- Add a restricted, bounded cleanup function driven by the approved policy; no browser may call it.
- Verify before/at/after cutoff, owner isolation, repeated cleanup, account-deletion cascade and no reuse after receipt expiry in local PostgreSQL.
- Verify that expired/missing proof keeps reconciliation pending rather than claiming success.
- Update the privacy design and launch checklist. Actual hosted scheduling/deployment remains subject to Phase 1 and existing security approvals.

The protected cleanup function accepts a batch size from 1 to 1,000, uses locked batches with skip-locked handling, and is executable only by the service role. It never touches live image rows or Storage objects. The minimal retired-ID table has no direct customer or service-role table access. No scheduler or hosted migration has been activated.


## Concurrent receipt maintenance evidence, 11 October 2026

The local PostgreSQL rehearsal now runs eight cleanup transactions across four workers with a two-receipt batch limit. Exactly seven expired synthetic receipts are removed; every result respects the batch limit. Recent receipts, the live-media count and all minimal retired IDs remain unchanged. Anonymous callers, null limits and limits over 1,000 are denied; repeated cleanup returns zero. The full local protection rehearsal passes. No production cleanup scheduler has been installed.
