# Task 2c acceptance audit

Status: Local preparation only. Task 2c and Phase 2 remain open.

Sabine approved local account interfaces and simulated tests while Phase 1 remains open. This does not authorize real sign-ins, provider credentials, hosted changes, emails or paid calls.

## Evidence and remaining work

| Requirement | Current evidence | Still required |
| --- | --- | --- |
| Account access before styling | Foundation coordinator refuses customer sessions; sample UI never unlocks styling | Connect actual verified identity to all customer routes after approval |
| Email/password and registration | Local labeled screens, simulated controller and shared verified-session orchestration; stale/canceled replies discarded; confirmation grants no cookie | Actual provider transport, registration policy, email confirmation, failure recovery and remote-session cleanup |
| Google and Apple | Simulated handoff/cancel UI; one-time browser-bound PKCE transaction store and sanitized failure consumption | Real provider configuration/transport, redirect/state preservation, actual failure callbacks and physical-device checks; local code exchange orchestration and cleanup are simulated |
| Password recovery | Generic simulated acknowledgment and reset confirmation UI; recovery-only callback and expiring one-use server reset capability; simulated provider-purpose contract, separate opaque browser-delivery cookie and cleanup/replay tests | Provider-verified recovery authorization, scoped password update, expired/replayed recovery handling, cross-device behavior and confirmation UX |
| Signed server identity | Generated ES256/RS256 checks, fixed-project bounded JWKS transport, real local SQL session lookup with synthetic Auth schema | Actual signing configuration and Auth schema verification; live provider and configured session policy acceptance |
| Cookies and origin checks | Verified Secure/HttpOnly/host-only/Strict cookie preparation and same-origin request gate; generated-token composition tests | Actual browser cookie acceptance, secure route wiring, refresh-token/session lifecycle and CSRF integration |
| Sign-out | Immediate local UI closure; disconnected same-origin POST coordinator clears cookies and reports remote success only with exact adapter confirmation; stalled work is bounded; revoked synthetic sessions deny requests | Actual provider revocation, cookie clearing route and concurrent sign-out; local late callback-result cleanup is prepared but actual cleanup proof is open |
| Identity linking | Owner derives only from signed user ID; no email-based data merging is implemented | Review provider linking defaults, prove two accounts cannot merge through unverified or duplicate input, choose any customer linking flow with Sabine |
| Accessibility and responsive UI | Agent narrow layout and keyboard checks; labeled fields, result focus, live status and assertive errors | Actual screen reader, physical iPhone, zoom and complete accessibility acceptance |
| Production email | Not configured | Verified sender/DNS, approved email templates, rate limits, abuse protection, delivery/bounce monitoring and real delivery checks |
| Apple maintenance | No credentials created or inspected | Document actual credential expiry, owner, renewal reminders/process and a tested rotation procedure |
| Tests/review/phase exit | 424 local foundation checks across 52 files plus type checking/build; earlier SQL/Storage evidence | Actual provider/manual phase checks and required phase-wide code review; no phase exit is claimed |

## Current local next steps

1. Prepare the password/registration provider boundary with injected synthetic responses. It must produce the shared staged-session capability, preserve confirmation-only registration, use explicit session cleanup and never activate a route or read credentials by default.
2. Compose explicit sign-out with the encrypted store and primary session-presence authority. Current sign-out orchestration still relies on an injected abstract revocation port; refresh cleanup evidence does not prove that port is complete.
3. Prepare provider-specific OAuth and recovery adapters only after auditing the actual provider purpose/state contracts. A normal access token is insufficient recovery authorization.
4. Keep both accepted local manual reviews. Physical-device, screen-reader, browser HTTPS-cookie and real-provider acceptance remain separate gates.

## Current implementation reconciliation, 12 October 2026

The following evidence supersedes older pending-next-action paragraphs below. Those paragraphs remain as historical checkpoints.

| Area | Inspected source/evidence | Current conclusion |
| --- | --- | --- |
| Server activation | apps/foundation/src/server/main.ts and http.ts | Foundation starts its existing server; account factories remain disconnected. No customer activation is claimed |
| Password and registration | password-account.ts, password-http.ts and account-session.ts | Input validation, verified adoption and local HTTP lifecycle exist. Concrete password/registration provider transport remains missing |
| OAuth callbacks | account-callback.ts and account-exchange.ts | Browser-bound one-use PKCE and shared adoption exist. Real provider initiation/exchange adapters remain missing |
| Recovery | account-recovery.ts, recovery-browser.ts and recovery-http.ts | Recovery-only capabilities and one-use UI flow exist. Provider-purpose verification and real password update remain missing |
| Refresh storage and rotation | refresh-store.ts, refresh-rotation.ts, refresh-port.ts and scripts/check-refresh-adapter.mjs | Actual isolated PostgreSQL and encryption composition pass with synthetic provider HTTP. Hosted Auth, real transport and early-refresh limitations remain |
| Cleanup reconciliation | auth-session-presence.ts, refresh-reconciliation.ts, refresh-scan.ts and migrations 19/20 | Primary database absence is distinguished from lookup failure; scoped reconciliation and metadata inventory are prepared. No scheduler is installed; unknown records stay unresolved |
| Key operations | refresh-envelope.ts, docs/refresh-key-operations.md and isolated database rehearsal | Overlap/restart/early-retirement evidence passes. Point-in-time counts do not prove backup or concurrent-writer retirement safety |
| Sign-out | account-signout.ts and signout-http.ts | Cookie clearing and bounded orchestration exist. Concrete durable session revocation port still requires composition |

