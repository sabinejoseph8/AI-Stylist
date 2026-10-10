# Task 1c live transcription proposal

Status: preparation with simulated tests approved by Sabine. 10 October 2026.

## Proposed next increment

Prepare a disabled server-side OpenAI live transcription adapter using the existing WebSocket dependency and streaming microphone component. Feed bounded user transcript updates into the notebook coordinator. Keep API keys on the server, preserve cancellation/deadlines, retain no raw audio or transcript logs, and use mocked provider tests first. No provider call, deployment or spending is included in this preparation approval.

Official OpenAI documentation recommends gpt-live-transcribe for text arriving during speech, supports server WebSocket transcription, and requires client turn detection for that model. It documents incremental and final events matched by item ID, with completion order across turns not guaranteed. It does not provide word timestamps or confidence scores. Actual latency must be benchmarked. [Realtime transcription](https://developers.openai.com/api/docs/guides/realtime-transcription). Retrieved 10 October 2026.

This is a proposal for the notebook input spike, not a replacement of the existing avatar/conversation architecture. A second transcription path adds processing and eventual cost. Account availability, exact pinned model/version and live cost remain unverified. Structured extraction beyond the canned fixture needs its own model and schema review. Synthetic notes do not prove recognition quality or the two-second target.

## Boundaries and remaining action

All nine approved provider trials are closed; the original reserve is exhausted. Any real microphone-to-provider test needs a separately reviewed allowance before activation. Do not reset the ledger, enable a fallback, choose another provider or change spend controls. Tavus recovery still waits for its technical reply.

Sabine explicitly approved preparation with simulated tests. The disabled protocol adapter is implemented and its synthetic checks pass. See the preparation evidence below. Paid activation and a production architecture decision remain unapproved.

## Approved disabled transcription preparation, 10 October 2026

Sabine answered Approve preparation with simulated tests. This approves preparing the OpenAI live transcription path disabled, with simulated provider events only. It does not approve a paid call, new allowance, production model baseline, deployment or an avatar architecture change.

Implemented server-only PreparedLiveTranscription protocol adapter with an explicitly injected simulated wire. Default construction refuses live use before sending configuration. No socket factory, API key loading, HTTP/WebSocket route or browser integration enables it. It prepares the documented transcription session configuration for gpt-live-transcribe, 24 kHz PCM and client-owned turn commits. It accepts the existing microphone component's 960-byte frame format, but that component is not connected to this adapter in a running page.

Configuration acknowledgment precedes input; incompatible settings hold. Frame ordering, buffered transport bytes, overall audio size, transcript size, turn count, event count and deadlines are bounded. Provider deltas accumulate into versioned user partials. Item mappings and commit acknowledgments prevent an old turn's delayed completion from reviving its notes. Final text may correct a partial. Provider failures, cancellation, disconnect, consumer errors and timeout stop the adapter without retries. In-memory content is cleared on end; status contains counters and codes only. Cleanup is recorded as requested, never remotely verified, and a wire-close exception is reported as cleanup-unverified.

All 327 tests across 30 files, type checking and build pass. The 24 added checks include synthetic provider-event delivery into PartialNoteCoordinator: a note appears before completion, remains tentative and preserves a subsequent touch edit. These tests use an injected canned extractor, not a real extraction model. No provider connection, key access, microphone capture, real recognition measurement, remote cleanup, price reconciliation or Render deployment occurred. Existing browser assets are unchanged by this server-only preparation.

Remaining: an authenticated live session owner and transport wiring; approved/pinned structured extraction model and schema; allowance review before paid activation; actual microphone-to-notebook quality and complete latency measurement; real recommendation speech cancellation; and Tavus recovery clarification. Task 1c remains unchecked.

## Simulated note-session ownership integration, 10 October 2026

Added NoteSessionProbe to connect the existing prepared transcription protocol, partial-note coordinator and an injected capture source in-process. It refuses default live construction. The source is acquired only after transcription configuration acknowledgment, and its exact existing 960-byte frame interface is used. No actual browser microphone, provider socket, extraction model, key loading, route or authenticated production session is constructed.

The owner stops capture before committing a turn and invalidates the old capture callbacks. Session end, notebook clearing, disconnect, capture failure, provider failure, extraction failure, display callback failure and deadlines cancel extraction, request transport closure, release the source and clear volatile notes. A late permission result is released; late extraction and render callbacks cannot update the cleared notebook. Cleanup failures remain explicit, and remote provider cleanup is never claimed verified. No reconnect or automatic retry is added.

346 tests across 31 files, type checking and build pass, including 19 new ownership/integration checks. Simulated frames and provider partials flow through a canned extractor before turn completion; tentative values and touch-edit protection are verified. Configuration deadlines, the overall deadline during capture acquisition, stop/commit ordering, synchronous initial send failure, cleanup exceptions and late asynchronous results are covered. This is synthetic integration evidence, not live recognition, physical-device acceptance, authentication, two-tab isolation or measured end-to-end latency. Browser assets and the hosted phone preview are unchanged. No paid call, new allowance or deployment occurred. Task 1c and Phase 1 stay open.

## Structured extraction contract preparation, 10 October 2026

Added a provider-independent JSON extraction schema and strict application decoder. The output contains only the originating turn and up to seven unique known fields with literal value/evidence pairs. Every resulting note is tentative. Additional confirmation, save/profile authority, unknown fields, duplicate fields, wrong turns, malformed/oversized JSON and evidence outside the current fragment are rejected atomically. Values must equal trimmed evidence, preserving negation and avoiding invented seasons, currency or budget scope. This deliberately narrow prototype contract does not yet provide typed normalized budgets, separate exclusions or automatic voice confirmation.

A bounded 1,000-character prior context is now supplied alongside the current fragment for field identification, including clauses split across partials. Prior context alone cannot support a new patch. Prompt instructions are separate from the JSON-encoded untrusted speech data. These safeguards do not prove a model assigns the correct field or fully resists prompt injection; actual extraction quality still needs evaluation.

The simulated extractor adapter accepts an injected request function and refuses default live construction. Cancellation before or after a request holds the result; errors expose only generic codes. No model, API request, endpoint, keys or live switch is selected or enabled. All 368 tests across 32 files, type checking and build pass, including 22 new contract/integration checks. The canned notebook retains its interaction flow. No paid call or deployment occurred. Task 1c remains open.

## Approved pinned extraction adapter, 10 October 2026

Sabine approved GPT-4.1 mini preparation with simulated responses only. Added a server request builder pinned to gpt-4.1-mini-2025-04-14 and a Responses wire decoder. Requests specify strict JSON schema under text.format, store:false, no tools, no streaming and a 2,048-token output ceiling. store:false requests no Responses application-state storage; it does not promise zero retention or alter provider training policies. The protocol version uses a single-value enum in the provider schema, with the application decoder retaining its exact version check. [Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs), [Responses migration and storage](https://developers.openai.com/api/docs/guides/migrate-to-responses).

The decoder accepts one completed assistant text message from the pinned model. It rejects refusals, failed/incomplete/cancelled results, tool outputs, multiple messages, invalid JSON, wrong turns and unsupported evidence. Notes stay tentative. The simulated transport forwards cancellation, discards late results, redacts errors and performs no retries or model fallback. The existing coordinator owns the 1.5-second extraction deadline. No API client, credentials, live endpoint or activation path was added; simulation must be explicit.

All 396 focused tests across 33 files, type checking and build pass, including 28 new adapter checks. A simulated transcription envelope flows through the session owner and this adapter into tentative notebook notes; ending clears the session. Tests also cover the deadline and ignored late responses. This proves local contract handling only, not provider schema acceptance, account availability, semantic quality, live latency or physical-device behavior. No paid call, additional allowance or Render deployment occurred. All nine prior trials remain closed. Task 1c and Phase 1 remain incomplete.
