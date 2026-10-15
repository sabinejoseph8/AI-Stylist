# Task 8d: local operations preparation

Status: approved local preparation, 14 October 2026. Full Task 8d and Phase 8 remain open. These instructions do not activate accounts, deploy customer code, change settings, rotate keys, schedule cleanup or authorize spending.

See [backup and recovery planning](backup-recovery-plan.md) for the approved targets and complete recovery inventory: at most 24 hours of lost saved changes, 48-hour recovery and seven-day protected backup retention. These targets still require implementation and measured acceptance.

## Release inventory

| Artifact | Purpose and limit |
| --- | --- |
| `apps/foundation` | React sample app and separately selected account HTTPS runtime. The sample preview is not a customer service. |
| `apps/foundation/src/server/account-https-main.ts` | Direct TLS account entry. Requires private TLS files and exact HTTPS origin; it does not establish Render proxy trust. |
| `render.yaml` | Private recovery prototype, `node src/server.ts --preview --recovery`. |
| `prototypes/voice-avatar/render.yaml` | Private notebook trial, `node src/private-notes-trial-main.ts --activate-private-notes-trial`. |
| `docs/hosted-database-deployment.json` | Recorded dashboard application and hashes for migrations 001–021. Not Supabase CLI migration history or current database health. |
| `docs/refresh-key-operations.md` | Existing overlapping-key procedure and unresolved backup/key-retirement dependencies. |

The two Render files select different prototype modes. Never deploy a manifest by filename alone. Before any approved deployment, record the selected service, exact source commit, root directory, start command, build command, environment-variable names, private gate and plan. Compare the actual dashboard with the intended mode. Do not export secret values. Neither prototype manifest deploys the complete customer app.

## Deployment checklist, to execute only after its existing gates clear

1. Check the latest progress/blocker records and the intended release's explicit authorization. Resolve OpenAI startup, account origin/ingress/logging, sender credentials and permitted source requirements for the features being enabled. Preserve the deferred domain purchase and all existing spending limits.
2. Select an immutable, reviewed commit. Run the applicable foundation/prototype suites, type checks, builds and affected acceptance checks. Inspect the exact staged files for secrets, `.env`, recordings, backups, private ledgers and support-message/account details. Record results without private content.
3. Privately inventory existing runtime settings by name and mode. Keep the current service protected. Account callback origins must match the reviewed HTTPS origin; arbitrary Host/forwarded headers must not determine callbacks. Application URL cleanup cannot redact upstream logs. The direct-TLS entry is not a workaround for the unresolved Render ingress contract.
4. Compare every proposed migration hash and precondition with recorded hosted state. The SQL Editor did not populate CLI history. Do not replay migrations, reset the database or assume idempotence. Rehearse an upgrade and its data/access checks on synthetic data before a separately authorized hosted change.
5. Require a verified recovery point covering the actual database, private Storage object bytes, managed Auth dependencies, encryption key dependencies and deletion reconciliation. A PostgreSQL dump alone is insufficient. Sabine approved a 24-hour recovery-point target, 48-hour recovery-time target and seven-day backup retention. Verify complete-set freshness, storage configuration and timed restoration before claiming compliance.
6. Deploy only the approved artifact/mode and retain private access. Verify build/start status and non-starting health plus unauthorized-route denial. A 200 health response does not establish transcription readiness, account isolation, cleanup or billing completion. Do not press a paid trial's Start as a smoke check.
7. Perform only previously authorized functional acceptance. Record deployed commit, deployment ID, selected mode and evidence in project memory. Leave unresolved checks open. Public launch requires Sabine's separate approval.

## Rollback checklist

1. Stop admitting new work through the existing reviewed shutdown/control path. If its availability is unverified, treat admission as unconfirmed and escalate; do not invent a dashboard setting or claim that hiding a button ends provider work.
2. Stop local media and cancel pending work. Verify provider room/transport state using the applicable existing contract. Preserve unresolved cleanup holds and permanent financial reservations. A closed WebSocket is transport evidence, not final billing or deletion.
3. Record the failing version and fixed error category privately. Select the last known compatible reviewed source commit and its exact runtime mode. Confirm that its code supports the current forward schema and keyring before redeployment.
4. Roll back application code only through the separately approved deployment path. Do not run reverse migrations or restore an old database merely to match old code. If compatibility is unknown, keep the affected feature unavailable and ask for a recovery decision.
5. Keep key overlap required by live records and backups. Do not drop old keys, restore old active sessions or replenish consumed trial allowances. A restored database may contain expired sessions, resurrect deleted data or omit newer reservations; reconcile against current durable deletion/financial/identity evidence before reopening admission.
6. Repeat non-starting health, private-gate and synthetic access checks, then applicable accepted functional checks. Record the actual rolled-back commit and any remaining hold. No automatic public release or paid retry.