All 424 foundation tests, type checking/build and the latest isolated database rehearsal passed at the preceding implementation checkpoint. This audit adds no application behavior and claims no new test run. No credentials, emails, hosted migrations or paid calls were used.

## Human and external dependencies

- Sabine completed all eight local account preview steps and confirmed all worked and were readable. Physical-device and screen-reader acceptance remain open.
- Phase 1 completion and a hosted/account activation decision are still required before real account configuration or tests.
- Production email sender, Google/Apple credentials and actual callback allowlists are not approved by local preparation.
- Refresh/session persistence and same-browser versus cross-device recovery must be reviewed before promising customer behavior.
- No spending allowance or additional provider attempt is created by this audit.


## Activation preparation

See docs/task-2c-activation-checklist.md for evidence and approval boundaries. Sabine accepted all seven newer reset-screen review steps as working/readable; the original eight-step review also remains accepted. Adoption, encrypted storage and local HTTP/database composition now have evidence. Further preparation must address concrete password, sign-out, OAuth and recovery provider boundaries without treating synthetic evidence as hosted readiness.

Local Node loopback delivery checks now cover separate cookie headers, Host/Origin rejection and late response cleanup after client disconnect. They use simulated operation handlers and are not yet the generated-token full account composition or browser/TLS acceptance.

Generated-token password verification is now composed over actual loopback HTTP with simulated provider/current-session authority. Deadline, reader cancellation and four-operation retained admission checks pass. Actual browser/TLS, durable adoption and real provider behavior remain open.

Explicit optional server adoption now runs after signed-identity verification and before ready, with current-session revalidation and simulated-storage cancellation/partial-failure tests. Durable ownership, actual adapter adoption and local HTTP adoption composition remain pending.

Explicit adoption cancellation is now tested through generated-token password ownership and actual loopback HTTP disconnect. Late simulated storage is removed once after it settles. Durable storage/restart and real provider acceptance remain open.

A disconnected server-only encrypted refresh envelope is prepared and tested with generated keys. Context binds owner/session/generation/expiry. Durable storage, atomic generation enforcement, key provisioning/retirement and real provider adoption remain open.


Local migration 17 and the isolated PostgreSQL refresh-ownership rehearsal pass, including an actual database/container restart, one concurrent winner and service-only reconciliation. Ciphertext is placeholder fixture data; codec/RPC integration and real hosted Auth remain open. Sabine accepted all seven newer reset UI steps.

The encrypted migration-17 RPC adapter passes simulated response tests, including one-use server secret capability and ambiguous-write handling. Actual PostgreSQL adapter composition, provider revocation proof and hosted key/storage configuration remain open.


Actual codec/store-adapter composition with isolated PostgreSQL now passes lost-acknowledgment, concurrency, next-generation decryption, database restart and wrong-key hold checks. The psql bridge is test-only. Real Supabase HTTP transport, provider rotation/revocation, process key provisioning and hosted acceptance remain open.


## Guarded refresh HTTP transport, 11 October 2026

Prepared a disconnected refresh-specific transport allowing only the six ownership RPC operations. The shared Supabase transport now accepts caller cancellation and limits admission to four underlying operations. A request that ignores cancellation retains its slot until its fetch and response cleanup settle; failed cleanup conservatively retains capacity. Destination, size, deadline and generic-error protections remain in place.

All 383 foundation tests across 43 files, type checking and build pass. New scenarios cover the operation allowlist, encrypted adoption through simulated HTTP, and cancellation with unresolved fetch admission. An initial test attached its rejection assertion too late; attaching it before cancellation fixed the unhandled rejection. Loopback tests ran with the required local-network permission. No actual Supabase request, real provider, hosted change or paid call occurred.

Both account and reset-screen manual reviews are accepted. Task 2c remains incomplete. Exact next action: compose the durable encrypted refresh store with a synthetic refresh provider and shared account adoption lifecycle, exercising uncertain rotation and cleanup before live activation. Private Memory still needs a consolidated publication after its 368-test checkpoint.


## Staged refresh rotation lifecycle, 11 October 2026

