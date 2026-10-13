# OpenAI startup contract follow-up

Status: explicitly authorized by Sabine and submitted in the existing OpenAI Help support conversation on 13 October 2026. The submitted message is visibly present in the thread. An AI-assisted response was received; it repeats the proposed conversion and does not identify the rejected parameter. No further call, deployment or spending is authorized. Current experiment allocation is $49 and all four notes/startup reservations are held.

## Sanitized message for support

We ran one server-only diagnostic using the previously recommended bootstrap URL `wss://api.openai.com/v1/realtime?model=gpt-realtime-2.1` with standard Bearer authentication. No microphone, audio append, audio commit, response generation or extraction was used.

Observed sequence: connection opens, `session.created` arrives, the following single command is sent, then an error with type `invalid_request_error` and code `invalid_parameter` arrives. Our fixed diagnostic did not retain an allowlisted parameter name or a matching error event ID. We deliberately do not retain raw provider messages, session IDs, credentials or account details.

```json
{
  "event_id": "notes_startup_diagnostic_v1",
  "type": "session.update",
  "session": {
    "type": "transcription",
    "audio": {
      "input": {
        "format": { "type": "audio/pcm", "rate": 24000 },
        "transcription": {
          "model": "gpt-live-transcribe",
          "languages": ["en"],
          "delay": "low"
        },
        "turn_detection": null
      }
    }
  }
}
```

1. The current Realtime transcription guide shows `delay: "low"` with `gpt-live-transcribe`, but the client-events reference describes `delay` as supported only with `gpt-realtime-whisper` in GA Realtime sessions, including its transcription-session schema. Which contract applies to a dedicated `gpt-live-transcribe` session? Is the example or schema description outdated?
2. Does a connection created through `model=gpt-realtime-2.1` actually support changing its session type to `transcription`? Please provide an end-to-end dedicated server-key WebSocket example, including URL, required headers, initial server event and first client command. The generic conversation connection example and a transcription update example separately do not resolve the observed rejection.
3. If type conversion is unsupported, what is the current supported way to select transcription intent before session creation with a server key? An older official cookbook uses `intent=transcription` with older event names. Please distinguish the current GA initialization from that legacy example.

Please answer from the supported current protocol rather than recommending another unverified paid attempt. We can provide the fixed category above but cannot recover the discarded raw error.

## Evidence and limits

Reviewed on 13 October 2026:

- [Realtime transcription guide](https://developers.openai.com/api/docs/guides/realtime-transcription): transcription configuration, null turn detection, language list and low-delay example.
- [Realtime client events reference](https://developers.openai.com/api/reference/resources/realtime/client-events): effective configuration acknowledgment and conflicting delay restriction.
- [Realtime WebSocket guide](https://developers.openai.com/api/docs/guides/voice-websockets?voice-api=realtime): generic conversation-model URL and server authentication, without a dedicated transcription URL example.
- [Official transcription cookbook](https://developers.openai.com/cookbook/examples/speech_transcription_methods): older intent URL and transcription_session.update naming. Historical evidence, not proof of current GA compatibility.

The delay conflict is a candidate explanation, not an identified root cause. The diagnostic did not identify which parameter was rejected. Do not change the model, remove timing requirements, adopt the legacy protocol, retry a held record or claim a working fix from documentation alone.

## Response review, 13 October 2026

AI-assisted support says the transcription guide takes precedence over the conflicting delay description and repeats the conversation-model bootstrap followed by a transcription update. It characterizes the older intent query as legacy. It does not supply a demonstrated successful trace or the rejected parameter, and suggests another diagnostic retaining that parameter. This is an attributed support position, not independently verified provider compatibility or authorization for another call. The exact parameter remains unknown; no root cause or working correction is established.

No further support message, test, allowance or deployment was performed from this response. All consumed records and the $49 allocation remain unchanged. The next provider experiment, if proposed, must have a concrete diagnostic improvement and separately reviewed financial scope. Repeating the identical fixed-error run is not justified by this reply.

## Resent at Sabine's request, 13 October 2026

Sabine explicitly asked to resend the support request. Reopened the existing OpenAI Help conversation and submitted the same sanitized startup configuration, fixed observed error categories and three unresolved protocol questions. Asked for API technical support if available or an explicit statement of what cannot be confirmed. Verified the new message under You said with the composer cleared. No keys, account identifiers, audio, recordings or raw error messages were transmitted. Submission does not establish human escalation or a working correction. Private screenshot proof is retained outside the repository. No provider experiment, spending or deployment was started; the goal remains blocked pending a concrete dependency change.
