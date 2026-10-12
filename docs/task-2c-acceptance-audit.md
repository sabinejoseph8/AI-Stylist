# Task 2c acceptance audit

Status: Local preparation only. Task 2c and Phase 2 remain open.

Sabine approved local account interfaces and simulated tests while Phase 1 remains open. This does not authorize real sign-ins, provider credentials, hosted changes, emails or paid calls.

## Current evidence and remaining work

| Requirement | Verified local evidence | Still required |
| --- | --- | --- |
| Accounts before styling | Sample UI and coordinator keep customer styling locked | Approved route activation with verified identity on all customer routes |
| Password/registration | Bounded HTTP adapter, signed identity, initial encrypted ownership and isolated PostgreSQL composition; confirmation gives no cookie | Real project configuration, registration/email policy and delivery acceptance |
| Google/Apple | Fixed authorization links, browser-bound one-use PKCE, HTTP exchange, signed identity and encrypted ownership with database restart protection | Actual credentials, callback allowlists, linking defaults and device/provider checks |
| Recovery | Signed recent recovery-purpose verification, bounded HTTP request/exchange/update, one-use browser reset and actual primary-session cleanup composition with synthetic provider replies | Real email/reset acceptance, customer restart/cross-device decision and HTTPS browser checks |
| Refresh/cleanup | Actual isolated SQL ownership/fencing/restart tests, metadata reconciliation and key usage inventory | Hosted Auth schema/configuration, real concurrency/disconnect checks and operational recovery policy |
| Sign-out | Stored revocation port, HTTP cookie clearing and actual primary absence composition; accepted-only logout stays unconfirmed | Actual provider/session policy and device/concurrent sign-out acceptance |
| Accessibility | Original eight-step account and seven-step reset reviews accepted | Physical iPhone, screen reader, zoom and complete accessibility acceptance |
| Identity linking | Owner derives from signed user ID; no app email-based merging | Provider-default audit and business decision on customer linking behavior |
| Phase exit | 520 foundation tests across 73 files, type checking/build and isolated database rehearsal pass | Remaining manual/provider gates and phase-wide code review |

All provider operations in these tests are synthetic. Actual isolated PostgreSQL evidence is not hosted Supabase acceptance. No account route, real sign-in, email or password change has been activated.

The dormant account factory now has Request/Response integration against isolated PostgreSQL for password, Google/Apple initiation/callbacks, recovery request/callback/reset, refresh and sign-out. Generated identities are signed and database authority is actual local SQL; all provider responses remain synthetic. Response-discard cleanup, shared admission, reset shutdown and uncertain cleanup have local checks. Guarded factory password delivery now passes actual Node loopback checks with generated signed identity and simulated authority. Guarded password disconnect and factory shutdown now pass actual loopback checks with late simulated adoption cleanup. Google/Apple/recovery callback delivery, replay and late-result disconnect/shutdown now pass complete-factory Node checks with generated signed identities and simulated authority. Synthetic desktop WebKit now verifies optional reset readiness/cancellation/password clearing/replay refusal and explicit connected account wording, recovery and Google/Apple cancellation. Physical-device, live-provider/HTTPS acceptance and durable deployment abuse protection remain open.

## Next authorized local work

1. Reconcile the complete account acceptance checklist against current source and tests, including late-result cleanup and recovery credential lifetime.
2. Prepare any remaining independent local integration checks without real provider calls or hosted activation.
3. Preserve accepted manual reviews and all business, budget, Phase 1, hosted and device gates.

Earlier dated appendices below are historical checkpoints, superseded by this current matrix.

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


## Sign-out HTTP and primary database evidence, 12 October 2026

Extended the isolated database pipeline through the concrete stored sign-out port, sign-out HTTP factory, password HTTP logout and primary Auth session-presence authority. A synthetic accepted 204 without session-row deletion returns remoteUnconfirmed (409), clears browser cookies through headers and retains held ownership. When the injected provider actually deletes the synthetic Auth session, foreign-key cascade removes encrypted ownership, independent absence confirms signedOut (200), and the same still-signed token fails authorization. Explicit request counts show no automatic retries. Refused initial cleanup remains quarantined across the earlier actual restart.

