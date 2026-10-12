# Local Storage API protection rehearsal

Verified 11 October 2026. Run `python3 apps/foundation/scripts/check-storage-api.py`.

## What passed

The rehearsal starts disposable PostgreSQL 17 and Supabase Storage API containers from cached digest-pinned images, on an internal Docker network with no published ports. It applies the application's thirteen migrations to the actual Storage schema. Synthetic identities and short-lived JWTs are generated in memory for this run; no hosted credentials or customer images are used.

- A generated WebP uploads through the service role; its real response identifies the exact key and object ID.
- Its owner receives the exact image bytes. Foreign, anonymous, unauthenticated and public-path reads fail.
- Direct customer upload and overwrite fail. Customer deletion cannot change the object, even where the API returns an empty successful response.
- The owner can issue a two-second signed URL; other and anonymous identities cannot issue it. The link reads exact bytes before expiry and fails after expiry.
- Service deletion returns the exact key/bucket acknowledgment and the image becomes unreadable.
- The actual prepared TypeScript Storage transport passes upload, full-byte checksum, no-overwrite, remove and missing-object checks against this API. Only the test fetch translates a fixed synthetic Supabase HTTPS origin to local HTTP; production origin validation is unchanged.

Temporary containers and the network are removed in the finally block. The Storage server uses a bounded temporary filesystem, read-only root, dropped capabilities and no privilege escalation. Tests use bounded requests and startup waits. No Auth server, gateway, retailer, provider or deployment is involved.

## Bug found and fixed

The actual API reports a missing object with HTTP 400 and a JSON error containing `code: NoSuchKey`, `statusCode: 404` and `error: not_found`. The earlier transport recognized only HTTP 404 and therefore kept cleanup pending. It now requires bounded, valid JSON with that specific missing-key code/status/error under HTTP 400 or 404. Bare status codes, missing-bucket errors, permission errors and malformed/oversized responses remain unknown. The local media recovery rehearsal now uses this actual error envelope.

All 189 foundation tests, type checking and build pass. The isolated SQL suite and adapter-chain recovery rehearsal also pass. These are local integration results, not hosted acceptance.

## Signed-link privacy boundary

A signed URL is a bearer credential. The rehearsal demonstrates that it can be fetched without the customer's token before expiry. Denying other customers permission to *issue* it does not bind the resulting URL to the owner's account.

The approved requirement says another customer cannot access saved wardrobe photos, and the Phase 2 manual check includes copied URLs. Keep raw signed URLs out of the customer UI until account-bound delivery is implemented and verified. Prepare a server-authorized image read boundary that checks the current owner on every request and streams bytes without exposing a reusable storage credential. This is a routine security implementation of the existing requirement; it does not approve a new service or deployment. Actual customer authentication belongs to Task 2c and remains gated.

## Remaining acceptance

This verifies a cached local Storage version with actual RLS and HTTP behavior, using synthetic JWTs and a minimal Auth schema. It does not verify hosted Supabase configuration, secret-key formats, GoTrue token validation/revocation, actual Render limits, recovery across hosting restarts or deletion-receipt retention. Task 2b remains incomplete and its new migrations remain unapplied remotely.

Configuration reference: [Supabase Docker self-hosting](https://supabase.com/docs/guides/self-hosting/docker). This disposable rehearsal is not a change to the approved Supabase + Render hosting plan.
