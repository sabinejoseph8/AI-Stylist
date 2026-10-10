# Tavus technical question: interruption and safe resume

Status: Draft prepared for Sabine's approval, 9 October 2026. Not sent.

## Proposed support message

Hello Tavus Support,

We are testing OpenAI-generated 24 kHz PCM audio sent to a Tavus Audio Echo PAL through Daily app messages. Tavus's microphone input is disabled. We have confirmed on an iPhone that a spoken interruption can stop playback and end the room. We now want to resume safely within a room after interruption.

Before enabling that flow, could you clarify:

1. Does conversation.interrupt discard every queued audio Echo chunk for the interrupted inference, including chunks sent before the interrupt but not yet rendered? Can late chunks with the same inference_id resume that canceled output?
2. Is there an acknowledgment or event correlated to inference_id or another request identity that guarantees the interrupted output queue is cleared? The documented conversation.stopped_speaking schema lists role, duration and interrupted. Please provide the exact event fields and ordering guarantees for Audio Echo, including legacy duplicate events.
3. Does that acknowledgment cover audio/video already buffered by Daily or the browser? How should a client establish that old audio cannot play when unmuting for a new inference? If no such guarantee exists, is replacing the room the supported safe option?
4. Is there an accurate client playback offset, correlated to inference_id, that can be used to truncate external OpenAI context? We will not treat generated/sent duration or a server speaking span as proof of what the customer heard.

We are requesting technical guidance only, without enabling recording, changing our plan or authorizing a purchase. Please link the current supported Audio Echo contract or sample code.

Thank you.

## Engineering checkpoint

The implementation currently holds recovery until local output is stopped, the old model context is verified closed, old renderer output is verified unable to resume, and a distinct verified model context is ready. Restoring only confirmed customer context remains a separate integration task. The prepared components are not connected to the hosted phone page. No tenth test or new budget is authorized. No account IDs, keys, test transcripts, uploaded screenshots or private usage telemetry are included in this draft.

Sources inspected:

- https://developers.openai.com/api/docs/guides/realtime-conversations
- https://docs.tavus.io/sections/event-schemas/conversation-started-stopped-speaking.md

The Tavus event schema does not establish the required queue-clear acknowledgment or client playback offset. This is a gap in the inspected documentation, not a claim that Tavus cannot support the flow.
