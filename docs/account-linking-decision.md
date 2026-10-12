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
