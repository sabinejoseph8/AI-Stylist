# Task 2c local account preparation

Approved by Sabine on 11 October 2026 while Phase 1 remains open. Local interfaces and simulated tests only. No hosted configuration, real sign-ins, new credentials, paid calls or deployment.

## Implementation order

1. Add a provider-independent account-flow controller with injected account operations and a clear signed-out state. Credentials are passed only for the requested operation, never included in snapshots or logs.
2. Cover required email/password, confirmation-required registration and generic recovery acknowledgment. Do not infer account existence from recovery replies or treat registration as completed authentication.
3. Prepare Google and Apple pending/cancel/failure flows. Invalidate stale replies after navigation, a new attempt or sign-out. No automatic merging of unverified identities.
4. Prepare server-side verified identity, cookie, callback, origin and session-revocation boundaries. Browser claims alone never authorize styling or personal-data access.
5. Add local account screens using approved design tokens with an explicit simulated-mode explanation. Keep production styling gated while no actual account verification exists.
6. Run focused automated checks and a local visual review before claiming local UI acceptance.

## Acceptance boundaries

A successful simulated response proves a controller branch only. Actual email confirmation/delivery, recovery links, Google/Apple credentials and provider setup, identity linking, hosted callback allowlists, sign-out/token revocation and physical-device sign-in remain unverified. Those actions require their applicable approvals and Sabine's account steps. Do not enable account features in the hosted prototype under this exception.


## Local account-flow controller

Added a disconnected UI controller with injected provider operations, generation fencing, cancellation and a bounded deadline. It covers email/password, confirmation-required registration, generic recovery acknowledgment, Google/Apple pending/canceled states and immediate local sign-out. Failed remote sign-out is explicitly unconfirmed. Snapshots contain no passwords, email addresses, session tokens or raw provider errors. Canceled-before-dispatch operations never invoke the provider; late replies cannot restore local identity. Browser state is not server authorization.

All 223 foundation tests across 18 files, type checking and build pass. These eight new controller checks use synthetic responses; email delivery, actual OAuth, server tokens, cookies, callback/recovery validation and remote revocation are not implemented. The controller is not yet displayed in the foundation UI. Task 2c remains in progress and local-only.


## Local public signing-key transport

Prepared a disconnected fixed-project JWKS resolver using jose and injected fetch. Only the configured HTTPS Supabase endpoint is fetched, never a token-supplied URL. Requests refuse redirects, omit credentials and bound response time to five seconds, body size to 64 KiB and key count to 32. Private/symmetric key material is refused. Public keys expire after ten minutes; refresh attempts have a thirty-second cooldown. Unknown signing keys can trigger one allowed refresh, with concurrent callers sharing the request. A response deadline also covers injected transports that ignore cancellation; their pending operation stays retained so repeated calls cannot launch unlimited requests. Production native fetch is expected to honor abort; a non-cooperative injected operation can leave this resolver unavailable until it settles. No automatic retries or stale-cache fallback after expiration.

All 240 foundation tests across 21 files, type checking and build pass. Generated ES256 keys verify cryptographically through simulated HTTP responses. Rotation, unknown-key request storms, private keys, excessive response bodies, unsupported algorithms, ignored cancellation and stalled bodies are checked. No live JWKS request, actual signing configuration inspection or hosted account activation occurred. Cookie/origin and OAuth/recovery callback boundaries remain next.


## Local account request boundary

Prepared a disconnected cookie-only identity gate for a configured HTTPS application origin. It refuses foreign URL/Host/Origin, cross-site and same-site browser requests, query strings, duplicate or malformed account cookies and alternate Authorization credentials. Mutations require exact Origin. Owner headers and forwarded-host headers do not determine identity. The single __Host-stylist_access token is passed only to the prepared signature/current-session verifier; cancellation and errors return no identity. This is a prepared cookie contract, not cookie issuance or a customer endpoint. Secure/HttpOnly/Path=/ and SameSite controls must be enforced when the issuer is implemented.

All 245 foundation tests across 22 files pass, with type checking and build. The request suite includes a real generated ES256 signature, simulated session revocation and malformed/cross-origin request rejection. This proves local composition only; no browser cookie, actual Auth sign-in, OAuth or password recovery is accepted yet. No route, customer feature or hosted configuration is enabled.


## Verified account cookie preparation

Added a disconnected cookie issuer that first verifies the token and rechecks its current session. It produces a host-only __Host-stylist_access session cookie with Path=/, Secure, HttpOnly and SameSite=Strict. It sets no Domain or persistent Max-Age. Clearing uses the identical scope with Max-Age=0; remote sign-out is a separate requirement. Token size is capped at 3800 characters to leave room within common cookie limits; malformed tokens, revoked identity, canceled checks and errors produce no cookie. Request routes must enforce the prepared origin/CSRF boundary before invoking issuance. OAuth/recovery needs a separate short-lived callback contract; the strict account cookie is not that contract.

All 249 foundation tests across 23 files, type checking and build pass. These cookie checks use simulated verifier results. No actual browser cookie, credentials, provider connection or hosted feature was activated.


## Local callback transaction preparation

Prepared a disconnected process-local callback store for Google, Apple and recovery. Each flow gets independent 256-bit random state, browser binding and a 43-character PKCE verifier, with S256 challenge. The verifier stays in server memory; the temporary host-only cookie holds only its separate browser binding and uses Secure, HttpOnly, SameSite=Lax and a five-minute maximum age. At most 128 flows are retained, expired entries are purged and a valid transaction is consumed synchronously once before any future code exchange. Wrong browsers or purposes cannot consume another flow. A restart loses pending transactions and requires a new sign-in/recovery attempt; this is not storage of customer session notes.

The request parser allows only an exact configured origin and purpose-specific GET callback path, one flow field and one bounded code field, with an unambiguous binding cookie. It supports cross-site top-level redirects but rejects non-navigation Fetch Metadata when present, foreign hosts, duplicate or extra query fields, malformed codes and duplicate cookies. Return destinations are a fixed internal allowlist. Recovery always resolves to /account/reset and never implies normal stylist access. A matched callback does not authenticate a person: actual provider exchange, cryptographic token/session checks and separate recovery authorization are still required. Failed exchange must restart the consumed flow.