Prepared createRefreshRotation as a disconnected trusted-server capability. It claims a scoped durable record once, passes the one-use secret to an explicitly injected provider, and returns the existing PendingAccountSession adoption/discard interface. Adoption finishes the fenced encrypted rotation once. Discard waits for started adoption, requires exact provider-wide session revocation confirmation, inspects current ownership and removes only the matching claim or immediately adopted generation. Provider ambiguity leaves the durable claim blocked; no automatic retry or reclaim is added. The provider must revoke the entire session including rotated tokens, a contract still requiring actual provider evidence.

All 387 foundation tests across 44 files, type checking and build pass. Four new scenarios use simulated storage/provider adapters to cover staged adoption, ambiguous provider failure, unconfirmed revocation or different-generation removal refusal, and adoption/discard ordering. The prior isolated database rehearsal remains separate evidence; this new coordinator is not yet composed with PostgreSQL or the shared session verifier. No actual provider request, hosted change, credential activation or paid call occurred.

Exact next action: compose this coordinator with the real encrypted store in the isolated PostgreSQL rehearsal and the shared account-session verifier using synthetic provider results. Add wrong-session, expired and uncertain-adoption cases before actual HTTP activation. Task 2c and Phase 1 remain open. Private Memory publication still needs consolidation beyond its 368-test checkpoint.


## Refresh coordinator and verified-session database composition, 11 October 2026

Extended the isolated PostgreSQL rehearsal to compose the real encryption codec, durable refresh store, staged rotation coordinator and shared account-session verifier. Generated ES256 tokens use a generated in-memory signing key; current-session authorization is checked by the actual SQL function. Provider rotation and revocation remain explicitly synthetic.

Four composed scenarios pass: a cookie is returned only after verified next-generation adoption; a rotation write with lost acknowledgment returns unavailable and removes the reconciled record only after synthetic confirmed revocation; a wrong signed session is refused and cleaned up; expired signed access is refused and cleaned up. Earlier concurrent-claim, restart, wrong-key and fencing scenarios also pass. All 387 foundation tests across 44 files, type checking and build pass. Docker inspection confirms no rehearsal containers or volumes remain. No actual Supabase HTTP call, provider credential, hosted change or paid activity occurred.

Exact next action: consolidate the private Memory publication with these account/reset acceptance and database evidence updates, then prepare the account-refresh port that derives ownership from verified request identity and the inspected durable generation. Preserve the existing early-refresh limitation, explicit provider revocation contract and all live activation gates. Task 2c, Phase 1 and hosted/provider acceptance remain incomplete.


## Verified stored-refresh port and HTTP composition, 11 October 2026

Prepared createStoredRefreshPort to derive owner/session from reverified request identity and generation from durable inspection. It refuses missing, held or expired records, rechecks current authorization after inspection, and surfaces uncertain storage without starting a provider. No browser-supplied scope is accepted. The port is explicitly injected and no application route is enabled.

All 392 foundation tests across 45 files, type checking and build pass. Five new focused scenarios cover scope derivation, owner mismatch, unusable ownership, uncertain inspection and revocation/origin refusal. The isolated PostgreSQL rehearsal also composes the actual port, account-refresh coordinator and Request/Response HTTP factory with generated signed tokens: identity JSON is refused before rotation, valid cookie-derived refresh advances generation and returns only status plus cookie headers, and failed-delivery discard revokes synthetically then removes ownership. Existing SQL restart, fencing and signature-verification cases still pass. These HTTP factories are not a deployed server; provider rotation/revocation remain synthetic. No hosted changes or paid activity occurred.

Exact next action: extend actual loopback HTTP delivery coverage to stored refresh and inspect the provider activation checklist against the implemented account contracts. Keep the early-refresh limitation and actual provider revocation evidence gate open. The private Memory site currently contains the preceding 387-test checkpoint; consolidate it at the next meaningful publication. Task 2c and phase exit gates remain incomplete.


## Stored refresh over actual loopback HTTP, 11 October 2026

Added real loopback server tests composing generated signed identity, encryption/store adapter, staged rotation, verified stored-refresh port, account-refresh coordinator, HTTP factory and Node listener. Storage RPC and provider behavior remain simulated. Successful refresh delivers a status-only body and the secure cookie after generation adoption. Disconnecting during stalled adoption produces no accepted response and invokes provider revocation once before fenced ownership removal. The tests close their loopback servers.

All 394 foundation tests across 46 files, type checking and build pass. This complements the earlier actual isolated PostgreSQL Request/Response rehearsal; it does not claim PostgreSQL and network delivery were exercised in one scenario or that TLS/hosted/provider behavior is accepted. Updated the activation checklist to distinguish completed local evidence from remaining hosted checks. No real accounts, provider calls, hosted changes or paid activity occurred.

Exact next action: audit the real provider refresh/revocation contract against primary documentation and the activation checklist; prepare only disconnected transport behavior permitted by the local Task 2c exception. Keep unknown remote revocation, hosted schema, HTTPS/callback, email, social credential and Phase 1 gates open. Private Memory last published the 387-test checkpoint and should be consolidated after the next implementation checkpoint. Task 2c and Phase 2 remain incomplete.


