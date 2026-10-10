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

The shared pure transition validator, unapplied migration/rollback, bounded simulated persistence transport and local database check script are prepared. Seven TypeScript owner/transport composition scenarios now pass against isolated local SQL-backed injected responses, including a separate Node process preserving an unresolved reservation. Seven further loopback browser/database scenarios now pass. Next exercise partial-note extraction and browser presentation through this SQL-backed lifecycle. Keep the migration unapplied remotely and all providers disabled. Remote application, initialization and live trial remain separate security/financial gates.

Run local database checks explicitly from the prototype folder with `python3 scripts/check-notebook-allowance-db.py --local-docker`. The official image is pinned by digest; the script never pulls images, connects to Supabase, exposes a port or seeds an actual allowance. It creates synthetic roles/data in a temporary container and removes it in a finally block. The selected image must already be available locally.


### SQL-backed notebook owner composition

Connected the prepared TypeScript allowance, bounded persistence transport and protected owner to injected RPC responses backed by real local PostgreSQL transactions. Seven scenarios pass: normal reserve/close, fresh owners preserving consumed attempt history and exhaustion, a committed reservation with a lost acknowledgment, a separate fresh Node process holding that unresolved reservation, a committed closure with a lost acknowledgment, browser departure while reservation confirmation is pending, and concurrent owners forced to read the same snapshot before compare-and-swap. Only one competing owner constructs a synthetic provider. A lost closure acknowledgment keeps the original owner held; a fresh owner reads confirmed closure only after the synthetic provider cleanup has completed. This does not establish recovery from an unknown real provider state.

All 869 prototype tests across 63 files, type checking and build pass. The database harness additionally passes 50 SQL checks and seven TypeScript composition scenarios. Scripts are included in type checking. The harness verifies the pinned container image, no network or ports, temporary storage and no host mounts before using synthetic fixtures. It removes the container in finally. No Supabase HTTP authentication, actual database records, paid provider, spending allowance or deployment was used. D21/D22, Task 1c and Phase 1 remain partial.


### SQL-backed browser lifecycle composition

Seven additional scenarios connect the prepared browser session and lifecycle to a real loopback WebSocket bridge, protected owner, bounded persistence transport and isolated PostgreSQL transactions. They verify origin/host/authentication refusal before any database or provider work, page departure while reservation confirmation is pending, replacement blocked until verified closure, failed closure preserving an unresolved record and held slot, a lost reservation acknowledgment blocking both original and fresh bridges, hidden-page capture cleanup and note clearing, and the real eight-second persistence deadline with a late response retaining the hold. All providers and capture sources are synthetic; no actual camera, microphone, Supabase HTTP connection or paid request is used.

The first run exposed a harness cleanup assumption: an intentionally held lease remains active. Corrected fixture disposal to accept a held slot while still disposing its sockets/listeners/server, and to attempt every fixture cleanup even if another fails. The application hold behavior was correct and unchanged. The database subprocess has a bounded 60-second test deadline. The project runtime dependencies must be installed to run the loopback checks.

All 869 prototype tests across 63 files, type checking and build pass. Separately, 50 SQL checks, seven SQL-backed owner scenarios and seven SQL-backed browser scenarios pass. Temporary containers and loopback servers are removed after the checks. No remote data, allowance, legacy reservation or deployment changed. D21/D22, Task 1c and Phase 1 remain partial.