All 443 foundation tests across 56 files, type checking/build and the complete isolated SQL rehearsal pass. A missing cancellation argument in the test harness was corrected before the passing final run. Provider fetch is synthetic; no hosted or real-account acceptance is claimed. No live routes, credentials, emails or paid calls were used.

Exact next action: consolidate private Memory with the complete 443-test account checkpoint, then prepare OAuth initiation/exchange transport contracts locally with synthetic responses and one-use PKCE transactions. Recovery purpose verification, real provider configuration, HTTPS browser/device checks and Phase 1/hosted approvals remain open. Task 2c remains incomplete.

## Local OAuth exchange preparation

Prepared PKCE code exchange through the existing bounded Supabase HTTP transport. Only auth_code and code_verifier are sent to the fixed token endpoint; requests refuse redirects and browser cookies. Google and Apple reuse shared token normalization, initial-session staging and late-result cleanup. Five new synthetic tests cover request validation, malformed responses, late canceled results and the composed browser-bound callback to verified cookie preparation. All 451 foundation tests across 58 files, type checking and build pass. No real provider, credentials, account route or hosted settings were activated. Database composition of this OAuth path remains pending, and Task 2c stays open.

Next action: compose OAuth code exchange with the actual isolated PostgreSQL refresh-ownership store and confirm failed adoption and callback replay cannot issue access. Then update the private Memory publication, currently at 443 tests.

Protocol reference: https://github.com/supabase/auth-js/blob/master/src/GoTrueClient.ts (_exchangeCodeForSession). The reviewed upstream source is not a pinned installed SDK or evidence of live compatibility.

## OAuth database composition verified

The disposable PostgreSQL rehearsal passes with the prepared OAuth HTTP transport, generated signed identities and actual encrypted refresh ownership. Google and Apple each adopt generation one, reject callback replay, and clean up the staged ownership. A lost adoption acknowledgment combined with refused synthetic logout blocks access and keeps the ownership unclaimable after an actual database restart. All provider/network responses are synthetic. No hosted database changes or real provider calls occurred; this does not complete Task 2c. The earlier 451-test suite, type checking and build passed.

Exact next implementation action: prepare provider-verified recovery authorization, without treating an ordinary account JWT as recovery proof. Private Memory publication follows this checkpoint.

## Signed recovery-purpose verification prepared

The existing bounded asymmetric identity verifier now exposes a separate recovery check. It requires a signed amr recovery method with a valid recent timestamp, normal issuer/audience/role/identity checks, and a current authoritative Auth session. Recovery authority expires at the earlier of token expiry or five minutes after the recovery authentication, and isCurrent rechecks both expiry and session status. Normal identity verification keeps its original result shape. This is an application freshness rule, not a claim that Supabase promises this reset lifetime. No reset grant, password update, email or hosted route was activated.

All 453 foundation tests across 58 files, type checking and build pass. New synthetic signed-token tests reject missing/password/stale/future/malformed recovery methods and confirm independent recovery expiry. Source: https://supabase.com/docs/guides/auth/jwt-fields documents amr recovery and timestamps; real project claims and provider/device behavior remain unverified.

Exact next action: connect this proof to a prepared recovery provider adapter that creates reset-only capability, rechecks purpose/current authority before updating a password and independently confirms session cleanup. Keep normal account cookies unavailable through recovery. Private Memory currently publishes the earlier 451-test database checkpoint.

## Reset-only recovery provider prepared

Prepared an injected recovery adapter using signed recovery-purpose verification and current identity checks. Its server-only capability exposes one password update attempt, rechecks current recovery authority, and issues no normal account cookie. Discard always attempts scoped logout, then requires exact independent owner/session absence proof; logout acceptance alone is insufficient. Malformed proof or failed identity verification cannot authorize a reset. A late verification failure retains the remote cleanup capability, with unconfirmed cleanup held by the existing recovery owner.

All 458 foundation tests across 59 files, type checking and build pass. Five new simulated tests cover one-use reset, ordinary-login refusal, revoked authority, unknown cleanup, lost logout reply with independent proof, and verification exceptions. No provider HTTP recovery transport, real password change, email, hosted configuration or route was activated. Task 2c remains incomplete.

Exact next action: compose the recovery adapter with generated signed recovery identities and the existing recovery owner/browser binding, then prepare bounded recovery HTTP operations. Private Memory remains at the verified 451-test checkpoint.

