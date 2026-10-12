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
| Tests/review/phase exit | 332 local foundation checks plus type checking/build; earlier SQL/Storage evidence | Actual provider/manual phase checks and required phase-wide code review; no phase exit is claimed |

## Local next steps

1. Email/password HTTP handling is prepared locally with bounded parsing, same-origin protections and verified header-only cookies; actual server delivery and refresh adoption remain unverified.
2. Prepare recovery-request acknowledgment and refresh/sign-out integration contracts without provider calls or email delivery.
3. Keep the accepted eight-step account review recorded; verify the new reset step, actual screen reader/phone/zoom and every real-provider requirement separately.
4. Record actual provider setup requirements without applying settings or requesting credentials prematurely.

## Human and external dependencies

- Sabine completed all eight local account preview steps and confirmed all worked and were readable. Physical-device and screen-reader acceptance remain open.
- Phase 1 completion and a hosted/account activation decision are still required before real account configuration or tests.
- Production email sender, Google/Apple credentials and actual callback allowlists are not approved by local preparation.
- Refresh/session persistence and same-browser versus cross-device recovery must be reviewed before promising customer behavior.
- No spending allowance or additional provider attempt is created by this audit.
