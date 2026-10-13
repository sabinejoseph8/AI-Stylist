# Private notebook follow-up review

Status: one $2 follow-up and protected activation explicitly approved by Sabine on 13 October 2026. Experiment allocation is $45; approval ID notes_private_20261013_02. Setup/readiness verification is in progress; no follow-up test has started.

## Evidence and limits

The original $2 notebook record is held after Safari closed before Ready. The first failure had no reservation; the second did. The first record must never be reset, refunded or reused. Exact later failure remains unknown. Existing experiment allocation is $43.

Current preparation passes 1,568 tests, type checking/build, 77 isolated SQL checks and four SQL-backed owner scenarios. Diagnostics emit only fixed bounded stage codes and coarse provider error categories. A real local HTTP rejection is classified without retaining its response. Read-only selected-model metadata succeeded; it does not verify the live socket endpoint. No new provider session or microphone test was started.

## Concrete proposed experiment

Sabine approved one additional $2 allowance, total experiment allocation $45. One user-started protected notebook connection, at most two turns and 85 seconds including setup. It may fail before Ready. No retries, avatar, camera, plan upgrade or model fallback. Voice/text reach OpenAI only if the user proceeds through the existing consent and microphone controls. Retention terms apply, and connection closure is not deletion or billing-finalization proof.

## Prepared activation sequence, after approval only

1. Record the separate human financial/private decision and a new unique approval ID.
2. Apply private-notes-approved-trials-preparation.sql in the existing project; verify RLS, role denial and service-only RPCs. Do not change the original singleton or avatar ledger.
3. Replace only the deliberately NULL ID in private-notes-approved-trial-approval.sql after approval. It refuses duplicate IDs and initializes a separate immutable row. Verify exact terms and no reservation; preserve the old held row.
4. Select PRIVATE_NOTES_TRIAL_STORE=approved and the new matching approval ID on the existing protected Free service. Preserve the existing password, keys and consent controls. No default store switch or fallback exists.
5. Deploy only reviewed source. Verify health, unauthorized denial, exact metadata availability and unreserved new row without opening a trial socket.
6. Give Sabine the entire seven-step script before she starts. She operates the microphone. Inspect fixed stage codes and durable outcome afterward. Hold uncertain outcomes; never retry automatically.

Rollback stops the selected mode and preserves every approval record. The new rollback SQL refuses any initialized record. Returning to the original store keeps its consumed state; it does not regain a trial.

References reviewed: https://developers.openai.com/api/docs/guides/realtime-transcription and https://developers.openai.com/api/docs/guides/voice-websockets. The model query is still a candidate combination of documented Realtime connection and selected transcription-model guidance, not an accepted live contract.
