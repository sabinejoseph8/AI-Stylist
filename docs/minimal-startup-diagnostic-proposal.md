# Minimal transcription startup diagnostic

Status: prepared and tested in simulation only. No new spending or live activation is approved. This proposal does not change customer transcription settings or accept Task 1c.

## What changes

Use the existing server-only diagnostic boundary and bootstrap URL, wss://api.openai.com/v1/realtime?model=gpt-realtime-2.1. After session.created, send exactly one command:

```json
{
  "event_id": "notes_startup_diagnostic_v1",
  "type": "session.update",
  "session": {
    "type": "transcription",
    "audio": {
      "input": {
        "format": { "type": "audio/pcm", "rate": 24000 },
        "transcription": { "model": "gpt-live-transcribe" },
        "turn_detection": null
      }
    }
  }
}
```

Compared with the rejected request, this omits languages and delay. Both omissions are confined to the proposed diagnostic. The app's selected model, language requirements and latency targets remain. This is the minimal example supplied by support and shown in the [official transcription guide](https://developers.openai.com/api/docs/guides/realtime-transcription), checked 13 October 2026. The end-to-end bootstrap conversion remains live-unverified.

## What it can establish

- A matching transcription acknowledgment establishes acceptance of this one configuration on this connection. It does not validate microphone capture, extraction, timing, the full app configuration or final billing/deletion.
- Success would narrow the original investigation to the omitted optional-field bundle or differing conditions. It would not identify which optional field failed or rule out a transient difference.
- Rejection preserves only fixed error-code categories and known parameter names, plus whether param was missing, null, unrecognized or malformed. Unknown names and raw messages are never retained. Another result may still fail to identify the field.

## Proposed allowance and limits

Request $2 for one agent-operated local server diagnostic, raising the experiment allocation from $49 to $51. This is a conservative allowance, not actual charges or a provider-enforced billing ceiling. Use existing OpenAI and Supabase credentials and a new immutable reservation. Preserve all four existing held notes/startup records. No retries, automatic follow-up tests, new credentials, avatar, microphone, camera, audio append/commit, response generation, note extraction, upgrades or Render deployment. Provider connection is limited to ten seconds; separately bounded storage operations may extend total operator runtime. End and hold even on acceptance because remote finalization is not proven.

## Preparation and verification

The simulationProfile minimal option in notes-startup-diagnostic.ts is accepted only with simulation true. Existing live permits cannot select it. The activated runtime and reservation wrapper retain the existing payload. Eleven added tests prove the exact minimal payload, fixed diagnostic categories, one command, no media, timeout, cancellation, late event handling, single use and incompatible acknowledgment refusal. The complete prototype suite passes 1,699 tests across 118 files, type checking and build. No actual provider compatibility is claimed.

## After an explicit approval only

1. Record the exact financial/security authorization and bind a new operator-only minimal profile and immutable approval ID. Do not repurpose an old ID or convert held history.
2. Test the trusted activation and reservation path with mocks before connecting. Require exact scope/profile and reserve/reread before the opener. Retain the existing no-initializer/no-fallback behavior.
3. Verify the new ID is absent, initialize only its approved row with the existing append-only template, and verify all previous rows unchanged. Load existing secrets privately; never use command-line key values or public logs.
4. Run once, inspect fixed evidence, and verify the conservative held outcome. Any lost acknowledgment stays consumed with no retry. Do not mint a client secret or change transport.
5. Record results and implement only an evidence-supported correction. Any additional validation requires its own approval.

Sabine does not need to operate an iPhone for this server-only experiment.
