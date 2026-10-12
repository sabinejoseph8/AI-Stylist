# Hosted customer account activation

Status: preparation in progress, 12 October 2026. Hosted Tasks 2b/2c are authorized before Phase 1 completion. No new spending or paid voice call is authorized.

## Verified current state

- Existing AI Stylist Supabase project: all twenty-one customer migrations installed. Source hashes and metadata checks are in hosted-database-deployment.json. SQL Editor execution does not register CLI history.
- Customer account handlers are prepared but absent from the default server. The current Render service is the private voice prototype, not a deployed customer account application.
- Read-only dashboard inspection: Site URL is http://localhost:3000; no redirect URLs; built-in email sender with a production-use warning; password reset template uses ConfirmationURL.
- Local synthetic evidence: 560 tests, type checking, build, isolated database rehearsal and desktop WebKit checks. The rendered confirmation-to-password-form journey now passes. This does not prove real email, hosted provider or physical-device acceptance.

## Required order

1. Compose an explicit customer account host with verified server identity/session ports, encrypted refresh ownership, strict origin/Host checks, protected response delivery, shutdown and scheduled cleanup. Preserve the sample UI as a separately labeled mode.
2. Add durable abuse admission shared across processes/restarts. Process-local concurrency and rate guards alone are insufficient. Refuse provider work when durable controls or required secrets are unavailable.
3. Verify all routes and the actual reset page at the selected HTTPS customer origin. Do not reuse the private Memory URL or assume the private voice preview serves account routes. Redact proof-bearing URLs from application and proxy logs.
4. Configure the exact Site URL and exact Google/Apple/recovery redirects only for the working origin. Avoid wildcard allowlists. Keep email links unconfigured until the receiving endpoint works.
5. Prepare the recovery email with TokenHash and fixed recovery purpose pointing to the scanner-safe receiving page. Keep provider verification behind explicit browser confirmation. Never consume proof on email landing GET.
6. Configure a production sender using an approved service and privately entered credentials. Selecting a paid service or creating credentials requires Sabine. Do not publish sender credentials or personal account addresses.
7. Verify real sign-up/confirmation, sign-in, recovery on another device, one-use reset, sign-out and revocation. Verify Google/Apple and the approved identity-linking policy separately. No synthetic check substitutes for these.
8. Complete owner/foreign-user isolation through the live adapter, maintenance/restart checks, physical phone and accessibility checks, and the phase review before marking Tasks 2b/2c complete.

## Privacy and lifecycle gates

Schedule bounded seven-day receipt expiry and recovery-grant cleanup before customer activation. Minimal retired image IDs remain until account deletion. Unknown provider cleanup must remain held, not reported as confirmed termination. Do not enable recording, live voice or spending beyond existing allowances.

## Exact next implementation

The dormant explicit Supabase host composition and durable shared admission are prepared. Prepare separate connected account/reset browser delivery and strictly bounded static HTTPS serving, then test the complete browser journey. Do not change the live email template until a verified HTTPS destination and sender configuration are ready.

## Shared account admission prepared and installed, 12 October 2026

Prepared a service-only aggregate account admission guard and installed migration 202610120021 in the approved existing Supabase project. It stores one counter/window row, with no IP address, email, account identifier or request content. The engineering default is 60 admissions per 60-second database window, serialized under a row lock. Database clock regression fails closed. The dormant wrapper refuses unavailable/malformed/late acknowledgments before provider work, keeps at most four underlying admission operations, and preserves sign-out cleanup outside the aggregate cap. Existing strict authorization and listener/provider bounds remain required. This coarse aggregate cap does not replace provider anti-abuse protections or prove resistance to targeted/distributed attacks.

Evidence: 544 foundation tests across 76 files, type checking and build pass. The actual dormant factory is tested for refusal before provider calls, admission, shutdown and sign-out authorization. A disposable network-isolated PostgreSQL rehearsal admitted exactly 60 of 72 concurrent calls, preserved exhaustion through restart, renewed after expiry and refused backward clock renewal; all test containers/volumes were removed. Hosted installation returned Success; 10 live metadata checks all passed for RLS, role denial, service-only fixed-search-path function, unused singleton and preserved prototype budget table. The hosted function was not invoked and the wrapper is not mounted. Source hash is in the deployment receipt.

