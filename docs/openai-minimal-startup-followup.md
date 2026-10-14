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

This changes the support status, not implementation acceptance. No further paid diagnostic is authorized. The experiment allocation remains $51 and all five notes/startup reservations remain held. Next provider action: wait for a concrete supported procedure or investigation result. The separate local main-app notebook eight-step review is accepted; the local Wardrobe and Saved looks reviews are also accepted; the newer local shopping-list review remains pending. No task or phase is closed by this reply.

## Follow-up ownership request sent, 13 October 2026

Sabine reports sending the follow-up asking the assigned specialist to confirm whether API engineering review will be requested and whether support will follow up. The request also asks for a supported transcription startup and any relevant account-access restrictions, and reiterates that the same paid diagnostic will not be repeated. This is Sabine's reported submission, not an independently inspected delivery receipt. The specialist's preceding message confirms case ownership only; it does not promise another investigation or response. Engineering review, eligibility, a working procedure and any response date remain unconfirmed. No new paid attempt is authorized.

## Further specialist reply and local check, 13 October 2026

Sabine supplied the specialist's further reply: an optional local defaults/middleware inspection is suggested, not a confirmed fix. Engineering referral and follow-up timeframe remain unconfirmed, as do supported startup, session-type conversion and account access. The reply does not request another paid attempt or recover discarded diagnostic details.

Completed that local check with source inspection and mocked transport tests. The minimal payload is constructed directly, JSON-stringified, then forwarded unchanged to raw WebSocket send; no field-merging defaults/middleware were found in this inspected path. Existing runtime tests now assert the entire serialized outgoing message and fixed URL/header configuration. All 67 focused tests across three files, type checking and build pass. No real credentials, provider request or durable reservation was used. This is current-code replay evidence only; the historical wire payload cannot be reconstructed as observed evidence, and no provider-side acceptance or root cause is established.

Official references checked: [Realtime transcription guide](https://developers.openai.com/api/docs/guides/realtime-transcription) and [Realtime client events](https://developers.openai.com/api/reference/resources/realtime/client-events). The guide shows the minimal update shape; that alone does not prove the proposed connection can change session type or resolve this account's rejection. No API contract change was made.

## Local configuration findings follow-up reported sent, 14 October 2026

Sabine reports sending the prepared reply to the assigned specialist. It states that the inspected minimal payload is constructed, serialized and forwarded unchanged, with no field-altering defaults or middleware found. It distinguishes current-code evidence from unavailable historical wire evidence and confirms no additional API request or paid diagnostic was run. The reply asks for API engineering referral, a supported dedicated-transcription startup, clarification of session-type conversion and possible account/model-access restrictions, and whether the case will remain open with a further update. Submission is reported by Sabine, not independently verified in the support conversation. No newer support reply, engineering referral, timeframe or working procedure is confirmed. No repeat paid test is authorized.
