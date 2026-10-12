# Cross-device password recovery

Status: required by Sabine on 12 October 2026; implementation in progress.

## Required experience

A customer can request recovery on one device and open the email on another. The receiving browser confirms recovery, chooses a new password and remains signed out after completion. Opening the link alone must not change a password. Expired, reused or invalid proof gives a generic unavailable state and an option to request another email.

## Selected engineering direction

Use a Supabase email token hash with fixed recovery purpose, verified on the server. The existing requesting-browser PKCE cookie is not a prerequisite on the receiving device. Retain cryptographic identity verification, recent recovery purpose, current-session authority, reset-only permission, one-use submission and scoped cleanup. Do not reuse ordinary login authority for password reset.

The email landing GET must not consume proof. Require an explicit same-origin confirmation POST, bound to the receiving browser, before provider verification. Prevent duplicate in-flight consumption, reject caller-selected redirect/purpose, use no-store and no-referrer, and redact proof-bearing URLs from application/proxy logs. No third-party scripts or tracking on the landing page. Reuse the bounded provider transport, deadlines and uncertain-cleanup hold. The prepared transport method alone does not implement this full flow.

## Sources and evidence

[Supabase email templates](https://supabase.com/docs/guides/auth/auth-email-templates) documents TokenHash, server verification and email-scanner prefetch risks. [verifyOtp](https://supabase.com/docs/reference/javascript/auth-verifyotp) documents token-hash verification and recovery purpose. Actual email templates, token purpose, one-use behavior and device flow need hosted acceptance.

## Hosted inventory

Read-only inspection of the existing AI Stylist project on 12 October 2026 found public.stylist_prototype_budget and managed auth.users/auth.sessions. The dashboard has no tracked migrations. Customer tables are absent. Required Auth columns exist: sessions.id/user_id UUID and not_after timestamp; users.id UUID, deleted_at/banned_until timestamps and is_anonymous boolean. This is metadata inspection, not hosted migration or account acceptance.

## Next action

Compose token-hash verification with the reset-only provider lifecycle and receiving-browser confirmation. Review/apply the existing customer migration chain under the newly approved hosted scope; preserve the prototype budget table. Configure the recovery email only when the receiving endpoint and exact HTTPS origin are ready. No extra spending or paid voice test is approved.

## Cross-device reset-only lifecycle, 12 October 2026

The cross-device token provider now uses the same signed identity, recent recovery purpose, current-session check, one-use password operation and independently verified scoped cleanup as the existing PKCE provider. It accepts no requesting-browser verifier and exposes only a reset capability. Ordinary login purpose is refused while cleanup is retained. Malformed proof is rejected before the provider operation. The receiving-browser confirmation and HTTP owner are still to be composed; no live email or customer migration has been activated.

Evidence: 525 foundation tests across 73 files pass; type checking and build pass. Provider replies remain synthetic. Exact next action: compose receiving-browser confirmation with bounded recovery ownership and delivery cleanup, then apply/review the approved hosted migration chain. Hosted setup and cross-device behavior are approved; spending remains unchanged.
