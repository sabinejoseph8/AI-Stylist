# Dedicated notebook transcription startup clarification

Authorized submission; Sabine supplied an AI-assisted support reply on 10 October 2026. Contact/sign-in handoff resolved. Human engineering confirmation and dedicated remote-cleanup semantics remain unverified. See docs/notebook-provider-contract-review.md for disposition.

## Intended integration

A server-owned, notes-only WebSocket transcription session using gpt-live-transcribe. Input is mono PCM16 at 24 kHz; manual commit, no VAD. The prepared owner sends session.update with session.type set to transcription, audio.input.transcription.model set to gpt-live-transcribe, languages set to [en] and delay set to low. It waits for session.updated before accepting audio. No assistant speech or GPT-Live session.start protocol is intended.

## Questions for OpenAI support or documentation clarification

1. What exact GA WebSocket URL, query parameters and required headers create this dedicated transcription session with a server API key? Is a model query or transcription intent required? Please provide a current example for gpt-live-transcribe rather than an archived beta example or a conversational model.
2. Which initial server event precedes session.update, and which acknowledgment confirms the effective transcription configuration? Is session.updated with session.type equal to transcription the expected event?
3. Is audio.input.transcription.delay equal to low supported for gpt-live-transcribe? The guide demonstrates it, while the reference description restricts delay to a different model. Which description governs the selected model?
4. For manual commit, which acknowledgment establishes item-to-turn mapping, which completion event closes the committed turn, and what transport-close evidence should the application use before recording resource cleanup as verified?

## Evidence reviewed

- [Realtime transcription guide](https://developers.openai.com/api/docs/guides/realtime-transcription)
- [WebSocket connection guide](https://developers.openai.com/api/docs/guides/voice-websockets)
- [Deprecated transcription-session token reference](https://developers.openai.com/api/reference/resources/realtime/subresources/transcription_sessions/methods/create)
- [Archived cookbook with legacy intent example](https://developers.openai.com/cookbook/examples/speech_transcription_methods)

## Boundaries

Sabine explicitly authorized sending this draft. Complete the existing support conversation after sign-in; verify retained content to avoid duplicate submission. Do not include keys, recordings, full test ledgers or account details. The selected provider preparation stays disabled. A real experiment also needs the reviewed dedicated storage/configuration and a newly authorized allowance; the nine closed legacy trials remain unchanged.

## AI-assisted OpenAI support reply reviewed, 10 October 2026

Sabine supplied the support reply after using the email route. This is explicitly AI-assisted support summarizing public documentation, not a human engineering confirmation or live trace. The previous sign-in/contact handoff is resolved by receipt of this reply; do not ask Sabine to sign in again for this submission.

Support proposes wss://api.openai.com/v1/realtime?model=gpt-live-transcribe with server Bearer authentication, session.created followed by session.update/session.updated, low delay, and item_id correlation through committed/delta/completed events. Current official transcription guidance supports the selected configuration, low delay and item correlation. The retrieved general WebSocket example still selects a conversational model; applying its model query to the dedicated transcription model remains the support bot’s interpretation, not independently established live acceptance. Preserve this proposed URL as a candidate, not an activated endpoint.

The reply explicitly cannot establish a dedicated transcription terminal acknowledgment. GPT-Live session.close/session.closed must not be imported into the Realtime transcription implementation. Normal socket closure can show transport closure, not remote deletion, final billing, retention or a provider-specific terminal state. Keep remote cleanup unverified and the conservative hold rules intact. No API request, credentials, allowance or deployment changed. Documentation-only review; no tests rerun, latest code evidence remains 1,115 passing checks with type checking/build.

Next: Prepare a disabled connection-plan contract for the support-proposed transcription URL and local close evidence, with no socket construction, credentials or live enablement. Distinguish model-specific startup proposed by AI-assisted support from verified provider behavior. Keep remote cleanup, Tavus recovery and new paid-trial authorization as open activation gates.
