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

All 295 foundation tests across 30 files, type checking and build pass. Eight added checks cover one-time reset, no account access, expiry/input validation, rejection of ordinary access-token proof, cleanup failure holds, canceled late exchange, wrong/canceled callbacks, outstanding admission and delayed reset without retry. Tests use simulated trusted capabilities only. No real account, password, recovery email, provider call, hosted setting or spending changed. Task 2c and Phase 2 remain incomplete.

Exact next action: audit recovery failure/cleanup and browser-binding integration requirements, prepare local recovery UI/controller behavior, and refresh private Memory after the next verified account checkpoint. Real provider activation, refresh lifecycle and physical-device/screen-reader acceptance remain open.