Exact next action: compose the explicit customer account host with this durable guard, verified provider/identity/session ports and bounded maintenance/shutdown; then verify through local HTTPS before configuring email URLs or deploying. Twenty-one customer migrations are installed. Customer sign-in, email, real recovery/provider/device acceptance and phase gates remain open. Private Memory still publishes the earlier 20-migration checkpoint and needs the rendered reset fix plus this shared admission checkpoint in its next update. No new spending or paid voice call occurred.

## Explicit account host lifecycle prepared, 12 October 2026

Prepared createAccountHost to connect the dormant account composition to the strict Node delivery listener and shared database admission guard. Construction reads no environment and starts no listener, provider request or timer. Explicit start first verifies reset-grant cleanup and bounded receipt maintenance; only then can account requests be admitted. Maintenance runs without overlap, fails closed on malformed/failed replies, and preserves underlying ownership after a timeout. Sign-out remains available under its own authorization while account readiness is unavailable. The caller still owns TLS/proxy policy, static pages, actual provider/session port construction, server listen/close and deployment.

Shutdown stops the timer, aborts admitted request signals and cleanup work, closes reset grants and refuses late admission. Its bounded result reports unconfirmed if cleanup, admission or handler work remains unresolved; it does not claim remote transport termination. Six focused tests use actual loopback HTTP for startup gating, failed maintenance, sign-out, shutdown and late admission; fake time verifies scheduled cleanup. All 550 foundation tests across 77 files, type checking and build pass. No hosted account route, cleanup invocation, real credential, email or paid request was activated.

Exact next action: compose actual Supabase password/OAuth/recovery/refresh adapters, signed identity/current-session verification and encrypted ownership into the explicit host; then verify the combined host with synthetic HTTP/database providers before hosted configuration. Static reset/account pages and production sender/origin still need deployment and real acceptance. Private Memory needs the full rendered reset, 21-migration and 550-test host checkpoint. Task 2c and phase gates remain open.

## Current complete-host evidence, 12 October 2026

The complete factory now composes concrete Supabase transports, shared signed identity/current-session checks, encrypted refresh ownership, independently verified scoped revocation, shared admission and explicit maintenance/shutdown. All 560 foundation checks pass. Actual loopback HTTP plus disposable PostgreSQL prove generated signed login, encrypted adoption, generation-two rotation, primary-session deletion, ownership cascade and stale-cookie refusal. Auth provider and receipt-maintenance HTTP replies were synthetic. No customer host is mounted and no live Auth configuration has changed. The next delivery work must preserve the strict Origin/Host boundary and scanner-safe recovery landing.

## Connected account build and strict static delivery, 12 October 2026

Prepared a separate account.html build and connected account/reset React entry. The sample index preview remains separate. The connected page uses existing bounded account, OAuth-handoff and reset-permission transports. URL notices are fixed presentation text; callback proofs are never treated as browser authority. A trusted static host injects only the public Supabase project origin into the built HTML. Missing configuration renders unavailable; no API key belongs in HTML.

Prepared createAccountWebsite with explicit immutable HTML/assets and host inputs, exact Host validation, fixed account/reset pages, whitelisted build assets, bounded total size, no filesystem traversal, no-store/no-referrer/nosniff headers and restrictive CSP. Recovery landing/API routes delegate to the existing strict account listener. Invalid page queries and methods are refused. Construction starts no listener or provider work.

Evidence: five new focused checks cover connected copy, reset permission loading, fixed notices, strict page/asset delivery, immutable assets and invalid configuration. All 565 foundation tests across 81 files, type checking and two-entry build pass. The existing local HTTPS WebKit reset rehearsal now builds actual account.html and uses createAccountWebsite: scanner-safe landing, explicit confirmation, secure reset-only cookie, actual connected React form, one synthetic password update, cleared fields/cookie, disabled replay, unavailable reload and cleanup all pass. Provider operations remain synthetic; this is not physical-iPhone or real-email acceptance.

Exact next action: prepare a bounded build loader and explicit server lifecycle around the complete account host/website, then exercise the combined HTTPS account/recovery journeys before hosted origin/sender configuration. Customer access remains disabled. Private Memory publishes the previous 560-test complete-host checkpoint and needs this addition in the next consolidated update.

## Bounded build loading and complete application preparation, 12 October 2026

Prepared loadAccountBuild for an explicit absolute deployment-owned directory. It refuses symlink roots/assets/files, unexpected asset names, empty or oversized files, invalid UTF-8 HTML and build changes during bounded reads. Request paths never reach the filesystem. This assumes a trusted deployment owner controls the build directory; it is not an untrusted upload loader.

