## R2 activation and prepared usage guard

Sabine completed Cloudflare payment setup herself and reaffirmed the 10 GB/no-overage constraint. Read-only dashboard verification confirms R2 subscription active and overview shows no buckets, 0 B storage and $0 billable usage at inspection. Cloudflare budget alerts explicitly do not cap or pause usage. No provider-enforced 10 GB cap is established. No payment identifiers or account contact details are retained here.

Prepared tools/operations/backup_quota.py as a local admission owner for the future backup runner: 9,000,000,000 decimal-byte conservative ceiling, 900,000 Class A and 9,000,000 Class B requests. These are engineering margins below the approved free allowances. Private SQLite transactions serialize reservations before callback execution; failed operations retain their reservations. Missing/corrupt/stale baselines, backward time, period changes, invalid inputs and capacity exhaustion refuse operations. Initial baseline creation cannot overwrite an existing ledger. Ten new tests cover concurrency, failure retention, storage/operation boundaries, permission mode and unavailable evidence; all 40 operations unit/invocation tests pass.

This is local preparation, not active cloud enforcement or proof of zero charges. Created the empty ai-stylist-private-backups bucket using Standard class and automatic location (Eastern North America). Verified public development URL disabled, no custom domain and 0 B stored. No R2 credential, upload, scheduler or usage baseline was created. The R2 token inventory is empty. The runner, trustworthy account-wide baseline/reconciliation, monitoring, encryption/key custody and recovery integration still need completion. Other credentials or dashboard operations bypass this local owner. The current owner deliberately holds after a five-minute baseline age or a billing-period transition rather than resetting allowances. Do not silently reset it to enable more work. No reduction of retained valid backups is authorized merely to fit capacity.

Exact next action: prepare the private bucket and least-privilege credential handoff; finish the sole-writer runner and authoritative account-wide usage reconciliation before any backup upload. If a provider-enforced zero-charge guarantee is mandatory, R2's active usage-billed subscription cannot presently establish it. Full Task 8d remains open.

Source: https://developers.cloudflare.com/billing/manage/budget-alerts/ (reviewed during setup).

## Approved R2 free-allowance constraint

Sabine selected Cloudflare R2 and will create the account herself. MVP backup storage must stay within the free 10 GB allowance; no R2 overage spending is authorized. R2 Standard's published allowance is 10 GB-month per month, with one million Class A and ten million Class B operations. Request limits matter independently of stored bytes. Account-wide consumption, overhead, incomplete uploads and concurrent writes must be included before admission; unknown usage must stop new backup writes and alert the operator. This control is required preparation, not implemented or verified protection against charges. Cloudflare's free allowance must not be represented as an automatic hard billing cap.

Use a conservative capacity margin below 10 GB total stored backup data. Count all retained copies, manifests, encrypted overhead and recovery evidence, not only current wardrobe originals. Do not delete needed valid recovery points early to make room or silently weaken the approved recovery target. If capacity blocks a fresh backup, report that recovery freshness is at risk and request a business decision. Keep existing seven-day maximum and deletion reconciliation requirements. No billable scheduler, paid upgrade or source-transfer overage is authorized by this decision.

Exact next action: Sabine creates her Cloudflare account and reports when ready. Then inspect R2 activation terms and existing account usage, configure the private destination and credentials through the authorized handoff, and finish/test capacity and operation guards before enabling uploads. No account, credential, subscription or photo backup has been activated by recording this decision.

# Backup and recovery plan

Status: planning authorized by Sabine on 14 October 2026. Sabine approved the three targets below on 14 October 2026. No backup job, new storage, paid add-on, credentials, restore or customer deployment is activated. Full Task 8d remains open.

## Approved initial targets

| Decision | Approved planning baseline | Meaning and limitation |
| --- | --- | --- |
| Saved-data recovery point | At most 24 hours of lost saved changes | Applies jointly to preferences, Wardrobe photos/descriptions, saved looks and shopping lists. Daily database backups alone do not establish this target. A failed or overdue backup breaks it. |
| Recovery time | Within 48 hours of incident declaration | Includes data and image restoration, identity/access checks and deletion reconciliation before reopening. Record outage onset and detection delay separately. This is an internal target pending a timed drill and available operator, not a customer SLA. |
| Recovery history | Seven days | Approved rolling maximum for app-managed backup copies, including clothing photos. Provider backup windows must be checked separately. Deleted data can remain in restricted backups until expiry, but must never be served after restore. |

Alternative: a tighter saved-data target such as one hour and a shorter recovery target require a different design, staffing and cost assessment. Do not assume a database PITR add-on protects image files or achieves app-wide recovery. No purchase is proposed until actual requirements and costs are reviewed.

Sabine explicitly accepted up to 24 hours of lost saved changes, restoration within 48 hours of incident declaration, and up to seven days of protected backup retention including deleted clothing photos. These are approved targets, not demonstrated capabilities. Deleted items must remain excluded from restored customer access.

## Verified provider capability and account inspection