## Disconnected refresh provider bridge, 11 October 2026

Prepared createRefreshProvider with explicitly injected refresh/revoke operations and an explicit application expiry policy. It supplies the claimed refresh token, requires bounded bearer-token output, requests cleanup with literal local scope, deduplicates cleanup and returns false for failed or uncertain revocation. Four-operation admission and an eight-second maximum response deadline propagate cancellation; unresolved underlying operations retain their capacity. There are no retries, default SDK client, environment reads, credentials or route activation. The injected operations must independently prove accepted remote revocation; the bridge does not establish that proof.

All 398 foundation tests across 47 files, type checking and build pass. Four new simulated-operation scenarios cover explicit token/scope, malformed replies/expiry, ambiguous cleanup and unresolved cancellation capacity. No actual HTTP provider request, SDK integration, remote session or paid call occurred. Malformed/late results can leave remote state unknown; durable rotation remains blocked and no cookie is accepted. The actual HTTP transport, bounded provider response reading, signed identity binding and expired cleanup authority still need integration evidence.

Source inspection of upstream auth-js refresh and admin sign-out code confirmed explicit refresh-token request input and scoped logout routing. The inspected master source is not a pinned runtime dependency and does not authorize copying its retry/debug behavior. Primary source links: https://raw.githubusercontent.com/supabase/auth-js/master/src/GoTrueClient.ts and https://raw.githubusercontent.com/supabase/auth-js/master/src/GoTrueAdminApi.ts .

Exact next action: implement the fixed-project provider HTTP operations with bounded body reads, no redirects/retries, private injected configuration and explicit session-local logout. Test with simulated HTTP before connecting this bridge to the isolated database/session rehearsal. Preserve live activation and session-lifetime decisions. Task 2c and phase gates remain open.


## Fixed-project refresh provider HTTP preparation, 11 October 2026

Prepared createRefreshProviderHttp with explicitly injected project, private API key and fetch. Only fixed HTTPS Supabase project destinations are allowed. Refresh POSTs to the token endpoint with explicit refresh-token JSON; cleanup POSTs only to logout with local scope and its staged access JWT. Redirects and browser credentials are disabled. Responses are bounded to 64 KiB, deadlines to eight seconds, underlying admission to four and errors are generic. No retry, SDK persistence, environment reads or default routes are added. Requests that ignore cancellation retain capacity until actual settlement and confirmed body cleanup.

All 402 foundation tests across 48 files, type checking and build pass. Four simulated-HTTP scenarios cover exact destination/headers/body, uncertain remote cleanup, malformed/oversized replies and retained cancellation capacity. The initial test mock omitted typed arguments; correcting that signature resolved its type-check failure before the successful full run. No real provider call, credential activation, hosted change or paid activity occurred.

Only an empty 204 logout response is accepted by the prepared transport. This conservative acceptance rule is a local contract requiring exact hosted/provider evidence before enablement, not a claim that all provider success variants were verified. Errors, redirects and unexpected success shapes remain unconfirmed. Returned token identity, expiry policy and remote revocation evidence still require full composition; malformed or lost refresh replies can leave a blocked remote session.

Exact next action: compose the real HTTP operations and provider bridge with synthetic HTTP and isolated PostgreSQL/session verification, including malformed provider response, lost rotation acknowledgment and cleanup refusal. Then consolidate private Memory beyond its 387-test publication. Keep real activation, session-lifetime and phase gates open.


## Provider HTTP, bridge and database composition, 11 October 2026

Extended the isolated PostgreSQL rehearsal through the actual provider HTTP operations, provider bridge, encryption/store, staged rotation, verified-session lifecycle and HTTP Request/Response factory. Provider fetch is injected synthetic HTTP, so no remote provider was contacted. Four scenarios pass: verified adoption; committed rotation with lost acknowledgment and confirmed synthetic cleanup; malformed provider response retaining a rotating claim; refused logout retaining storage and setting the account coordinator's cleanup hold. Exact provider request counts confirm no automatic retries. Synthetic teardown confirmations dispose fixture records only and are not remote revocation evidence.

All 402 foundation tests across 48 files, type checking and build pass. The full isolated SQL/composition rehearsal passes, and Docker inspection finds no rehearsal containers or volumes remaining. No hosted configuration, real credential or paid activity was used.

Known gap found by this composition: refused cleanup after adoption retains a ready database record while the cleanup hold is process-local. Another server process could attempt refresh. Before activation, quarantine the matching durable ownership generation without deleting it or rotating a provider credential. Cancellation, stale generations and unknown quarantine acknowledgments must stay conservative. This is an implementation gap, not an approved production behavior.

