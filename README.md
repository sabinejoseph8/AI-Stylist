# AI-Stylist

## Private voice and avatar prototype

The Task 1b prototype is in [prototypes/voice-avatar](prototypes/voice-avatar/README.md). It is a private experiment, not the complete customer app. The password-protected Render Free preview is deployed. Sabine confirmed avatar audio, mouth movement, spoken interrupt-and-end and device cleanup on iPhone. Conversational resume and precise latency/lip-sync measurements remain unverified.

See [the phased plan](docs/progress.md) for actual evidence and open checks. The prepared Render configuration keeps secrets in server environment settings and uses the existing Supabase test-limit ledger. Never commit private configuration or experiment records.

## Current development status, 10 October 2026

All 1,146 prototype tests across 75 files, type checking and build pass. Separate isolated checks passed 50 PostgreSQL checks, 13 SQL-backed owner scenarios and 19 SQL-backed browser scenarios. The latest notebook preparation is published source, not a new Render deployment. Live notebook transcription and customer accounts, real shopping and production preference validation remain incomplete.

The disabled server/browser preparation keeps a test reservation held when remote cleanup is unverified. New remote-required browser scenarios use injected persistence; their PostgreSQL/fresh-process composition is the next check. All nine earlier provider attempts are consumed and closed; no new paid trial is authorized.

The sections below preserve earlier implementation checkpoints. Their test counts describe those earlier changes, not the current suite.

### Partial speech groundwork

The provider-independent partial-note coordinator and bounded timing metadata pass 282 tests with the rest of Phase 1, plus type checking and build. They are not yet wired into the notebook UI or a provider. Live speech extraction, actual render timing and recommendation speech gating remain open. See docs/task-1c-notebook-prototype.md.

The coordinator is now connected to the notebook's canned conversation fixture. Browser checks confirm captured and uncertain notes and stale-budget correction rejection. This remains simulated extraction, with no real microphone or provider connection.

### Shared look release preparation

The notebook sample now uses a shared display/speech permit with immediate invalidation on edits, new checks and session changes. All 303 tests, type checking and build pass. Speech cancellation is verified with a synthetic transport; no actual recommendation audio or production validator is connected.

### Disabled live transcription preparation

Sabine approved simulated-test preparation. The server-only protocol adapter is ready for further integration and has no live connector, route or key access. All 327 tests, type checking and build pass. Live extraction, microphone integration and representative measurements remain open.

### Note session integration preparation

The disabled in-process note session probe now owns capture, transcription, note updates and cancellation together. All 346 tests, type checking and build pass. No provider connection or microphone capture is enabled; see docs/task-1c-live-transcription-proposal.md for remaining integration gates.

### Structured extraction preparation

Added strict literal-evidence decoding with a separate untrusted input/context envelope and tentative-only note updates. All 368 tests, type checking and build pass. No model or paid extraction request is enabled.

## Pinned extraction preparation

Sabine approved GPT-4.1 mini preparation. The disabled adapter validates simulated Responses envelopes and returns tentative notes only. All 396 tests, type checking and build pass. No provider call or deployment occurred. See [the scoped decision and evidence](docs/task-1c-extraction-model-proposal.md).
