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