## Recovery owner/browser composition verified locally

Three new composed synthetic checks use generated ES256 recovery JWTs, actual identity verification, the recovery provider adapter, one-use callback owner, reset browser binding and reset HTTP response. The correct reset cookie permits one update and clears itself without issuing an access cookie. Wrong browser binding and callback replay fail. An ordinarily signed password token fails recovery-purpose verification and is cleaned up. An update with unproved primary session cleanup returns HTTP 409/unconfirmed, clears the reset cookie and holds both recovery and browser owners.

All 461 foundation tests across 60 files, type checking and build pass. Provider operations and session presence are simulated here, not actual hosted or isolated database evidence. Real password changes and email delivery remain disabled. Task 2c stays open.

Exact next action: prepare bounded HTTP recovery-request, PKCE exchange and password-update operations, then compose with the isolated primary database. No real provider call, credential or route is authorized by this checkpoint. Private Memory remains at 451 tests.

## Bounded recovery HTTP preparation

Prepared explicit injected HTTP operations for recovery requests, PKCE code exchange and password updates. Requests use fixed Supabase HTTPS/default-port destinations, refuse redirects and browser credentials, validate the exact recovery callback and flow, and send allowlisted fields only. Transport has four underlying operations, an eight-second maximum deadline, bounded request/response sizes, redacted failures and retained admission while ignored cancellation or late response cleanup is unresolved. Password-update confirmation requires a matching returned owner ID; decoding the input JWT only correlates this response, while the recovery adapter performs signature/purpose/current-session authorization. Existing scoped logout transport is composed separately.

All 468 foundation tests across 61 files, type checking and build pass. Seven new synthetic checks cover destination/callback restrictions, exact recovery and PKCE bodies, owner correlation, ignored cancellation and malformed/oversized/non-JSON/failure responses. No real email, password update, provider request, route or hosted configuration was activated. Task 2c stays open.

Protocol reference: https://github.com/supabase/auth-js/blob/master/src/GoTrueClient.ts (resetPasswordForEmail, _exchangeCodeForSession, _updateUser). Upstream source is research, not a pinned installed SDK or live acceptance. Exact next action: compose recovery HTTP with signed recovery identity and actual isolated primary database cleanup, then refresh private Memory from its current 451-test checkpoint.

## Recovery database composition verified

The disposable PostgreSQL rehearsal now composes the prepared recovery request/PKCE/password-update HTTP transport, generated signed recovery identity, callback owner, browser reset cookie and independent primary-session presence RPC. Synthetic confirmed reset deletes the actual synthetic Auth session, while accepted-only logout leaves cleanup unconfirmed. An ordinary signed password token is rejected and cleaned up. Replay and repeated reset are refused; no normal account cookie is issued. Provider and password-update responses are synthetic, not real hosted password changes or email delivery. Containers and volumes were verified removed.

Current foundation evidence: 468 tests across 61 files, type checking and build pass. Full isolated ownership rehearsal passes including password, OAuth, recovery and sign-out compositions. Task 2c stays open for real configuration, cross-device/restart policy, HTTPS/device/accessibility checks and phase gates. Next: review the remaining local account acceptance gaps and prepare the highest-priority authorized one; do not activate hosted Auth or spend.

## OAuth callback HTTP delivery prepared

Added the previously missing disabled callback-response adapter for Google and Apple. It delivers verified account cookies only with an allowlisted relative redirect, returns no response body containing tokens, sets no-store/no-referrer headers, sanitizes failures and clears the flow cookie. Ready results arriving after cancellation or carrying a disallowed return path are discarded. Undelivered successful responses retain a server-only cleanup capability. The real exchange owner remains responsible for one-use callback validation and cleanup holds. No route is installed.

All 472 foundation tests across 62 files, type checking and build pass. Four new synthetic checks cover cookie/redirect delivery, failure sanitization, canceled/external return cleanup and origin/method/path refusal. Actual callback browser delivery and Node disconnect composition remain separate checks; this is not hosted sign-in acceptance.

Exact next action: add the analogous reset-only recovery callback delivery, then compose both callback handlers with the prepared Node transport and actual signed identities. Preserve all hosted and spending gates. Private Memory currently publishes the 468-test database checkpoint.

## Recovery callback delivery, 12 October 2026