Exact next action: implement fenced durable quarantine for failed adopted-session cleanup and prove refusal persists across database restart and replacement coordinator. Then consolidate private Memory beyond its 387-test checkpoint. Task 2c and all live/phase acceptance gates remain incomplete.


## Durable adopted-session cleanup quarantine, 11 October 2026

Fixed the ready-record gap found in the combined rehearsal. Discard now inspects adopted ownership, claims its exact next generation and requests a durable hold before calling remote revocation. The claim itself blocks competing refresh if the hold acknowledgment is lost. Cleanup records its quarantine lease and removes only its matching generation/lease after confirmed revocation. Provider refusal leaves the credential stored and held; no provider rotation occurs during quarantine. A refused/stale claim never authorizes removal of a different generation. No new SQL migration or hosted change is needed; this reuses existing fenced claim/hold operations.

All 402 foundation tests across 48 files, type checking and build pass. Updated simulated lifecycle/loopback fixtures exercise the extra quarantine operations. The actual isolated PostgreSQL pipeline confirms refused provider cleanup leaves generation 2 held, then restarts the database and constructs a replacement store: the hold remains and claiming generation 2 is refused. Other SQL/composition scenarios pass. Disposable database containers/volumes were removed and verified absent. Provider calls remain synthetic.

Limits: if database inspection or claiming cannot be confirmed before remote cleanup, durable quarantine is not proven; process-local uncertainty remains and production reconciliation still needs explicit handling. The restart result proves the confirmed quarantine path, not every outage path. Task 2c and live/phase acceptance remain open.

Exact next action: test lost quarantine acknowledgments, stale competing generations and database failure during cleanup, then document the remaining reconciliation contract. Consolidate private Memory with the resulting evidence beyond its 387-test publication. No real provider, hosted activation or paid activity is authorized by this local fix.


## Cleanup uncertainty and competing-generation evidence, 11 October 2026

Extended the actual isolated PostgreSQL pipeline with lost quarantine-claim and lost hold acknowledgments. A committed claim with lost acknowledgment remains rotating; a committed hold with lost acknowledgment remains held. In both cases refused provider cleanup retains storage, an actual database restart preserves the state, and a replacement store cannot claim that generation. Synthetic provider request counts confirm no retries. Fixture teardown removes records using explicit synthetic confirmation only; it does not resolve a real remote session.

All 404 foundation tests across 48 files, type checking and build pass. Two new focused tests confirm unavailable inspection never removes ownership and a newer competing generation is neither quarantined nor deleted. The complete SQL/composition rehearsal passes. Disposable containers and volumes are verified absent. No real provider, hosted configuration or paid call was used.

Known outage behavior: an inspection exception exits cleanup before provider revocation is attempted. This avoids an unsupported cleanup success claim but can leave remote state active and the record ready. The current local hold is not a durable reconciliation plan for a database outage. Keep activation blocked on this failure path; do not describe all uncertain cleanup as durably quarantined.

Exact next action: improve cleanup to attempt bounded remote revocation even when quarantine inspection fails, while reporting uncertainty and retaining ownership unless scope and revocation are confirmed. Test that failure path and cancellation explicitly. Then consolidate private Memory, whose last publication is the 387-test checkpoint. Task 2c and phase gates remain incomplete.


## Cleanup outage revocation attempt and cancellation, 11 October 2026

Fixed quarantine inspection/claim/hold exceptions suppressing remote cleanup: quarantine now has its own guarded block, so an uncanceled cleanup still attempts the bounded provider revocation. Failed final inspection/removal remains false. Already canceled cleanup starts no storage or provider work; cancellation during revocation prevents removal even if a late adapter returns true. Cleanup remains deduplicated, and no automatic retry is added.

All 406 foundation tests across 48 files, type checking and build pass. Updated outage test confirms one revocation attempt despite inspection exceptions and no unsupported removal. Two new tests cover pre-canceled cleanup and cancellation during revocation. The complete isolated PostgreSQL/provider composition, lost-acknowledgment and restart scenarios still pass. Disposable containers/volumes were verified absent. All provider responses remain synthetic; no hosted change, real credential or paid call occurred.

Remaining limit: simultaneous database unavailability and unconfirmed provider revocation cannot establish durable quarantine or remote termination. This fix attempts revocation but does not resolve that distributed failure. Cleanup remains unconfirmed, account adoption stays unavailable in that coordinator, and live activation still requires a durable reconciliation mechanism and its failure evidence. Do not claim outage recovery complete.

Exact next action: consolidate private Memory with the 406-test checkpoint and recorded remaining distributed-cleanup risk, then prepare a disconnected trusted reconciliation path with explicit scope and evidence, without silently retrying rotation or resetting uncertain ownership. Task 2c and phase gates remain open.


## Trusted cleanup reconciliation preparation, 11 October 2026

