## Current MVP account scope, 14 October 2026

Sabine removed Google sign-in from the MVP after previously removing Apple. MVP accounts now use email/password with password recovery only. Do not request Google Cloud sign-in, OAuth credentials, consent-screen setup, social-provider acceptance tests or Apple membership for MVP delivery. Earlier social sign-in and automatic-linking approvals are historical, not current requirements. Local social buttons are removed, initiation is refused before provider work, and both social callbacks are absent from the composed customer host. Generic low-level OAuth helpers remain disconnected historical scaffolding. No hosted provider setting or existing account was changed. Seven-day sessions, cross-device recovery, confirmation, isolation and privacy/spending gates remain. Sender and exact customer-host security still need resolution; domain purchase and Rakuten remain deferred.

## Account scope amendment and prerequisite setup, 14 October 2026

Sabine asked to complete missing account/source prerequisites, confirmed she has no Apple Developer membership and will not obtain one, then explicitly removed Apple sign-in from MVP launch requirements. Email/password with recovery and Google remain required. Apple is removed from sample/connected account choices, browser initiation guards and the mounted account callback map. Generic disconnected historical Apple helpers are retained without an MVP entry route or activation authority. Explicit tests reject Apple before fetch/provider/navigation/cookie issuance and verify the missing mounted callback. Seven-day sessions, cross-device recovery, verified-email automatic linking for Google, confirmation and owner protection remain unchanged.

Read-only inspection of the existing AI Stylist Supabase project confirms email enabled, Google and Apple disabled, new signup/email confirmation enabled, anonymous/manual linking disabled. Google Client IDs and OAuth secret are empty; its exact Supabase callback is verified in the dashboard. No setting was saved and no secret was read or created. The Google Auth Platform page is open at sign-in for Sabine; credential creation/entry remains a secure user handoff. Hosted customer origin/ingress/logging and production sender remain unresolved. Domain purchase stays deferred until public launch.

Sabine confirmed she has no live public fashion website/blog/customized social page. Rakuten registration remains unfulfilled and no SID or retailer permission exists. Sabine reaffirmed Rakuten deferral on 14 October 2026 and did not approve the proposed style-guide website. Do not create/publish that website or begin Rakuten registration to bypass the deferral. Source work remains clearly labeled sample data until the business prerequisite is reopened. Do not use the private Memory/preview or unfinished app as an eligible live publisher site. No account/advertiser application, terms acceptance, support message, purchase or new paid call occurred. Allocation remains $51 and all held records remain intact. Full Tasks 2b/2c, source access and launch remain open.

Exact next action: finish checks and publish/copy the approved Apple scope amendment; complete Google setup only after Sabine signs in and the secure credential handoff is available. Rakuten and its proposed public style-guide prerequisite are deferred by Sabine; do not prepare that site without renewed authorization. Real email/recovery/Google/isolation acceptance follows the working host and required security evidence, not these configuration observations.

# MVP identity-linking decision

Status: approved by Sabine on 12 October 2026. Hosted security acceptance remains pending.

## Evidence

Supabase documents automatic linking of sign-in identities using the same email address. It describes unique-email requirements and removal of other unconfirmed identities when adding a matching identity to protect against pre-account takeover. Manual linking is a separate signed-in feature, including linking a different email address. Disabling manual linking does not disable the documented automatic behavior.

Primary source: https://supabase.com/docs/guides/auth/auth-identity-linking (reviewed 12 October 2026).

Read-only project inspection confirmed manual linking disabled, email confirmation enabled, and Google/Apple disabled. No live automatic-linking scenario has been tested. Documentation is not hosted acceptance evidence.

## Approved MVP policy

Use Supabase's documented automatic identity linking for the MVP, subject to provider security acceptance. Keep manual linking and application-driven merges disabled. Customers using different provider email addresses, including a different Apple relay address, must not be promised access to the same account unless the provider resolves them to the same verified identity ID.

Sabine explicitly selected “Use Supabase automatic linking (Recommended).” This approves the customer policy above. No account data has been merged or provider enabled.

## Application boundary

Saved data ownership uses the cryptographically verified identity ID and current session, never a matching email or provider response user object. OAuth token normalization passes only access and refresh material to verified session staging. A focused regression supplies misleading user ID, email and identity metadata and confirms none reaches staging.

This proves an adapter boundary only. It does not prove Supabase's live linking safety or P2-06 acceptance.

## Required hosted acceptance

1. Verified email/password account followed by matching Google and Apple identities: check the expected verified owner ID and access to its own data.
2. Unconfirmed and duplicate email scenarios: no unauthorized access or cross-customer data merge.
3. Different provider/relay emails: no application merge or lookup by email.
4. Canceled, failed and replayed callbacks: no new account authority.
5. Verify second-customer database and Storage isolation, including after provider transitions.
6. Record synthetic scenario results and cleanup without exposing emails, tokens or private user IDs.

The policy is approved. These checks still require a working hosted endpoint and provider credentials. Existing spending and phase gates remain intact.