## Incident checklist

| Observation | Immediate action | Evidence and exit condition |
| --- | --- | --- |
| Unexpected audio or stale response | Stop local playback/microphone and cancel old output. Use the existing interrupt/end path; do not resume the interrupted inference. | Match known state/identity events privately. Tavus stopped-speaking does not prove downstream buffer flush. Strict recovery requires verified renderer teardown/room replacement within an approved test. |
| Transcription startup rejection | Keep microphone blocked and end the connection. Preserve its reservation. | Fixed startup stage/error category only. Existing OpenAI failure remains unresolved; no automatic retry. |
| Account/callback or cross-owner access concern | Hold account admission and affected operations using the reviewed control path; escalate to Sabine. | Review synthetic identity/expiry/owner checks and exact ingress contract. Never paste callback tokens, cookies or user rows into logs/support. |
| Save/delete or provider cleanup uncertain | Keep the record/cleanup claim held; avoid duplicate writes, retries or refund claims. | Use the existing idempotency/revision and bounded cleanup contracts. Only their verified result can release the hold. |
| Deployment/schema mismatch | Stop promotion, retain the compatible running version if safe, and inspect hashes/mode. | Rehearse with synthetic data; do not repair hosted schema or migration history blindly. |
| Credential exposure suspected | Limit access and alert Sabine for the security-sensitive response. | Privately inventory dependencies and follow approved rotation/revocation. This task does not rotate credentials or retire encryption keys. |
| Capacity/expense limit reached | Refuse new work through existing guards and preserve all usage records. | Reconcile authorized allowance separately from actual charges. No plan upgrade, retry or new allowance is implied. |

## Redacted diagnostics

Use existing fixed lifecycle stages, aggregate counters and bounded timing results. Keep raw request URLs/query strings, cookies, authorization, keys, session/user IDs, transcripts, garment photos, free-form provider errors and support email text out of public records. Do not equate application redaction with upstream platform redaction. No new monitoring service, log retention policy or alert automation is activated here.

For escalation, prepare a sanitized event sequence and public configuration shape. Sending it needs explicit authorization. Operational support replies are attributed evidence, not proof of an untested runtime contract.

## Synthetic backup and restore rehearsal

Run from the repository root:

```sh
python3 -m unittest discover -s tools/operations -p 'test_*.py'
python3 tools/operations/rehearse-backup.py --run-local-synthetic
```

The script accepts no connection string, database name, backup path or credentials. It requires the explicit local-synthetic flag. It uses the already installed pinned PostgreSQL 17 image with `--pull=never`, network disabled, no published ports and memory-backed database files. It creates synthetic Auth/Storage schemas and applies all 21 current migrations. It saves a made-up profile, wardrobe reference and owned look through existing controlled functions, plus a synthetic deletion receipt/retired ID. No actual photo bytes, managed Auth service, provider or hosted Supabase is contacted.

A custom-format `pg_dump` archive stays in process memory. A SHA-256 comparison rejects changed/truncated archives; this is integrity checking, not encryption or authenticity. The source database is dropped and the archive restored into a new database with `--single-transaction --exit-on-error`. Comparison covers exact synthetic rows, policy definitions, RLS flags, effective ordinary-role table/function privileges and function security settings. Restored owner isolation, anonymous/direct-write denial, private-retired-ID denial, retired-ID resurrection refusal, profile revision fencing and identity-sequence continuation are exercised.

A deliberately truncated archive is also sent directly to a separate empty scratch database, bypassing the script's integrity gate only for the failure drill. Restore must fail without leaving partial application tables. All temporary databases and archives disappear when the dedicated container is removed. No backup or dump file is written to the repository or host. Success reports only aggregate checks and scope; failures report fixed stages, not raw SQL/provider output. Cleanup failure is reported explicitly and exits unsuccessfully.

This is database-only logical recovery evidence. Roles remain in the same disposable PostgreSQL cluster; it does not prove cluster/role provisioning, managed Auth recovery, encrypted refresh-envelope recovery, private Storage byte restoration, real customer deletion reconciliation, PITR, provider cleanup, production key inventory, final billing, or measured production recovery objectives.

## Full acceptance still required

- Supported and accepted customer integration, security review and phase dependencies.
- Approved real deployment/origin/callback and ingress/logging contract.
- Implementation and measured verification of the approved recovery targets, with approved storage/access/encryption arrangements.
- Database plus actual private object recovery, safe deletion reconciliation and key dependencies.
- Real incident/rollback drill, durable bounded cleanup scheduling and monitoring under approved settings.
- Authorized credential rotation rehearsal and full customer/device acceptance.

Do not tick full Task 8d or Phase 8 from this local preparation.
