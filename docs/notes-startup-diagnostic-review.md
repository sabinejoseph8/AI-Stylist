# Proposed server-only startup diagnosis

Status: implemented and tested locally; not authorized or activated for live use. All three notes starts are held. Current experiment allocation is $47.

## Purpose

Identify the rejected transcription configuration before another customer-operated microphone trial. The revised bootstrap demonstrably creates a session but its update is rejected; the responsible field is unknown.

## Proposed boundary

- One operator-started connection with the existing approved OpenAI destination and server key. No microphone, camera, avatar, transcript, note extraction, response generation or shopping integration.
- Require a separately recorded human financial/security decision, a new immutable approval identity and durable reserve-before-connect. No reuse, refund or reset of existing records.
- Send exactly the reviewed transcription session.update after session.created. Correlate with a fixed diagnostic event ID; never derive IDs from customer/account data.
- Retain only reviewed fixed diagnostic categories, allowlisted error codes/parameter names, stage/timing and outcome. Never put raw errors, credentials, account/session IDs or content in public files or logs. Raw-message inspection, if essential, needs a separately reviewed private handling design.
- Close immediately on accepted transcription acknowledgment, a provider error or a short startup deadline. No audio or response.create in any outcome. No retries or fallback. Preserve a conservative held outcome when final provider cleanup is unproven.
- Local mocked tests must prove no connection before authorization/reservation, one connection only, exact configuration, no audio/generation/extraction, error redaction, cancellation, timeout and irreversible consumed history.

## Implemented operator boundary

- `src/notes-startup-diagnostic.ts`: one configuration command, fixed event correlation, ten-second provider deadline, immediate close on acknowledgment/error, no media or extraction APIs.
- `src/reserved-notes-startup-diagnostic.ts`: independent startup-only financial/security scope, immutable approval ID, bounded storage operations, reserve/re-read before loading a connection and conservative held outcome. Lost write acknowledgment starts no provider and cannot permit another run.
- `src/notes-startup-diagnostic-main.ts`: separate explicit operator command. It refuses missing flags and ordinary notes IDs before credential use. Configuration is internally branded; forged programmatic runtime settings are refused. No normal app startup or Render change.

Local evidence: 1,635 prototype tests across 117 files, type checking and build; 77 network-isolated PostgreSQL checks, four existing ledger-owner scenarios and four new SQL-backed diagnostic scenarios, with fresh-process refusal checks. The disposable container stopped successfully. These results do not establish provider compatibility, customer acceptance or final billing/deletion.

## Proposed single live diagnostic

Proposed allowance: $2, bringing the experiment allocation from $47 to $49 only if Sabine approves. Proposed approval ID: notes_startup_diag_20261013_01. This is a proposal, not a stored approval or permission.

One agent-operated connection from this computer using existing server credentials with OpenAI and the existing Supabase allowance store. No iPhone, customer audio, microphone, camera, avatar, extraction, response.create, retry, plan upgrade or Render deployment. The provider portion is capped at ten seconds; preparation and recording the held outcome may take longer because each store operation is bounded separately. The $2 is a conservative allowance, not a claim that the no-audio session is free or a hard provider billing stop.

Only fixed diagnostic categories, allowlisted code/parameter names and outcome/correlation flags are emitted. Raw error messages remain excluded. If the provider supplies unknown fields or no useful details, this run may still fail to identify the rejected setting. Do not launch another attempt automatically.

## Operator procedure after explicit approval

1. Record the exact human approval and proposed ID. Verify it does not exist, preserve all three earlier held records and initialize only a new row using the existing reviewed append-only template. Verify exact $2 ledger terms and null reservation.
2. Use existing private configuration files outside Git. Do not display keys, put them in shell arguments, or write them to public outputs. Set only the separately approved startup-only operator flags and ID.
3. Run `node src/notes-startup-diagnostic-main.ts --run-approved-notes-startup-diagnostic` once from the prototype directory with those private environment values. Required flags: NOTES_STARTUP_DIAGNOSTIC_FINANCIAL_APPROVED=true, NOTES_STARTUP_DIAGNOSTIC_SECURITY_APPROVED=true, NOTES_STARTUP_DIAGNOSTIC_SCOPE=startup-only, and NOTES_STARTUP_DIAGNOSTIC_APPROVAL_ID set to the new approved ID. SUPABASE_URL, SUPABASE_SECRET_KEY and OPENAI_API_KEY must come from the existing private configuration. No key is entered on a command line.
4. Inspect fixed stages/result and read the durable outcome. If a reservation or its acknowledgment is uncertain, hold without retry/refund. Expected final state is held even when configuration is accepted; no remote-cleanup claim is made.
5. Implement a correction only if the observed evidence supports it, run local tests and review any additional human validation separately. This diagnostic does not accept the live notebook feature.

No approval initializer, hosted change or provider request has been performed for this proposal.
