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

## Bounded cross-device recovery ownership, 12 October 2026

Token-hash verification now enters the same bounded recovery owner as PKCE recovery. It preserves four underlying operations, five-minute reset-only grants, one-use password submission, cancellation, late-result cleanup and holds after uncertain cleanup. The server-only token owner accepts no original-browser verifier. It is not an HTTP endpoint; receiving-browser confirmation must authenticate its binding before invoking it. Three focused synthetic checks cover reset-only permission, malformed proof and cancellation with a late capability. All 528 foundation tests across 73 files, type checking and build pass.

Next: implement the receiving-browser landing/confirmation binding and compose delivery cleanup, then review/apply the approved hosted migration chain. Hosted accounts, email configuration and physical-device acceptance remain open; no paid calls or hosted changes occurred.

## Receiving-browser confirmation binding, 12 October 2026

Prepared a server-only confirmation binding for cross-device recovery. Email landing creates an opaque Secure/HttpOnly/SameSite cookie and separate confirmation nonce without verifying provider proof. Explicit same-origin confirmation claims that binding before asynchronous verification. Foreign origins, another browser, duplicate cookies, expired proof, malformed landings and replays are refused. Shutdown cancels active verification. Five focused synthetic checks and the complete 533-test foundation suite across 74 files, type checking and build pass.

This module is not yet mounted or rendered. Next: add the no-store/no-referrer landing page and bounded confirmation HTTP delivery with reset-cookie cleanup, then integrate with the explicit account host. Apply the approved customer migrations with post-application privilege checks. Real email configuration, hosted acceptance and physical-device tests remain open. No paid call or hosted schema change occurred. Private Memory still shows the earlier 522-test checkpoint and needs a consolidated refresh.

## Cross-device confirmation HTTP composition, 12 October 2026

The prepared account composition now optionally includes the email landing page and bounded confirmation POST. The page uses no-store, no-referrer and a script-hash CSP, removes proof from the visible URL, makes no provider call on opening and requires an explicit confirmation click. Verified permission is installed only as a reset cookie; failed delivery or installation retains scoped cleanup. No normal account cookie is issued. The existing Node adapter accepts the exact landing path when explicitly registered. The composition remains dormant with no environment activation.

Evidence: 538 foundation tests across 75 files, type checking and build pass. A synthetic composed journey opens the link without original-device PKCE material, confirms it, changes the password once and cleans reset permission. Four HTTP checks verify page protection, failed-delivery cleanup, malformed input and failed cookie installation. No actual email, hosted route or customer migration is activated.

Exact next action: browser-verify the rendered confirmation journey and refresh the private Memory site, then review/apply the authorized hosted customer migration chain and configure the exact HTTPS recovery origin/email endpoint. Proxy URL redaction, durable abuse controls, hosted provider behavior and physical-device acceptance remain required. Task 2c and Phase 2 remain incomplete.
