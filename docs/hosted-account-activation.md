# Hosted customer account activation

Status: preparation in progress, 12 October 2026. Hosted Tasks 2b/2c are authorized before Phase 1 completion. No new spending or paid voice call is authorized.

## Verified current state

- Existing AI Stylist Supabase project: all twenty reviewed customer migrations installed. Source hashes and metadata checks are in hosted-database-deployment.json. SQL Editor execution does not register CLI history.
- Customer account handlers are prepared but absent from the default server. The current Render service is the private voice prototype, not a deployed customer account application.
- Read-only dashboard inspection: Site URL is http://localhost:3000; no redirect URLs; built-in email sender with a production-use warning; password reset template uses ConfirmationURL.
- Local synthetic evidence: 538 tests, type checking, build, isolated database rehearsal and desktop WebKit checks. The rendered confirmation-to-password-form journey now passes. This does not prove real email, hosted provider or physical-device acceptance.

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

Prepare the dormant explicit host composition and durable abuse control contract, with focused tests. Do not change the live email template until a verified HTTPS destination and sender configuration are ready.
