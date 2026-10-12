# Photo-deletion receipt retention proposal

Decision requested from Sabine. Not approved or activated. No hosted customer receipts exist from this preparation.

## Why a receipt exists

If image deletion succeeds but the response is lost, the app needs a small durable receipt to distinguish completed deletion from an uncertain failure. The current local schema keeps an image ID, account ID, opaque Storage key, deletion token and timestamp. It contains no photo bytes, transcript, notebook values or preferences. Only protected server functions can read an owner's receipt; customer direct table access is revoked.

The current local schema retains these records until the account is removed. That is an implementation placeholder, not an approved customer retention policy. Hosted activation is blocked until a policy is agreed and implemented.

## Proposed policy

1. Keep the full technical deletion receipt for seven days after deletion.
2. After seven days, remove the Storage key, deletion token and receipt timestamp. Keep only a retired image ID linked to the account, until account deletion, to prevent that ID from being reused accidentally.
3. Delete the retired-ID record when the account is deleted. Do not keep image bytes, notes or conversations for recovery.
4. A retry after the full receipt has expired must not invent proof of deletion or recreate the old image. Return a safe unavailable/uncertain state if the remaining evidence cannot establish the result.
5. Keep expiration separate from image deletion: purging a technical receipt must never delete a still-used image or authorize new uploads. Do not add a paid service for this work.

Seven days provides a bounded window for delayed retries while limiting detailed technical metadata. This is a proposed engineering/UX tradeoff, not a legal retention recommendation or a promise about provider backups.

## Implementation after approval

- Add a minimal owner-scoped retired-ID ledger and preserve the existing no-reuse trigger.
- Add a restricted, bounded cleanup function driven by the approved policy; no browser may call it.
- Verify before/at/after cutoff, owner isolation, repeated cleanup, account-deletion cascade and no reuse after receipt expiry in local PostgreSQL.
- Verify that expired/missing proof keeps reconciliation pending rather than claiming success.
- Update the privacy design and launch checklist. Actual hosted scheduling/deployment remains subject to Phase 1 and existing security approvals.

Alternative: Sabine can choose another duration or ask to redesign recovery with less retained metadata. No routine technical choice should silently change the agreed privacy policy.
