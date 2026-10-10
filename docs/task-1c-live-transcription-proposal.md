# Task 1c live transcription proposal

Status: proposed, awaiting Sabine's decision. 10 October 2026.

## Proposed next increment

Prepare a disabled server-side OpenAI live transcription adapter using the existing WebSocket dependency and streaming microphone component. Feed bounded user transcript updates into the notebook coordinator. Keep API keys on the server, preserve cancellation/deadlines, retain no raw audio or transcript logs, and use mocked provider tests first. No provider call, deployment or spending is included in this preparation approval.

Official OpenAI documentation recommends gpt-live-transcribe for text arriving during speech, supports server WebSocket transcription, and requires client turn detection for that model. It documents incremental and final events matched by item ID, with completion order across turns not guaranteed. It does not provide word timestamps or confidence scores. Actual latency must be benchmarked. [Realtime transcription](https://developers.openai.com/api/docs/guides/realtime-transcription). Retrieved 10 October 2026.

This is a proposal for the notebook input spike, not a replacement of the existing avatar/conversation architecture. A second transcription path adds processing and eventual cost. Account availability, exact pinned model/version and live cost remain unverified. Structured extraction beyond the canned fixture needs its own model and schema review. Synthetic notes do not prove recognition quality or the two-second target.

## Boundaries and remaining action

All nine approved provider trials are closed; the original reserve is exhausted. Any real microphone-to-provider test needs a separately reviewed allowance before activation. Do not reset the ledger, enable a fallback, choose another provider or change spend controls. Tavus recovery still waits for its technical reply.

Sabine's next decision: approve preparing this disabled live-transcription path with mocked tests, or review alternatives first. Project AGENTS.md requires asking before settling an open architecture choice.
