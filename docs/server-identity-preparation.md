# Server identity preparation

Local Task 2c only. No live request route or Supabase key is configured.

## Prepared checks

The gate uses pinned jose 6.2.12 for signature verification. It requires the selected HTTPS Supabase project's exact Auth issuer, authenticated audience/role, UUID user and session IDs, integer expiry/issued-at claims, a key identifier and an explicit non-anonymous claim. Only ES256 and RS256 are allowed. It returns only the verified owner and an isCurrent check; token contents and credentials are not returned.

A valid signature alone does not prove sign-out has not happened. The injected authoritative session port must verify the signed user/session pair remains active. The gate rechecks this and expiry before returning identity; downstream image delivery can recheck through isCurrent before returning bytes. Unknown/revoked session evidence fails closed.

Each check has a maximum eight-second response deadline and four underlying operations may be pending at once. Cancellation and deadline abort the supplied session signal. A provider ignoring abort still occupies an admission slot until its operation settles; repeated timeouts cannot accumulate unlimited work. No retry or successful identity is manufactured from a timeout.

## Evidence

Eight new tests use generated ES256/RS256 keys and actual signatures. They cover incorrect issuer/audience/role, malformed claims, anonymous users, expiry, altered signatures, unknown keys, disallowed symmetric signing, revocation, failed/stalled authority, cancellation, configuration and bounded unresolved work. They prove the local verifier and simulated session port, not actual Supabase session status.

## Remaining activation requirements

- Prepare a protected local SQL function to check auth.sessions against both signed IDs; direct browser access must remain denied. Verify real schema semantics before hosted use.
- Prepare a fixed-project JWKS transport with response/timeout bounds, rotation handling and no untrusted header URLs. The current resolver is injected and local in tests.
- Verify the actual project's signing-key configuration. This gate deliberately refuses legacy symmetric tokens; changing keys or configuring a compatibility path is not authorized by this local preparation.
- Add the request/cookie/origin gate and OAuth/recovery callback handling. This file alone does not authenticate browser cookies or create sessions.
- Check real sign-out, account confirmation, user deletion/disablement and provider linking; do not infer those properties from the UI controller.
- Wire media/consultation routes only after the corresponding Auth and hosted approvals. No live provider, key, request or customer data has been used.

Sources reviewed on 11 October 2026: [Supabase JWT verification](https://supabase.com/docs/guides/auth/jwts), [Supabase sessions](https://supabase.com/docs/guides/auth/sessions), [sign-out semantics](https://supabase.com/docs/guides/auth/signout). The docs distinguish JWT validity from current session status and describe checking session_id against auth.sessions. This implementation uses that distinction; it does not claim remote sign-out acceptance.


## Protected current-session lookup

Migration 016 prepares a service-only boolean lookup joining auth.sessions and auth.users by both signed IDs. It rejects missing/expired sessions and deleted, banned or anonymous users. It never creates or changes managed Auth tables. A disconnected authority adapter accepts only exact true and discards canceled/error replies. The isolated fixture now includes a minimal synthetic Auth schema; a generated signed token passes the actual local SQL lookup and is rejected after its session row is removed. Direct browser table/function access is denied.

All 234 foundation tests across 20 files, type checking and build pass. Full local PostgreSQL and actual Storage upgrade rehearsals pass with sixteen migrations. This does not prove actual GoTrue sign-out, live schema privileges, configured inactivity/timebox policies or email/OAuth behavior. Supabase model fields were reviewed from its official source; the actual hosted schema and session configuration still require verification before activation.


Official model references reviewed: [Supabase session model](https://github.com/supabase/auth/blob/master/internal/models/sessions.go), [Supabase user model](https://github.com/supabase/auth/blob/master/internal/models/user.go). The lookup checks persisted session existence/not_after and user state. It does not reproduce all configurable GoTrue lifetime/inactivity/MFA rules; hosted activation must verify those policies and incorporate the relevant authority. Synthetic schema checks must never be described as actual GoTrue authentication.


## Local public signing-key transport

Prepared a disconnected fixed-project JWKS resolver using jose and injected fetch. Only the configured HTTPS Supabase endpoint is fetched, never a token-supplied URL. Requests refuse redirects, omit credentials and bound response time to five seconds, body size to 64 KiB and key count to 32. Private/symmetric key material is refused. Public keys expire after ten minutes; refresh attempts have a thirty-second cooldown. Unknown signing keys can trigger one allowed refresh, with concurrent callers sharing the request. A response deadline also covers injected transports that ignore cancellation; their pending operation stays retained so repeated calls cannot launch unlimited requests. Production native fetch is expected to honor abort; a non-cooperative injected operation can leave this resolver unavailable until it settles. No automatic retries or stale-cache fallback after expiration.

All 240 foundation tests across 21 files, type checking and build pass. Generated ES256 keys verify cryptographically through simulated HTTP responses. Rotation, unknown-key request storms, private keys, excessive response bodies, unsupported algorithms, ignored cancellation and stalled bodies are checked. No live JWKS request, actual signing configuration inspection or hosted account activation occurred. Cookie/origin and OAuth/recovery callback boundaries remain next.


## Local account request boundary

Prepared a disconnected cookie-only identity gate for a configured HTTPS application origin. It refuses foreign URL/Host/Origin, cross-site and same-site browser requests, query strings, duplicate or malformed account cookies and alternate Authorization credentials. Mutations require exact Origin. Owner headers and forwarded-host headers do not determine identity. The single __Host-stylist_access token is passed only to the prepared signature/current-session verifier; cancellation and errors return no identity. This is a prepared cookie contract, not cookie issuance or a customer endpoint. Secure/HttpOnly/Path=/ and SameSite controls must be enforced when the issuer is implemented.

All 245 foundation tests across 22 files pass, with type checking and build. The request suite includes a real generated ES256 signature, simulated session revocation and malformed/cross-origin request rejection. This proves local composition only; no browser cookie, actual Auth sign-in, OAuth or password recovery is accepted yet. No route, customer feature or hosted configuration is enabled.


## Verified account cookie preparation

Added a disconnected cookie issuer that first verifies the token and rechecks its current session. It produces a host-only __Host-stylist_access session cookie with Path=/, Secure, HttpOnly and SameSite=Strict. It sets no Domain or persistent Max-Age. Clearing uses the identical scope with Max-Age=0; remote sign-out is a separate requirement. Token size is capped at 3800 characters to leave room within common cookie limits; malformed tokens, revoked identity, canceled checks and errors produce no cookie. Request routes must enforce the prepared origin/CSRF boundary before invoking issuance. OAuth/recovery needs a separate short-lived callback contract; the strict account cookie is not that contract.

All 249 foundation tests across 23 files, type checking and build pass. These cookie checks use simulated verifier results. No actual browser cookie, credentials, provider connection or hosted feature was activated.
