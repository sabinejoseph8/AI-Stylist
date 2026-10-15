# Local receiving-browser recovery protection

15 October 2026. Sabine authorized local tests and fixes, without spending, real accounts or hosted changes. The approved email-link experience is preserved. The separate code-recovery candidate and abuse journal remain disconnected.

## Result and fixes

The existing receiving-browser binding and reset-only delivery were exercised together using synthetic provider grants. Opening an email landing page still performs no provider verification. Confirmation on the receiving device requires that browser's opaque Secure/HttpOnly/SameSite cookie and separate nonce; it does not require the requesting device's PKCE cookie or normal account session.

Two gaps were fixed:

1. **Late permission after replacement/expiry.** The binding now tracks active confirmation by cookie, aborts an in-flight confirmation when that browser starts a replacement landing, and rechecks cancellation, shutdown and the original binding expiry after provider completion. A late reset grant is discarded instead of returned. Existing owner cleanup holds remain authoritative if that discard cannot prove cleanup.
2. **Landing-page lifecycle and request settings.** The generated confirmation script now aborts on page exit, refuses cached-return reuse, stops after ten seconds and ignores late responses. It clears its nonce variable and permits no automatic retry. Its same-origin POST uses only the configured origin root as referrer, matching the existing account/reset transport pattern while keeping proof-bearing paths out of that referrer. The page retains no-store/no-referrer headers and its exact script-hash CSP. Responses must have JSON content type and the exact expected status shape before navigation to the reset screen.

No server Origin, cookie, signed-purpose, provider-cleanup or hosting trust safeguard was relaxed. The old account-composition and confirmation-HTTP tests were updated to parse the nonce's new script declaration; their behavioral assertions remain.

## Evidence

**24 new tests**, in apps/foundation/tests/receiving-browser-protection.test.ts, bring the foundation suite to **1,331 passing tests across 130 files**. Type checking and production build pass. The 16 local Memory checks pass after documentation synchronization. The earlier 245 operations/four encryption checks are unchanged recorded evidence, not new executions in this task.

The new checks cover:

- A receiving browser with no requesting-device PKCE or account cookies confirms, resets once, clears reset authority and receives no normal account sign-in cookie.
- A nonce or cookie paired with another binding, foreign/null Origin, wrong Host, cross-site metadata and bearer authorization are refused before verification.
- Replacement, expiry, cancellation, shutdown and a fresh server instance refuse old bindings. Late grants are discarded; uncertain late cleanup sets the real recovery owner's hold.
- Refreshing the stripped landing URL cannot silently restore proof or permission.
- Executing the generated inline script in a Node VM verifies its CSP digest, URL cleanup, fixed referrer, single dispatch, pagehide/cached-pageshow refusal, timeout and rejection of malformed/failed responses.
- Existing field-lifecycle helpers clear synthetic password fields synchronously on exit/cached return and cancel the pending presentation flow. A late completion cannot restore the form or permit a retry.

All identities, proofs, grants and password-operation replies are simulated. The generated script is executed against a small synthetic DOM/event/fetch harness, not a physical browser. The field lifecycle test also uses synthetic events. This is not new WebKit/iPhone/Android, native cache or real email/provider acceptance.

## Limits retained

A complete stolen cookie-and-nonce pair is a bearer credential: the server cannot distinguish its copy from the original browser. An explicit negative test documents that limit and confirms only one submission reaches verification. This is browser binding, not physical-device identity or protection against a compromised browser.

Page-exit clearing and aborting are local protections, not remote logout, deletion or proof that an already completed password change was undone. A fully delivered reset cookie can remain until bounded expiry or explicit server cleanup even if the user subsequently leaves the page. Server shutdown/expiry cleanup and hosted delivery acceptance remain required.

The email-link landing still contains proof in the incoming URL, so application URL cleanup does not settle upstream logging questions. Fixed-origin request settings do not establish trusted ingress. Provider recovery-purpose compatibility, durable abuse/restart authority, sender configuration, exact hosted logging/headers and actual cross-device acceptance remain open. No acceptance or phase checkbox is closed.

## Exact next action

Design the durable admission-port contract and its relationship to the receiving-browser and reset-only owners locally. Before mounting any candidate, resolve the existing purpose/hosting/sender contracts and actual policy/evidence ownership. Preserve B03/B04 and all privacy, spending and hosted activation gates. No action from Sabine is required for the completed local checks. No hosted Memory/GitHub publication, credential, backup runtime or scheduler changed.
