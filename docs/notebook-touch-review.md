# Connected notebook touch review

This is an optional local simulation review, not a paid voice test. Read the whole sequence before starting. Use http://127.0.0.1:4320/notebook.html on the computer while its local preview server is running. No account, microphone, camera, provider call, saved preference or real look is involved.

1. Expand **Review the prepared notebook connection**, then choose **Start connection rehearsal**. Wait for Ready.
2. Choose **Play first simulated turn**. Wait for Emerald green, To confirm, and Ready.
3. Choose **Edit** beside Color. Change the draft, then press Escape or Cancel. Emerald green must remain unchanged, and focus should return to its Edit button.
4. Choose **Confirm** beside Color. It should become Confirmed; keyboard focus should move to Edit.
5. Choose **Show multiple preference issues**. Three explanations should appear. Style should say Structured, To confirm; Budget should remain Not specified.
6. Choose **Edit** beside Style, enter Tailored, then **Save rehearsal note**. The old explanations must clear, and Tailored should become Confirmed only after the simulated server updates it. No look is approved.
7. Choose **Edit** beside Budget and enter 350. Save must remain disabled until you check the statement confirming a maximum for item prices only, with shipping and tax separate. Check it and save. The note should show USD 350 maximum (items only), Confirmed.
8. Edit another field and Cancel to retain its original value. Empty values may clear a non-budget note; it then becomes Not specified and needs clarification.
9. Choose **End rehearsal**. Notes and explanations must disappear. A new rehearsal must start with missing notes. Escape an open dialog before choosing End. Leaving or reloading the page also clears the temporary draft and notes.

The existing 85-second rehearsal limit can end a slow review. Restart the local rehearsal for remaining steps; it uses no paid allowance. This is not the avatar's private voice test.

Implementer checks passed cancellation/focus, budget meaning/save, style correction/clearing, confirmation/focus and end clearing. Sabine has not accepted these new steps. Automated checks cover stale drafts and connection loss; real iPhone touch and spoken screen-reader output remain pending.


## Stale draft and connection loss

Read all steps first. This local sequence starts no paid voice test.

1. Start a fresh connection rehearsal and choose Edit beside Color. Enter Red in the draft.
2. Choose Simulate newer note, then Save rehearsal note. Save must be refused; Red stays in the editor and a message says the draft was not sent.
3. Choose Load latest note. Blue should replace Red, and keyboard focus should return to the input. Nothing is sent by loading.
4. Enter another draft, then Escape or Cancel. The notebook must still show Blue, To confirm; the cancellation message should say the draft was discarded.
5. Open Color again. It must show Blue rather than the canceled draft. Enter an unsaved value and choose Simulate connection loss. The dialog, notes and draft must disappear. The status says the connection ended; keyboard focus returns to Start.
6. Start a new rehearsal. All notes must be Not specified and no earlier draft or explanation should reappear. End the rehearsal when finished.

Implementer browser checks passed the refusal, explicit reload, input focus, cancellation and disconnect cleanup. These controls exist only in the injected local rehearsal. They do not establish live provider recovery or customer restart persistence.


## Local timing diagnostics

Read first: this optional check measures scripted events, not real speech or the live performance target.

1. Start a clean connection rehearsal and play the first simulated turn.
2. Expand Local timing diagnostics below its notes. After display acknowledgment, Rendered should increase and a local p95 may appear. Total, failed, canceled, pending and overflow are shown separately.
3. Verify the panel explicitly says live timing acceptance is not verified. Do not use this number to accept the two-second live target.
4. End rehearsal. Both the notes and diagnostics must disappear.

Implementer browser verification passed one acknowledged sample and end clearing. Representative live timing and physical-device performance remain unverified.