Prepared createRefreshReconciliation as an explicit server-only capability. It snapshots owner/session/generation/lease, inspects current ownership, refuses stale generations/leases, requires an independently injected exact-session revoked proof, then uses fenced removal. Even absent local ownership requires revocation proof before confirmed completion. Wrong-session, malformed, unavailable or canceled evidence remains unconfirmed. A refused/uncertain remove is not silently retried. Four-operation admission and an eight-second maximum deadline retain underlying authority capacity until settlement. No route, scheduler, rotation retry, ownership reset or real authority is installed.

All 411 foundation tests across 49 files, type checking and build pass. Five new simulated-authority/storage scenarios cover scoped removal, stale or wrong evidence, absent-local/unknown-remote state, removal/cancellation failures and unresolved authority admission. Prior isolated database evidence is retained but this new reconciliation capability has not yet been composed with actual PostgreSQL. No real provider call, hosted configuration or paid activity occurred.

Remaining risk: the independent revocation authority and durable discovery of unresolved cleanup work still need implementation/evidence. This capability does not by itself recover lost process-local work or establish remote revocation. Task 2c and live/phase gates remain open.

Exact next action: compose reconciliation with the actual encrypted SQL store and synthetic exact-session authority, including lost removal acknowledgment, stale-generation races and restart persistence. Then define the durable unresolved-cleanup discovery mechanism before hosted activation. Private Memory currently contains the verified 406-test checkpoint.


## Cleanup reconciliation actual database composition, 11 October 2026

Composed reconciliation with the real encrypted SQL store in isolated PostgreSQL. Synthetic exact-session authority provides proof only in this rehearsal. Unknown authority retains a held record; an actual database restart preserves it; stale scope is refused; a committed removal with lost acknowledgment remains unconfirmed; an explicit trusted invocation with fresh proof then confirms local absence. A concurrent claim/finish advancing generation between inspection and proof causes fenced removal refusal and preserves the newer record. Fixture teardown is not evidence of real provider termination.

The complete SQL/composition rehearsal and all 411 foundation tests across 49 files, type checking and build pass. Disposable containers/volumes were verified absent. No real provider request, hosted change, credentials or paid activity occurred.

Limits: this proves supplied-scope reconciliation, not automatic discovery, durable scheduling or actual revocation authority. No background job or deployed route exists. Remaining simultaneous storage/provider failure remains an activation gate.

Exact next action: prepare durable unresolved-cleanup discovery and its service-only SQL access, explicitly tracking pending cleanup before it can be lost across process restart. Reuse existing scoped reconciliation and never reset blocked rotation automatically. Test intent persistence, stale work and account-deletion cascade locally before any hosted setup. Private Memory currently contains the 406-test publication and needs consolidation after the next implementation checkpoint. Task 2c and phase gates remain open.


## Durable metadata candidate discovery, 11 October 2026

Prepared local migration 18 and a seventh allowlisted refresh RPC for bounded keyset discovery of existing ownership records. Service-only access returns owner/session/generation/expiry/state/lease metadata without envelopes or secrets. The store validates exact shape, count, cursor order and scope. Pages are limited to 100 records; no route or scheduler is installed. Existing durable ownership is the discovery source, including ready records that may contain unresolved cleanup after an outage. Candidates are a superset including legitimate active sessions: discovery alone never authorizes revocation or deletion.

All 413 foundation tests across 49 files, type checking and build pass. Two new focused tests cover safe metadata and invalid limits/order/credential-bearing output. Actual isolated PostgreSQL verifies ordinary-role denial, page bounds, cursor behavior and disappearance after session-deletion cascade. The composed rehearsal obtains reconciliation scope from discovery, restarts the database, constructs a replacement store and rediscovers the held record. The final full SQL rehearsal passes and disposable containers/volumes are verified absent. Migration 18 has not been applied to hosted Supabase.

Limits: discovery provides candidates, not a dedicated cleanup-intent ledger or proof that active records should be terminated. A real independent revocation authority and trusted bounded scan orchestration remain required. Unknown authority must preserve records; no automated provider calls or rotation retries are enabled. Task 2c and phase gates remain open.

Exact next action: prepare a bounded explicit scan that uses metadata discovery and scoped reconciliation with injected authority, preserving unknown/active records and reporting resumable cursors. Test page progress, stale records, cancellation and underlying operation retention before scheduling or real activation. Private Memory last published the 406-test checkpoint.


## Bounded explicit reconciliation scan, 11 October 2026

Prepared createRefreshScan to process one metadata page sequentially through scoped reconciliation. It reports visited/confirmed/stale/unconfirmed counts and the last fully processed session cursor. Cancellation does not advance past unresolved work. A maximum eight-second deadline propagates abort; one underlying scan at a time retains its slot until actual completion, including ignored cancellation. No route, scheduler, provider revocation initiation, automatic rotation retry or ownership reset is installed.

