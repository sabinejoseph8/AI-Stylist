# Task 1b: Voice and avatar evidence

Updated: 9 October 2026  
Status: Approved and in progress. Scripted desktop provider connection observed; natural conversation and real-device acceptance remain pending.  
Authorization: Sabine said "proceed with 1b." This starts the isolated voice/avatar task, not Task 1c or the full app.

## Scripted provider test, 9 October 2026

The separate /scripted.html probe generated a fixed sentence with OpenAI Realtime gpt-realtime-2.1, voice marin, then closed that WebSocket and sent buffered PCM16 audio at 24 kHz to Tavus Audio Echo using the stock Anna - Casual face. Read-only inspection of the built-in pipecat0 PAL confirmed Echo mode, microphone disabled, empty/non-dynamic greetings and no TTS, LLM or STT layer. No PAL was changed. No ElevenLabs integration or text Echo fallback was used.

Two private provider rooms were created. Each required a meeting token, allowed two participants, disabled recording/automatic recording and had a 90-second provider limit. The server imposed an 85-second limit and ended rooms on heartbeat loss. Browser microphone/camera inputs remained disabled. Credentials stayed server-side; temporary room access was delivered only to the local browser and never displayed.

| Attempt | OpenAI usage | Transport and manual result | Closure |
| --- | --- | --- | --- |
| First | 39 input tokens, 171 output tokens | 335 paced chunks per playback. Avatar visible; Sabine requested a repeat, so sound/mouth behavior was not accepted on this attempt. | Tavus ended the room, but the client mistakenly parsed its empty success body as JSON. Independent GET confirmed ended before the reservation was reconciled. |
| Repeat requested by Sabine | 39 input tokens, 172 output tokens | 338 paced chunks; last chunk marked done. Sabine confirmed: “Yes, I heard it and saw her mouth move.” | Browser output stopped, and the corrected service verified provider status ended. |

This supports a scripted desktop voice-to-avatar connection. It does not establish lip-sync accuracy, natural conversational latency, continuous streaming, barge-in/resume or physical-phone quality. The event panel showed join events, not a correlated speaking/playback acknowledgment; exact customer-heard position remains unproven. The corrected observer accepts the documented dotted speaking event names.

Each attempt conservatively reserves $2 and five avatar minutes in an owner-only, ignored ledger. Both reservations are closed and retained: $4 and ten minutes reserved total. These are safeguards, not actual charges or consumed minutes. No additional hosting was purchased. Current billed usage and dashboard reporting delay still require reconciliation before further spend. Missing/corrupt ledgers and unresolved room creation/cleanup block another attempt; never reset the ledger to bypass the cap.

The empty-response cleanup bug is fixed and covered by four HTTP regression tests. The focused suite now passes 68/68, with type checking and the React build passing. Mocked tests make no provider calls. Tests cover ledger caps/serialization, payload framing/pacing/cancellation, PAL policy, lifecycle races and cleanup failure. Interrupt and end stops local output and closes the room; natural interruption inside an ongoing conversation is still pending. Task 1b stays unchecked, R01/R07/R09/R10/R11 stay open, and Task 1c has not started.

### Next verification

1. Reconcile actual Tavus minutes and OpenAI usage against the retained reservations.
2. Complete endpoint/account retention, training/deletion and real-person consent preflight before enabling any microphone or camera.
3. Extend the approved candidate within Task 1b to test continuous conversation, stale audio cancellation and safe context reset when exact playback position is unavailable. Review findings with Sabine before changing architecture.
4. Prepare an authenticated HTTPS phone test, then verify voice, mouth timing, repeated interruptions and disconnect behavior on a physical phone. No phone-accessible deployment exists yet.

## Earlier implementation and preflight history

The runnable experiment is in prototypes/voice-avatar/. React + TypeScript renders the private test page; a Node.js + TypeScript service owns the simulated response state. The page uses the approved canvas, notebook paper, ink, green controls and book-style headings. It labels its silent frames and captions as simulated and leaves live connection disabled. The notebook-style experiment panel records connection counters, not customer styling preferences.

At the initial simulation stage, the code did not call OpenAI, Tavus, Daily, Supabase or Render. It does not request a microphone or camera. At initial implementation, API keys were not configured. Sabine has now saved Tavus and OpenAI keys privately and read-only authentication checks passed; the application itself still has no provider execution path. No paid media call, room, deployment or customer session was created. Task 1b stays unchecked until the actual media path and relevant manual checks pass.

## Automated and local browser evidence