Supabase documents daily database backups with seven days accessible on Pro. Storage object bytes are excluded. Project deletion also removes provider backups. Restores cause downtime; duration varies. PITR is an optional paid feature with compute requirements. These documentation facts are supplemented by the account inspection below. [Supabase database backups](https://supabase.com/docs/guides/platform/backups), reviewed 14 October 2026.

A complete recovery must also address roles, managed Auth, Storage and configuration differences. Use the current provider instructions when preparing a specific restore; a logical database dump is not a full project clone. [Supabase backup and restore guide](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore), reviewed 14 October 2026.

## Actual backup setup inspection, 14 October 2026

Sabine authorized proceeding with actual backup setup. Read-only inspection of the AI Stylist Supabase dashboard confirms six scheduled physical database restore points dated 9 through 14 October 2026. The newest is 14 October 2026 at 13:52:01 UTC. The dashboard states daily backups and explicitly excludes Storage object bytes. The existing Storage inventory lists stylist-wardrobe with a 10 MB limit and JPEG/PNG/WebP types; its contents were not downloaded or inspected. No restore, new backup, credential, paid add-on or setting change was performed.

Database backups already run; complete application backup activation remains incomplete. Next action: identify Sabine's existing independent storage account, then finalize a private encrypted destination, separate key custody, aligned database/object recovery points, current deletion/reservation evidence and alerts. Sabine confirmed no separate storage account exists. No new provider or spending is assumed from general setup approval. Full Task 8d remains open.

A possible independent destination is R2 Standard, pending account selection and authorization. Its published free tier includes 10 GB-month storage, one million Class A and ten million Class B requests monthly; overages are billable. This is not a guaranteed free complete backup system: source egress, scheduler and key management must also be costed. No account or resource has been created. Source: https://developers.cloudflare.com/r2/pricing/ (reviewed 14 October 2026).

## Independent backup account prerequisite

Sabine confirmed she has no separate S3, R2 or B2 account. The proposed destination is a private Cloudflare R2 Standard bucket, selected by Sabine with a free-allowance-only MVP constraint; account activation is pending. Existing app hosting stays on Render/Supabase. R2 activation requires checkout; its free allowance is not a hard spending cap. Do not activate billing, create credentials or upload customer data on the strength of the general backup setup approval.

Proposed protection: encrypt backup sets before upload using an established authenticated-encryption tool, store recovery key material separately from the bucket, restrict the backup credential to its bucket, disable public access and retain only persistent approved data. A worker must verify completed sets, remove expired copies and alert on failure. R2 lifecycle deletion is asynchronous and typically follows expiration within 24 hours, so a seven-day lifecycle rule alone cannot prove the approved seven-day maximum. Use earlier scheduled deletion with verified results and lifecycle protection; retain this as an unverified target until the real expiry drill passes. Missing deletion/financial evidence prevents promotion of restored data.

Published R2 Standard allowances: 10 GB-month storage, one million Class A and ten million Class B operations monthly; standard storage beyond the allowance is $0.015/GB-month. Source transfer, execution, key custody and alerts require a complete cost assessment before activation. Seven full daily copies of a 1 GB source would use roughly 7 GB before database exports, metadata and overhead; this is an illustration, not a measured forecast. No amount or billing authorization is inferred.

Next user action: create the selected Cloudflare account and complete account/password/terms/payment entry personally. Before billable activation, agree a concrete monthly allowance and verify current checkout terms. Before real uploads, complete the encryption, coordinated snapshot, durable evidence, monitoring and recovery acceptance gates. Actual backup setup remains incomplete.

References reviewed: https://developers.cloudflare.com/r2/get-started/ ; https://developers.cloudflare.com/r2/pricing/ ; https://developers.cloudflare.com/r2/buckets/object-lifecycles/ .

## Recovery inventory

| Data or dependency | Recovery treatment | Evidence required before activation |
| --- | --- | --- |
| Saved preferences, Wardrobe metadata, saved looks, shopping list | Consistent database recovery point with schema, functions, RLS and privileges | Successful backup timestamps and restore verification for all customer tables and ownership boundaries |
| Private original/normalized image objects and permitted derivatives | Separate protected copies matched to the chosen database recovery point | Actual bytes, content digests, private bucket policies and object/reference manifest agree; metadata-only restoration fails acceptance |
| Deleted images/accounts and retired identifiers | Reconcile against current deletion evidence that survives failure of the primary database | A deletion after the selected recovery point remains deleted after restore; missing evidence holds affected data unavailable |
| Financial reservations and provider cleanup holds | Preserve or reconstruct current authoritative state before admitting work | Old backups cannot replenish allowances or release uncertain holds; no provider call is used as a restore smoke test |
| Managed Auth and app session ownership | Reconcile current identity, revocation and seven-day expiry; do not revive old sessions | Cross-user denial and current session/recovery behavior verified; reauthentication where safe reconciliation is unavailable |
| Encryption keys and configuration | Private recovery inventory, separate from public code and backup archives | Authorized access to every required key version; loss/rotation scenario tested without exposing key values |
| Application and schema versions | Reviewed Git commit, migration hashes, build/start mode, configuration names | Compatible application/schema pair, reproducible build and rollback path |
| Unsaved notes, live media, temporary photos | No new backup retention introduced | Existing session privacy and expiry rules remain; no promise to resume an interrupted live consultation |

The approved seven-day technical photo-deletion receipt and account-linked retired ID policy remains unchanged. This plan does not add a new deletion journal retention policy. If independent deletion/account evidence requires new personal metadata or retention, present that design for approval first. Do not silently extend session or deleted-content retention to satisfy recovery.

## Proposed backup design

1. Verify current provider plan, backup age/type and available restore points read-only before relying on managed backups. Do not change settings during inspection.
2. Prepare a separate encrypted, access-restricted destination for app-managed object copies and any approved database/configuration exports. Destination, region, key custody, access, expiry enforcement and cost remain unresolved. An additional bucket in the same project alone does not protect against project deletion.
3. Couple each completed backup set to a database recovery point and a private manifest: schema/source version, start/end times, object versions/digests, required key identifiers and completion status. Use immutable object versions or a bounded coordinated snapshot so concurrent photo replacement cannot mix versions. Incomplete sets are not selectable recovery points.
4. Copy only approved persistent data. Never place archives, customer rows, images, secrets or detailed manifests in GitHub or the public documentation. Public receipts contain aggregate outcome only.
5. Monitor the age of the last verified complete set against the selected target; report failures and missing objects. Alert destination and operator coverage must be established before claiming a recovery-time target. No monitor or schedule is created by this document.
6. Under the approved seven-day maximum, expire app-managed backups by age and verify deletion. Provider-held copies follow the verified provider contract. Failed purge is an incident, not evidence of deletion; never claim a universal seven-day purge guarantee.
7. Keep a separate recovery copy accessible through the approved incident procedure. Verify loss-of-project and loss-of-operator-access scenarios; shared failure domains and key access can otherwise defeat recovery.

## Restore sequence and acceptance gates

1. Declare the incident, record outage onset/detection/declaration, and hold affected customer writes and new consultations through the reviewed controls. Obtain approval for destructive restore or new paid infrastructure.
2. Preserve current deletion, reservation and identity evidence privately before choosing a restore point. If that evidence is lost, keep affected access unavailable until safely reconciled.
3. Restore into an isolated target with outbound provider work, email sending, scheduled jobs and public customer access disabled. A new hosted project or charge requires separate authorization.
4. Verify backup integrity/authenticity using the selected storage/key controls. A checksum alone is not authenticity. Reject truncated, mismatched or incomplete sets before promotion.
5. Restore compatible database schema/data/roles and the matching private image bytes. Reapply and verify current access configuration. Do not restore secrets into logs or source control.
6. Apply later deletions/retired IDs and reconcile current reservations, cleanup holds and sessions. Keep expired/deleted identities unavailable. Never restore removed photos merely because they exist in an older backup.
7. Run owner-versus-other-user and anonymous denial checks; verify image bytes, saved data, schema/function privileges, expiry, no stale session reuse, no quota replenishment and no outbound provider/email side effects.
8. Measure actual data loss and recovery duration. A successful database command does not establish the complete-app target. Record failures against the chosen targets and fix them before launch acceptance.
9. Obtain applicable promotion authorization, then reopen only verified features. Retain rollback evidence and remove temporary recovery copies under the approved retention/access policy.

## Completed local rehearsal and remaining evidence limits

Existing synthetic database rehearsal covers 21 migrations, saved rows, RLS/functions/grants, retired-image refusal, sequence continuation and atomic failure on truncated archives. It does not cover image bytes, a managed Auth restore, production keys, current deletion replay across systems or real restore timing.

The extended drill now passes 155 PostgreSQL assertions and 30 operations unit/invocation tests. Two synthetic byte objects are paired with the database archive digest through a process-key HMAC manifest. A post-backup deletion is replayed through the real media lifecycle functions after restoration; the deleted object is omitted and its ID cannot be resurrected. Existing private-notes ledger SQL shows the older backup lacks a newer hold; independently retained fixture evidence restores that hold and reset/reopen attempts fail. Expired Auth fixture sessions remain inactive.

Negative helper cases reject missing/corrupt bytes, a mismatched database digest, wrong verification key, modified manifest, absent deletion evidence and expired/future recovery points. Seven-day eligibility is tested, not an actual retention purge. Objects and later evidence are held only in process memory, with no filesystem image/archive output. This is a simulation of coordinated recovery, not a production storage format, encryption system or independent durable evidence source. Real Storage/Auth/key recovery, workload timing, provider cleanup and current financial reconciliation remain unverified.

## Decision and execution queue

1. Completed: Sabine approved 24-hour saved-data loss tolerance, 48-hour recovery and seven-day protected backup retention.
2. Completed locally: synthetic object/deletion recovery rehearsal; evidence limits above remain.
3. Inspect actual backup availability when account access permits. Select storage/key/alert/operator arrangements and obtain any new financial, credential or privacy approvals before implementation.
4. Resolve secure hosted activation, rehearse the full recovery with authorized infrastructure and measure outcomes before any launch promise.
