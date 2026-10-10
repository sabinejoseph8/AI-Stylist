# Notebook provider contract review

Reviewed: 10 October 2026. Read-only official documentation review. No keys, provider requests, account usage checks or deployment.

## Findings

| Preparation | Official documentation comparison | Result |
| --- | --- | --- |
| Transcription configuration | `gpt-live-transcribe`, transcription session, 24 kHz PCM, null turn detection, `languages` and low delay match the guide. | No model/configuration change justified by this review. |
| Transcript processing | Append/commit and delta/completed events are documented; item IDs associate results with audio turns. | Existing item mapping and stale-turn protection remain necessary. |
| Timing | Delay is configurable and must be measured with representative audio. Confidence scores are unavailable. | Do not label simulated timing as provider latency or tentative notes as calibrated model confidence. |

Source: [OpenAI realtime transcription guide](https://developers.openai.com/api/docs/guides/realtime-transcription).

The approved extraction snapshot `gpt-4.1-mini-2025-04-14` is still listed; structured output is supported. No migration is proposed. Source: [GPT-4.1 mini model documentation](https://developers.openai.com/api/docs/models/gpt-4.1-mini).

The preparation uses the Responses `text.format` JSON schema shape, required object fields and no additional properties. Application validation still rejects unsupported evidence, refusals and incomplete output. A schema cannot prove that a preference was correctly understood. Source: [Structured outputs guide](https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=responses).

## Limits and unresolved checks

- The complete Realtime server-event and Responses create references returned retrieval errors. Guide examples omit some event metadata. This review does not establish whether every required metadata/configuration field in our strict decoders matches actual wire responses. Do not loosen validation based on abbreviated examples. Retrieve the full references or an official schema before live connection work.
- The general WebSocket guide now covers both GPT-Live and Realtime. They have different session startup protocols. Do not mix a GPT-Live `session.start` connection with the prepared Realtime `session.update` owner. The exact dedicated transcription connection contract remains an activation prerequisite. Source: [OpenAI WebSocket guide](https://developers.openai.com/api/docs/guides/realtime-websocket).
- Existing simulation cleanup checks do not verify remote provider closure, retention or deletion. A live owner must await the documented transport close result and preserve a hold when uncertain.
- No current pricing or account entitlement was verified. A cost estimate and separately authorized allowance remain required. The nine legacy trial reservations stay closed and unchanged.

## Next engineering step

Exercise authenticated partial-note extraction and cancellation through the disabled server owner with simulated transports, including a pending extraction at exit and a late completion. Keep the live route and providers disabled. Then verify the complete official connection/event contract before any real activation adapter is prepared.
