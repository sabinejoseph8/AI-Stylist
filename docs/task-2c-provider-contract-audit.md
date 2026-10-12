# Supabase account provider contract audit

Status: documentation audit and local preparation only. No real provider activation authorized.
Reviewed: 11 October 2026.

## Verified public behavior and implementation consequences

| Provider behavior | Prepared implementation | Remaining acceptance |
| --- | --- | --- |
| Refresh exchanges a supplied refresh token for a new session. The API also supports reading client-managed state if no token is supplied. | Supply only the server-held claimed secret. Isolate per-operation provider state; do not allow a shared mutable client to choose another session. | Pin the SDK/transport and prove explicit-token use, no client persistence, automatic refresh or background requests. |
| Refresh-token reuse has limited exceptions; other reuse can terminate the session. | Durable generation/lease claims fence rotation. Ambiguous results remain blocked rather than blindly retrying. | Actual lost-response and concurrent-refresh behavior against synthetic hosted accounts. |
| Sign-out offers global, local and others scopes; JavaScript defaults to global. | Failed-delivery cleanup must explicitly target the staged current session. It must not accidentally sign out other devices. | Prove explicit local scope and exact JWT/session correspondence in the real adapter. General customer sign-out policy remains a separate product contract. |
| Revoked refresh tokens do not immediately invalidate an already-issued access JWT. | Verify signatures and current-session authority before customer operations; signature validity alone is insufficient. | Hosted authority permissions/schema and old-cookie denial after actual sign-out. |
| Admin sign-out requires a valid logged-in JWT and a scope. | A staged provider result must retain enough trusted context to revoke its exact session. | Determine cleanup behavior when the returned access JWT expires or the response is lost. Do not treat a timeout, 401, 404 or unavailable authority as proof of revocation without an explicit verified contract. |
| Default provider sessions can last indefinitely; configured timeout enforcement is not always proactive. | Local encrypted expiry is an application-owned boundary. It is not proof of provider refresh-token expiry or remote termination. | Decide customer session lifetime before enabling persistent login. Do not derive a long-lived product promise from fixture expiry values. |

## Critical integration risks

- A successful rotation followed by a lost response can leave a remote session with no usable returned credentials. Keep the durable claim unresolved, deny cookies and retain reconciliation evidence. Current synthetic cleanup cannot prove real recovery from this condition.
- A sign-out SDK may normalize certain remote errors into local success. The actual adapter must distinguish accepted revocation from local clearing and verify its exact error semantics before returning true.
- Our React interface calls the application server. It does not use the Supabase browser client for authenticated data, Storage or automatic session refresh. Preserve this boundary if using HTTP-only cookies; adding direct browser Supabase access requires a deliberate architecture review.
- Current refresh is early refresh only: expired access cookies require sign-in. Seamless continuation after access expiry requires a separately verified server session locator and CSRF contract; it is not implemented or promised here.
- Actual hosted Auth schema, TTL settings and private encryption-key provisioning remain unverified. Local synthetic Auth tables prove SQL behavior only.

## Next local implementation

Prepare an explicitly injected provider adapter with no environment reads, default route or real calls. Test explicit refresh input, isolated client state, bounded cancellation, current-session cleanup scope, malformed replies, expired cleanup authority and ambiguous remote outcomes. Keep live activation gated by docs/task-2c-activation-checklist.md.

## Primary sources

- [Supabase refreshSession](https://supabase.com/docs/reference/javascript/auth-refreshsession): explicit refresh-token input and session return.
- [Supabase user sessions](https://supabase.com/docs/guides/auth/sessions): reuse exceptions, session identity, lifetime and session-row checks.
- [Supabase signing out](https://supabase.com/docs/guides/auth/signout): scopes and access-token lifetime after revocation.
- [Supabase admin signOut](https://supabase.com/docs/reference/javascript/auth-admin-signout): valid JWT and scope requirements.

These sources establish documented semantics, not successful integration or hosted configuration. Review exact pinned SDK source and synthetic hosted behavior before activation.