All 421 foundation tests across 51 files, type checking and build pass. Four new simulated scenarios cover mixed outcomes, stale scope/cursor progress, cancellation during reconciliation and unresolved discovery admission. Existing SQL evidence remains separate; this scan has not yet been composed with actual PostgreSQL. No hosted configuration or paid/provider call occurred.

Semantics: endOfSweep only means the returned metadata page was shorter than the requested limit, not that all cleanup succeeded. Unconfirmed records remain stored and need a later full sweep from a null cursor; keyset pagination is not a transactional snapshot, so new earlier keys are picked up by a later full sweep. A canceled in-flight operation may have committed removal; scoped reconciliation and independent proof must resolve that uncertainty on an explicit subsequent invocation.

Exact next action: compose the actual scan with encrypted PostgreSQL discovery/reconciliation and synthetic authority, proving unknown records persist, confirmed records are removed and a replacement scanner resumes from the returned cursor. Then consolidate private Memory beyond its 406-test checkpoint. Task 2c and live/phase gates remain open.


## Reconciliation scan database composition, 11 October 2026

Composed the actual scan, metadata discovery, scoped reconciliation and encrypted store with isolated PostgreSQL. Three synthetic sessions exercise unknown/confirmed/unknown outcomes in one-record pages. Unknown records remain stored; only the independently confirmed fixture is removed. After an actual database restart, a replacement store/scanner resumes from the first page's cursor. An empty final page marks sweep end while two unknown records still exist. A later explicit full sweep with fresh synthetic authority resolves those two records. Temporary synthetic sessions are removed.

The full isolated SQL/composition rehearsal and all 417 foundation tests across 50 files, type checking and build pass. Disposable containers/volumes are verified absent. Provider authority remains synthetic; no hosted migration, actual provider call or paid activity occurred. This is explicit local invocation, not a running or scheduled background worker.

Remaining requirements: real independent revocation authority, operational authorization and durable scan cursor scheduling still need evidence before activation. Candidate discovery includes legitimate ready records, so the scanner cannot infer that they should be revoked. Simultaneous database/provider failure remains unconfirmed rather than automatically reset.

Exact next action: consolidate private Memory with the 417-test and complete scan/database evidence, then implement an independent, error-distinguishing server-side revocation authority contract using verified provider/session semantics. Keep hosted configuration, real credentials and phase gates closed until separately authorized. Task 2c remains incomplete.


## Normalized password provider bridge, 12 October 2026

Prepared createPasswordProvider with explicitly injected normalized operations and a server-only session stager. Exact confirmation-only results are accepted only for registration. Valid access/refresh results pass to staged ownership, while malformed replies with usable access authority retain idempotent exact-session cleanup. Late replies retain cleanup capability after cancellation. Failed staging attempts remote cleanup but stays unconfirmed because partial local ownership is possible. The shared account lifecycle supplies deadlines/admission and cleanup holds; this bridge must not be exposed directly. No route or credentials are activated.

All 428 foundation tests across 53 files, type checking and build pass. Four synthetic scenarios cover staging, confirmation, malformed/staging-failure cleanup and cancellation. Concrete HTTP operations, initial durable session staging and actual provider behavior remain incomplete. Supabase documents confirmation-enabled registration without an authenticated session: https://supabase.com/docs/reference/javascript/auth-signup . The exact normalized confirmation contract still requires a concrete adapter; arbitrary provider JSON is not treated as confirmed.

Exact next action: implement initial durable session staging with verified owner/session identity, encrypted generation-one adoption and conservative discard/reconciliation, then compose the password bridge with isolated PostgreSQL using synthetic operations. Preserve hosted/account/financial gates. Private Memory remains at its earlier verified 421-test publication pending consolidation.


## Initial encrypted session ownership, 12 October 2026

Prepared createInitialSessionStager for the normalized password bridge. It derives owner/session only from verified identity, rechecks current authority before adoption, refuses existing ownership, encrypts generation-one storage through the existing adapter and deduplicates adoption/discard. Cleanup waits for started adoption, quarantines confirmed owned state before revocation and removes only its matching generation/lease after exact confirmation. Lost adoption/claim acknowledgments never grant deletion authority; unknown or competing records remain unresolved for independent reconciliation. Expiry policy is explicit application configuration, not a new customer lifetime decision.

All 431 foundation tests across 54 files, type checking and build pass after correcting missing parameter type declarations. Three synthetic tests cover single adoption/cleanup, ambiguous or pre-existing ownership, invalid identity and refused revocation. Actual PostgreSQL/password composition is still pending; this is not hosted acceptance. No account route, production key, real sign-in, email or paid call was activated.

Exact next action: compose initial ownership and the normalized password bridge with the existing isolated PostgreSQL harness, generated signed identity and synthetic provider operations. Test lost adoption acknowledgment and restart quarantine before preparing the concrete password HTTP transport. Consolidate private Memory after this composition checkpoint.


## Initial password database composition and lost-save fix, 12 October 2026