Prepared a reset-only recovery callback HTTP adapter. A verified grant is installed in the existing opaque browser binding and redirects only to /account/reset, with reset/flow cookies and no account-access cookie or provider token body. Canceled delivery and refused installation clean the grant; undelivered successful responses retain cleanup. Failure statuses are sanitized with no-store/no-referrer headers. The Node listener now explicitly accepts only google/apple/recovery callback routes alongside its account API paths. No route is registered in the running application.

All 477 foundation tests across 63 files, type checking and build pass. Five new tests cover reset-only delivery, cancellation/install cleanup, failure/path validation, exact Node callback allowlisting and actual loopback redirect/separate-cookie transport. The loopback transport fixture is synthetic and does not yet prove the generated-identity callback/disconnect composition. Hosted TLS/browser acceptance remains open.

Exact next action: compose actual signed OAuth/recovery callback handlers with Node delivery, including a disconnected client and late provider result; keep the server activation disabled. Private Memory currently publishes the 468-test database checkpoint.

## Signed callbacks and disconnect cleanup, 12 October 2026

Five new composed loopback HTTP tests use generated ES256 identities and actual OAuth/recovery owners with callback response adapters. Google and Apple deliver account cookies/relative redirects and refuse replay. Recovery delivers only its reset cookie. A late OAuth session after client disconnect is discarded. A late recovery result is revoked without installing reset permission.

The recovery disconnect test exposed an unnecessary unresolved-cleanup hold: cancellation prevented initial identity verification, leaving cleanup unable to correlate primary absence. Fixed by verifying identity with the independent bounded cleanup signal before revocation, solely for cleanup correlation. Failed verification still attempts logout and remains unconfirmed. This does not restore reset authority or issue cookies.

All 522 foundation tests across 73 files, type checking and build pass. Provider/current-session responses in these loopback cases are simulated. Earlier isolated database evidence remains separate and must be rerun after this cleanup change before claiming the new path is database-verified. No route, hosted setting, email or real sign-in was activated.

Exact next action: extend the isolated recovery database rehearsal with the canceled/late result case and rerun it, then update private Memory from the 468-test checkpoint. Task 2c and hosted/device gates remain open.

## Late recovery cleanup database verification, 12 October 2026

Extended the actual isolated PostgreSQL rehearsal with a canceled caller and delayed recovery result. Cleanup verifies the signed identity with its independent signal, invokes scoped synthetic logout, and confirms actual primary-session deletion. No password update or reset permission occurs, and cleanup does not remain unnecessarily held. The full ownership rehearsal passes and disposable containers/volumes were verified removed. Provider replies remain synthetic; no hosted changes occurred. Foundation evidence remains 482 passing tests, type checking and build.

Next authorized local work: prepare the missing OAuth initiation HTTP boundary, then compose disabled account handlers into an explicit route factory. Do not register real account routes or configure providers. Task 2c remains open.

## Same-origin OAuth initiation delivery, 12 October 2026

Prepared the missing JSON initiation HTTP boundary at /api/account/oauth, without registering it. It accepts only provider and returnPath, uses the existing same-origin/JSON/body/deadline checks and the fixed Google/Apple authorization builder, and delivers only a public handoff URL plus a Secure/HttpOnly browser-binding cookie. The verifier remains server-only. Pending transactions now expose a server-only idempotent discard capability; undelivered responses remove them. Also rejected nondefault Supabase ports in the URL builder.

All 485 foundation tests across 65 files, type checking and build pass. Three new synthetic checks cover public handoff shape/binding, abandoned transaction refusal, cross-origin/extra-field/provider/external-return rejection and destination-port restrictions. No sign-in page, provider call, route or hosted configuration was activated.

Exact next action: compose the prepared initiation, password, callback, refresh, recovery and sign-out handlers into one explicit disabled account route factory, sharing lifecycle owners and preserving undelivered-response cleanup. Task 2c remains open. Private Memory remains at the verified 482-test checkpoint.

## Reset readiness HTTP and browser preparation, 12 October 2026

Prepared a metadata-only reset readiness endpoint in the dormant account factory. It accepts only an empty same-origin JSON request, checks the server-owned reset cookie without consuming it, returns only status and expiry, and sets no cookie. The browser adapter validates bounded expiry before preparing the explicit reset panel. Password submission independently checks the server-owned permission again. Missing, expired, consumed or closed permission cannot enable this configuration. No live routes, provider calls, email or hosted settings were activated.

