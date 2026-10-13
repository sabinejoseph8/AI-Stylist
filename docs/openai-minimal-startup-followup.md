# Prepared OpenAI follow-up after the minimal diagnostic

Status: explicitly authorized by Sabine and submitted in the existing OpenAI Help conversation on 13 October 2026. Verified the message under You said and the cleared composer. Submission does not establish human escalation or a working correction. No new provider attempt is approved.

## Sanitized message

We completed one separately approved server-only minimal startup diagnostic, using your proposed URL wss://api.openai.com/v1/realtime?model=gpt-realtime-2.1 and standard Bearer authentication. The connection opened and session.created arrived. Exactly one session.update selected type transcription, audio.input.format audio/pcm at 24000 Hz, audio.input.transcription.model gpt-live-transcribe and audio.input.turn_detection null. No languages, delay, prompt or keywords fields were sent.

The response again had error.type invalid_request_error and error.code invalid_parameter. This time our fixed classifier establishes that error.param was a string, but it was not one of these retained exact names: session.type, session.model, session.audio.input, session.audio.input.transcription.model, session.audio.input.transcription.languages, session.audio.input.transcription.delay or session.audio.input.turn_detection. Its unrecognized text was discarded. No triggering event correlation was retained. No audio or response generation was sent.

The minimal example therefore also fails on this connection. We cannot recover the discarded parameter or raw message, and will not repeat the same paid attempt.

Please route to API engineering if available. Can you confirm the supported dedicated-transcription startup before any session-type conversion, and explain which fields of this minimal command may produce invalid_parameter? If public documentation cannot establish that contract or account eligibility, please say so rather than treating the already-rejected generic bootstrap as verified.

No credentials, account identifiers, request/session IDs, recordings, customer content or raw errors are included.

## Support escalation reported, 13 October 2026

Sabine supplied OpenAI's notification: escalated to a support specialist, with a response expected in the coming days. Record this as a reported escalation, not a technical resolution or a confirmed response date. Await the specialist's answer before interpreting startup compatibility or requesting another paid attempt. No further provider call or spending is authorized.

## Human support clarification, 13 October 2026

Sabine supplied a response from the assigned OpenAI support specialist. Human ownership of the case is now confirmed by that supplied reply. Support acknowledges that the minimal startup failed after session.created and the transcription session.update, and retracts earlier claims that the proposed startup was verified or that conflicting documentation could be dismissed as outdated. The cause, supported dedicated-transcription startup, session-type conversion and applicable transcription fields remain unresolved. API engineering review, account eligibility and a working procedure are not confirmed. The rejected parameter text and triggering-event correlation were not retained and cannot be recovered; support requests no repeat attempt.

This changes the support status, not implementation acceptance. No further paid diagnostic is authorized. The experiment allocation remains $51 and all five notes/startup reservations remain held. Next provider action: wait for a concrete supported procedure or investigation result. The separate local main-app notebook eight-step review remains pending; its sample-data preparation may proceed within the approved exception. No task or phase is closed by this reply.
