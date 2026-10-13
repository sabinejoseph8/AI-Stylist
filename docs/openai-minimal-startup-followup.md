# Prepared OpenAI follow-up after the minimal diagnostic

Status: explicitly authorized by Sabine and submitted in the existing OpenAI Help conversation on 13 October 2026. Verified the message under You said and the cleared composer. Submission does not establish human escalation or a working correction. No new provider attempt is approved.

## Sanitized message

We completed one separately approved server-only minimal startup diagnostic, using your proposed URL wss://api.openai.com/v1/realtime?model=gpt-realtime-2.1 and standard Bearer authentication. The connection opened and session.created arrived. Exactly one session.update selected type transcription, audio.input.format audio/pcm at 24000 Hz, audio.input.transcription.model gpt-live-transcribe and audio.input.turn_detection null. No languages, delay, prompt or keywords fields were sent.

The response again had error.type invalid_request_error and error.code invalid_parameter. This time our fixed classifier establishes that error.param was a string, but it was not one of these retained exact names: session.type, session.model, session.audio.input, session.audio.input.transcription.model, session.audio.input.transcription.languages, session.audio.input.transcription.delay or session.audio.input.turn_detection. Its unrecognized text was discarded. No triggering event correlation was retained. No audio or response generation was sent.

The minimal example therefore also fails on this connection. We cannot recover the discarded parameter or raw message, and will not repeat the same paid attempt.

Please route to API engineering if available. Can you confirm the supported dedicated-transcription startup before any session-type conversion, and explain which fields of this minimal command may produce invalid_parameter? If public documentation cannot establish that contract or account eligibility, please say so rather than treating the already-rejected generic bootstrap as verified.

No credentials, account identifiers, request/session IDs, recordings, customer content or raw errors are included.