Prepared prepareAccountApplication to load the build and compose the concrete Supabase host with strict website delivery. Construction performs no provider request, timer or socket activation. Explicit start runs the existing required maintenance; close preserves its bounded cleanup reporting. The application returns only delivery/lifecycle capabilities. Network listener, TLS/proxy and graceful socket shutdown remain caller responsibilities.

Evidence: six focused checks cover valid loading, symlink/path/name/size/text refusal, no-work preparation, explicit startup/close and malformed build refusal. All 571 foundation tests across 83 files, type checking and two-entry build pass. The actual connected-page HTTPS WebKit reset journey now reads its build through this loader and passes all previous confirmation/reset/replay/cleanup checks with a synthetic provider. No live customer account, email or paid request occurred.

Exact next action: implement explicit network lifecycle with bounded graceful shutdown and exercise the complete application over HTTPS with synthetic services before hosted origin/sender setup. Private Memory publishes the 560-test host checkpoint; consolidate the 565/571 delivery additions in its next update. All real hosted/device/accessibility acceptance gates remain open.

## Explicit account network lifecycle, 12 October 2026

Prepared createAccountNetwork around an explicitly supplied application and HTTP/HTTPS server factory. Construction starts no provider operation, socket or process handler. Startup first requires application maintenance, then opens the chosen explicit bind address/port. Duplicate startup is idempotent. Deadlines, occupied ports, maintenance failure and cancellation refuse activation; late startup cannot open a socket after closure/failure. Caller still owns the trusted TLS/proxy factory and deployment configuration.

Shutdown stops accepting connections, invokes bounded application cleanup, waits for listener and tracked socket closure, and destroys remaining sockets at its deadline. Forced or uncertain application cleanup returns false. Runtime listener errors use the same bounded shutdown. Rejected handlers emit a generic unavailable response without private details.

Evidence: seven focused local-socket checks cover explicit startup, idempotence, refusal, occupied ports, active stalled request shutdown, late startup, handler errors, unconfirmed cleanup and runtime listener errors. Initial checks exposed premature socket-close reporting and a test that had not established an active request; both were corrected. All 578 foundation tests across 84 files and type checking pass; the two-entry build passes. Local HTTPS WebKit reset acceptance passes through the new network wrapper with the actual connected build, bounded loader and strict website handler. Auth/reset responses remain synthetic. No hosted account, email or paid request was enabled.

Exact next action: exercise the full prepareAccountApplication plus network wrapper over HTTPS with synthetic Auth and isolated PostgreSQL, including browser login/recovery/sign-out; then prepare explicit hosted runtime configuration. Preserve pending sender, origin, social credentials/linking, real provider/isolation, physical-device/accessibility and phase-review gates. Private Memory needs the delivery/lifecycle additions after its 560-test checkpoint.

## Combined account browser and database rehearsal, 12 October 2026

Added an opt-in ACCOUNT_BROWSER_REHEARSAL mode to the disposable PostgreSQL runner. The new check builds actual account.html, prepares the complete application, starts its HTTPS network wrapper and uses desktop WebKit against it. Auth HTTP and media-receipt maintenance replies are synthetic; all admitted session/refresh operations use actual isolated PostgreSQL functions.

Verified generated signed sign-in, secure HttpOnly cookie, encrypted initial ownership, generation-two refresh, confirmed scoped sign-out, primary absence/cascade, empty browser storage, recovery request, then scanner-safe confirmation/reset in a separate browser context with none of the requesting browser's cookies. Exactly one password update occurs, reset/access cookies clear, reload cannot reuse reset permission, and graceful shutdown succeeds. This proves separate-browser behavior locally, not actual email or physical-device acceptance.

The first attempt checked cookies after local UI closure but before server acknowledgment; corrected the test to await the confirmed sign-out message. Also corrected misleading sign-out error copy that advised retry even after the access cookie was cleared. Unconfirmed remote cleanup remains explicitly unconfirmed; no new cleanup authority was introduced. Both focused and integration assertions cover the accurate text. All 578 foundation tests, type checking and two-entry build pass. Verified no disposable database containers/volumes remain. Browser/server/certificate/build resources were removed.

Exact next action: synchronize private Memory with connected delivery/lifecycle and combined rehearsal evidence, then prepare explicit hosted runtime configuration. Real SMTP sender, exact hosted origin, Google/Apple credentials/linking, hosted provider/isolation, physical-device/accessibility and phase review remain open. No live account, email, setting change or paid call occurred.