| Check | Expected | Observed |
| --- | --- | --- |
| P1-01, synthetic interruption | Cancel both adapter paths; clear queue; reject old audio and playback acknowledgments | Passed in automated fixtures. Actual network stop and audible interruption remain untested. |
| P1-07, provider policy | Reject excluded/unknown direct voice, fallback and unverified TTS bypass | Passed in synthetic fixtures. Actual Tavus account configuration remains uninspected. |
| Supporting audio/state checks | Reject malformed/oversized audio, invalid playback positions, overflow and unsuccessful generation; separate generation from playback completion | Passed in automated fixtures. |
| Local HTTP boundary | Local host/origin/token checks; no provider execution; no microphone/camera permission; no caching | Passed in automated endpoint tests. This is not production auth or a security audit. |
| npm run test:phase-1 | All currently implemented 1b checks pass | 43/43 passed. P1-02 through P1-06 are not implemented; 1c is not started. |
| npm run typecheck | No TypeScript errors | Passed. |
| npm run build | Static React build succeeds | Passed. |
| Desktop in-app browser | Page loads through local server; Start, Interrupt and delayed-event controls work | Observed Stopped at 18 silent frames. A delayed event increased ignored events from 0 to 2 while sent frames remained 18. |
| Direct file opening | Application requires a server | Opening index.html as a file was insufficient. Opened http://127.0.0.1:4318 successfully instead. |
| Physical phone, real avatar, real voice | Natural voice, consistent female avatar, lip sync and interruption | Pending. No quality, latency, p95 or realism result is claimed. |
| Restart message in browser | New server instance resets synthetic state and displays loss notice | Passed in the desktop in-app browser after restarting the saved prototype server. The loss notice appeared and counters reset to zero. This is synthetic demo state only; notebook/Supabase recovery is not implemented. |

An initial host-header test failed because the test client's Fetch implementation normalized Host. The test now uses a raw local HTTP request to exercise the actual server restriction; the final check passes. Type-checking also caught a command-payload typing error, corrected before the final checks. Neither is a confirmed customer-app defect.

## Dependencies pinned for this experiment

Node runtime observed: 24.19.0 in the bundled runtime; command-line environment also provides Node 24. React/react-dom 19.3.0; Vite 8.3.4; TypeScript 7.0.2; Vitest 5.0.3; @types/node 24.19.1; @types/react and @types/react-dom 19.3.0. package-lock.json pins transitive dependencies. Installed from the package registry with lifecycle scripts disabled. These are implementation choices for the isolated spike, not a newly approved production architecture.

## Current provider contract findings

OpenAI's Realtime WebSocket guide still documents the /v1/realtime connection. Its general voice pages also cover GPT-Live, which has different session events. Keep the Realtime candidate separate; do not combine the protocols. Server credentials must stay off the browser. [OpenAI Realtime WebSockets](https://developers.openai.com/api/docs/guides/realtime-websocket)

