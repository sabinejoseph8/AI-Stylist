# Proposed server-only startup diagnosis

Status: design prepared, not implemented or authorized for live use. All three notes starts are held. Current experiment allocation is $47.

## Purpose

Identify the rejected transcription configuration before another customer-operated microphone trial. The revised bootstrap demonstrably creates a session but its update is rejected; the responsible field is unknown.

## Proposed boundary

- One operator-started connection with the existing approved OpenAI destination and server key. No microphone, camera, avatar, transcript, note extraction, response generation or shopping integration.
- Require a separately recorded human financial/security decision, a new immutable approval identity and durable reserve-before-connect. No reuse, refund or reset of existing records.
- Send exactly the reviewed transcription session.update after session.created. Correlate with a fixed diagnostic event ID; never derive IDs from customer/account data.
- Retain only reviewed fixed diagnostic categories, allowlisted error codes/parameter names, stage/timing and outcome. Never put raw errors, credentials, account/session IDs or content in public files or logs. Raw-message inspection, if essential, needs a separately reviewed private handling design.
- Close immediately on accepted transcription acknowledgment, a provider error or a short startup deadline. No audio or response.create in any outcome. No retries or fallback. Preserve a conservative held outcome when final provider cleanup is unproven.
- Local mocked tests must prove no connection before authorization/reservation, one connection only, exact configuration, no audio/generation/extraction, error redaction, cancellation, timeout and irreversible consumed history.

## Remaining work before any live authorization request

Implement and test a dedicated bounded runner using the existing reviewed ledger and cancellation patterns. Review how to acquire useful diagnostic evidence when code/param are absent without exposing raw errors. Then present a concrete operator procedure and proposed allowance to Sabine. Do not infer free usage from the support bot's suggestion of a short/non-paid test. No cost increase, initializer, activation or provider request is approved by this document.
