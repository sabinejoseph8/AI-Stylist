# Task 1c: Notebook prototype and review

Updated: 10 October 2026. Status: local prototype manual review passed; Task 1c remains in progress.

## Authorization and scope

Sabine explicitly approved starting Task 1c while Task 1b waits for Tavus's technical reply. This exception permits independent notebook preparation; it does not mark Task 1b complete, accept a media architecture, authorize another paid test or approve later groups.

The isolated notebook page follows the approved fashion journal design: ivory paper, a ruled notes layout and margin line, Georgia headings, printed interface text, green controls, collapsed initial state and one checked sample look at a time. It is not the customer app. No account saving, profile persistence, shopping, live extraction, connected avatar or actual recommendation agent is implemented.

## What is implemented

- Seven structured fields: occasion, season/date, color, style, budget, look type and owned wardrobe. Missing, tentative and confirmed states include text labels.
- A sample description emits clauses progressively before its simulated turn ends. November does not imply a season. An ambiguous “five hundred dollars” remains tentative until currency and maximum/item-price scope are explicitly confirmed.
- Touch edits use a modal with Save/Cancel, keyboard focus and return to the edit control. A simulated explicit voice correction changes the budget immediately; an older result cannot undo it. This is not real speech recognition.
- The collapsed notebook retains its current summary, pending-confirmation count and confirmed item thumbnail. Updates do not force expansion or move focus.
- JPEG, PNG and WebP selection with file-size/type bounds, decode checks and an explicit confirmation step. The actual selected image appears in the notebook with editable description and owned/inspiration choice. A replacement does not remove the old reference until confirmed. Object URLs are revoked on replacement, cancellation, clear or page exit. No photo is uploaded or saved to a wardrobe.
- Camera-only local preview, explicit Start, still capture/confirmation, Stop, page-hide cleanup, track-loss cleanup and a two-minute limit including permission wait. Late permission results are released. No microphone, live analysis or recording. Physical acceptance remains pending.
- A deterministic synthetic check keeps candidates hidden until the latest check passes. Conflicts, unknown required values, unsupported budget/date assumptions, timeouts, invalid results and stale approvals hold the look. Changing notes, reference or the synthetic saved-preference fixture invalidates old approval. This is not the future background AI validation agent.
- The look is an explicitly labeled garment illustration with fictional test costs and no shopping links. Real item matching is not connected, so adding an image or owned wardrobe requirement holds this sample rather than pretending it matches that item.
- Page Content Security Policy blocks network connections; microphone permission is disabled and camera is limited to the same origin. The existing preview password gate still covers the page when hosted. Local notes live only in page memory, not Supabase or the server. Reload/clear/page exit clears them. Server/session recovery integration remains future work.

## Automated evidence

265 tests across 27 files, TypeScript checking and Vite build pass after the final fixes. The cumulative suite includes 29 new focused assertions for notebook state, fixture validation, local camera ownership and page security headers. Tests make no real provider calls.

Covered: progressive synthetic clauses; uncertainty; touch/voice correction ordering; cleared-session events; independent snapshots; immutable check versions; conflict, timeout, invalid and old results; reference invalidation; unreasonable budgets; camera permission races and unexpected audio tracks; and network/microphone policies including a query-string URL.

The first check attempt was slow and returned a TypeScript compatibility error in the camera constructor. It was fixed to match erasableSyntaxOnly. A subsequent full run completed with all tests, type checking and build passing. No dependency or runtime changes were needed.

## Browser evidence

Observed on the computer preview: initial collapsed notebook, progressive sample completion, explicit missing/uncertain values, touch budget and look-type edits, focus return, hidden candidate while checking, release after a successful fixture check and immediate invalidation after correction. A synthetic local PNG was selected and confirmed; its actual thumbnail remained when the notebook collapsed. Reload cleared the reference and notes. A 390-pixel viewport showed no horizontal overflow and readable wrapped controls. This is responsive browser evidence, not physical iPhone acceptance or a screen-reader audit.

## Complete review instructions for Sabine

Read these before starting. No instructions from chat are needed during the review. All 18 steps are available at the top of the page under **Read full test instructions**, and also under **How to review this prototype** below the look area.

Open the computer-only preview at http://127.0.0.1:4320/notebook.html. It does not work on your iPhone yet and has not been deployed to Render.

### A. Notes and successful sample check