Evidence: 516 foundation tests across 72 files pass; type checking and production build pass. The new integration checks cover repeated non-consuming readiness, missing cookie, extra input, metadata response and browser configuration refusal after shutdown. This is local synthetic-provider evidence, not real recovery acceptance. Task 2c and both phase exit gates remain open.

Next action: connect the explicit account return-page resolver and reset configuration in a disabled local composition, retaining the sample preview as the default; then run its focused browser checks. Private Memory still publishes the earlier 497-test checkpoint and needs reconciliation.

## Optional recovery-page composition, 12 October 2026

Prepared an explicit recovery page that accepts only the clean reset return path, waits for server-cookie readiness metadata before showing password fields, cancels on page changes/unmount, and ignores late or stale configurations. The default sample App does not mount it. No live authentication, email, hosted change or paid call was enabled.

Evidence: 519 foundation tests across 73 files pass; type checking and build pass. Tests cover forbidden return paths, expired readiness, canceled late preparation and request-free initial rendering. This is not physical browser or real recovery acceptance.

Next action: add browser lifecycle verification for the optional reset page, then review remaining local Task 2c activation prerequisites. Private Memory publishes the prior 516-test checkpoint.

## Reset-page browser lifecycle verification, 12 October 2026

A local WebKit run using synthetic reset data verified readiness before fields appear, immediate cancellation on Return, refusal of a late response after Return, reset submission, clearing both password fields, disabled replay and cancellation on unmount. Fixed Return to cancel immediately even if the parent does not unmount the screen. The optional connected screen remains absent from the default App. No provider, email or hosted account operation was started.

The full foundation suite still passes 519 tests across 73 files, type checking and build. Browser script: apps/foundation/scripts/check-recovery-browser.cjs; serve the foundation on loopback port 4325, supply PLAYWRIGHT_MODULE and optionally WEBKIT_EXECUTABLE for an existing installation. Fixture: tests/browser/recovery.html. Desktop WebKit simulation does not replace physical iPhone, accessibility or real recovery acceptance.

Next action: review remaining local Task 2c prerequisites and explicit account-panel composition. Private Memory remains at the 516-test checkpoint; update it with the next consolidated publication.

## Explicit account presentation mode, 12 October 2026

Prepared opt-in connected account wording with an explicit injected provider requirement. The sample provider cannot enable connected mode. Connected labels, password-manager autocomplete and status messages describe account operations accurately; simulated reset entry remains preview-only. Rendering does not call the provider. The default App stays in sample mode, and no live route or hosted operation is enabled.

Evidence: 520 foundation tests across 73 files pass, including connected configuration refusal, labels and request-free rendering. Type checking and build pass. Connected browser interaction and real-provider acceptance remain open.

Exact next action: verify connected account presentation with a synthetic browser provider, including recovery messaging and cancellation, then reconcile the Memory site. Preserve all activation and spending gates.

## Connected account WebKit evidence, 12 October 2026

The repeatable local WebKit check passed with synthetic account responses: sign-in/sign-out, clearing email and password on sign-out, password clearing after creation, new-password autocomplete, confirmation and non-enumerating recovery messages, absence of the sample reset shortcut, and Google/Apple cancellation with late handoff refusal. Script: apps/foundation/scripts/check-account-browser.cjs; fixture: tests/browser/account.html. Uses the existing loopback-only port 4325 and injected Playwright installation, as documented for the reset browser check. No external provider, email or hosted setting was used.

The last full foundation run remains 520 passing tests across 73 files with type checking and build passing. This browser evidence does not close physical-device, accessibility, live Auth or phase gates. Next: reconcile the private Memory website with current account/browser evidence and audit authorization prerequisites for the remaining backlog.

## Account configuration-change isolation, 12 October 2026

Changing the explicit account provider or connected/sample mode now remounts account presentation and cancels the old flow. This clears old sign-in state and entered details. Local WebKit verified replacement after sign-in clears fields, replacement during Google handoff aborts the old request, and its late reply cannot restore handoff state. Existing synthetic browser account scenarios also pass. All 520 foundation tests, type checking and build pass. No hosted or provider operation was activated.

