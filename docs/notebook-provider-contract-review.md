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

- Follow-up retrieval succeeded for the [Python Responses create reference](https://developers.openai.com/api/reference/python/resources/responses/methods/create). Its completed assistant/output-text example supports the prepared response envelope; this is not model entitlement or live-output proof.
- The [official Realtime schema index](https://developers.openai.com/api/reference/python/resources/realtime) exposes delta/completed event schemas. Both require event and item IDs. Completed requires content index and transcript; delta content index and text are optional. Preserve conservative rejection of contentless/unmapped deltas; do not invent an index or preference. The full session-update acknowledgment schemas still returned retrieval errors. Configuration compatibility remains incomplete.
- The [generic Realtime connect reference](https://developers.openai.com/api/reference/python/resources/realtime/methods/connect) was retrieved but only describes generic connection parameters. It does not settle the dedicated transcription startup contract.
- The general WebSocket guide now covers both GPT-Live and Realtime. They have different session startup protocols. Do not mix a GPT-Live `session.start` connection with the prepared Realtime `session.update` owner. The exact dedicated transcription connection contract remains an activation prerequisite. Source: [OpenAI WebSocket guide](https://developers.openai.com/api/docs/guides/realtime-websocket).
- Existing simulation cleanup checks do not verify remote provider closure, retention or deletion. A live owner must await the documented transport close result and preserve a hold when uncertain.
- No current pricing or account entitlement was verified. A cost estimate and separately authorized allowance remain required. The nine legacy trial reservations stay closed and unchanged.

## Next engineering step

The protected owner, lifecycle, deadline and replacement integration checks now pass with synthetic services. Reconcile the selected transcription session acknowledgment and connection startup protocol, then add representative official-schema fixtures to the disabled adapter. Preserve conservative event validation and cleanup holds. Keep the live route and providers disabled until the contract and dedicated durable allowance prerequisites are resolved.
