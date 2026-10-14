## Account scope amendment and prerequisite setup, 14 October 2026

Sabine asked to complete missing account/source prerequisites, confirmed she has no Apple Developer membership and will not obtain one, then explicitly removed Apple sign-in from MVP launch requirements. Email/password with recovery and Google remain required. Apple is removed from sample/connected account choices, browser initiation guards and the mounted account callback map. Generic disconnected historical Apple helpers are retained without an MVP entry route or activation authority. Explicit tests reject Apple before fetch/provider/navigation/cookie issuance and verify the missing mounted callback. Seven-day sessions, cross-device recovery, verified-email automatic linking for Google, confirmation and owner protection remain unchanged.

Read-only inspection of the existing AI Stylist Supabase project confirms email enabled, Google and Apple disabled, new signup/email confirmation enabled, anonymous/manual linking disabled. Google Client IDs and OAuth secret are empty; its exact Supabase callback is verified in the dashboard. No setting was saved and no secret was read or created. The Google Auth Platform page is open at sign-in for Sabine; credential creation/entry remains a secure user handoff. Hosted customer origin/ingress/logging and production sender remain unresolved. Domain purchase stays deferred until public launch.

Sabine confirmed she has no live public fashion website/blog/customized social page. Rakuten registration remains unfulfilled and no SID or retailer permission exists. Sabine reaffirmed Rakuten deferral on 14 October 2026 and did not approve the proposed style-guide website. Do not create/publish that website or begin Rakuten registration to bypass the deferral. Source work remains clearly labeled sample data until the business prerequisite is reopened. Do not use the private Memory/preview or unfinished app as an eligible live publisher site. No account/advertiser application, terms acceptance, support message, purchase or new paid call occurred. Allocation remains $51 and all held records remain intact. Full Tasks 2b/2c, source access and launch remain open.

Exact next action: finish checks and publish/copy the approved Apple scope amendment; complete Google setup only after Sabine signs in and the secure credential handoff is available. Rakuten and its proposed public style-guide prerequisite are deferred by Sabine; do not prepare that site without renewed authorization. Real email/recovery/Google/isolation acceptance follows the working host and required security evidence, not these configuration observations.

# Account provider maintenance

Status: local Task 2c operational preparation, 13 October 2026. Procedures are prepared; no Apple or SMTP credential exists by implication, no reminder has been scheduled, and no hosted provider was enabled. Task 2c remains incomplete.

## Activation prerequisites

Use this only after the working exact HTTPS customer origin and callback/logging boundary are verified. Keep Google's and Apple's real security tests, account linking, cross-device recovery, customer isolation and phase review open until observed. Sabine deferred domain purchase until public launch; this document does not authorize buying one, choosing a paid sender or creating credentials.

Sabine owns the provider accounts and performs new credential entry. Keep signing keys, generated client secrets, SMTP passwords, refresh tokens and customer data outside the public repository, chat, screenshots and logs. Existing approvals cover preparation, not a new subscription or wider access grant.

## Private operational inventory

Before enabling each provider, maintain the following in the owner's private password manager or operations record. Do not put actual identifiers, addresses or secret values in this public template.

| Field | Required record |
| --- | --- |
| Service and environment | Apple OAuth, Google OAuth or SMTP; dedicated test/production designation |
| Account owner | Person responsible for renewal and incident response |
| Secret location | Private vault reference, never the value |
| Bound destination | Exact reviewed project, customer origin and callback |
| Issued and expires | Actual UTC timestamps from the credential; use not applicable only when documented |
| Renewal review | Review 30 days and 7 days before the actual expiry; these are procedure dates, not scheduled automations |
| Last verification | Deployment version, synthetic scenario, pass/fail and cleanup status |
| Recovery path | Safe prior configuration reference and remaining sign-in options |

An unknown expiry or missing owner keeps activation readiness incomplete. Do not invent a six-month date from the current date before a credential is issued.

## Apple web OAuth renewal

Supabase's Apple guide requires renewal of the web OAuth client secret every six months using the private signing key. This is distinct from rotating the underlying signing key itself. Native-only Apple flows have different requirements; this project currently prepares web OAuth. [Supabase Apple sign-in](https://supabase.com/docs/guides/auth/social-login/auth-apple)

