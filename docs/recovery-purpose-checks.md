## Subsequent local admission rehearsal, 15 October 2026

The [abuse/restart rehearsal](local-recovery-abuse-restart.md) adds 37 fresh-process and failure cases for a separate synthetic journal. It does not replace the TypeScript candidate's process-local maps, supply provider-purpose proof or activate account protection. Its explicit coordinated-rollback limitation remains a production gate.

# Local recovery-purpose checks

15 October 2026. Sabine authorized local design and tests with no new spending or hosted changes. This candidate is disconnected from customer routes, email templates and account runtime configuration.

## Security contract

A browser label, an ordinary signed login token, a successful HTTP response or an email request alone cannot grant password-reset permission. A server-owned attempt must correlate a fixed recovery verification operation with independently verified, current recovery authority. The existing signed recovery-method requirement remains mandatory.

The local design deliberately **does not accept ordinary OTP authentication as recovery**. It therefore does not resolve the Supabase compatibility question identified in [the investigation](render-local-alternative-investigation.md). A server-side request receipt records intent, not independent proof that the provider authenticated recovery. No production alternative to that proof has been accepted.

## Candidate sequence

1. A trusted server creates an opaque attempt for one exact email address. It expires after five minutes. The object identity is private to the server; its visible purpose label is not a bearer credential. JSON copies, attempts from another instance and canceled/expired attempts fail.
2. Verification accepts only attempt, matching email and a six-digit code. A valid-shaped submission claims the attempt synchronously before any asynchronous work. Invalid email/code consumes the attempt too; concurrent/replayed submissions do not start another provider operation.
3. The dedicated server transport receives only the snapshotted email/code. The existing transport fixes the provider destination and recovery purpose. The browser cannot select a provider, purpose, redirect or access token.
4. The original identity verifier independently checks signature, issuer, audience, role, anonymous status, current primary session and recent signed recovery method. The candidate additionally requires matching signed email and token issuance no earlier than the attempt's start second and no later than the current second. This timestamp check is conservative correlation, not cryptographic proof of a unique request or a brand-new session.
5. Owner/session correlation and reset-only capability creation reuse the existing provider and bounded recovery owner. A repeated provider session is refused and invalidates the previous candidate's future reset checks. An already-started provider password change cannot be undone by this check.
6. Before password change, authority, expiry, cancellation, shutdown and duplicate-session invalidation are checked again. Password submission is one-use. No ordinary account session or sign-in cookie is issued.
7. Rejected, expired and late results retain scoped cleanup. A revoke acknowledgment alone is insufficient; independent primary-session absence is required. Unknown cleanup holds subsequent recovery work. A timeout retains underlying admission until late work settles, with the existing four-operation cap.

## Implementation

- apps/foundation/src/server/recovery-provider.ts: disconnected createRecoveryCodeProvider, using the existing strict verification and cleanup core.
- apps/foundation/src/server/account-recovery.ts: disconnected createCodeRecoveryOwner, using the existing bounded reset-only lifecycle.
- apps/foundation/tests/recovery-purpose-candidate.test.ts: 26 tests with locally generated asymmetric signatures and simulated verification, password and cleanup operations.

The attempt/session maps are bounded at 128 records each and process-local. Attempt expiry, single-use claiming and session receipt invalidation are not durable distributed abuse protection. A fresh instance cannot accept an old opaque attempt, but no claim is made that session history or cleanup holds survive a restart. A receiving device would need its own authenticated server binding before using this server-only API; the original requesting device's cookie is not a proposed prerequisite.

Calling candidate close blocks new attempts and subsequent reset checks; it is not remote logout. Issued capabilities must still be discarded through the recovery/browser/network owner's shutdown and expiry lifecycle before any future host activation.

## Evidence

All **1,307 foundation tests across 129 files**, type checking and production build pass. The 26 new cases cover successful one-use reset with independently confirmed cleanup; refusal of OTP/password/magic-link purpose; fabricated/serialized/foreign/canceled attempts; email/code mismatch and extra purpose/token/redirect fields; signed email/freshness/identity validation; repeated sessions; competing submissions; immutable request fields; attempt capacity/expiry; current-session checks; uncertain cleanup holds; late cancellation; shutdown; forged signatures; reset expiry; wrong token type; stalled-operation admission; and uncertain late cleanup.

Every identity is synthetic, every provider operation is simulated and no actual password is changed. The browser preview is unchanged, so no new user walkthrough is required for this server-only candidate. No hosted service, private backup runtime, account, credential, spending record or support message changed. No GitHub or hosted Memory publication occurred.

## Remaining gates and exact next action

Keep B03/B04 and all phase/acceptance checkboxes open. The current signed-purpose safeguard still refuses an OTP-only Supabase reply. Next, review whether a supported provider contract can supply independently sufficient recovery purpose, without relabeling ordinary login or merely trusting a browser field. In parallel, durable guessing/resend limits, receiving-browser binding and restart cleanup need local design before a code-entry interface can be composed. Any adoption that changes the approved emailed-link experience requires Sabine's business decision; hosted verification/activation remains separately gated. Do not start another paid diagnostic or alter hosting policy to close these questions.