All 257 foundation tests across 24 files, type checking and build pass. New checks cover challenge derivation, replay/concurrent winner, wrong browser/purpose, expiration/restart, admission bounds, safe return paths and hostile callback requests. No provider code was exchanged, actual OAuth state/redirect preservation verified or hosted setting changed. Same-browser recovery and process-restart UX need acceptance review before activation; cross-device recovery is not silently declared unsupported by the product. Actual Supabase flow-ID/version handling and Apple redirect behavior must be verified at integration.

References: [Supabase PKCE flow](https://supabase.com/docs/guides/auth/sessions/pkce-flow), [RFC 7636](https://www.rfc-editor.org/rfc/rfc7636.html). The prepared flow uses an application-owned browser transaction alongside provider code exchange; it is not a replacement for provider OAuth state validation.


## Simulated local account screens

Profile now displays an account panel, also reached by Preview account screens on Stylist. It uses approved design tokens and offers email/password, account creation, recovery, Google and Apple preview actions. Every screen states that only made-up details should be used, no account/email/provider connection is created and simulated sign-in never unlocks the stylist. Inputs are labeled, status uses a live region, errors use an alert, modes expose pressed state and pending/handoff work can be canceled. Password input clears after submission; sample sign-out clears local input fields. Leaving Profile cancels its controller and discards its local state. No browser storage or network provider is used.

All 261 foundation tests across 25 files pass, with type checking and build. Static markup and simulated provider/controller checks cover the available methods and outcomes. Agent browser QA verified sample sign-in, sign-out, confirmation, recovery, both social handoffs and cancel in the actual local page, plus a desktop layout inspection. Sabine's visual review, narrow viewport, keyboard/screen-reader acceptance and real providers remain open; Task 2c is not complete. The existing loopback preview on port 4322 was reused after a duplicate start reported the port occupied; no second service was launched.


### Complete local visual review instructions

Use only made-up details at http://127.0.0.1:4322/ on this computer.

1. Open Profile or select Preview account screens. Confirm the simulation notice is readable.
2. Enter sample@example.test and a made-up password, then Preview sign-in. Confirm the message says no real account is connected.
3. Sign out of sample account. Confirm inputs are cleared.
4. Select Create account, enter the made-up details and preview account creation. Confirm no email was sent.
5. Select Recover access, enter the made-up email and preview recovery. Confirm no email was sent.
6. Select Sign in, preview Google and cancel, then preview Apple and cancel. No external page should open.
7. Return to Stylist. The stylist must remain unavailable. Expand and collapse My Styling Notes.
8. Refresh. Return to Profile and confirm the sample account and input details have been discarded.

Report any unreadable labels, overlapping controls or unexpected behavior. These steps do not validate actual sign-in or email delivery.


## Account composition and local usability checks

Added createAccountSecurity to compose the fixed-project key resolver, cryptographic/current-session verifier, request gate, secure cookie issuer and one-time callback store. Configuration and server-only RPC/fetch remain explicit injected dependencies. No environment, HTTP route, actual account, provider credential or customer activation is added. Generated-token integration checks verify the whole cookie-to-request path with simulated HTTP/RPC: owner comes from the signed identity, revoked sessions cannot issue cookies or authorize requests, anonymous/forged tokens fail and a callback transaction alone does not authorize access.

Fixed canceled account-controller operations retaining unlimited non-cooperative provider promises: at most four underlying operations are admitted, timed-out/canceled work retains its admission until it settles, and stale results cannot replace a newer identity. A focused test proves admission recovers after settlement. The UI now moves keyboard focus to completed/canceled status messages; errors announce assertively. Agent browser QA confirmed focus moves to the result, Tab reaches Cancel and Enter cancels with focus returning to status.

Viewport overrides of 390 and 320 pixels produced measured document widths of 375 and 305 pixels respectively, with no horizontal overflow; the browser scrollbar accounts for the difference. Inputs and action buttons measured at least 50 pixels high in the narrow view. Controls wrap and remain readable. The temporary viewport override was reset. These checks are browser layout/keyboard evidence, not actual iPhone or screen-reader acceptance. Sabine has received the complete eight-step local visual review, with independent local work continuing while the response is pending.

All 265 foundation tests across 26 files pass. Type checking and build are rerun for the final source before publication. Task 2c and Phase 2 remain incomplete.


## Canceled and failed callback handling

The disconnected callback parser now distinguishes exchange-required success from a bound provider failure. A valid failure consumes its transaction once and returns only canceled purpose plus /account; it exposes no verifier, code or raw error text. Duplicate fields, mixed error/code input, unknown fields, oversized error fields and oversized URLs fail without consuming a valid transaction. This prepares safe account-access return behavior, not a real provider callback route or styling session. Actual provider error field/redirect preservation still requires integration verification.

All 267 foundation tests across 26 files, type checking and build pass. The new checks prove one-time failure consumption, sensitive error-text suppression and rejection of ambiguous success/failure callbacks. docs/task-2c-acceptance-audit.md separates local evidence from every remaining real-provider, recovery, refresh, sign-out, identity-linking, email, Apple maintenance, phone and accessibility requirement. No Task 2c or phase completion is claimed.


## Disconnected account exchange orchestration

Added a provider-independent callback exchange coordinator. It consumes a bound Google/Apple callback once, passes only its bounded code and PKCE verifier to an injected trusted server adapter, verifies the returned signed token/current session and prepares secure account/flow-clear cookies plus the verified owner and stored internal return path. The ready result is a server-only capability, not a customer JSON response. The caller must send cookies only as response headers, adopt the adapter-held session/refresh lifecycle and invoke its idempotent discard capability if response delivery or adoption fails. No HTTP route or real adapter is installed.

A newly created session has an adapter-owned discard operation that must revoke that exact session and remove its refresh material. Invalid identity or cancellation triggers discard. Late sessions after timeout/cancellation are also discarded and cannot restore access. Cleanup is bounded and deduplicated. Failed, stalled or malformed cleanup and ambiguous provider failures place a coordinator hold on further exchanges. Only an explicit exact notCreated acknowledgment avoids an ambiguity hold. There is no automatic retry/reset. This process-local hold and pending work must become durable/reconcilable before hosted activation; a restart is not proof of remote cleanup.

Responses are bounded to eight seconds and at most four underlying exchanges are admitted. Timed-out work retains its admission until it settles, so repeated attempts cannot create unlimited pending provider work. A busy response does not consume the callback. Recovery is refused by the normal access path before consuming its transaction, preserving it for a separate provider-verified reset flow. Provider cancellation returns no account access.

All 277 foundation tests across 27 files, type checking and build pass. Generated signed-token integration and simulated adapter tests cover ready identity/cookies, replay, invalid identity cleanup, cancellation/late arrival, failed/ignored cleanup, ambiguous failure holds, explicit no-session proof, recovery isolation, admission recovery, pre-canceled/invalid requests and malformed cleanup capabilities. No real session, OAuth exchange, refresh token, sign-in, email, credential or hosted configuration was created or used. Actual adapter cleanup semantics and response-delivery handling remain acceptance requirements.


## Shared local account lifecycle and accepted preview, 11 October 2026

Sabine completed every step of the eight-step account preview and reported that all steps worked and were readable. This accepts the local simulated screens only, not real sign-in or email delivery.

Extracted a common server-only session lifecycle and added disconnected email/password and registration ports. Password and OAuth callback methods share a four-operation admission limit and the same uncertainty hold after ambiguous creation or failed cleanup. Registration confirmation returns no account cookie. Email whitespace is trimmed; passwords are passed unchanged and never stored by these interfaces. Exact input keys and string methods are required, preventing object coercion into a supported action. HTTP origin/CSRF, rate/body limits, real provider policy and refresh adoption remain requirements before wiring any route.

All 283 foundation tests across 28 files, type checking and build pass. Six added tests cover signed session/cookie preparation, confirmation isolation, malformed input, cross-method holds, late cancellation cleanup and shared outstanding admission without consuming busy callback transactions. Existing callback tests pass after the refactor. No routes, providers, real accounts, emails, hosted settings or paid calls were activated. Next: scoped local recovery and sign-out contracts. Task 2c and Phase 2 remain open.


## Local sign-out coordinator, 11 October 2026

Prepared a disconnected POST-only sign-out coordinator for the exact configured HTTPS origin and account sign-out path. Valid same-origin requests return access-cookie and flow-cookie clearing headers independently of remote revocation. Only a verified signed identity reaches the injected trusted revocation adapter; only its exact true acknowledgment reports signedOut. Invalid identity, errors, cancellation, deadline and admission exhaustion report remoteUnconfirmed. No response claims that clearing a browser cookie revokes the remote session. The future HTTP caller must deliver these headers, close local customer state immediately and arrange durable retry/reconciliation for unconfirmed revocation.

At most four underlying operations are admitted, with an eight-second maximum response deadline. A stalled operation retains admission until it settles; late success never changes a returned unconfirmed result. Four new tests cover verified owner/revocation, local clearing on failure, hostile request refusal and stalled admission. The initial deadline test incorrectly combined fake timers with asynchronous cryptography; it now verifies identity first and isolates the stalled revocation stage. All 287 foundation checks across 29 files, type checking and build pass. No real accounts, cookies, provider calls, hosted changes or spending were activated.

Next action: prepare provider-verified recovery authorization and scoped reset contracts locally, then refresh the private Memory site with the account checkpoints. Actual provider revocation, refresh-material adoption and response delivery remain open. Task 2c is incomplete.


## Scoped local recovery preparation, 11 October 2026

Added a disconnected recovery owner that consumes only a bound recovery callback. Its trusted adapter must establish provider recovery purpose, identity and expiry; an ordinary signed account token is insufficient. The resulting server-only capability exposes reset and discard, never normal account cookies or stylist access. The effective grant expiry is the earlier of the provider expiry and five minutes. Reset consumes the grant before calling the adapter, so simultaneous, repeated or timed-out attempts cannot repeat a password change. Invalid input does not consume valid permission. No new production password policy is invented.

ResetComplete requires exact password-change confirmation and confirmed cleanup of the recovery session/refresh material. Failed or timed-out work is unconfirmed; late completion is cleaned up without changing the returned result. At most four underlying operations and 128 retained grants are allowed. Stalled work retains admission until it settles. Expired grants are discarded on use or a subsequent recovery attempt. The future HTTP/session owner must bind this server capability to the browser separately, enforce Origin/CSRF and rate/body limits, arrange proactive expiration/disposal and durable reconciliation, and provide reviewed cross-device recovery UX. These process-local contracts do not prove provider purpose, remote cleanup or restart recovery in production. No HTTP route or provider adapter is installed.

All 346 foundation tests across 39 files, type checking and build pass. Eight added checks cover one-time reset, no account access, expiry/input validation, rejection of ordinary access-token proof, cleanup failure holds, canceled late exchange, wrong/canceled callbacks, outstanding admission and delayed reset without retry. Tests use simulated trusted capabilities only. No real account, password, recovery email, provider call, hosted setting or spending changed. Task 2c and Phase 2 remain incomplete.

Exact next action: audit recovery failure/cleanup and browser-binding integration requirements, prepare local recovery UI/controller behavior, and refresh private Memory after the next verified account checkpoint. Real provider activation, refresh lifecycle and physical-device/screen-reader acceptance remain open.


## Simulated reset interface, 11 October 2026

Recover access now offers a clearly labeled simulated reset step after its no-email acknowledgment. It requires matching made-up passwords, clears both fields after submission, announces errors/results with focus, disables completed or unconfirmed attempts and returns to account options without authentication. The independent browser controller stores no password in its snapshot, consumes a valid dispatch once, refuses expired permission, cancels on unmount and discards late results. Timeout and cancellation cannot retry an uncertain change. The sample five-minute permission is presentation only, never provider proof or a server authorization boundary. No new credential is actually created or changed.

All 300 foundation tests across 31 files, type checking and build pass. Five new checks cover confirmation matching/one dispatch, expiry, cancellation/late results, timeout/no retry and accessible labeled simulated markup. Actual local browser QA confirmed mismatch feedback, matching completion, cleared fields, disabled repeat submission, status focus and continued signed-out messaging. Screenshot: /private/tmp/ai-stylist-reset-preview.png. Physical iPhone, screen reader and Sabine review of this newly added reset step remain open; the earlier eight-step account preview is already accepted and is not reopened.

Exact next action: audit and strengthen recovery expiration, discard and cross-method cleanup behavior, then publish a consolidated private Memory refresh. Real providers, browser-bound server recovery delivery, refresh lifecycle and hosted acceptance remain gated. Task 2c remains incomplete.


## Recovery discard audit, 11 October 2026

Found and fixed a recovery cancellation gap: discarding a grant while its password-change call was pending did not abort that call. Each reset now owns a cancellation scope; public discard aborts it, consumes permission and invokes deduplicated cleanup. The caller receives unconfirmed, and a late adapter success cannot become resetComplete. A provider may already have changed a password before cancellation, so this does not promise rollback; real adapter/reconciliation semantics remain required. Reused active or discarded adapter capability objects are rejected. A cancellation detected at the final exchange boundary discards a returned grant before exposing permission.

All 302 foundation tests across 31 files, type checking and build pass. Two new regressions cover in-flight discard and disposed-capability reuse. Tests use simulated providers; no real credentials, accounts, provider calls or hosted settings changed. The previous local reset UI browser evidence remains valid; no UI behavior changed in this audit.

Exact next action: publish the consolidated private Memory account/recovery checkpoint, then prepare the browser-bound reset-delivery contract and failure/expiration checks locally. Full Task 2c requires real-provider integration, refresh/sign-out confirmation, phone/accessibility acceptance and the existing phase gates.


## Disconnected browser reset delivery, 11 October 2026

Prepared a process-local browser delivery owner for provider-verified recovery grants. Its separate __Host-stylist_reset cookie contains a cryptographically random 256-bit opaque handle and uses Path=/, Secure, HttpOnly, SameSite=Strict and a maximum five-minute life capped by the server grant expiry. The store retains only a SHA-256 lookup hash and the server-only capability, never a normal account cookie or serialized reset capability. Duplicate installation and more than 128 retained grants are refused. A failed installation remains the trusted caller's responsibility to discard; it is not permission to leak or abandon provider state.

The disconnected submission accepts only the exact configured HTTPS origin, POST /api/account/reset, matching Origin, allowed Fetch Metadata, matching Host where supplied, no Authorization/query/hash, one bounded opaque reset cookie and exact matching password/confirmation input. Normal account cookies cannot authorize a reset. Valid delivery is removed synchronously before asynchronous work, preventing concurrent replay. The result clears the reset cookie; completion requires both reset and cleanup confirmation. Expired/abandoned delivery discards the grant. Cleanup is deduplicated and failure holds further delivery. Real HTTP body/rate protections, response header delivery, proactive expiration/disposal, browser acceptance, cross-device UX and durable restart reconciliation remain required. Deadlines and provider-purpose verification belong to the actual recovery owner/adapter; installing arbitrary browser JSON is forbidden. No route is installed.

All 309 foundation tests across 32 files, type checking and build pass. Seven new tests cover secure separate cookie/one use, hostile origins and duplicate/normal cookies, input correction, expiry/abandonment, cleanup failure holds, concurrent reset/error privacy and retained-grant limits. Existing recovery tests include the newly explicit server-only grant expiry. No actual cookies, accounts, recovery emails, provider calls, hosted changes or spending were activated.

Exact next action: compose the actual disconnected recovery owner with browser delivery in integration tests, including cancellation, expiry and response-adoption failure; then refresh private Memory. Task 2c and its real-provider/manual gates remain open.


## Composed local recovery verification, 11 October 2026

Added integration checks using the actual disconnected callback/recovery owner, browser-delivery store and account request verifier together. Provider lease replies remain simulated. A bound recovery callback produces separate reset-cookie delivery; that cookie cannot authorize a profile request. Password reset is one-use and requires cleanup confirmation. Failed response adoption discards the real grant and prevents later reset. Canceling the actual reset Request propagates through browser delivery into the reset owner, returns unconfirmed and deduplicates cleanup after late provider success. Expired delivery prevents password change and propagates failed-cleanup holds to both owners.

All 313 foundation tests across 33 files, type checking and build pass. Four new composed tests prove these integration paths. No real provider-purpose proof, account session, password, browser cookie, email, hosted setting or paid call was used. The generated signing material and local adapter replies are test fixtures. Actual production recovery, HTTP delivery/limits, restart reconciliation, provider cleanup and physical-device accessibility still require acceptance.

Exact next action: prepare explicit recovery-delivery expiration and shutdown disposal, including an in-flight reset during shutdown, then refresh the private Memory checkpoint. This lifecycle preparation remains local and does not authorize hosted activation. Task 2c remains incomplete.


## Recovery delivery lifecycle, 11 October 2026

Added explicit expire and close operations to the disconnected browser recovery owner. Expire removes expired delivery and confirms grant cleanup. Close permanently stops new installation/submission, removes browser handles and discards all active grants, including grants already consumed by an in-flight reset. Active reset controllers are aborted during public disposal/shutdown. Normal post-reset cleanup preserves confirmed completion; cancellation remains unconfirmed. Cleanup is deduplicated and independently response-bounded to at most eight seconds. A stalled/failed cleanup holds the owner and close returns false; a repeated close returns the same result instead of retrying uncertain provider work. Retained capacity now counts active consumed grants as well as pending delivery.

All 317 foundation tests across 33 files, type checking and build pass. Four new checks cover explicit expiry, permanent/deduplicated shutdown, stalled cleanup deadline and composed shutdown during an actual recovery-owner reset with a simulated provider. No production timer, process hook, provider call, account or hosted setting was activated. The future HTTP/service owner must invoke expire on an appropriate schedule and close at graceful shutdown; forced process termination and durable reconciliation remain unproven. A true cleanup acknowledgment proves the adapter's contract only, not reversal of a password change that may already have occurred.

Exact next action: refresh private Memory with the verified 317-test recovery checkpoint, then prepare the disconnected recovery/account HTTP boundary with bounded parsing and Origin/CSRF checks. Preserve no-real-provider/no-hosted-change scope and all existing phase/spending gates. Task 2c remains incomplete.


## Prepared reset HTTP boundary, 11 October 2026

Added a disconnected reset HTTP handler factory; it is not registered in a server or deployed. It requires the exact configured HTTPS origin and POST reset path, matching Origin/Host, allowed Fetch Metadata, JSON UTF-8 content type, no content encoding or alternate Authorization, no query/hash and a declared body length within 16 KiB where supplied. Actual streamed bytes are independently bounded to 16 KiB and decoded as strict UTF-8. Only exact matching password/confirmation input reaches delivery. Errors return generic status JSON, never credentials/provider text. Cookie changes are response headers only. Responses are no-store, nosniff and same-origin resource policy with no CORS grant.

The handler has a maximum ten-second response deadline and four underlying admitted requests. Cancellation aborts delivery and cancels an active body reader. Non-cooperative delivery retains admission until it settles; timeout reports unconfirmed rather than promising rollback. Production durable rate/abuse controls, real server registration, header delivery and actual provider/restart behavior remain acceptance work. This factory alone is not a live account endpoint.

All 322 foundation tests across 34 files, type checking and build pass. Five added checks cover header-only cookies, private status JSON, hostile origin/content/body rejection, generic provider errors, stalled-body cancellation and retained admission after delivery timeout. A fixture initially returned an invalid null-cookie shape for unconfirmed delivery; type checking caught it and the fixture was corrected before final verification. No actual provider, account, password, email, hosted setting or spending changed.

Exact next action: refresh private Memory with the 322-test checkpoint, then integrate the reset HTTP factory with the actual disconnected recovery/delivery owners in simulated request tests. Task 2c and Phase 1/2 acceptance remain open.


## Full local reset HTTP composition, 11 October 2026

Verified the actual disconnected callback/recovery owner, browser delivery and HTTP handler together with simulated provider leases. A bound callback and separate reset cookie produce status-only HTTP completion plus a clearing cookie header; no normal account cookie is issued. Replaying the same request is rejected, and provider reset/cleanup each run once. A foreign-origin HTTP request is refused before consuming valid permission, allowing the legitimate same-origin attempt afterward.

All 324 foundation tests across 34 files, type checking and build pass. Two new full-composition checks provide this evidence. These in-memory Request/Response tests do not validate a real HTTP server, real browser cookie handling, actual provider purpose, email delivery, signing configuration, rate controls or hosted behavior. No route, account or paid activity was enabled.

Exact next action: refresh private Memory, then audit the remaining authorized local Task 2c requirements and implement the next ready account transport/controller contract while keeping actual provider and hosted activation gated. Task 2c remains incomplete.


## Disconnected password account HTTP preparation, 11 October 2026

Extracted the tested bounded same-origin JSON POST boundary for reuse by reset and password account handling. Existing recovery HTTP and full-composition checks pass after the refactor. The boundary preserves strict origin/path/content/body protections, a 16 KiB streamed byte limit, maximum ten-second response deadline, four admitted underlying operations, cancellation and no-store/status-only error responses. A late private response can be discarded by its owning handler rather than delivered after cancellation.

Added a disconnected /api/account/password handler factory composed with the actual prepared password account owner. Generated signed-token tests confirm that successful sign-in returns only signedIn JSON and verified secure cookies in headers. Registration confirmation issues no account cookie. Malformed input never reaches provider session creation. The server-only discardResponse capability revokes the exact returned session when response delivery or refresh-state adoption fails, with idempotent cleanup. A canceled request returns no account cookie and a late session is discarded. The future HTTP caller must actually adopt adapter-held refresh state, send headers and invoke discardResponse on failed delivery/adoption; this factory is not installed in a server. No real provider transport or refresh persistence is claimed.

All 328 foundation tests across 35 files, type checking and build pass. Four added composed checks cover signed cookie/status separation, confirmation, invalid input and canceled late-session cleanup. All providers are simulated and signing material is generated test data. No actual sign-in, account, email, browser cookie, hosted setting or paid call was created. Production rate controls, real provider policy and manual acceptance remain open.

Exact next action: prepare the disconnected recovery-request acknowledgment contract and simulated tests, including account-enumeration-safe replies and cancellation, then refresh private Memory. Task 2c remains incomplete.


## Generic recovery request preparation, 11 October 2026

Prepared disconnected POST /api/account/recover handling on the shared bounded same-origin JSON boundary. It accepts only a valid email field, trims whitespace and chooses the recovery callback internally. The trusted adapter receives that address, fixed-purpose callback and S256 challenge; no caller-selected redirect or account cookie is accepted. The same 202 recoveryRequested body and flow-cookie shape are returned for a simulated absent account and provider error. This is a generic acknowledgment, not a promise that email was sent. Cancellation abandons the bound transaction and never retries delivery. The shared response deadline and underlying admission limits remain in effect; a non-cooperative provider may still send a late email, but its canceled callback is no longer usable.

All 332 foundation tests across 36 files, type checking and build pass. Four added checks cover internal callback/challenge handoff, generic response shape, malformed input/redirect rejection and cancellation verified with the actual original browser binding. No actual email adapter, account, provider call or hosted route is installed. These checks do not prove constant-time behavior or eliminate provider timing side channels; production anti-enumeration, rate/abuse controls and actual delivery policies need acceptance. Same-browser/cross-device recovery remains a customer UX review gate.

Exact next action: refresh private Memory with the password HTTP and recovery-request checkpoint, then audit pending local account transport and refresh/session lifecycle requirements. Real provider activation, email sender setup, credentials and hosted changes remain outside this local preparation. Task 2c remains incomplete.


## Account presentation contract alignment, 11 October 2026

The browser account controller expected a user ID in signed-in replies, but the prepared password HTTP interface deliberately returns status only. Aligned the presentation controller to accept that exact status-only reply without inventing a client identity. Existing simulated ID-bearing replies remain strictly validated. Browser signed-in state is presentation only and never authorizes server access; every customer operation still needs verified server identity. No app route, fetch transport or stylist access was enabled.

All 333 foundation tests across 36 files, type checking and build pass. The added check proves status-only presentation leaves userId null and retains no password. Private Memory source 26312ecfdf8f701dfab7ecd958d248ea21ad1028 deployed successfully as appgdep_6acc46f2caf081918d224d2921d008e5 with the preceding 332-test account HTTP/recovery-request checkpoint. All 16 website checks pass; owner-only access and MCP remain. The 333rd controller check will be included in the next consolidated refresh.

Exact next action: prepare an injected, disabled same-origin browser account transport for the status-only password and recovery interfaces, with bounded response parsing, cancellation and simulated fetch tests. Real sign-in, provider credentials, hosted routes and paid calls remain gated. Task 2c is incomplete.


## Disabled injected browser account transport, 11 October 2026

Prepared a browser AccountProvider factory requiring an explicitly injected fetch implementation and configured HTTPS application origin. The visible preview still selects its sample provider; no real transport is wired. Password, recovery and sign-out use fixed same-origin POST paths with same-origin credentials/mode, JSON only, redirect refusal, no-store and no-referrer. No token, Authorization header, browser storage or client account ID is introduced. Social handoff is refused by this transport until its separate verified contract is prepared.

The parser requires exact status-only JSON, a matching response destination when available, no redirect, valid content type and at most 1 KiB actual UTF-8 response bytes. Status and HTTP code must match the requested operation; registration confirmation cannot satisfy sign-in, and sign-out requires remote confirmation. Malformed replies and raw errors become generic Account unavailable. Cancellation/deadline cancels the response reader, rejected bodies are released and late success cannot restore presentation. The maximum fifteen-second response deadline and four admitted underlying operations prevent repeated canceled requests from accumulating unlimited fetches. Ignored cancellation retains admission until actual settlement.

All 341 foundation tests across 37 files, type checking and build pass. Eight new tests cover fixed request shape/cookie transport, confirmation/recovery separation, invalid/social/pre-canceled input, response limits and unexpected fields, sign-out confirmation, ignored cancellation/admission, stalled bodies and redirected/foreign destinations. Every fetch is simulated. No provider call, credential, sign-in, email, route or hosted change occurred. Real browser/server cookie and Origin behavior, provider session adoption, rate controls and manual acceptance remain open.

Exact next action: compose the disabled browser transport/controller with the actual local password/recovery HTTP factories using simulated fetch, then prepare sign-out HTTP response handling and publish a consolidated Memory refresh. Task 2c remains incomplete.


## Simulated browser-to-account HTTP composition, 11 October 2026

Prepared disconnected sign-out HTTP response handling on the shared bounded JSON boundary. Only an empty input object is accepted; caller-selected owner/scope fields are refused before revocation. Confirmed remote sign-out returns 200; unconfirmed returns 409. Both deliver the coordinator's cookie-clearing headers separately from status-only JSON. No route is registered.

Added composed tests using the actual browser transport/controller, password/recovery/sign-out HTTP factories, generated signed identity and simulated provider/current-session authority. A test-only cookie jar and Origin header emulate browser handling; they do not prove actual browser cookies or CORS behavior. Sign-in produces verified cookie access while the controller invents no user ID. Confirmed sign-out clears cookies and the simulated revoked original token no longer authorizes a profile request. Registration and generic recovery produce no account access. Failed remote revocation clears local cookies and closes controller access, but explicitly reports unconfirmed; the simulated original token remains current, demonstrating why local clearing alone is insufficient. No real email or provider is involved.

All 346 foundation tests across 39 files, type checking and build pass. Five added checks cover sign-out header/status behavior, input rejection and the three full browser/controller/server scenarios. Actual browser cookie acceptance, real provider revocation, refresh-state adoption/persistence, rate/abuse controls, phone/accessibility and phase gates remain open. No credentials, actual account, hosted endpoint or paid activity was enabled.

Exact next action: refresh private Memory with the 346-test checkpoint, then audit remaining local Task 2c lifecycle requirements and prepare refresh/session ownership without connecting real providers. Task 2c remains incomplete.


## Discarded account session reuse protection, 11 October 2026

Sabine confirmed all eight local account preview steps worked and were readable. This accepts that sample interface only, not real authentication, the later reset screen or physical-device accessibility.

The shared session owner now refuses a provider adapter object that has already been discarded, before issuing another cookie. Cleanup remains idempotent and is not retried. A generated-token regression test proves the same disposed lease cannot restore account access, even if the simulated current-session authority still reports it current. All 347 foundation tests across 39 files, type checking and build pass. No real provider, hosted route, email or paid activity was enabled.

Exact next action: refresh private Memory from the latest committed documents, then prepare disconnected refresh/session ownership with simulated tests. Task 2c remains incomplete; actual provider configuration, session persistence, customer activation and manual phase gates remain open.


## One-time adapter session ownership, 11 October 2026

The disconnected shared account owner atomically claims each adapter session object before asynchronous cookie verification. Concurrent submissions returning the same object produce one ready result and one unavailable result; the rejected duplicate does not revoke the legitimate owner's session. Discarded object reuse remains refused. The process-local WeakSet is a programming-contract guard, not durable refresh-token storage or cross-process provider replay protection.

All 348 foundation tests across 39 files, type checking and build pass. No actual provider or route is enabled. Private Memory source 64c11ab097cfc66146dd6e7f8533bea9a1c11d47 deployed successfully as appgdep_6acc4976b8308191b73f38788c6c4379 with the preceding 347-test checkpoint. All 16 website checks pass; owner-only access and MCP remain. The additional concurrency test will be included in the next consolidated refresh.

Exact next action: prepare disconnected refresh/session ownership with bounded cancellation, one-time rotation and simulated tests, without connecting real providers or promising durable persistence. Task 2c remains incomplete.


## Disconnected early account refresh, 11 October 2026

Prepared a server-only refresh coordinator for POST /api/account/refresh. A trusted injected adapter receives only the verified request and signed owner identity and must resolve/rotate server-held refresh material. No refresh credential is accepted from JSON or returned to the browser. The coordinator requires current verified access, fixed application origin/path and cancellation checks; expired access cannot use this early-refresh preparation and must sign in again. No actual adapter, HTTP route, refresh storage or scheduler is installed.

The shared session verifier now accepts an internal expectedOwner constraint. A refreshed signed session for a different customer is discarded before any cookie is exposed. The coordinator caps outstanding work at four, bounds response time to eight seconds and propagates request/external cancellation; a late rotated session is discarded and cannot restore access. Session cleanup uncertainty remains a hold in the shared owner. Production must share this owner with password/OAuth, implement durable session-specific single-flight rotation and reconcile failures; the current coordinator alone does not prove rotation atomicity across concurrent requests or processes.

All 352 foundation tests across 39 files, type checking and build pass. Four added generated-token/simulated-adapter checks cover verified refresh, missing/foreign access rejection, wrong-owner cleanup and canceled late cleanup. No real provider, email, hosted setting or paid activity was used.

Exact next action: prepare session-specific rotation ownership and concurrent refresh tests, then compose a disconnected refresh HTTP boundary. Durable refresh persistence, expired-session behavior, real-provider rotation/revocation and customer activation remain open; Task 2c is incomplete. Private Memory remains at the preceding 347-test checkpoint pending the next consolidated refresh.


## Session-specific refresh and HTTP delivery, 11 October 2026

The cryptographic identity gate now retains the verified session ID as server-only context. Refresh requires that ID and prevents overlapping adapter rotation for the same verified owner/session in this coordinator. Cancellation does not release the rotation lock while an adapter ignores cancellation; the lock is released when that provider operation actually settles. The shared verifier requires both the same signed customer and exact signed session in the returned access token. A different session for the same customer is discarded. Existing media callers need only owner/current access and remain compatible. Session identity is not added to browser JSON.

Prepared disconnected refresh HTTP delivery on the bounded same-origin JSON boundary. Only an empty object is accepted; refresh tokens, owner IDs and other input fields are refused before provider work. Successful replies contain only signedIn status, with verified cookies in headers and no-store. A server-only discardResponse capability cleans the returned session if refresh-state adoption or response delivery fails. No route is registered. The future caller must use this capability and adopt refresh state atomically.

All 355 foundation tests across 39 files, type checking and build pass. Three added checks prove same-session overlap rejection even after cancellation, full HTTP cookie/status/failed-delivery behavior and refusal of another signed session for the same customer. All provider behavior is simulated. The coordinator's lock is process-local and covers the adapter operation, not durable storage/adoption, other coordinators, processes or server restarts. Actual provider rotation, durable fencing, email/account setup and hosted acceptance remain open.

Exact next action: compose refresh with the shared account lifecycle owner, verify uncertainty holds across account methods and prepare refresh-state adoption ownership with simulated tests. No provider activation, new credentials or spending is authorized. Task 2c remains incomplete. Private Memory remains at the preceding 347-test checkpoint pending the next consolidated refresh.


## Shared refresh/account uncertainty lifecycle, 11 October 2026

The disconnected account composition now optionally accepts an explicit refresh adapter and creates its refresh coordinator with the same session owner as password and OAuth. Without that injected adapter, refresh is null rather than implicitly enabled. Failed cleanup after a bad refresh session sets the shared uncertainty hold, preventing later password/OAuth provider work. Ambiguous password session creation likewise prevents refresh provider calls. The refresh adapter retains its original object binding. No HTTP route, provider transport or credential is installed.

All 358 foundation tests across 39 files, type checking and build pass. Three added composed tests verify holds in both directions and absence of an unconfigured refresh interface. This is process-local simulated evidence, not actual remote cleanup or durable adoption.

Exact next action: prepare explicit refresh-state adoption and failed-delivery ownership in the disconnected server composition, with simulated cancellation and cleanup tests. Audit real-adapter prerequisites before claiming account readiness. Actual provider setup, durable refresh storage, recovery/identity-linking policies, hosted changes and manual phase acceptance remain open. Task 2c remains incomplete; private Memory's latest verified publication reflects 347 tests pending the next consolidated refresh.


## Account readiness audit and reset review handoff, 11 October 2026

Reviewed the current Task 2c requirements, acceptance audit, prepared server boundaries and phase dependencies. Added docs/task-2c-activation-checklist.md to distinguish remaining local adoption/persistence/server-composition work from actual hosted/provider decisions. It records concrete evidence needed for real signing/session authority, email, Google/Apple callbacks, linking, recovery across devices, refresh/revocation and phase exit. No provider settings or credentials were changed.

The existing local preview serves HTTP 200 at http://127.0.0.1:4322/. The in-app open request was queued; it is not evidence that Sabine saw it. Sent Sabine the complete seven-step newer reset-screen review in one question. This review is pending and separate from her accepted eight-step account review. No test suite was rerun for this documentation-only audit; the latest code evidence remains 358 passing foundation tests, type checking and build.

Exact next action: implement the local adoption/persistence ownership contract with simulated storage and failure tests; incorporate Sabine's reset review when received, and refresh private Memory at the next consolidated checkpoint. Task 2c, hosted account activation and phase exit remain incomplete.


## Local Node account response delivery, 11 October 2026

Prepared a disconnected Node HTTP listener that accepts only an explicitly supplied route map and configured HTTPS application identity. It checks Host before dispatch, maps IncomingMessage into a streaming Fetch Request with cancellation, bounds buffered account responses to 16 KiB, preserves separate Set-Cookie headers and streams the final bounded JSON response through Node. Client disconnect aborts work; a handler response returned afterward invokes its idempotent discardResponse cleanup. Failed output also invokes cleanup. The default foundation server is unchanged and registers no account route. TLS/proxy trust, durable adoption and production rate controls are not configured by this listener.

All 361 foundation tests across 40 files, type checking and build pass. Three new tests use actual loopback Node HTTP with the prepared shared JSON boundary and simulated operation handlers. They verify cookie/header separation, wrong Host/Origin rejection before operation work and late-response cleanup after actual client disconnect. These tests do not compose a real provider, verify a real browser cookie jar or demonstrate hosted TLS. Prior generated-token account composition remains separate evidence.

Exact next action: compose the local Node listener with generated-token password/refresh owners and simulated adoption storage; test response loss and cancellation at that composition boundary. Add explicit delivery deadlines/resource checks before production use. Sabine's newer reset review is still pending. Task 2c remains incomplete. Private Memory remains at its preceding 347-test checkpoint pending a consolidated refresh.


## Bounded Node delivery and verified password composition, 11 October 2026

The prepared Node account listener now bounds delivery to at most ten seconds, cancels stalled response readers and closes timed-out sockets. At most four underlying handler operations are admitted. A timed-out handler that ignores cancellation retains admission until it actually settles; late returned responses are discarded. Duplicate Host/Origin/Cookie/Authorization headers are refused before dispatch. These are process-local limits, not distributed abuse protection. Routes remain unregistered in the default server.

Added actual loopback HTTP composition with the prepared password owner, cryptographic verifier, generated ES256 token, simulated current-session authority and password adapter. Returned JSON contains signedIn only, while the distinct Secure/HttpOnly/Strict access cookie can authorize the same generated owner/session through the prepared gate. This manually forwards a cookie header; it does not prove browser cookie acceptance or hosted TLS. Two more loopback scenarios verify stalled response cancellation/cleanup and retained admission for four timed-out handlers. A test-helper typing mismatch was fixed before the final clean run.

All 364 foundation tests across 40 files, type checking and build pass. No live provider, credential, hosted route or paid activity was used. Durable refresh-state adoption and reconciliation remain unimplemented. Node's successful end callback proves local response completion, not that a remote user received every byte.

Exact next action: implement and test explicit simulated refresh-state adoption ownership at the server composition boundary, then consolidate private Memory publication. Incorporate Sabine's newer reset review when received. Task 2c and phase acceptance remain open; private Memory's current verified live checkpoint is still 347 tests.


## Explicit server session adoption preparation, 11 October 2026

The trusted PendingAccountSession contract can now supply an explicit adopt(signal) capability. The shared owner first verifies the signed owner/session, then requires exact true adoption and a fresh authoritative session check before exposing ready/cookies. Adoption is claimed once with the session object. An adapter omitting this optional capability retains the existing contract that it already owns its server-held state; omission is not proof of durable ownership. No real adapter or storage is configured.

False, throwing, revoked or canceled adoption refuses access and discards the session. If a non-cooperative adoption is still running when cancellation returns, its underlying admission is retained and cleanup waits until it settles, so a late storage write cannot occur after premature cleanup in the tested flow. The adapter must make discard remove both staged and adopted state and revoke remote access. Unconfirmed cleanup keeps the shared lifecycle held. Never-settling adoption remains unresolved; durability, fencing and restart reconciliation still require real storage implementation.

All 368 foundation tests across 40 files, type checking and build pass. Four new generated-token/simulated-storage scenarios cover successful ownership before ready and failed-delivery cleanup, partial failed adoption, late adoption after cancellation and authoritative revocation during adoption. No refresh credential, provider account, hosted change or paid call is used. The storage Map holds fixture strings only and is not production persistence.

Exact next action: consolidate private Memory publication with this checkpoint, then test explicit adoption through the actual local HTTP composition and prepare durable ownership/failure reconciliation locally. Sabine's newer reset screen review is pending. Task 2c remains incomplete.


## HTTP adoption cancellation and Memory refresh, 11 October 2026

Composed explicit session adoption with generated signed identity, the actual password owner/HTTP factory and real loopback Node delivery. A real HTTP client disconnect during simulated adoption aborts the request without prematurely running cleanup. After non-cooperative storage settles and writes its fixture state, the shared owner discards once and removes that state. The adapter is simulated and no real refresh material is used. This adds transport-composition evidence to the previous direct adoption tests.

All 369 foundation tests across 40 files, type checking and build pass. Private Memory source 7bc7d55b602c23ca17e6791d1352140b3216fd95 deployed successfully as appgdep_6acc4d8337588191960f5476c57ef265. All 16 website checks pass; owner-only access and MCP are preserved. That publication includes the preceding 368-test checkpoint, current account limitations and pending reset review. The additional HTTP adoption test will appear in the next consolidated refresh.

Exact next action: prepare durable server refresh-state ownership and reconciliation locally, including generation fencing, partial adoption and restart evidence; continue to keep real provider/hosted activation gated. Sabine's seven-step reset review remains pending. Task 2c and phase acceptance remain incomplete.


## Server-only refresh encryption preparation, 11 October 2026

Prepared a disconnected encryption codec using Node's AES-256-GCM implementation, generated 96-bit nonces and 128-bit authentication tags. Authenticated context binds ciphertext to its exact signed owner, session, rotation generation, expiry and key identifier. The codec accepts an explicit server keyring of one to four 256-bit keys, copies key bytes and uses the selected current key for writes; explicitly retained old keys can read earlier envelopes. It creates no production key, store, provider connection, schedule or route. Key provisioning, secure deployment and retirement remain activation prerequisites.

The exact versioned envelope contains ciphertext/key ID/nonce/tag only. Inputs and ciphertext are bounded to 8 KiB plaintext, malformed/noncanonical/tampered envelopes fail closed, expired context cannot decrypt, and invalid storage inputs produce generic errors. Caller scope IDs must be real strings in canonical UUID form, and generation must be positive. These checks do not supply durable fencing or prevent replay into the same unchanged scope; storage must atomically enforce the expected generation. Plaintext and keys still exist in server process memory during use; this is encryption at rest preparation, not a zero-memory-retention claim.

All 374 foundation tests across 41 files, type checking and build pass. Five tests use generated keys and fixture strings only, checking context separation, nonce variation, tampering/size/unknown key refusal, explicit key rotation/caller-buffer isolation, expiry, invalid values and configuration. No actual credential was read, stored or published. No hosted or paid activity occurred.

Exact next action: prepare local durable refresh-state storage with generation compare-and-swap, service-only access and unresolved-rotation holds; integrate the codec and rehearse restart/partial-write behavior with synthetic records. Key management and actual provider/hosted activation remain gated. Task 2c is incomplete; the newer reset review remains pending. Private Memory's last verified publication includes the preceding 368-test checkpoint.


## Durable refresh ownership SQL rehearsal and accepted reset review, 11 October 2026

Prepared migration 202610110017_refresh_ownership.sql locally. A private RLS-enabled table stores bounded versioned encrypted-envelope fields with owner/session references, generation, expiry, rotation state and a random lease. Direct table access is revoked from ordinary visitors, signed-in customers and service_role; fixed-search-path SECURITY DEFINER functions grant only service_role controlled adoption, inspection, claiming, finishing, holding and confirmed-removal operations. Adoption verifies the current Auth owner/session. Atomic updates require exact owner/session/generation/lease and appropriate state. An unresolved rotation is never reclaimed merely because a process restarts or time passes. Held records require explicit reconciliation and verified revocation before removal. The trusted caller's boolean is a contract, not database proof of remote revocation. Auth session deletion cascades its refresh record.

The isolated pinned PostgreSQL 17 rehearsal uses synthetic Auth rows and placeholder ciphertext, not real credentials or the encryption codec. It proves denied direct/customer function access, duplicate-adoption refusal, cross-owner refusal, exactly one concurrent claim winner, unresolved rotation surviving a real container/database restart, wrong generation/lease refusal, hold preventing finish/reclaim, service-only held-state inspection, explicit confirmed removal, successful version increment, stale-finish refusal, malformed-envelope rejection and session-delete cascade. The initial run caught PostgreSQL's regex repetition limit; ciphertext validation now uses a bounded length plus simple alphabet check. The final rehearsal passes, and its disposable database container/volume are removed. All 374 foundation tests across 41 files, type checking and build also pass. No migration was applied to Supabase. Actual hosted Auth schema, encryption integration, provider rotation and durable application reconciliation remain open.

Sabine confirmed all seven newer reset-screen review steps worked and were readable. This accepts the local simulated reset UI, including mismatch clearing, matching completion, disabled repeat and refresh clearing. No real recovery email, password change, phone accessibility or provider recovery acceptance is implied. Both the earlier eight-step account preview and this seven-step reset review are accepted; Task 2c remains incomplete.

Exact next action: connect the encrypted envelope codec and service-only refresh ownership RPCs through a bounded disconnected adapter; test rotation/adoption/uncertain-write reconciliation with synthetic PostgreSQL records. Consolidate private Memory publication after that checkpoint. Real credentials, hosted activation, provider calls and spending remain gated.