1. The owner checks the actual client-secret expiration and private signing-key availability before the review date. Confirm the exact reviewed Services ID, project and callback; do not change identifiers as part of routine renewal.
2. Preserve the last known working non-secret configuration and a secure reference to the prior, still-valid credential for recovery. An expired or suspected-compromised credential is not a rollback option.
3. The owner generates and enters the replacement through the approved private workflow. Credential creation and submission are a human handoff. Never use a public generator or paste the signing key/client secret into this chat.
4. Update only the intended Apple provider's secret in the verified project. Keep unrelated providers, manual linking, callback allowlists and account/session policy unchanged. Record the new actual expiration privately.
5. Run the verification below with designated test accounts. A dashboard save alone is not proof of successful sign-in.
6. If verification fails, stop rollout. Restore the last safe still-valid configuration only through the owner-approved private workflow, then repeat the affected verification. If none is safe, report Apple unavailable and preserve verified alternate sign-in methods; do not merge accounts or bypass authentication.
7. Record the outcome, deployment version and next review dates without secret values. Schedule notifications only when Sabine explicitly asks; no scheduler is created by this runbook.

If a signing key is lost or compromised, stop the routine renewal procedure. The owner follows Apple's revocation/replacement process with an explicit security handoff, then verifies every affected service. Do not automatically revoke a key because other apps may depend on it.

### Apple manual verification

- Successful sign-in returns to the exact app origin and correct test identity.
- Cancellation returns to account access and creates no consultation.
- Repeat sign-in works when Apple supplies no full name; the app must not require one.
- Approved verified-email automatic linking returns to the existing account when applicable. Test unverified/duplicate identity cases without application-driven merges.
- Sign-out denies protected access, and the existing seven-day absolute deadline is not extended by refresh.
- Confirm no callback code, token, private identity or credential is present in application/proxy logs. Until upstream logging behavior is established, do not activate real callbacks.

## Production email setup and maintenance

Supabase's built-in sender is restricted to project-team addresses, has a small changeable limit and is intended for testing. Custom SMTP is needed for production delivery. Sender purchase/domain and credentials remain unapproved until Sabine's launch decision. [Supabase SMTP](https://supabase.com/docs/guides/auth/auth-smtp)

1. At the approved setup point, the owner selects the sender service and approves any charge. Privately obtain its exact SMTP host, port, TLS requirement, username and credential. Use that provider's verified setup instructions rather than guessed values.
2. Verify ownership of the chosen sender domain and its required authentication records through the approved domain/account workflow. Do not assume a paid domain or sender is already available.
3. Disable link tracking or rewriting for account emails when the selected sender supports it. Preserve the exact scanner-safe recovery destination, fixed recovery purpose and explicit receiving-browser confirmation. A landing GET must not consume proof.
4. Configure only the reviewed project and templates. Keep actual account proofs out of public examples and logs. The app's non-enumerating recovery response must remain the same for unknown and known addresses.
5. Verify confirmation and reset delivery using designated test accounts, including another device, expired/replayed links, bounce behavior and rate-limit responses. Do not send to arbitrary real customers during setup.
6. Before SMTP credential renewal, retain a secure recovery reference and arrange a verification window. The owner creates and enters the replacement; then verify real delivery before retiring an old credential through the approved provider workflow.
7. On delivery failure, leave account/session authority unchanged. Report email delivery unavailable without exposing whether an address has an account. Use safe prior configuration only if it is still valid and uncompromised. Do not silently switch to the development sender for production customers.
8. Record sanitized failure categories, delivery verification and cleanup. Keep sender dashboards' addresses, message bodies, proof-bearing links and raw provider errors private. Agree provider-specific log retention before launch.

### Email manual verification

| Scenario | Expected result |
| --- | --- |
| New test account | Confirmation arrives from the verified sender; exact destination and intended account |
| Recovery on another device | Landing is safe; explicit confirmation grants reset-only access; password update works once |
| Scanner or landing GET | No password change, session creation or recovery-proof consumption |
| Unknown address | Same public response shape as a known address |
| Expired/reused proof | Refused; no partial account/session adoption |
| Sender outage or rate limit | Readable retry guidance, bounded requests, no automatic unlimited resend |
| Credential renewal | New delivery works; safe rollback tested if necessary; private inventory updated |

## Evidence required to close the maintenance preparation item

Prepared: this runbook, private-inventory template, renewal/rollback sequence and explicit Apple/email verification scenarios. These are documentation deliverables only. No automated account test was added or run for this runbook; the existing foundation suite remains the prior recorded evidence. Real credential provisioning, actual renewal/delivery, notifications and provider acceptance stay open. Completing this preparation does not complete Task 2c or unlock later phases.