1. Reload the page to begin empty. The notebook should be collapsed.
2. Select **Play sample description**, then **Open notebook** while the sample is playing. Occasion, date, style, color and budget appear progressively. Look type and wardrobe stay **Not specified**. Date and budget show **To confirm**.
3. Confirm the date as **November; season not specified**. No season should be invented.
4. Edit Budget. Keep 500 or enter 350. Check the statement confirming a **USD maximum for item prices only**, then save. Shipping and tax are separate. No profile preference is saved.
5. Edit Look type to **Dress**, then save. Keep owned wardrobe blank for this sample.
6. Select **Check sample look**. During the check, no candidate should be shown. Afterward, one labeled synthetic sample should appear. Its USD 320 cost is fictional test data, not a shopping offer.

### B. Corrections, conflicts and old results

7. Select **Simulate “Actually, make it $350”**. The prior look should disappear immediately. The budget should become USD 350 maximum for items only.
8. Wait for the older $500 result. The status should say the $350 correction was kept. Collapse the notebook and confirm the summary retains the updated budget, then reopen it.
9. Turn on **Avoid emerald green** under Saved preference fixture. Check again. The sample should remain hidden with a conflict message. Turn the fixture off afterward.
10. Select **Timeout** in Simulated check, then check. The sample should stay hidden after timeout. Repeat with **Invalid result**. Return to Normal fixture check.
11. Start a normal check, then edit Budget to 100 before it finishes. Its old result must not release a look. A fresh check must hold the USD 320 fixture as over budget.

### C. Photos and local camera

12. Choose a clothing photo, edit its description, choose **Owned by me** or **Inspiration only**, then select **Use this item in my notebook**. The actual image should appear. Collapse the notebook: the item thumbnail and label stay visible.
13. Choose a different photo. Before confirming it, the first photo remains the active reference. Cancel the new photo and confirm that the original remains. Confirming a replacement should update the reference and invalidate any earlier look check.
14. Optional camera check: expand **Show an item with my camera**, select **Start local camera**, then allow camera access. Microphone stays off. Capture a still and confirm it as the reference.
15. Show another item on camera without capturing/confirming it. The notebook reference should stay unchanged. Select **Stop camera**. The confirmed still should remain. To test automatic cleanup, restart and leave it for two minutes, then confirm the camera turns off. Separately restart and switch tabs; the camera should stop. Camera denial should leave photo upload available.
16. A supplied item holds the sample look because real image matching is not connected. This is expected; the prototype must not invent an item match.

### D. Clear and accessibility review

17. Select **Clear this session**. Notes, reference, pending images and sample approval should disappear; any camera should stop. Reload also starts empty.
18. Use Tab and Enter to open/edit/save/cancel a note, expand/collapse the notebook and open/close a confirmed photo. Focus should be visible and return to the edit control. Check readable wrapping with larger text. Report any clipped text, unexpected focus movement or unclear labels.

Report what you liked about the notebook and any step that behaved differently. No real voice test or further spending is authorized by these instructions.

## Remaining Task 1c gates

Real partial speech extraction, real voice edits, notes appearing during an actual conversation, timing instrumentation and representative p95 measurements, production recommendation display/speech gating, image recognition, physical camera/reference acceptance and accessibility review remain pending. A synthetic clause timer does not prove A02's two-second target. Task 1c stays unchecked. Task 1b recovery still needs Tavus clarification and later separately approved test allowance.

## Instruction visibility correction, 10 October 2026

Sabine could not find the full instructions. The original on-page section contained only a seven-step summary, although it had been described as the complete guide. Replaced that summary with the complete 18-step guide and added a prominent expandable Read full test instructions control above the prototype notice. Both locations share one instruction component. Browser inspection verified all 18 numbered steps and four section headings, and the top guide is left open for Sabine. 265/265 tests, type checking and build pass. No provider call or deployment occurred.

## Sabine's manual review result, 10 October 2026

After receiving the complete 18-step guide in chat, Sabine reported: “finished, all steps worked.” The local notebook review is accepted on that basis, including the simulated note/edit flow, fixture validation controls, photo/reference and clearing/accessibility instructions. No failed step was reported. This is user-reported acceptance; device/browser and individual optional camera sub-checks were not separately identified. It does not establish physical iPhone acceptance, a complete accessibility audit, measured latency or live speech/image/validation integration.

The prototype review is complete. Remaining Task 1c integration gates stay open; no overall task-group checkbox is ticked. Latest code checks remain 265 passing tests, type checking and build; documentation-only update, with no paid test or deployment.
