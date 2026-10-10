# Dedicated notebook transcription startup clarification

Draft only, not sent. No credentials, customer media, private records or account identifiers.

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

Do not send this draft without Sabine's explicit authorization. Do not include keys, recordings, full test ledgers or account details. The selected provider preparation stays disabled. A real experiment also needs the reviewed dedicated storage/configuration and a newly authorized allowance; the nine closed legacy trials remain unchanged.
