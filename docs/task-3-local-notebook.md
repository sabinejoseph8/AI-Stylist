# Main-app notebook local review

Status: local preparation of Tasks 3a through 3c authorized and its complete eight-step visual review accepted by Sabine on 13 October 2026. Earlier phase acceptance, real speech, account persistence and Phase 3d remain open.

## Scope and evidence

The state model is local-only, requires simulation mode and explicit caller retention durations, and performs no network or storage operations. Seven shared fields retain status, origin, scope and revision. Updates reject stale epochs, field revisions and input ordering. Explicit Clear/End abort pending tickets; disconnect cancels jobs and reconnect changes epoch. Immutable snapshots and owner binding are application preparation, not verification of a real customer identity.

The controller/UI uses scripted sample fragments and explicit field text editing, not AI extraction or microphone capture. Confirmed sample preferences can be explicitly selected and kept in the current preview's memory. They are not a saved Supabase profile. Refresh or closing the page removes this memory. Navigation within the app preserves the active notebook.

Validation: all 672 foundation tests across 96 files, type checking and build pass. Browser checks observed progressive summary, seven fields, Save/Cancel/focus return, profile selection plus new sample, navigation preservation and cancellation during the sample timer. Initial issues with TypeScript settings and duplicate missing labels were corrected. Automated expiry checks use an injected clock; no real 30-minute idle or physical-phone accessibility claim is made.

## Read every step before starting

Open http://127.0.0.1:4322/ on this computer. Refresh once and use made-up details only. No sign-in or microphone is needed.

1. In Stylist, confirm My Styling Notes starts collapsed. Click Play sample conversation. Watch Outdoor wedding appear first, then November with season not specified. Both should be To confirm.
2. Expand the notebook. Confirm all seven fields are readable and absent fields say Not specified. Confirm Occasion; its label should change to Confirmed.
3. Choose Edit budget, type USD 350 maximum (items only), then Cancel. Budget should remain Not specified and focus should return to Edit budget. Reopen, type the same value, then Save. It should say Confirmed and Customer edit.
4. Edit budget to $500 and Save. It must remain To confirm. Click Preview spoken budget correction. The scripted correction should change it to the confirmed USD 350 maximum for item prices only. No microphone is used.
5. Switch to Wardrobe, then return to Stylist. Your notebook and its expansion choice should remain. Collapse and reopen it to confirm the same notes remain.
6. Select Budget under Sample profile preferences, then Save selected sample preferences. End sample session and confirm the notebook is empty. Start new sample session. Only the explicitly saved budget should return, with the notebook collapsed.
7. Click Play sample conversation and immediately Clear session notes. Wait a few seconds. No delayed sample notes should reappear. The separately saved sample budget is not deleted from sample profile memory.
8. Refresh. Confirm all sample notes/profile memory are gone, the notebook starts collapsed, and the real stylist remains unavailable.

Reply with whether every step worked and was readable, or which step failed. These steps review the local sample UI, not live speech or full phase acceptance.

## Remaining integration

Real partial transcription and extraction; verified customer session ownership; approved production expiry/reconnect policy; real profile persistence; representative input-to-notebook/correction timing; broader phone/assistive-technology checks; recommendation invalidation integration; formal phase review. No new paid test, hosted setting or deployment is authorized by this local exception.

## Human review result

Sabine confirmed all eight steps worked and were readable on 13 October 2026. This includes the ambiguous-budget status after pressing Save. No repeat review is pending. Full integration and phase acceptance remain open as listed above.

## Focused delayed-proposal regression

Agent browser review and automated tests verify that a budget correction made between the first and second sample fragment preserves that budget while November still arrives. Updated validation is 696 tests across 97 files, type checking and build. For a manual replay, read these steps first: (1) Refresh the local main app. (2) Click Play sample conversation and immediately Preview spoken budget correction. (3) After the second fragment, expand the notebook and confirm both November with no inferred season and the confirmed USD 350 budget remain. (4) Clear session notes and confirm both disappear. No microphone is used. This supplemental check has agent evidence only; the previously accepted eight-step review is not reopened.
