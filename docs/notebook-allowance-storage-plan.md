# Notebook allowance storage preparation

Status: unapplied migration prepared and checked locally, 10 October 2026. This document authorizes no database change or spending. The current allowance and connection tests use an injected in-memory compare-and-swap store.

## Scope and isolation

Use a new notebook-specific store. Do not change, migrate, reseed or refund the nine closed voice/avatar reservations. Keep only approval metadata and reservation IDs/statuses. Never store audio, transcripts, preferences, account emails, images or conversation content in this ledger.

The existing simulation discriminator remains mandatory during preparation. Changing it for a real trial requires a reviewed live adapter and an explicit approved amount, attempt count and time limit. Fixture amounts are not financial authorization. A reservation consumes its full allowance permanently even when the attempt fails; confirmed cleanup closes it without refunding it.

## Proposed persistence contract

- One singleton row for the first separately authorized notebook experiment, with an immutable approval ID. This matches the private prototype’s single experiment scope. A subsequent experiment requires separate review, not overwriting its history. Missing rows fail; there is no runtime initializer or default allowance.
- Store the exact approval and ordered reservation history represented by PreparedNoteLedger. Validate required keys, purpose, integer bounds, unique IDs and at most one open reservation.
- Read returns a validated snapshot. Compare-and-swap locks that experiment row, compares the complete expected snapshot and performs one allowed transition in the same transaction.
- An append preserves approval and all earlier records, adds exactly one open reservation, requires no earlier open reservation and respects the lifetime attempt cap.
- A closure changes exactly one known open reservation to closed. It preserves order, IDs, length and approval. Reject removal, reopening, approval amendments, extra fields and replacement history.
- Return success only after the transaction commits. A failed or missing acknowledgment retains a hold. No automatic retry, fallback to a file, refund or reconstruction of a missing row.
- Protect server requests with a bounded deadline and response size; refuse redirects and malformed JSON. Uncertain writes remain held even if a local timeout has fired.

## Access design

Put tables and privileged implementation functions in a dedicated schema outside the exposed Data API schemas. Enable row security and deny direct table access to public, anonymous and authenticated roles. Prefer invoker functions. Where privilege elevation is necessary to keep direct writes unavailable, keep the definer implementation private, pin an empty search path, and fully qualify referenced relations. Expose only narrowly scoped invoker wrappers if an RPC endpoint is needed. Revoke default execution from every unintended role and grant only the server role needed for the private prototype.

This preserves server-only access; it is not a customer account authorization model. Before application, review the actual exposed schemas, function owners and inherited/default privileges in the dedicated project. Secret keys remain outside the browser.

Sources: [Supabase database functions](https://supabase.com/docs/guides/database/functions), [Supabase row security](https://supabase.com/docs/guides/database/postgres/row-level-security).

## Verification required before activation

1. The migration now runs in an isolated pinned PostgreSQL 17 Docker container with no network or exposed ports. All 50 SQL transition, privilege, concurrency and rollback checks passed locally. Rollback refuses initialized history and removes only empty preparation objects; reinstallation does not seed an allowance. Supabase-specific project configuration and recovery review remain required before remote application.
2. Run database tests for malformed records, immutable approval/history, concurrent reservation, stale compare-and-swap, exhausted allowance and exactly one allowed closure transition.
3. Verify anonymous and ordinary authenticated users cannot read or mutate records or call privileged functions. Verify permitted server access through the intended wrapper only.
4. Verify a fresh server reads the same closed/open history and refuses a new attempt when an unresolved record exists.
5. Simulate a successful write with a lost acknowledgment. Confirm no duplicate write, refund or provider start occurs, and that review is required.
6. Review the bounded server transport and the complete browser cleanup chain. Existing synthetic tests are supporting evidence, not live database acceptance.
7. Obtain the specific new spending authorization before initializing an actual allowance. Applying schema alone must not create a reservation or call a provider.

## Exact next implementation action

The shared pure transition validator, unapplied migration/rollback, bounded simulated persistence transport and local database check script are prepared. Next exercise the TypeScript owner/transport chain against isolated local SQL-backed injected responses. Keep the migration unapplied remotely and all providers disabled. Remote application, initialization and live trial remain separate security/financial gates.

Run local database checks explicitly from the prototype folder with `python3 scripts/check-notebook-allowance-db.py --local-docker`. The official image is pinned by digest; the script never pulls images, connects to Supabase, exposes a port or seeds an actual allowance. It creates synthetic roles/data in a temporary container and removes it in a finally block. The selected image must already be available locally.
