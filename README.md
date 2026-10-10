# AI-Stylist

## Private voice and avatar prototype

The Task 1b prototype is in [prototypes/voice-avatar](prototypes/voice-avatar/README.md). It is a private experiment, not the complete customer app. Phone deployment and remaining manual acceptance are pending.

See [the phased plan](docs/progress.md) for actual evidence and open checks. The prepared Render configuration keeps secrets in server environment settings and uses the existing Supabase test-limit ledger. Never commit private configuration or experiment records.

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
