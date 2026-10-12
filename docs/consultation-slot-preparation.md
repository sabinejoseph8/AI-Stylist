# Single-consultation database preparation

Local Task 2b preparation for Phase 2 check P2-07. No Auth route, coordinator, provider or hosted database uses this migration yet.

## Contract

Migration 015 keeps one private row locked during each state change. A protected server claim supplies a verified account ID and a fresh session UUID. Exactly one competing claim gets a reservation. Its server-only random token and increasing fence identify that generation; a different account, session, token or fence cannot change it. Direct table access and browser function execution are revoked.

An authenticated reconnect must supply the same session and server token and arrive before expiry. It returns the same reservation without starting another provider call. A failed reconnect never silently creates a new consultation. The trusted server must keep this token private and resolve account identity from verified authentication, not request JSON. Task 2c supplies real authentication later.

Reservations last 60 seconds, renewed by a valid heartbeat. Before attempting any provider call, the server must atomically mark the row as provider work. Only the first transition succeeds; retries cannot launch a second call. Stale or expired work fails a check or heartbeat. An expired reservation can be reclaimed only when provider work was never permitted.

Expiry does not prove remote closure. Once provider work may exist, the slot stays occupied until the trusted server verifies cleanup and explicitly ends it. An uncertain provider start or lost response stays held. The cleanup flag is a trusted service assertion, not a browser option or a substitute for provider-specific evidence. The existing spending ledger remains a separate required guard. This adds no provider allowance.

Ending releases the row but preserves its monotonic fence. Old generations cannot end or revive a replacement. An account with an occupied slot cannot be deleted through the foreign key; its consultation must be safely closed first. The free row retains no account, session or token. No conversation, notes or media are stored here.

## Evidence and remaining work

Local PostgreSQL tests cover two simultaneous starts with one winner, same-account reconnect, foreign denial, exactly-once provider authorization, heartbeat, refusal of unverified cleanup, expired-provider hold, verified release, stale-generation rejection, expired-reservation replacement and function/table privilege denial.

The 60-second heartbeat window is an internal preparation choice, not a customer recovery promise. Actual coordinator admission, per-command fencing, heartbeat cancellation, provider cleanup evidence, bounded database request deadlines, real Auth and hosted acceptance remain open. Do not treat this row as automatic cleanup of remote media or as live single-consultation acceptance.
