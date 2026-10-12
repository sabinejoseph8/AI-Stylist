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
| Tests/review/phase exit | 402 local foundation checks plus type checking/build; earlier SQL/Storage evidence | Actual provider/manual phase checks and required phase-wide code review; no phase exit is claimed |

## Local next steps

1. Email/password HTTP handling is prepared locally with bounded parsing, same-origin protections and verified header-only cookies; actual server delivery and refresh adoption remain unverified.
2. Recovery-request and sign-out HTTP composition are prepared with simulated adapters. Early refresh ownership and expected signed-owner checks are prepared. Session-specific concurrent rotation and refresh HTTP composition are prepared locally. Shared lifecycle uncertainty holds are composed and tested. Adoption composition and durable refresh state remain pending.
3. Keep the accepted eight-step account review recorded; verify the new reset step, actual screen reader/phone/zoom and every real-provider requirement separately.
4. Record actual provider setup requirements without applying settings or requesting credentials prematurely.

## Human and external dependencies

- Sabine completed all eight local account preview steps and confirmed all worked and were readable. Physical-device and screen-reader acceptance remain open.
- Phase 1 completion and a hosted/account activation decision are still required before real account configuration or tests.
- Production email sender, Google/Apple credentials and actual callback allowlists are not approved by local preparation.
- Refresh/session persistence and same-browser versus cross-device recovery must be reviewed before promising customer behavior.
- No spending allowance or additional provider attempt is created by this audit.


## Activation preparation

See docs/task-2c-activation-checklist.md for evidence and approval boundaries. Sabine accepted all seven newer reset-screen review steps as working/readable; the original eight-step review also remains accepted. Further local preparation must address adoption, storage and actual local HTTP composition rather than treating generated-token tests as hosted readiness.

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
