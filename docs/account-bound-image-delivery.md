# Account-bound image delivery preparation

Local Task 2b preparation, verified 11 October 2026. No application route installs the handler.

## Interface

`createMediaReadHandler` accepts a trusted authentication gate, an owner-scoped metadata reader and a bounded Storage byte downloader. The request contains only an asset UUID in `/api/media/<id>`; owner identity comes from the server gate. Query credentials, range requests, non-GET methods, unexpected origins and cross-site requests are refused. It creates no signed URL and returns no Storage location or credential.

For every request it checks the authenticated session, validates ready owner metadata, downloads bounded bytes, verifies MIME/signature/checksum, rereads the metadata and rechecks the session before returning a copied response buffer. Staged, deleting, deleted, foreign, malformed, changed or uncertain records are held. Legacy ready JPEG/PNG images may have no stored checksum; the downloaded bytes are still hashed and their MIME/signature checked.

Responses use private/no-store caching, no referrer, nosniff, same-origin resource policy, restrictive CSP, and no CORS permission. Failures have an empty uncached body. The handler bounds concurrent work to four image requests, returning 429 with a one-second retry hint when full; the eventual UI must queue/retry thumbnail requests. Each request has a ten-second total deadline and an abort signal passed to its ports. The Storage downloader respects cancellation and its existing eight-second transport/10 MiB limits. No external decoder, credential or new deployment is enabled.

## Evidence

All 209 foundation tests across 16 files, type checking and build pass. Sixteen handler checks cover exact bytes, owner-only access after URL copying, foreign metadata, invalid paths/origins/methods/ranges, unsafe/stale metadata, malformed or excessive bytes, legacy images, deletion and revocation during download, cancellation/deadlines, immutable response bytes, redacted failures and bounded admission. Four additional Storage checks cover full downloads, invalid/partial/oversized responses and enclosing-request cancellation.

The actual local Storage rehearsal additionally executes this TypeScript handler against the disposable database's service-role metadata function and actual Storage HTTP bytes. The generated owner succeeds; another generated owner using the same app URL receives no image. Identity verification remains simulated. Real GoTrue token verification and sign-out/revocation belong to Task 2c; the interface is not accepted as live authentication.

## Remaining gates

- Wire the handler only after authorized account integration and verify real session revocation, cookies, origin handling and service-role isolation.
- Verify account-bound delivery on the actual hosted environment, including copied URLs and caches.
- Serialize or otherwise validate deletion-versus-delivery behavior in the real request lifecycle. The second metadata read detects the tested transition; it cannot retract bytes already delivered or prove a distributed atomic delivery/deletion transaction.
- Enforce the actual deployment's resource/admission limits and browser image-queue behavior.
- Activate and monitor the approved seven-day receipt cleanup before hosted use. The policy and migration 014 are approved and pass local cutoff and concurrent-batch checks; hosted scheduling is still gated.

The app retains Supabase + Render hosting and all existing Phase 1/spending gates. This implements the existing private-image requirement locally; it does not change consent or authorize a hosted migration.
