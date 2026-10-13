# Local main-app clothing photos and camera

Status: local Tasks 4a/4b preparation explicitly approved and all ten local manual review steps accepted by Sabine on 13 October 2026. Full phase dependencies remain open. No customer deployment or paid calls are authorized.

## Prepared scope

- Select one to four JPEG, PNG or WebP photos. Limits: eight MB each, sixteen MB together, 8192 pixels per dimension and sixteen million pixels before/after decode. Headers are scanned within 64 KB; unsupported encodings fail clearly. HEIC is not supported.
- Normalize pixels in the browser, discard source metadata and scale to a maximum 1280-pixel edge. The app owns only normalized Blob URLs. Preparation has an eight-second deadline per image. No server upload, persistent browser storage or provider request occurs.
- Preview before confirmation. Describe one garment, including which garment in a multi-item image, then choose Owned or Inspiration explicitly. No recognition or product identity is inferred.
- Keep the existing confirmed reference while replacement photos load. A new selection does not replace it until confirmation. Removing/clearing/ending releases app-owned URLs; browser memory reclamation is not a secure-erasure guarantee and original files on the device are untouched.
- Enlarge the selected or confirmed photo in a native modal. Preserve the confirmed thumbnail in the collapsed notebook.
- Reuse the prototype camera lifecycle safeguards. Camera-only acquisition and a single explicitly captured still; no microphone, live stylist viewing, recording or frame stream upload. Stop after two minutes, leaving/hiding Stylist, Stop, Clear/End, expiry or page exit. Stopping preserves a confirmed still.

## Evidence and limitations

All 771 foundation tests across 102 files, type checking and build pass. Tests exercise local state, cleanup, input limits, bounded processing, late results, normalization and inherited camera/still ownership. Decoder/encoder timeout tests verify late bitmap release and zeroing the temporary canvas dimensions; native browser decoding itself is not a process isolation guarantee. The agent observed a labeled test image, explicit confirmation requirements and enlargement in the browser. A later automated file chooser stalled beyond the session lifetime; expiry was visible and media cleared, but this does not accept the multi-file flow or physical camera. The agent started neither a real device nor a paid service.

Sabine accepted the following complete local-computer human review. No repeat is pending. Recognition, hosted ownership/Storage, server upload isolation, permanent wardrobe saving, voice capture, physical target phones and complete accessibility/phase review remain open. Browser header checks and rasterization are not a replacement for the future server isolation boundary.

## Read all ten steps before starting

Open http://127.0.0.1:4322/ on this computer. Choose clothing-only photos you are comfortable using locally. No account, microphone or paid provider is needed.

1. Refresh, expand My Styling Notes and find Style around this item.
2. Choose a JPEG, PNG or WebP clothing photo. Confirm the actual preview appears without a confirmed reference. Enter a short garment description, choose Owned, then Confirm session reference.
3. Enlarge the confirmed reference, close it, collapse the notebook and confirm its thumbnail remains; reopen it.
4. Choose a different photo. The old confirmed reference must remain until you describe the new garment, choose Inspiration and confirm it.
5. Choose two photos together. Select the second, describe the intended garment and confirm its ownership.
6. Expand Show an item with my camera. Start local camera and allow camera access. Capture a still, Stop camera, then describe and confirm the still. No microphone is requested.
7. Restart the camera and show something different without capturing. Stop camera. The confirmed still should remain unchanged.
8. Start the camera again, visit Wardrobe and confirm the device indicator turns off. Return to Stylist; the reference should remain.
9. Clear session notes. All photos and the collapsed thumbnail should disappear, with the camera off.
10. Choose and confirm a photo again. End sample session, then Start new sample session; no photo should return. Refresh and confirm it is still empty.

Report whether all steps worked and were readable, or identify the failed/unclear step. Denied or unavailable camera access should offer photo selection while preserving the reference. This review does not grant server upload, recognition, wardrobe persistence or phone deployment approval.

## Format references

PNG header dimensions: [W3C PNG specification](https://www.w3.org/TR/png-3/#11IHDR). WebP RIFF layout and dimension fields: [Google WebP container specification](https://developers.google.com/speed/webp/docs/riff_container). These references support the header checks, not a claim that local decode is a complete production security boundary.

## Human review result

Sabine reported All ten steps worked and were readable on 13 October 2026. This supersedes the earlier pending multi-file/camera review and the automated file-picker limitation for that accepted local scope. Earlier limitations remain historical evidence. Actual hosted integration, target-phone behavior, recognition, voice capture, persistence and full phase acceptance remain open.

## Focused camera-collapse regression

A post-acceptance audit fixed a hidden-preview gap. Both notebook and camera-section collapse now stop camera ownership; reopening never auto-starts it. All 777 foundation tests, type checking and build pass. The original ten-step review stays accepted. This separate four-step human regression is pending; read every step before starting:

1. Refresh the local app, expand My Styling Notes and Show an item with my camera, then Start local camera.
2. Collapse Show an item with my camera and confirm the camera indicator turns off. Reopen it; the camera stays off and Capture a still is disabled.
3. Start camera again, then collapse the entire notebook. Confirm the device indicator turns off.
4. Reopen both sections and confirm the camera stays off until Start is clicked, then End sample session.

No photo upload, microphone or paid call is needed. The agent did not start a real device. This check does not grant target-phone/hosted acceptance or change saved references.
