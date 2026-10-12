# Task 2c local account preparation

Approved by Sabine on 11 October 2026 while Phase 1 remains open. Local interfaces and simulated tests only. No hosted configuration, real sign-ins, new credentials, paid calls or deployment.

## Implementation order

1. Add a provider-independent account-flow controller with injected account operations and a clear signed-out state. Credentials are passed only for the requested operation, never included in snapshots or logs.
2. Cover required email/password, confirmation-required registration and generic recovery acknowledgment. Do not infer account existence from recovery replies or treat registration as completed authentication.
3. Prepare Google and Apple pending/cancel/failure flows. Invalidate stale replies after navigation, a new attempt or sign-out. No automatic merging of unverified identities.
4. Prepare server-side verified identity, cookie, callback, origin and session-revocation boundaries. Browser claims alone never authorize styling or personal-data access.
5. Add local account screens using approved design tokens with an explicit simulated-mode explanation. Keep production styling gated while no actual account verification exists.
6. Run focused automated checks and a local visual review before claiming local UI acceptance.

## Acceptance boundaries

A successful simulated response proves a controller branch only. Actual email confirmation/delivery, recovery links, Google/Apple credentials and provider setup, identity linking, hosted callback allowlists, sign-out/token revocation and physical-device sign-in remain unverified. Those actions require their applicable approvals and Sabine's account steps. Do not enable account features in the hosted prototype under this exception.