Composed the normalized password bridge, initial session stager, generated ES256 identity, actual session SQL authority and encrypted ownership in isolated PostgreSQL. Successful initial adoption and confirmed cleanup pass. The new lost-adoption-acknowledgment/refused-revocation scenario reproduced a ready-record gap. Fixed it by attempting quarantine after any started adoption, even if its acknowledgment was lost. Deletion authority still requires confirmed ownership and matching lease; unknown ownership remains unresolved. A focused regression and actual database restart confirm the quarantined row cannot be claimed by a replacement store.

All 432 foundation tests across 54 files, type checking/build and the full isolated SQL composition pass. Provider replies and revocation remain synthetic. This proves the confirmed-quarantine path, not simultaneous database/provider outages. No real sign-in, email, production key or hosted change occurred. Task 2c remains open.

Exact next action: consolidate private Memory with this checkpoint, then prepare concrete password HTTP operations and registration-response normalization with simulated fetch. Keep startup routes disabled and preserve all activation/financial gates.


## Disconnected password HTTP operations, 12 October 2026

Prepared createPasswordProviderHttp with fixed HTTPS Supabase project endpoints: password grant, signup and explicit local logout. It whitelists email/password request fields, refuses redirects/browser cookies, bounds JSON responses to 64 KiB, limits four underlying operations and deadlines to eight seconds, retains admission for unresolved late requests/cleanup, and sanitizes errors. Only an empty 204 confirms logout. A token-free signup user reply with a UUID id normalizes to confirmationRequired; this is not proof an email was delivered or an account created. Session-bearing replies still require the verified staged-session owner. No SDK persistence, retries, environment credentials or installed routes.

All 438 foundation tests across 55 files, type checking and build pass. Six synthetic-fetch scenarios verify fixed request contracts, confirmation normalization, logout, refusal before fetch, ignored-cancellation admission and oversized/non-JSON rejection. Actual provider behavior and complete HTTP/password/database composition remain unverified. Upstream SDK source was consulted for endpoint/request shape, not installed or treated as a pinned live contract: https://raw.githubusercontent.com/supabase/auth-js/master/src/GoTrueClient.ts .

Exact next action: compose the HTTP adapter, normalized bridge and initial encrypted ownership in the isolated PostgreSQL harness with generated tokens and synthetic fetch; test confirmation-only signup and cleanup failure. Preserve hosted/account and financial gates. Private Memory remains at its verified 432-test checkpoint pending the next consolidation.


## Password HTTP and database composition, 12 October 2026

The isolated PostgreSQL harness now composes actual password HTTP operations, normalized provider bridge, generated signed identity, initial encrypted ownership and shared account lifecycle. Injected synthetic fetch confirms exact endpoints, body allowlisting, no redirects/cookies and no automatic retries. Registration confirmation returns no cookie or durable ownership. Successful sign-in adopts generation one and confirmed cleanup removes it. Lost adoption acknowledgment plus refused HTTP logout retains quarantine across actual database restart and replacement-store refusal. Counts are exactly three password/signup requests and two cleanup requests.

The registration normalizer now also refuses ambiguous error/session fields rather than describing them as confirmation. All 439 foundation tests across 55 files, type checking/build pass. The full isolated database rehearsal passes with synthetic provider replies; real Supabase Auth and browser HTTPS behavior remain unverified. No real sign-in, email, credentials, hosted change or paid call occurred.

Exact next action: prepare the concrete durable sign-out port using verified request identity, scoped encrypted ownership and independent session-presence confirmation. Keep provider response uncertainty explicit. Consolidate private Memory at the next checkpoint; its current publication contains 432 tests. Task 2c remains incomplete.


## Durable sign-out port preparation, 12 October 2026

Prepared createStoredSignOut as a disconnected port behind the existing bounded sign-out owner. It snapshots request headers, verifies exact same-origin POST/path and signed owner/session, quarantines ready encrypted ownership where possible, attempts explicit session logout and then requires independent primary Auth absence through scoped reconciliation. An accepted HTTP logout alone is insufficient. A lost logout acknowledgment can still resolve only when independent absence is proved. Empty local storage also requires remote evidence; malformed, canceled or unknown paths return false. Matching generation/lease removal remains fenced.

All 443 foundation tests across 56 files, type checking/build pass after correcting incomplete test doubles and narrowing the identity dependency to authorize only. Four synthetic scenarios cover independent proof, lost acknowledgment, wrong owner/origin refusal and quarantine-before-cleanup ordering. The new port is not yet composed with isolated PostgreSQL or real providers. No route, hosted change, credential or paid call was added.

Exact next action: compose the sign-out port, actual password HTTP logout and primary Auth presence authority in the isolated database harness; prove logout-response-without-row-deletion stays unconfirmed, actual synthetic session deletion confirms, and quarantine survives refused cleanup. Consolidate private Memory at that checkpoint. Task 2c remains incomplete.
