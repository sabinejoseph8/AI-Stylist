# Task 8c: local failure and capacity preparation

Approved by Sabine on 14 October 2026 as a local sequencing exception. Full Task 8c, Phase 8 and launch acceptance remain open. No customer runtime, provider call, paid test, hosted setting or operating limit is changed.

## Evidence boundaries

| Rehearsal | What actually runs | What remains unproved |
| --- | --- | --- |
| Failure composition | Existing StylingSession, LocalOutfitValidation, LocalSessionLifecycle, LocalDiagnostics and AuthSessionAuthority with test-only wiring and simulated source/model/authority results | Customer authentication/voice transport, integrated renderer cancellation, real feed/model outages and physical-device behavior |
| Consultation capacity | Actual pinned PostgreSQL, migrations 015/016 and the existing consultation/auth-session adapters with synthetic users and sessions | Hosted Supabase/managed Auth, verified JWT entry, provider cleanup and production load/timing |
| Restart | A real restart of the disposable database container with a temporary volume; new adapter instances read the persisted hold | Customer app/browser/server recovery, platform failover and provider reconnection |

The test-only composition does not install a new app coordinator. Every real visual/audio release flag remains false. A simulated pass is rehearsal eligibility only. The known OpenAI startup failure and unresolved Render/account/source prerequisites stay open.

## Failure matrix

| Injected condition | Expected evidence |
| --- | --- |
| Model/validator unknown, blocked, refused or timeout | No simulated visual/audio frame eligibility |
| Source reader outage after a pass | Prior pass revoked; fixed state only, no private source exception |
| Media disconnect | Session aborts its old signal; old validation results cannot appear |
| Reconnect inside approved grace | Local confirmed notes remain, but new epoch and validation tickets are required |
| Disconnect at five minutes | Notes expire, reconnect refuses revival and local cleanup runs |
| Thirty-minute idle deadline | One-minute warning, then expiry; polling does not extend retention |
| Authority expiry, malformed reply or outage | Test composition ends; pending results cannot complete |
| Authorization finishes after cancellation | Late true reply cannot revive a turn |
| New confirmed requirement, Clear, End or newer validation job | Previous tickets cannot authorize the current frame |
| Local cleanup failure | Remains pending; only the failed local port retries, without result revival |
| Replacement local process or backward clock | Prior ticket identity and expired work are refused |

The short semantic deadline and literal fixture facts are existing local rehearsal settings, not production latency or product compatibility evidence. Session retention uses the already approved policy unchanged. No default production recovery/retry policy is introduced.

## Shared consultation rehearsal

```sh
python3 -m unittest discover -s tools/operations -p 'test_*.py'
python3 tools/operations/rehearse-capacity.py --run-local-synthetic
```

The wrapper accepts no external database, credential or existing-container argument. It creates a uniquely named local container using the already installed pinned PostgreSQL image with `--pull=never`, no network and no published ports. A temporary volume holds synthetic data across the restart; both container and volume must be removed before success is printed. The TypeScript driver separately rejects names outside the fixture format and unknown phases. It pipes only fixed synthetic SQL to Docker, bounds subprocess time/output, and reports aggregate counts or fixed failure stages without SQL errors, identities, lease tokens or row contents.

Eight independent adapter instances claim the same singleton concurrently. Exactly one wins. Foreign owner/token and altered-fence checks fail. A simulated lost provider-start reply occurs after the actual SQL mutation commits: the adapter submits once, reports uncertainty, and the database retains provider state. A second provider transition refuses permission. Expiring the provider lease does not release capacity, permit heartbeat or accept old output. A real database restart preserves the hold.

After restart, a fresh adapter cannot reclaim the expired provider session. Unverified End refuses release; only the synthetic verified-cleanup action frees it. This flag represents fixture evidence, not actual provider cleanup. The next claim has a higher fence. Old lease actions cannot release or heartbeat the new claim. Lost reservation acknowledgment retains unused capacity until its safe expiry, then a new fence/token is issued. Lost End acknowledgment is uncertain and is not automatically retried. A failed reconnect never silently starts a replacement session.

The actual Auth lookup function also checks synthetic owner/session matching, expiration and lookup failure. It does not prove signature validation, seven-day customer sessions or managed Auth recovery.

## Results

- 25 new failure-composition cases pass.
- 35 actual PostgreSQL/adapter assertions pass, including 8 parallel claims with exactly 1 admission and the restart hold.
- 8 new invocation-boundary unit tests pass; all 21 operations unit tests pass, including the earlier backup checks.
- All 1,237 foundation tests across 123 files, type checking and build pass.
- Read-only Docker inventory confirms no capacity fixture containers or volumes remain.

No app UI or production runtime source changed. Earlier accepted human reviews remain valid; no new manual checklist is required for this preparation. The unchanged prototype retains its earlier test evidence, not a new regression run.

## Required full acceptance

Real physical phones/networks; verified account expiry and sign-out through the full customer journey; actual provider/feed/model outages; browser/server restart and reconnect; verified provider cleanup; redacted production health/timing; the agreed simultaneous load; and measured session cost remain open. Reserved allowances are not actual charges. Allocation stays $51, and no repeat paid diagnostic or new test allowance is authorized.

Do not mark full Task 8c or Phase 8 complete. Review concrete provider/account/source evidence when supplied before connecting the real journey.