Exact next action: audit remaining local preparation against Phase 1 and Phase 2 requirements, distinguishing additional implementation from decisions and hosted acceptance. Private Memory remains at the prior 520-test browser checkpoint and will receive this fix in the next consolidated update.

## Current account database rehearsal and next-stage audit, 12 October 2026

Re-ran apps/foundation/scripts/check-refresh-ownership.py against current source. The isolated PostgreSQL rehearsal passed account factory password, Google/Apple, recovery, refresh and sign-out composition, encrypted ownership, concurrency fencing, restart holds, key transition and primary-session cleanup. Provider responses remained synthetic; no hosted data or paid request was used. Disposable rehearsal resources were removed. This supplements the 520-test foundation and desktop WebKit evidence and does not establish hosted acceptance.

The next substantial customer-account stage is gated by the existing local-only exception. Two decisions have been presented to Sabine and remain unanswered: whether recovery must work on another device, and whether hosted Tasks 2b/2c may begin before Phase 1 closes. Do not infer either answer from elapsed time. Phase 1 also needs the pending Tavus technical reply and a newly approved bounded paid-test allowance. Rakuten registration remains deferred until the customer site is live.

Exact next action: incorporate Sabine's recovery and hosted-sequencing answers when received, then prepare the selected recovery contract or hosted database/account setup under that scope. Until then, preserve all current activation and spending gates; no backlog task or phase is marked complete by this audit.

## Approved hosted setup and cross-device recovery, 12 October 2026

Sabine explicitly approved hosted Tasks 2b and 2c before Phase 1 finishes, including applying prepared customer database protections and configuring accounts in the existing AI Stylist Supabase project. This supersedes the previous local-only sequencing boundary for that work. It authorizes no extra spending or paid voice test. Credentials and any new financial or irreversible action retain their gates. Phase 1 and all hosted acceptance checks remain open.

Sabine selected password recovery that works when the emailed link is opened on another device. The existing browser-bound PKCE rehearsal does not satisfy that requirement. Prepare a server-verified cross-device recovery contract using current official Supabase guidance; inspect actual project/email/callback settings before applying changes. Do not present same-browser-only recovery as completed MVP behavior.

Exact next action: inspect the existing AI Stylist Supabase project and current recovery contracts, review the prepared migration chain against hosted state, then implement/configure the approved scope. No hosted change has occurred merely from recording this approval.

## Cross-device transport and hosted preflight, 12 October 2026

The bounded recovery provider transport now supports token-hash verification with a fixed recovery purpose and fixed Supabase destination. Malformed/canceled proofs are refused before fetch. All 522 foundation tests across 73 files, type checking and build pass. This is transport preparation, not a completed cross-device flow. The receiving-browser confirmation, reset-only lifecycle composition, email configuration and real-device acceptance remain to implement.

Read-only hosted inventory confirms the existing AI Stylist project has only the prototype budget table in the inspected app schemas and no tracked customer migrations. Required managed Auth columns match the prepared checks. No customer schema migration, email or provider operation has been activated yet. See docs/cross-device-recovery.md for the selected direction, primary sources and remaining checks. Hosted Tasks 2b/2c are now explicitly authorized before Phase 1 finishes; prior local-only and pending-question statements are historical. Spending limits remain unchanged.

Exact next action: review and apply the customer migration chain to the verified project with post-application privilege checks, and compose cross-device token verification with receiving-browser confirmation and reset-only authority. Credentials/new financial decisions still require Sabine.

## Cross-device reset-only lifecycle, 12 October 2026

The cross-device token provider now uses the same signed identity, recent recovery purpose, current-session check, one-use password operation and independently verified scoped cleanup as the existing PKCE provider. It accepts no requesting-browser verifier and exposes only a reset capability. Ordinary login purpose is refused while cleanup is retained. Malformed proof is rejected before the provider operation. The receiving-browser confirmation and HTTP owner are still to be composed; no live email or customer migration has been activated.

Evidence: 525 foundation tests across 73 files pass; type checking and build pass. Provider replies remain synthetic. Exact next action: compose receiving-browser confirmation with bounded recovery ownership and delivery cleanup, then apply/review the approved hosted migration chain. Hosted setup and cross-device behavior are approved; spending remains unchanged.

## Consolidated hosted checkpoint published to private Memory, 12 October 2026

