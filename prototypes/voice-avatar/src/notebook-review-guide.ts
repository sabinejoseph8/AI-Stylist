export const REVIEW_SECTIONS = [
  {
    "title": "A. Notes and successful sample check",
    "start": 1,
    "steps": [
      "Reload the page to begin empty. The notebook should be collapsed.",
      "Select Play sample description, then Open notebook while the sample is playing. Occasion, date, style, color and budget appear progressively. Look type and wardrobe stay Not specified. Date and budget show To confirm.",
      "Confirm the date as November; season not specified. No season should be invented.",
      "Edit Budget. Keep 500 or enter 350. Check the statement confirming a USD maximum for item prices only, then save. Shipping and tax are separate. No profile preference is saved.",
      "Edit Look type to Dress, then save. Keep owned wardrobe blank for this sample.",
      "Select Check sample look. During the check, no candidate should be shown. Afterward, one labeled synthetic sample should appear. Its USD 320 cost is fictional test data, not a shopping offer."
    ]
  },
  {
    "title": "B. Corrections, conflicts and old results",
    "start": 7,
    "steps": [
      "Select Simulate “Actually, make it $350”. The prior look should disappear immediately. The budget should become USD 350 maximum for items only.",
      "Wait for the older $500 result. The status should say the $350 correction was kept. Collapse the notebook and confirm the summary retains the updated budget, then reopen it.",
      "Turn on Avoid emerald green under Saved preference fixture. Check again. The sample should remain hidden with a conflict message. Turn the fixture off afterward.",
      "Select Timeout in Simulated check, then check. The sample should stay hidden after timeout. Repeat with Invalid result. Return to Normal fixture check.",
      "Start a normal check, then edit Budget to 100 before it finishes. Its old result must not release a look. A fresh check must hold the USD 320 fixture as over budget."
    ]
  },
  {
    "title": "C. Photos and local camera",
    "start": 12,
    "steps": [
      "Choose a clothing photo, edit its description, choose Owned by me or Inspiration only, then select Use this item in my notebook. The actual image should appear. Collapse the notebook: the item thumbnail and label stay visible.",
      "Choose a different photo. Before confirming it, the first photo remains the active reference. Cancel the new photo and confirm that the original remains. Confirming a replacement should update the reference and invalidate any earlier look check.",
      "Optional camera check: expand Show an item with my camera, select Start local camera, then allow camera access. Microphone stays off. Capture a still and confirm it as the reference.",
      "Show another item on camera without capturing/confirming it. The notebook reference should stay unchanged. Select Stop camera. The confirmed still should remain. To test automatic cleanup, restart and leave it for two minutes, then confirm the camera turns off. Separately restart and switch tabs; the camera should stop. Camera denial should leave photo upload available.",
      "A supplied item holds the sample look because real image matching is not connected. This is expected; the prototype must not invent an item match."
    ]
  },
  {
    "title": "D. Clear and accessibility review",
    "start": 17,
    "steps": [
      "Select Clear this session. Notes, reference, pending images and sample approval should disappear; any camera should stop. Reload also starts empty.",
      "Use Tab and Enter to open/edit/save/cancel a note, expand/collapse the notebook and open/close a confirmed photo. Focus should be visible and return to the edit control. Check readable wrapping with larger text. Report any clipped text, unexpected focus movement or unclear labels."
    ]
  }
] as const;