Realtime audio generation and actual playback are different events. With external playback, interruption needs cancellation plus context truncation at the audio the customer actually heard. The local harness holds unknown positions rather than deriving them from bytes generated. The actual Tavus transport must supply suitable evidence, or the experiment must reset the provider context and report the limitation. [Realtime conversation interruption](https://developers.openai.com/api/docs/guides/realtime-conversations)

Tavus's current Echo guide uses an Echo PAL and a face. Audio Echo bypasses its voice-generation layers; text Echo uses its TTS layer and is not accepted by this experiment's policy. Its sample supplies audio, sample rate, inference ID and done properties. This establishes a candidate shape, not a proven connection, encoding guarantee or account entitlement. Current create-conversation documentation uses face_id and pal_id rather than the earlier replica/persona terminology. [Tavus Echo mode](https://docs.tavus.io/sections/conversational-video-interface/echo-mode), [Create conversation](https://docs.tavus.io/api-reference/conversations/create-conversation)

Tavus documents private rooms using require_auth with a returned meeting token. Speaking notifications include PAL/user roles and legacy replica duplicates; stopped-speaking duration is a provider speaking span and is not yet proven to be exact customer-heard audio. Correlation, deduplication and playback position remain integration checks. [Private conversation contract](https://docs.tavus.io/api-reference/conversations/create-conversation), [Speaking events](https://docs.tavus.io/sections/event-schemas/conversation-started-stopped-speaking)

## Tavus dashboard inspection, 9 October 2026

Sabine created an account and reached the developer dashboard. The authenticated Billing page showed Free with 0 / 20 CVI minutes used, stock-face access and API access. This is a snapshot of the displayed allowance, not a guarantee of future entitlement, Echo compatibility or zero charges for other services. No upgrade or payment action was taken.

The manual PAL builder exposes a face-default voice, a Tavus language model and automatic speech-to-text. Those defaults are not accepted as evidence that the required OpenAI Audio Echo path or excluded-provider policy passes. The inspected Advanced Settings did not expose an Echo pipeline selector. API configuration and exact account capabilities still need verification; no PAL configuration was saved and no call was started by these steps.

The API Keys page showed no existing keys and controls to create the first key. Sabine must create the credential and store it privately; no key value belongs in this document, GitHub, a screenshot or chat. Provider retention/training/deletion settings and the actual voice/fallback path remain unverified.

## Saved credential and read-only API checks, 9 October 2026

Sabine created and saved the Tavus key in the prototype's local .env file. Presence, a single key entry and owner-only permissions were checked without printing its value. Existing .gitignore rules exclude that file. No secret was copied into project memory, chat, browser code or GitHub.

Authenticated GET requests to /v2/faces and /v2/pals returned HTTP 200. The stock-face listing includes completed Phoenix 4.5 faces, including Anna - Casual. Listing a face does not yet prove that creating a conversation with it is allowed on the Free plan. Read-only GET checks of pipecat0 and pipecat-stream also returned HTTP 200. Both report Echo mode and empty/non-dynamic greetings; pipecat0 returned no TTS layer, while pipecat-stream returned a Cartesia TTS configuration. The audio-only bridge, microphone transport mode and voice/fallback compliance still need runtime verification before acceptance. No existing PAL was changed and no conversation was started.

Both provider keys are saved privately. OpenAI dashboard access, billing, optional sharing and read-only model listing have been inspected as recorded below. Remaining media preflight is pending. Provider privacy and application media cost controls remain open. These checks confirm provider account access, not completed Task 1b or successful lip synchronization.

## OpenAI dashboard and spending controls, 9 October 2026

The authenticated billing page showed a $5.00 API credit balance and Auto-reload OFF. No funds were added, payment method changed or subscription purchased. A separate AI Stylist Prototype project was created and verified in the project list, with Global residency and Standard Retention. No other project settings were changed.

The new project Limits page now shows $0.00 / $8.00 and Limit enforced, using the already approved $8 OpenAI stop threshold within the $10 allocation. The page also shows an alert at 100% ($8). This is a monthly project limit, not the durable lifetime experiment ledger. Enforcement can lag and permit a small overage. The prototype still requires its own usage reservation, total experiment cap, bounded sessions and cleanup before billed media calls. The existing credit balance is not a reason to add funds automatically. [OpenAI spend limits](https://developers.openai.com/api/docs/guides/spend-limits)

Sabine created the project key herself and saved it in the owner-only local .env file. The prepared creation form selected the AI Stylist Prototype project, 30-day expiry, List models Read and Realtime Request, leaving other model endpoints at None. Credential issuance, applied expiry and scope were not independently inspected after creation to avoid exposing the key. An authenticated GET to https://api.openai.com/v1/models returned HTTP 200. The list includes gpt-realtime-2.1 and gpt-realtime-2.1-mini. This proves model listing and credential authentication, not successful audio generation, exact applied scope or a completed voice bridge. The read-only check did not create a model response. [OpenAI model listing](https://developers.openai.com/api/reference/resources/models/methods/list)

The authenticated OpenAI Data controls Sharing page showed Disabled for feedback sharing, evaluation/fine-tuning sharing, and sharing API inputs/outputs. API call logging was Enabled per call. No privacy settings were changed. The project list showed Standard Retention; remaining abuse-monitoring retention still applies and must be explained before real-person media. Do not opt into free-token sharing to fund this experiment.

Further read-only Tavus pipecat0 inspection confirmed layers.transport.input_settings.microphone is disabled and enable_transcription is false. The recording mode was not established by the inspected safe-value check. These partial checks do not prove runtime TTS bypass or total provider retention.

The current official Tavus schema documents explicit recording and automatic-recording flags, bounded maximum call duration and participant timeout controls. The Echo schema requires done=false for streaming chunks and done=true at the last chunk, before waiting for playback completion. The initial synthetic harness returned its final Echo marker in finishPlayback. This ordering was corrected: a successful generation sends completion once its queued audio drains, while actual playback completion remains a separate transition. Three focused regression checks cover generation finishing after send, queue-drain ordering, and interruption after sending completion. These were synthetic checks; the later scripted desktop result is recorded above, while exact playback acknowledgment remains unverified. Daily sendAppMessage has a 4 KB JSON payload limit; validated framing and pacing remain required. [Tavus API contract](https://docs.tavus.io/openapi.yaml), [Daily app-message contract](https://docs.daily.co/reference/daily-js/instance-methods/send-app-message)


## Original preflight checklist, with remaining real-person gates

Account creation/sign-in and the displayed free allowance have now been inspected. The checklist below records the original broader gate. The scripted synthetic probe findings above supersede earlier no-call statements; unchecked items include remaining continuous-conversation and real-person checks. Partial inspection does not close the full gate.

- [ ] Sabine signs in to the Tavus developer account. Inspect available Echo PAL/face access, a licensed stock female face, supported audio format, plan allowance and API access. Resolve current account naming/capability against official contracts before implementing a live adapter.
- [ ] Inspect actual selected voice and fallback settings. Confirm OpenAI supplies the only audible voice; Tavus Audio Echo bypasses TTS. Hold unknown, excluded or automatically assigned providers. No ElevenLabs SDK/API/service or fallback.
- [ ] Inspect actual OpenAI API project access and choose an explicit available Realtime model/voice within the existing cap. A ChatGPT subscription does not by itself establish API access. Configure keys privately on the server, not in chat or browser.
- [ ] Verify Tavus/Daily recording, transcript, retention, training, deletion and transport settings; verify OpenAI data controls and remaining abuse-monitoring retention. Do not equate recording-off with no retention. Record an evidence reference without account emails, keys or tokens in public files.
- [ ] Explain remaining provider data handling and obtain real-person test consent before Sabine's microphone/camera is used. Use permitted synthetic fixtures first. This task does not activate camera capture.
- [ ] Check actual free Tavus entitlement and total charges. Enforce at most 20 connected avatar minutes, including failed joins and retries, within the approved $25 total: $10 OpenAI, $7 hosting, $8 reserve. Use the planned $8 OpenAI stop threshold and check in-flight billing. No auto-refill, subscription upgrade or expanded trial.
- [ ] Implement private-room creation, short-lived token handling, bounded call duration, explicit room end/cleanup, OpenAI connection cleanup and a durable experiment-usage record before billed calls. Implemented for the separate scripted probe as recorded above; continuous-conversation enforcement remains to verify.
- [ ] Implement and verify Daily transport chunk limits, 24 kHz PCM encoding, pacing/backpressure, echo output routing, one audible output and captions. Verify trusted event identity and old-generation rejection across the real browser/service boundary.
- [ ] Verify exact customer playback position or a safe reset path; stop both sides on interruption/disconnect and prevent queued speech or stale acknowledgments from restarting. Do not call a simulated stop a successful live interruption.

## Manual live check, after the preflight

1. Start one private synthetic-media call. Verify selected voice and face remain consistent, only one voice is audible, captions match, and lip sync is credible. Record provider configuration references and observed behavior.
2. After consent/preflight, repeat on Sabine's phone. Speak over the stylist, interrupt repeatedly, and confirm the old response does not resume. Record measured timing and quality observations, including failures.
3. End and disconnect; verify both paid connections close and usage remains within the cap. Record consumed minutes and cost evidence without secrets.
4. Compare the observations with the agreed product requirements. Keep R01/R10/R11 open until supported by actual evidence. If the bridge fails, show the findings to Sabine before changing the media architecture.

The local preview uses HTTP loopback and is not a phone-accessible deployment. A private HTTPS phone test route and account protection still need preparation before Step 2. Production hosting remains Supabase + Render. Git checkout/publishing and the Memory site remain unestablished; no remote update is claimed.

## Focused regression verification, 9 October 2026

After the completion-order correction, 43/43 focused synthetic checks, TypeScript checking and the React build passed. Initial re-runs found that copied node_modules launchers resolved to the wrong paths in the saved folder. Reinstalling the exact package-lock versions with npm ci and lifecycle scripts disabled repaired those launchers; no package versions changed. No real media session or provider response was generated by these checks.

Dependency additions for the scripted probe: @daily-co/daily-js 0.93.0, ws 8.22.0 and @types/ws 8.18.2, pinned in package-lock.json and installed from the official package registry with lifecycle scripts disabled. New modules: experiment-budget.ts, scripted-providers.ts, scripted-service.ts, echo-stream.ts and scripted.tsx. The default simulation and locked /api/live route remain separate from explicit --scripted mode.

## Usage follow-up after the repeat

The authenticated Tavus Billing page showed Free and 1.9 / 20 CVI minutes used after the two scripted attempts. This is the displayed account usage snapshot, not a finalized invoice or a replacement for the conservative ledger. The ledger retains two closed reservations totaling $4 and ten minutes. No upgrade/payment change or new media call occurred during this read-only check. OpenAI actual billing reconciliation and remaining provider privacy preflight are still pending.

## Completed usage/settings inspection

See [Usage and privacy review](task-1b-privacy-review.md): Tavus displayed 1.9/20 free minutes, OpenAI displayed $0.02 across two prototype requests, $4.98 prepaid credit with auto-reload off, and the $8 project cap enforced. Optional OpenAI sharing remains disabled; Standard Retention still applies. Both rooms are ended. Tavus API-specific retention, training/improvement use, deletion coverage and processors remain unresolved; microphone/camera stay off under the agreed preflight. A support question is drafted but not sent. No new provider call or settings change occurred.

### Tavus support follow-up

After Sabine explicitly approved sending the prepared privacy questions, the authenticated contact form was submitted. It closed after Sending with no displayed error; no ticket number or explicit delivery receipt was shown. Written clarification is still pending. See [submitted question and evidence](task-1b-tavus-privacy-question.md). No new media call or settings change occurred.

## Local camera and microphone check, 9 October 2026

Sabine asked to turn on microphone and camera while Tavus's reply is pending, said she was okay with the unresolved provider practices, then approved the proposed local preview and microphone check. This supersedes waiting for Tavus as a blanket restriction on this private experiment. Provider privacy findings remain open and this is not approval for customer launch or proof of privacy compliance.

Implemented a separate devices.html page with a muted local camera preview, microphone level meter and explicit start/stop controls. No recorder, storage, media upload or provider connection is present. Its CSP blocks network connections; the microphone/camera permission is allowed only for this page's own origin. The avatar and simulation pages still disable input devices. Tracks stop on Stop, tab hiding, leaving, device loss or the two-minute active-check limit. Canceled permission requests discard late grants. No new provider call or experiment reservation was made.

Verification: 76/76 focused tests pass, including seven device ownership/race checks and an isolated-page policy check; type checking and production build pass. Browser opened the page and requested access, showing Waiting for permission without console errors. Actual camera image and microphone movement are not verified yet. Sabine must allow the browser prompt to complete that check. Natural voice conversation is still unimplemented; this local check does not connect human media to the stylist. Task 1b remains unchecked.

Manual checks: Allow both devices, confirm the camera image, speak and confirm the meter responds, press Stop and confirm the device indicators turn off. Restart the check and switch tabs to verify capture stops; verify automatic stop after two minutes. These hardware checks remain pending.

### Device-check follow-up

After Sabine reported completing permission and asked to continue, the browser displayed "Two-minute check finished. Camera and microphone are off." In this implementation that state follows successful device acquisition, audio-context startup and camera playback, then the active-check deadline. This supports browser startup and automatic-stop behavior. It does not establish that Sabine saw a correct camera image, that microphone levels responded to her speech, or that physical indicators stopped. Restart requested for those manual observations; browser initially showed Waiting for permission again. No provider call was started.

### Local device acceptance

Sabine answered Yes when asked whether she could see herself and see the microphone meter move while speaking. Browser status was On, with a nonzero microphone level. Pressed Stop and verified the page reported both devices Off, zero microphone level, no camera preview and a disabled Stop control. The earlier automatic two-minute stop was also observed. This accepts the local camera preview and microphone meter only. Physical hardware indicators, tab-hide cleanup and phone checks are not independently verified. No human media was sent to Tavus or OpenAI. Task 1b remains in progress because natural conversation and real interruption/resume are not implemented or accepted.

## Tavus response received through Sabine

Sabine supplied the support answer on 9 October 2026. See task-1b-privacy-review.md for the sanitized summary. Support states both scripted calls were unrecorded, but self-serve training has no opt-out and retention/deletion coverage remains limited. Private-test authorization stands; customer-launch R07 remains open. Task 1b remains unchecked, with natural conversation, interruption/resume and phone checks outstanding. No new media call occurred.

## Buffered spoken-input prototype, 9 October 2026

Sabine said Continue after reviewing Tavus's support answer. Continued approved Task 1b with a separate spoken.html probe: microphone input to OpenAI Realtime, generated reply PCM to Tavus Audio Echo and Daily, with the same stock face, explicit OpenAI voice and excluded-provider policy. This is a two-exchange buffered prototype, not continuous streaming or automatic barge-in. Human camera remains off in this probe; the accepted local device-check page remains available separately. No production architecture baseline was changed.

### Behavior and boundaries

- Start prepares a private recording-disabled, two-participant room using the existing durable reservation ledger. There is no generated fixed greeting in spoken mode.
- Talk acquires only microphone audio. An AudioWorklet emits bounded mono samples, capped independently of browser timers at twelve seconds. Send or that limit stops capture, converts/resamples to 24 kHz PCM16 and submits one owner-authorized request to the local server. End before Send discards capture.
- OpenAI generates at most 1024 output tokens and twenty-five seconds of reply audio per turn. The response is buffered before its PCM chunks are paced to Audio Echo. Input is capped at twelve seconds per turn and two exchanges per room. Camera video is never attached to Daily or OpenAI.
- Context is explicit and volatile: an earlier assistant transcript is reused only after Sabine selects I heard the whole reply. Generation completion and renderer events are not taken as evidence of customer playback. The second exchange includes only the confirmed first exchange. There is no live preference extraction, product recommendation, saved profile or customer account implementation.
- Interrupt and end mutes output, stops microphone tracks, invalidates client work, aborts OpenAI generation, clears history and closes the room. This ends the conversation rather than guessing a truncation position or resuming mid-reply. Stale session identifiers and pending/duplicate confirmations are rejected. No retry or replacement room starts automatically.
- Tab hiding, page exit, server connection failure, room duration or missing heartbeat end the test. Provider closure must still be verified before the durable reservation closes; failed cleanup holds further tests. The shared ledger prevents scripted and spoken rooms from spending in parallel. Provider records are not erased by End.
- The page explains OpenAI input, Tavus/Daily reply audio, the self-serve training finding, provider retention, buffered behavior and experiment limits before Start. The app writes no human media, transcript or history file. No raw microphone stream is sent to Tavus; generated replies may reflect spoken information.

### Verification actually completed

112/112 focused automated tests pass, plus TypeScript checking and the production build. All new tests use synthetic samples or mocked providers; none makes a paid provider call. Coverage includes input bounds, PCM conversion, worklet cap/flush, output identities and deduplication, cancellation, context confirmation, two-turn cap, stale session actions, cleanup failures, HTTP owner/origin/field/body boundaries and the existing durable budget checks.

Fixed a build issue before manual testing: Vite would inline the small worklet as a data URL, conflicting with the page's strict script policy. Asset inlining is disabled and the built worklet is a separate same-origin file. Existing playback replacement now interrupts the previous renderer queue first. Repeated participant updates do not reattach unchanged media tracks.

The spoken page loads in the browser with Start enabled, microphone off and no observed console errors. It is open for Sabine's manual test. No spoken provider room has been created, no human voice submitted and no new reservation consumed. Ledger inspection still shows two closed attempts, $4 and ten minutes conservatively reserved. These are reservations rather than bills. The live API request, microphone worklet in this actual browser, relevant avatar answer, confirmed follow-up and real interruption closure remain unverified. Task 1b stays unchecked; natural continuous conversation and physical-phone acceptance remain open.

### Manual sequence, one step at a time

1. Select Start private voice test; wait for the stock avatar and Talk to become available. Do not start another attempt if it fails or holds without reviewing cleanup and the ledger.
2. Select Talk, allow microphone access if asked, speak briefly about an event, then select Send. Camera stays off.
3. Check that the avatar answers what was said, with audible voice and visible mouth movement. Note any long pause or sound issue. After the whole reply finishes, select I heard the whole reply.
4. Use Talk and Send for one follow-up, verify the confirmed prior exchange is understood, then confirm the second reply. The test ends after two exchanges.
5. In a separately budgeted attempt only if needed, use Interrupt and end during a reply and confirm immediate local stop plus verified provider cleanup. Do not infer interruption acceptance from stopping after a reply already finished.
6. Physical-phone, uninterrupted conversation and latency/lip-sync measurements remain separate pending checks. The local HTTP preview is not a phone deployment.

## Fixed-sentence test follow-up and allowance hold

Sabine reported selecting Play script. Browser inspection showed the earlier scripted page with 330 chunks sent, microphone/camera off and verified connection closure displayed. The durable ledger now has four closed reservations, none unclosed, totaling $8 and twenty conservatively reserved avatar minutes. The prior two-reservation status is historical; no reservation was reset or refunded. Two further reservations occurred after the prior inspection; their precise manual outcomes were not inferred from this message. No human spoken exchange has been accepted.

Added owner-only safe budget status and visible exhausted/cleanup messages to both test pages. Start is disabled when no attempts remain or ledger state is unavailable. Added a link from the fixed-sentence page to the spoken test to reduce navigation confusion. The spoken page is now open and visibly shows the attempt limit. 116/116 synthetic/mocked checks, type checking and build pass. No new provider call was made by this fix.

A read-only Tavus Billing inspection now shows Free, 2.9/20 CVI minutes used. This is actual displayed account usage, distinct from twenty minutes conservatively reserved. Current OpenAI usage review is in progress; do not describe $8 reserved as $8 billed or bypass the existing four-attempt guard. A concrete reviewed amendment is needed before another reserved test; no budget expansion or plan upgrade is approved here.

### Usage reconciliation after the attempt limit

Read-only dashboards now show Tavus Free 2.9/20 CVI minutes and OpenAI AI Stylist Prototype $0.03, three requests, for Last 7 days. Rounded dashboard figures can lag. The local ledger has four closed reservations, none unclosed, $8/twenty minutes reserved. Reservations and provider request counts need not match because failed preparation retains a reservation; the precise fourth-attempt outcome is not inferred. No new provider call, deletion, funding, plan upgrade or allowance change was performed. The spoken page is visibly held at the four-attempt guard. A proposed amendment is one additional spoken attempt capped at $2/five minutes from the existing experiment allocation, retaining all old records and requiring Sabine's approval before enabling it. This proposal is not approved.

## Approved additional spoken attempt

Sabine answered Yes to one additional spoken test capped at $2 and five minutes from the existing allowance. Applied one durable spoken-only extension; all four previous reservations remain byte-for-byte identical as serialized records. The fifth reservation is permitted only in spoken mode, a sixth is refused, and scripted mode retains its original four-attempt cap. No funding, plan upgrade or account spend-limit change was made. Failed attempts still retain their reservation and unresolved cleanup blocks use. Automated evidence: 119/119 focused tests, type checking and build pass. Actual spoken exchange acceptance remains pending.

## Spoken attempt follow-up, 9 October 2026

The fifth, specifically approved spoken attempt connected to the stock avatar, then stopped at Exchange 0 before a human spoken turn was observed. Read-only ledger inspection now shows five closed reservations, none unresolved, $10 and twenty-five minutes conservatively reserved. Closure is recorded only after the existing end-and-status verification. Reservations are not actual charges. Current dashboards show Tavus Free 3.2/20 CVI minutes and OpenAI AI Stylist Prototype $0.03 across three requests for Last 7 days; rounded figures may lag. The exact reason for the fifth stop was not captured and is not inferred.

The spoken test now explains the avatar location, Talk/Send steps, tab visibility requirement and automatic room limit before Start. It shows remaining room time while active. Future server automatic stops distinguish the approximately 85-second local cutoff from a lost heartbeat; leaving the tab shows an explicit local stop message. The 90-second provider limit, immediate stop on hidden tab, microphone privacy, retained reservations and sixth-attempt block are unchanged. No extra attempt, provider call, account funding or upgrade was performed during this follow-up.

120/120 synthetic/mocked tests, type checking and build pass. This includes separate heartbeat-loss and room-expiry checks with verified cleanup. Human spoken acceptance, interruption during a reply and physical-phone checks remain pending; Task 1b stays unchecked. A further attempt requires an explicit allowance amendment after this usage review.

## Approved reserve-funded spoken test, 9 October 2026

Sabine approved exactly one further spoken test capped at $2 and five avatar minutes, moving $2 from the $8 reserve to the OpenAI allocation. Overall initial budget stays $25: OpenAI allocation $12, hosting $7, reserve $6. This does not change account spend settings, fund an account or upgrade a plan. Actual OpenAI project stopping controls remain in place and may stop work before the allocation is spent.

Applied a separate durable reserve-transfer amendment only after all five previous attempts were closed. All five prior records remain unchanged. One sixth spoken attempt is available; scripted tests remain exhausted, a seventh attempt is refused and cleanup holds still block new use. No provider call or reservation was created by applying the amendment. The test must be started by Sabine when she is ready at the visible spoken page, to avoid consuming room time while she locates it.

124/124 synthetic/mocked checks, type checking and build pass, including preservation of earlier records, refusal of early/altered transfers, exclusion of scripted use and the seventh-attempt cap. Human spoken acceptance and Task 1b completion remain pending.

## Actual spoken test evidence, 9 October 2026

The sixth approved test reached Exchange 2 of 2. The notebook displayed a generated response acknowledging a structured look and asking which sleeve length the customer preferred. Sabine explicitly confirmed hearing the reply and seeing the avatar mouth move. This is actual private microphone-to-generated-reply/avatar evidence, not a synthetic test. It does not establish precise lip-sync timing, full conversation quality, phone acceptance or interruption during playback.

The browser then displayed: the test time limit was reached and provider connection closure was checked. The final spoken reply was not explicitly confirmed through the page button before expiry; verbal acceptance is recorded separately. No third exchange is available, and no seventh attempt is approved. Further guidance must not invite another spoken turn in this ended room. Local ledger inspection confirmed six reservations, all closed. Task 1b remains in progress pending remaining manual checks.

## iPhone preview preparation checkpoint

Sabine chose iPhone rather than iPad and signed into Render. Read-only dashboard inspection confirmed workspace access; no AI Stylist service was created and the existing unrelated service was not changed. The prototype remains localhost-only. Do not publish its current local owner-cookie mechanism: /api/status currently grants the local token to any visitor, so public hosting requires a separate private-access gate. Host/origin handling and port binding also require an explicit remote configuration while preserving the local defaults.

Render Free web-service files are ephemeral and persistent disks require a paid service, per https://render.com/docs/free and https://render.com/docs/disks, reviewed 9 October 2026. The existing spending ledger must not be recreated on deployment/restart. A proposed Supabase use is durable experiment reservations and cleanup state, with no human audio or conversation content. This optional use is not yet approved under the project instructions. No schema, credentials, deployment, provider call or additional test allowance has been created at this checkpoint.

## Approved durable prototype ledger preparation

Sabine explicitly approved Supabase for preserving the private prototype's spending/test-limit records across Render restarts. This approves that additional role only, not storing human audio or transcripts, starting another provider test, funding, plan upgrades or a public launch.

Prepared src/supabase-budget.ts as a server-only adapter and supabase/prototype-budget.sql as an unapplied migration. The adapter validates the existing ledger schema, allows only HTTPS Supabase project destinations, bounds request time, refuses redirects, sanitizes failures and makes no automatic retry, seed or local fallback. Writes compare the complete prior ledger under a database row lock. The migration enables RLS, revokes direct table access and limits function execution to the service role. Allowance changes through the hosted adapter are refused. Validation accepts JSON field reordering without relaxing approved amounts.

129/129 synthetic/mocked checks, type checking and build pass. These checks do not prove the SQL runs on Supabase or its live access policies. No Supabase project was selected, no migration applied, no ledger imported and no hosted adapter activated. The existing local server still uses its file ledger. The six closed reservations remain unchanged and no seventh test is approved. Remote private access, production origin/port configuration, durable ledger import/verification, restart/concurrency checks and deployment remain pending. Confirm the dedicated AI Stylist Supabase project before database actions.

Sources reviewed: https://supabase.com/docs/guides/database/functions and https://supabase.com/docs/guides/database/postgres/row-level-security.

## Supabase project-selection cost checkpoint

Sabine reported no AI Stylist project. Read-only inspection confirmed one unrelated project in the selected organization; the new-project form identifies the organization as Pro and shows an additional $10/month for a Micro project. No project name/password was entered and no project was created. This exceeds the approved $7 initial hosting allowance. The form offers creating a free organization for up to two free projects across organizations; eligibility and settings still require verification. Choosing a free prototype organization or approving a higher recurring cost requires Sabine's decision. Do not use the unrelated existing project or click paid creation.

## Approved new Supabase project cost

After being told that a new project in her Pro organization adds $10/month, Sabine explicitly said "Create it." This authorizes one AI Stylist project at that displayed recurring charge as a specific exception to the earlier $7 hosting allowance. It does not approve other hosting charges, plan upgrades or another provider attempt. Reconcile the total revised ongoing/experiment budget before any additional charges; do not keep claiming the original $25 ceiling covers all revised allocations.

Prepared the new-project form with name AI Stylist, Micro compute, Americas region, Data API enabled, automatic table exposure disabled and automatic RLS enabled. No project was submitted or created yet. Database password entry and final creation are handed to Sabine because they involve a new credential. Do not read, save, print or echo her database password in chat or project documents. The unrelated existing project remains unchanged.

## AI Stylist Supabase project and live storage verification

Sabine completed project creation herself. The dashboard verifies AI Stylist, Healthy, Micro, West US (Oregon), with no GitHub repository connected. The authorized prototype-budget migration was executed in this project through its SQL editor and returned Success. No other project was modified.

Live privilege checks returned true for RLS enabled, anonymous and authenticated direct-table access blocked, anonymous read-function access blocked, authenticated write-function access blocked, and service-role read/write-function access allowed. The table currently has zero ledger rows: all six existing private reservations still need import, and no reservation was reset or initialized remotely. This verifies schema/privileges only, not the REST adapter, concurrent updates or restart behavior. No provider room/test was started.

Next dependency is a server-only Supabase key saved privately, followed by importing and comparing the existing ledger, live adapter checks, a private remote-access gate and Render configuration. Never paste keys in chat or publish them to GitHub. The optional Supabase ledger role and one project at the displayed $10/month were approved; no seventh provider attempt or further charge is approved.

## Private server-key handoff completed

Sabine could not paste the copied key and explicitly authorized direct transfer into the private configuration file without displaying it. The existing Supabase server key was copied from AI Stylist's Secret keys control and saved to the ignored owner-only prototypes/voice-avatar/.env.supabase file. A private temporary transfer file was removed. No credential value is recorded in documentation or chat.

A bounded, redirect-refusing REST call with the saved key reached the authorized ledger read function and returned PostgreSQL P0002 (no row), consistent with the verified empty ledger table. This confirms authenticated reachability only; import and successful adapter reading are still pending. No ledger was seeded, attempt approved or media/provider call started. Do not confuse the expected missing-row response with a completed durable migration of the six prior reservations.

## Durable history import and private phone preview preparation

Imported the existing six closed reservations into the approved AI Stylist Supabase project using a one-time function that cannot overwrite its singleton row. Compared the full imported ledger with the private original using deep equality; all records and approval metadata match. A new adapter instance read the same state, and reserve('spoken') was rejected at the six-attempt cap before provider work. The import function's execution was then revoked from service_role as well as public/anon/authenticated; a live query returned six historical attempts, six closed attempts and importer_disabled=true. No seventh reservation or media/provider request was made.

Prepared a Render Free private-preview configuration, pinned Node 24.20.0, manual deploys, health check and explicit --preview --spoken startup. Preview mode requires a valid HTTPS onrender.com origin and a strong password, gates both pages and APIs with HTTP Basic access, issues a Secure HttpOnly SameSite owner cookie only after authentication, validates exact Host/Origin and limits failed password guesses with bounded memory. It uses Supabase for the existing ledger with no file fallback or automatic seeding. Local mode remains loopback-only. A detected server replacement stops local media and clears transient conversation context. This is private-prototype access, not the customer account system.

135/135 focused synthetic/mocked checks, type checking and build pass. Render/iPhone operation is unverified; deployment and phone permission/playback checks remain pending. Render-generated password format and nested root-directory settings were checked against https://render.com/docs/blueprint-spec and Node selection against https://render.com/docs/node-version. The GitHub repository was cloned read-only for preparation; the local primary folder is not a Git checkout and GitHub CLI is not authenticated. No code was pushed, Render service created, secret uploaded to Render or additional charge accepted. A GitHub publishing connection is the next dependency.

## GitHub publishing connection verified

Sabine completed GitHub permission review and password confirmation. GitHub CLI authentication succeeded for the repository owner. The prepared publication contains source, tests and project documents only; the credential scan found no private keys or test ledgers. Task 1b remains in progress, with no additional provider attempt or Render secret transfer approved by this connection.

Published the prepared source, tests and project documents to the existing public AI-Stylist repository after Sabine completed authorization. Private configuration, credentials, media and lifetime test ledgers were excluded. Render deployment and physical-phone acceptance remain pending; the six-attempt cap is unchanged.

## Render private configuration handoff

Sabine explicitly approved sending the existing OpenAI, Tavus and Supabase API keys to Render private server settings. Imported only those keys, the Supabase project URL and pinned Node version into the new-service form. The form targets the public AI-Stylist repository, main branch, prototypes/voice-avatar, Node, Oregon, Free ($0/month), manual deploys and /healthz. No service has been submitted yet. PREVIEW_PASSWORD is prepared with an empty value for Sabine to generate herself. Key values are masked and are not included in screenshots or project files. The six-attempt cap remains unchanged.

## Hosted preview evidence

Render Free deployment succeeded and is live. Unauthenticated spoken-page access returned 401 with a Basic authentication challenge; the health endpoint returned {ok:true}. No media/provider attempt was started. Authenticated browser and physical iPhone acceptance remain pending.