The owner-private Memory update succeeded with MCP enabled and its existing one-user/no-group audience unchanged. All 16 site checks and artifact validation passed. Published source a9b2d3a07867a52698b1a5cb71d2c4f43963bcd6; deployment appgdep_6acc87d9a600819187ec3906722f17b2; saved version appgprj_6acbce5b11a88191beb15ff1046a9d3c~appgver_4e85326dbb7c8191b12ec0d200df2e72. The site now includes installation of migrations 001 through 020 and the distinction between metadata checks and customer acceptance. No task was marked complete by publication.

Read-only hosted Auth inspection found Site URL http://localhost:3000, no redirect allowlist entries, built-in email service with a production-use warning, and the reset template still using ConfirmationURL. No setting was changed and no email was sent. The exact customer HTTPS origin and working reset destination must be deployed before changing template/redirect settings; custom SMTP needs a sender service/account and credentials. Next: document the activation sequence and complete the rendered confirmation-to-password-form journey locally, preserving the hosted activation gates.

## Complete rendered reset journey and WebKit origin fix, 12 October 2026

Extended the actual local HTTPS confirmation check to build and serve the real React RecoveryPage and connect its readiness/reset transports to the prepared Node handlers. The earlier placeholder destination is replaced in this synthetic test. Browser evidence now includes scanner-safe opening, explicit confirmation, secure reset-only cookie, readiness, password form submission once, cleared password fields/cookie, disabled replay, unavailable state after refresh and scoped cleanup. Provider verification/password update remain synthetic, not real Supabase or physical iPhone acceptance.

The integration exposed a WebKit behavior: no-referrer on the browser POST produced Origin: null, which the server correctly refused. Fixed the account transport to use same-origin referrer policy with an explicit fixed origin-root referrer. No proof-bearing path/query is sent; exact server Origin checks remain unchanged. The transport test asserts this configuration. All 538 foundation tests across 75 files, type checking, production build and the complete WebKit HTTPS check pass. The first full-suite attempt lacked sandbox loopback permission and was stopped; the authorized rerun passed. Temporary browser/server/cert/build resources were removed.

Exact next action: prepare the explicit customer account host and durable abuse/maintenance wiring before hosted activation; configure exact HTTPS URLs/email only when that destination works. Hosted inventory still has localhost/no redirect allowlist, built-in SMTP and the default ConfirmationURL reset template. Private Memory publishes the complete 20-migration checkpoint; include this rendered-browser fix in its next consolidated update. Task 2c and all phase acceptance gates remain open.

## Shared account admission prepared and installed, 12 October 2026

Prepared a service-only aggregate account admission guard and installed migration 202610120021 in the approved existing Supabase project. It stores one counter/window row, with no IP address, email, account identifier or request content. The engineering default is 60 admissions per 60-second database window, serialized under a row lock. Database clock regression fails closed. The dormant wrapper refuses unavailable/malformed/late acknowledgments before provider work, keeps at most four underlying admission operations, and preserves sign-out cleanup outside the aggregate cap. Existing strict authorization and listener/provider bounds remain required. This coarse aggregate cap does not replace provider anti-abuse protections or prove resistance to targeted/distributed attacks.

Evidence: 544 foundation tests across 76 files, type checking and build pass. The actual dormant factory is tested for refusal before provider calls, admission, shutdown and sign-out authorization. A disposable network-isolated PostgreSQL rehearsal admitted exactly 60 of 72 concurrent calls, preserved exhaustion through restart, renewed after expiry and refused backward clock renewal; all test containers/volumes were removed. Hosted installation returned Success; 10 live metadata checks all passed for RLS, role denial, service-only fixed-search-path function, unused singleton and preserved prototype budget table. The hosted function was not invoked and the wrapper is not mounted. Source hash is in the deployment receipt.

Exact next action: compose the explicit customer account host with this durable guard, verified provider/identity/session ports and bounded maintenance/shutdown; then verify through local HTTPS before configuring email URLs or deploying. Twenty-one customer migrations are installed. Customer sign-in, email, real recovery/provider/device acceptance and phase gates remain open. Private Memory still publishes the earlier 20-migration checkpoint and needs the rendered reset fix plus this shared admission checkpoint in its next update. No new spending or paid voice call occurred.
