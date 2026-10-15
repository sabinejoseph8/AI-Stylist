# Local investigation: accounts without forwarded-header dependence

15 October 2026. Authorized scope: local investigation and simulated tests, no new spending, real accounts or hosted changes. This is not a replacement deployment contract or a change to the approved recovery experience.

## Conclusion

**Partly feasible, not ready to activate.** The existing account adapter already builds URLs from an explicitly configured HTTPS origin. Recovery-code verification can keep the proof out of URL queries. Neither result proves the actual hosting boundary, complete recovery lifecycle or provider compatibility.

| Question | Evidence | Result |
|---|---|---|
| Can application URLs ignore forwarded host/scheme claims? | Actual loopback HTTP into the existing Node adapter with synthetic conflicting forwarded headers | Yes. The resulting application URL uses the configured origin; wrong Host/Origin is refused. |
| Does a configured HTTPS origin establish encrypted ingress? | Same loopback request with and without the existing transport guard | No. The bare adapter admits plaintext. The real guard refuses it despite an HTTPS header claim. |
| Can recovery proof stay out of the requested URL? | Existing JSON boundary and bounded provider HTTP transport, with injected simulated fetch | Yes for the candidate request. Email and code are in a fixed-purpose POST body; no browser session or reset permission is created. |
| Can ordinary OTP identity satisfy current reset safeguards? | Locally signed synthetic OTP and recovery identities, using the real identity verifier | No. Ordinary identity may verify while recovery-specific authority remains refused. |

## Research and limits

[Render web services](https://render.com/docs/web-services) documents TLS termination, HTTP redirection and a service port not directly publicly reachable. This supports evaluating a deployment policy based on fixed platform ingress, but it does not identify every private caller or prove the selected deployment configuration. Host/Origin checks are request validation, not peer authentication. No trust callback returning unconditional true was installed, and the current transport boundary is unchanged.

[Supabase email templates](https://supabase.com/docs/guides/auth/auth-email-templates) documents a six-digit Token alternative to ConfirmationURL. [Supabase Auth source](https://github.com/supabase/auth/blob/master/internal/api/verify.go) accepts recovery verification by POST with email/token and returns session tokens. [Auth client types](https://github.com/supabase/auth-js/blob/master/src/lib/types.ts) include recovery among email OTP purposes. Public master source read today is not proof of the hosted project's deployed version or configuration.

The public verification path uses OTP authentication when issuing tokens. Our current verifier requires a recent signed recovery method. This is a compatibility risk inferred from source, not an observed hosted failure. Do not relabel ordinary OTP as recovery or loosen the verifier. Purpose correlation, one-use reset permission, session absence after cleanup and account isolation still need a supported complete contract.

## Prepared code and tests

A disconnected verifyRecoveryCode method on the existing bounded provider transport accepts only email/code and sends POST /auth/v1/verify with fixed recovery purpose. It reuses deadlines, cancellation, admission, response bounds and generic error handling. No customer route, email template, environment setting or sample UI calls it. It is a transport seam, not a functioning recovery flow.

Fourteen new tests cover request shape, leading-zero codes, malformed input, extra purpose/redirect fields, URL proof refusal, foreign/null Origin, Host validation, cancellation, bounded/redacted provider errors, loopback origin construction, plaintext refusal and cryptographically signed purpose separation. All 1,281 foundation tests across 128 files, type checking and production build pass. The initial restricted run could not open loopback sockets; the authorized rerun passed without relaxing safeguards. All provider replies are simulated; no email was sent.

## Work required before adopting this candidate

1. Design and test server-owned recovery-purpose correlation without admitting ordinary sign-in authority. Keep failed/late verification cleanup and durable abuse controls.
2. Specify short-code guessing limits across processes/restarts, expiry, resend and generic error behavior. Process-local concurrency limits are insufficient protection for a short code.
3. Obtain Sabine's decision before changing the agreed emailed-link experience to code entry. Preserve cross-device recovery and remaining signed-out after reset.
4. Cover signup confirmation too. Changing recovery alone would not remove proof-bearing URLs from other account email flows. Rejecting query proof after ingress cannot erase an upstream record.
5. Verify the exact deployed HTTPS/private-network boundary and acceptable handling of sensitive request bodies/headers. POST removes proof from the URL, not from every possible log.
6. Configure sender/templates and run separately authorized hosted/device acceptance only after the security contract is established.

Next local action: design the purpose-binding contract and review its feasibility against the existing one-use reset and cleanup owners before building a customer-facing code screen. B03/B04 remain open. No phase or acceptance checkbox is closed, and no hosted Memory/GitHub publication is performed under this local-only investigation.
