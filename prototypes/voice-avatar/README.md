# Task 1b: Private voice and avatar experiment

## Current status, 9 October 2026

Task 1b is approved and in progress. The source is published to GitHub, and a password-protected Render Free preview uses Supabase for its durable test-limit ledger. The deployed phone page supports two bounded, buffered exchanges and spoken interrupt-and-end. Sabine confirmed a generated avatar reply with mouth movement and intentional spoken interruption on iPhone. Continuous conversation recovery and precise latency/lip-sync measurements are not accepted.

All nine approved provider attempts are consumed and verified closed. No further provider test is authorized. Do not reset the ledger, seed a replacement, use historical attempt counts below as current allowance, or start a paid test from old instructions. Reservation totals are not actual charges. Credentials and private records remain outside GitHub.

The latest local and published preparation includes incremental output, cancellation after audio delivery, confirmed-only conversation memory and guarded recovery. It is not deployed or enabled on the phone page. Live recovery requires Tavus's pending technical reply about verified renderer cleanup, transport integration and separately approved physical testing. No customer accounts, live styling notes, looks or shopping are built.


### Task 1c local notebook preview

Sabine approved independent notebook preparation while Task 1b waits. notebook.html provides simulated progressive notes, touch edits, a simulated budget correction, confirmed local image references and camera-only preview. It uses no microphone, provider calls, shopping or permanent saves. A synthetic look stays hidden until its current fixture check passes. Real speech extraction, recommendation validation and device acceptance remain pending.

The currently running computer-only review is http://127.0.0.1:4320/notebook.html. For a later fresh local run, the existing default server command serves notebook.html on port 4318; do not enable --spoken or --scripted for notebook review. Read the [complete Task 1c guide](../../docs/task-1c-notebook-prototype.md) before starting. This page has not been deployed to Render.

### Automated checks

From this prototype directory, with installed dependencies and Node 24:

```sh
npm run test:phase-1
npm run typecheck
npm run build
```

869 tests across 63 files, type checking and build pass. Tests use synthetic inputs and mocked providers. They do not prove real provider behavior or authorize additional spending.

See [current plan summary](../../docs/progress.md) and [Task 1b evidence](../../docs/task-1b-voice-avatar.md). The following notes retain earlier snapshots for context. Their status statements and allowance counts are historical, not current operating instructions.

# Historical implementation notes

Updated 9 October 2026. Status: scripted desktop provider connection observed; natural conversation and phone acceptance pending.

This isolated React/TypeScript and Node/TypeScript prototype has two modes. The default page at / is a silent local simulation. Explicit --scripted mode adds /scripted.html, which generates a fixed OpenAI Realtime voice clip and streams the buffered audio to a Tavus stock avatar. Sabine confirmed hearing the repeat and seeing the mouth move. This is not the customer app, a latency benchmark or proof of natural interruption. No customer notes, shopping, Supabase access or Render deployment exists.

## Open the local simulation

Use Node 24.19 or later within Node 24:

```sh
npm ci --ignore-scripts
npm run start
```

Open http://127.0.0.1:4318. Direct file opening does not run the application. The server is restricted to this computer and cannot be opened from a physical phone. Stop with Ctrl+C. The default /api/live route remains locked.

## Scripted provider probe

Server-only credentials must be saved in the ignored owner-only .env file, never in chat, browser code or GitHub. The ignored owner-only .experiment-usage.json ledger has already been initialized and contains two closed reservations. Do not recreate, clear or reset it. Missing/corrupt usage records or unresolved room cleanup block paid work.

After checking account usage and the remaining approved allowance:

```sh
npm run build
node src/server.ts --scripted
```

Open http://127.0.0.1:4318/scripted.html. Start scripted test creates a new bounded attempt. Play script sends the generated clip; do not overlap playbacks. Interrupt and end mutes local media, discards queued chunks and ends the provider room. Verify the page reports provider closure before starting another test. This control ends the whole test; it does not demonstrate natural barge-in/resume.

Microphone and camera remain disabled in browser policy and the Daily call. OpenAI generates the bounded fixed script, then its WebSocket closes before room creation. Tavus Audio Echo uses pipecat0 with no TTS/LLM/STT layer and the Anna - Casual stock face. No text Echo or ElevenLabs fallback exists. The room requires a token, allows two participants, disables recording and has a 90-second provider limit; the server stops after 85 seconds or heartbeat loss.

Every attempt permanently reserves $2 of the OpenAI allocation and five avatar minutes, including failures. At most four attempts fit the $8 stop threshold and 20-minute experiment allowance. Reservations survive restart and are not actual bills. Two closed attempts currently reserve $4 and ten minutes. Actual billing must still be checked. No automatic refill, upgrade or larger trial is approved.

## Focused checks

```sh
npm run test:phase-1
npm run typecheck
npm run build
```

68/68 focused tests pass, plus type checking and build. Tests use mocks, not paid provider calls. They cover P1-01/P1-07 and supporting state, completion, budget, transport, policy, HTTP and cleanup behavior. P1-02 through P1-06 belong to Task 1c and are not implemented.

Manual simulation checks: Start local demo, interrupt, inject a delayed event and confirm the frame count stays fixed. Restart the server and confirm the loss notice and zero counters. This verifies synthetic state, not notebook or Supabase recovery.

## System patterns and limits

- Keep generation completion separate from actual playback. Send the final Echo marker on the last audio chunk. Generated bytes and provider speaking spans do not prove customer-heard position.
- The scripted probe uses paced 20 ms PCM16 chunks at 24 kHz, each JSON message below Daily's 4 KB limit. Browser scheduling stalls cancel the queue rather than burst stale audio.
- Epoch/response/item isolation in the simulation rejects old events. The scripted probe invalidates queued chunks on end and requires a fresh room for another attempt. Continuous-conversation cancellation remains to prove.
- Known provider closure is checked before marking a ledger record closed. Unknown creation or cleanup holds further work. An empty successful Tavus end response must not be parsed as JSON; verify the room separately.
- The browser cookie is a local experiment boundary, not production authentication. Exact playback acknowledgment, natural conversation, phone behavior and complete provider privacy preflight remain open.
- Recording off does not mean zero retention. Do not enable human microphone/camera until remaining provider data handling and consent have been reviewed.
- Ignore files exclude secrets, usage ledgers, recordings, dependencies and build output. This folder has not been published to GitHub.

See [Task 1b evidence and remaining gates](../../docs/task-1b-voice-avatar.md).

## Local camera and microphone check

Open http://127.0.0.1:4318/devices.html and select Turn on camera and microphone, then allow the browser prompt. Camera preview is muted and audio feeds only a local level meter. This page blocks network connections and has no recording, upload, persistence or provider call. Stop, tab hide, page exit, device loss and the two-minute active-check limit release all tracks. Other pages keep media input disabled. Actual device checks are pending; this does not implement live stylist conversation.

Latest checks: 76/76 focused tests, type checking and build pass.

## Private buffered spoken test

Build with npm run build, then run node src/server.ts --scripted --spoken and open http://127.0.0.1:4318/spoken.html. Opening the page makes no provider call. Start private voice test reserves the existing $2/five-minute allowance and creates the bounded private room. Talk captures microphone audio, Send (or twelve seconds) stops it and submits PCM to OpenAI. OpenAI reply audio is then paced through Audio Echo. Confirm hearing the complete reply before one follow-up. Interrupt and end clears all temporary context and ends the room; it does not resume the same conversation.

This is two buffered exchanges, not continuous streaming or automatic barge-in. Camera stays off. No app recording/persistence or live preference extraction is implemented. Provider retention/training still applies and is disclosed on the page. Use only the existing durable ledger; do not reset or refund reservations. Live provider/manual acceptance is pending. Latest checks: 112/112 mocked/synthetic tests, type checking and build pass.

## Current readiness and allowance

The fifth spoken attempt connected but ended at Exchange 0. All five reservations are closed. No sixth attempt is approved. The spoken page now explains the location and steps before Start, displays the approximately 85-second local room countdown and identifies local tab-leaving stops. Server automatic stops distinguish expiry from heartbeat loss. Exact cause of the earlier fifth stop is unknown. Latest checks: 120/120 synthetic/mocked tests, type checking and build pass. Manual spoken acceptance remains pending.

## Durable ledger preparation for iPhone preview

Supabase is approved for private prototype test-limit records. src/supabase-budget.ts and supabase/prototype-budget.sql are prepared but not activated/applied. Confirm the dedicated project, review/apply the migration, import all six closed reservations without reset, verify anon/authenticated denial and service-only RPC, and prove restart/concurrency failure behavior before hosting. Server credentials stay private; never publish the ledger or credential values. Private remote access and origin/port handling are still required. There is no seventh-attempt approval. Latest checks: 129/129 mocked/synthetic tests, type checking and build pass. Live database/SQL verification remains pending.

## Current private phone preview setup

All six historical reservations are imported into Supabase and match the private original. The one-time importer is disabled. The six-attempt cap remains; another live test requires a separately reviewed amendment. Do not reset the local or remote ledger.

Render deployment is prepared, not deployed. The root render.yaml uses prototypes/voice-avatar as rootDir, npm ci and npm run build, then node src/server.ts --preview --spoken. Pin Node 24.20.0, use Free and disable automatic deployment. Supply server-only SUPABASE_URL, SUPABASE_SECRET_KEY, OPENAI_API_KEY and TAVUS_API_KEY in Render's private environment settings. PREVIEW_PASSWORD is a strong generated value; RENDER_EXTERNAL_URL supplies the required HTTPS origin. Do not place any credentials in Git, a URL, build variables prefixed VITE_, screenshots or chat.

Preview browser access uses HTTP Basic username stylist and the private generated password. This protects this experiment only. The future Supabase customer account flow is not built. Health exposes only an ok flag. Missing password/origin/durable ledger blocks startup; ledger outage blocks paid work and there is no file fallback. On a server restart, local media stops and temporary context clears. Unclosed durable reservations still require provider cleanup review.

Before phone acceptance, verify denied anonymous page/API access, wrong Host/Origin rejection, cookie protection and no credential leakage in the deployed browser bundle, then use Safari on a real iPhone. Verify local device permissions and Stop first without provider use. Any new avatar test needs a separate allowance review. Latest checks: 135/135 synthetic/mocked tests, type checking and build pass.


## Automatic capture and spoken-stop probe

With the existing explicit `--spoken` startup mode, open `/handsfree.html`. It uses the same protected access, durable reservations and bounded two-exchange room. Start microphone sends short clips automatically after a pause; generation is still buffered. Detected speech during processing or playback ends the room, with no conversational resume. Confirm a whole reply explicitly before a normal follow-up. Noise, speaker echo and hesitation remain physical-device risks. One eighth attempt is separately approved for the private iPhone automatic-capture/spoken-stop check; a ninth remains blocked. See docs/task-1b-voice-avatar.md for the gated manual check.

### Separately approved repeat

On 9 October 2026 Sabine approved exactly one ninth, spoken-only repeat of the automatic capture/spoken-stop check, capped at $2/five minutes from the final reserve. The overall experiment allocation stays $25 (OpenAI $18, hosting $7, reserve $0); recurring Supabase is separate. Apply prototype-repeat-trial.sql only once after eight verified closed records. No tenth attempt is allowed, no history may be reset, and hosted code cannot grant its own amendment. Give the complete test instructions before the user starts. Natural interruption acceptance remains pending.

### Incremental output and recovery preparation

streamSpokenReply, IncrementalEcho, startStreamedBridge and ContextRecovery are tested building blocks for Task 1b. They are not enabled through the hosted HTTP test or phone page. 215 synthetic/mocked tests, type checking and build pass. The owner must reserve allowance first, enforce the private room lifetime, cancel stale output, verify actual old model/renderer cleanup and restore only confirmed context. No automatic retries or new budget are granted. See docs/task-1b-tavus-recovery-question.md for the unresolved vendor contract.

### Confirmed conversation context

ConfirmedConversation is wired to the local SpokenService and keeps generated replies pending until explicit whole-reply confirmation. It retains one confirmed exchange within the existing two-turn limit and clears on end/replacement. ContextRecovery restores an immutable confirmed-only snapshot and waits for acknowledgment before releasing its hold. Timeout, stale context and unresolved cleanup remain blocking. 231 mocked/synthetic tests, type checking and build pass. These changes are not deployed to Render; live resume still requires Tavus clarification and transport integration.

## Streaming lifecycle cleanup fix, 9 October 2026

The prepared streaming bridge now retains its parent cancellation connection after all output frames are sent. Remote playback may continue after sending finishes, so ending the owning session must still send the interrupt. Cancellation releases the listener and repeated cancellation does not resend the interrupt. Completion racing with cancellation is rejected rather than reported as successful. Sending an interrupt still requires independent renderer/room cleanup verification.

233/233 synthetic/mocked tests, type checking and build pass. Two new regression checks cover parent cancellation after output delivery and cancellation during final output handoff. No provider call, reservation, deployment or budget change occurred. The fix is local and published only; live recovery and physical acceptance remain pending Tavus clarification and integration. Task 1b remains unchecked.

## Combined recovery checks, 9 October 2026

Added three combined synthetic checks using the real streaming bridge, paced output queue, session coordinator, confirmed memory and recovery gate, with mocked generation and transport acknowledgments. They verify that interruption clears queued audio and rejects late frames; only confirmed memory is restored before a new response is accepted; unverified renderer cleanup blocks replacement; and ending during restoration disposes the replacement without reviving the session. These checks validate component coordination, not Tavus's actual cleanup guarantees.

236/236 tests across 24 files, type checking and build pass. No provider calls, paid attempts, deployment or architecture changes occurred. Live recovery adapters and physical verification remain pending Tavus's technical reply and later test authorization. Task 1b remains unchecked.

### Notebook manual review accepted, 10 October 2026

Sabine reported all steps in the complete notebook review worked. The local simulated notebook review passed; actual speech/extraction, recommendation speech gating, measured timing and full device/accessibility acceptance remain pending. Task 1c stays in progress. No provider call or deployment was started by recording this result.

## Shared look display and speech permission, 10 October 2026

Added LookRelease, a synthetic discovery gate binding an immutable sample description to its exact validation ticket, session and notebook revision. Display and speech use the same permit. A pending, blocked, unknown, malformed, timed-out, stale or copied approval cannot authorize either path. A description cannot be swapped after checking. Speech starts at most once per permit; each queued frame must recheck permission immediately before enqueue, and the transport receives an abort signal. Notebook edits, captured corrections, reference changes, saved-preference fixture changes, clearing, a new check and ending synchronously revoke the permit. Frames already heard cannot be undone.

The notebook now uses this shared permit for the illustrated sample and its description. Browser checks verified hidden-during-check, release after confirmed fixture values, and immediate disappearance after enabling Avoid emerald green. Synthetic transport tests verify queued-frame cancellation, exceptions and changes inside the start callback. 517 tests across 38 files, type checking and build pass. No real speech output, independent AI validator, database transaction, second-tab synchronization or remote renderer cleanup is established. The provider speech adapter must honor abort and separately verify cleanup; this is still an open Task 1c gate. No paid call or Render deployment occurred.

### Disabled transcription preparation

PreparedLiveTranscription accepts an injected simulated wire only. No live connector or route is enabled. Tests feed synthetic deltas into the notebook coordinator, exercise frame/turn bounds and reject delayed old completions. Status does not claim remote cleanup or live latency. See ../../docs/task-1c-live-transcription-proposal.md for approval and remaining integration gates.

### Simulated note session owner

NoteSessionProbe connects injected capture and transcription events to the guarded note coordinator. It cancels and clears the session on end/failure, protects against late acquisition/extraction and records unverified cleanup. It does not expose an authenticated live route or construct a real capture/transport/extraction adapter. The 346-test Phase 1 suite remains synthetic/mocked.

### Structured extraction contract

The model-independent schema, decoder and simulated request adapter preserve literal user evidence and return only tentative notes. Prior context identifies fields but cannot supply new evidence. All 368 Phase 1 tests pass with type checking and build. Sabine approved pinned GPT-4.1 mini preparation with simulated responses; live integration remains pending.

## Approved pinned extraction adapter, 10 October 2026

Sabine approved GPT-4.1 mini preparation with simulated responses only. Added a server request builder pinned to gpt-4.1-mini-2025-04-14 and a Responses wire decoder. Requests specify strict JSON schema under text.format, store:false, no tools, no streaming and a 2,048-token output ceiling. store:false requests no Responses application-state storage; it does not promise zero retention or alter provider training policies. The protocol version uses a single-value enum in the provider schema, with the application decoder retaining its exact version check. [Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs), [Responses migration and storage](https://developers.openai.com/api/docs/guides/migrate-to-responses).

The decoder accepts one completed assistant text message from the pinned model. It rejects refusals, failed/incomplete/cancelled results, tool outputs, multiple messages, invalid JSON, wrong turns and unsupported evidence. Notes stay tentative. The simulated transport forwards cancellation, discards late results, redacts errors and performs no retries or model fallback. The existing coordinator owns the 1.5-second extraction deadline. No API client, credentials, live endpoint or activation path was added; simulation must be explicit.

All 396 focused tests across 33 files, type checking and build pass, including 28 new adapter checks. A simulated transcription envelope flows through the session owner and this adapter into tentative notebook notes; ending clears the session. Tests also cover the deadline and ignored late responses. This proves local contract handling only, not provider schema acceptance, account availability, semantic quality, live latency or physical-device behavior. No paid call, additional allowance or Render deployment occurred. All nine prior trials remain closed. Task 1c and Phase 1 remain incomplete.

## Recognition rewrite correction, 10 October 2026

Found and fixed a stale-note case: a revised transcript could remove evidence from a partial that had already produced a note. The coordinator now tracks exactly which field revisions it wrote during each turn. On a rewrite it immediately retracts those unchanged speech revisions, cancels obsolete render receipts and re-extracts the revised text. Retraction invalidates current look approvals synchronously. Touch edits and customer confirmations are protected by their newer revisions, and notes from previous turns are not erased. A conservative rewrite can temporarily clear unchanged speech fields from that same turn until they are extracted again; the prototype does not guess which old evidence remains valid.

The notebook receives an immediate invalidation update and explains that speech changed. The simulated session owner accepts the same display callback and ends safely if display updates fail. All 408 focused tests across 34 files, type checking and build pass, including 12 new correction checks. They cover removed evidence, replacement values, confirmed/manual/cleared fields, prior turns, stable appends, stale render receipts, look approval revocation and callback cancellation/failure. These are synthetic correction tests; actual recognition and physical-device timing remain unverified. No provider call, allowance or deployment occurred. Task 1c remains open.

## Simulated connection ownership preparation, 10 October 2026

Added NoteConnectionScope as a disabled, process-local control boundary around the simulated note-session owner. One opaque server connection object owns each random session identity. A second tab cannot take over using a matching user label or a guessed session ID. Strict versioned commands bind the session, a monotonically increasing sequence and the exact command payload; duplicate, old, malformed and foreign commands are rejected. Provider callbacks are accepted only through the original connection binding. This reference is supplied by trusted server code, never parsed from browser JSON.

The slot is reserved before constructing resources, preventing a reentrant second start. End, disconnect and the existing probe deadline retire the simulation; late starts, provider events and commands cannot revive it or control a new session. Cleanup failures hold the slot rather than admit another session. Session identities are never reused within the bounded process history. Ending remains possible after the command limit is reached. Diagnostics contain flags and counts only.

All 430 focused tests across 35 files, type checking and build pass, including 22 new checks. Integration with a real NoteSessionProbe and simulated transcription confirms that another connection cannot update notes, while the owned connection can; disconnect clears the notebook and closes the simulated wire once. No HTTP/WebSocket upgrade route, authentication verification, browser connection, provider socket, key loading or deployment is added. These tests do not establish authenticated customer isolation, real two-tab browser behavior, remote provider cleanup or a distributed production lease. The process-local guard is for the approved disabled prototype only; production lease/heartbeat settings remain undecided. Task 1c remains open, all nine paid trials remain closed and no spending is authorized by this work.

## Disabled network control bridge, 10 October 2026

Prepared attachSimulatedNoteBridge using the existing pinned ws dependency and PreviewGate. Explicit simulation is required before any listener is attached. The bridge checks the configured host, exact origin, GET method, exact /api/notebook-simulation path without query credentials, and existing private-preview Basic credentials before upgrade. It rejects subprotocol credentials and a second connection before constructing session resources. The opaque socket owner is bound to NoteConnectionScope. The upgrade/authorization pattern follows the [official ws authentication example](https://github.com/websockets/ws/blob/master/README.md#client-authentication).

Control messages are limited to 1,024 bytes, compression is disabled, send backlog is bounded, and pending commands cannot accumulate. Invalid JSON, binary/control misuse, wrong ownership, duplicate commands and transport errors end the simulation. An end command can cancel an in-progress start. Disconnect, disposal and the existing 85-second prototype limit stop the owned session; late asynchronous starts cannot revive it. Only readiness and command acknowledgments are sent. No audio, transcript or notebook-value transport is implemented by this control-only bridge.

All 453 focused checks across 36 files, type checking and build pass, including 23 new bridge tests using actual loopback WebSocket connections with fixture credentials and simulated providers. Checks cover wrong/missing credentials and origins, host/path/query/subprotocol rejection, a second socket, malformed/oversized/binary messages, command replay, disconnect, pending-start cancellation, disposal and the deadline. A real NoteSessionProbe driven by simulated transcript events gains a tentative note and clears it when its socket disconnects. The disconnect test waits for the server cleanup event rather than assuming the client's close event proves cleanup already occurred.

The application server, CLI, browser assets and Render preview do not attach or enable this bridge. Loopback tests use HTTP with configured preview headers; they do not verify HTTPS termination, Render routing, Safari Basic-auth behavior, real two-tab UI behavior, Supabase customer authentication, provider behavior, live latency or remote cleanup. The existing browser notebook remains an isolated simulation. Next: prepare browser updates and provider transport adapters, then review activation and allowance before any paid trial. No account changes, API keys, paid calls, new allowance or deployment occurred. Task 1c and Phase 1 remain incomplete.

## Notebook update transport preparation, 10 October 2026

Extended the disabled bridge with connection-bound notebook publishing. A strict whitelist sends only seven notes, statuses, field/notebook revisions, the originating notebook session and an optional render receipt. Transcripts, photo/reference data, saved profiles and look approvals are excluded. Updates have their own increasing sequence and a bounded count. A publisher captures its original socket; an old session callback cannot target a replacement connection. One validated initial snapshot may be buffered during construction and is sent only after readiness. An invalid initial update ends and cleans up the newly constructed session.

Added the browser-compatible NoteUpdateClient state helper. It requires a simulated ready event, rejects foreign/replayed updates, changed notebook sessions, regressed revisions and changed values without a new field revision. Missing/uncertain values remain explicit. New retraction snapshots can remove obsolete notes. Snapshot access returns copies. Disconnect clears all client note content and prevents reuse. A render acknowledgment can be built once for the exact current update/receipt, after the future UI commits it. The helper does not itself measure physical rendering or display HTML.

All 476 focused checks across 37 files, type checking and build pass, including 23 added checks. Actual loopback sockets deliver simulated transcription through NoteSessionProbe as tentative note snapshots, and the client helper returns a matching receipt over the connection. Checks cover content whitelisting, malformed/oversized notes, revision regression, replay, retractions, stale receipts, duplicate acknowledgments, disconnect clearing, initial ordering/cleanup and an old publisher after replacement. The simulation remains unattached to the running application server, React notebook and Render. No browser socket, real microphone-to-provider transport, model call, actual rendering acceptance or paid trial occurred. Task 1c and Phase 1 stay open.

Next integration work: connect the prepared browser state helper to React with commit-time acknowledgments and cleanup, provide authenticated browser transport, and prepare the real provider adapters. Review an additional allowance before paid activation; the original nine trials remain closed with no reserve.

## Validated update rendering in the notebook, 10 October 2026

Connected the visible React notebook's existing simulated conversation to NotebookPresentation and the prepared NoteUpdateClient/decoder. Displayed note values now pass through the strict seven-field wire schema and revision checks in-process. Local photo/reference and look-gate controls remain local. This does not open a socket, relax the notebook's connect-src restriction or connect a provider. Existing touch edits, confirmations, synthetic speech corrections and session clearing use the same presentation path.

After React commits an update and reaches the next animation frame, the exact current wire update may produce one matching extraction render receipt. Superseded updates, touch edits, clearing, retired notebook sessions and disconnects cannot acknowledge an older receipt. Wire update sequences never repeat across local clears, preventing a late callback from accidentally acknowledging a new session. These callbacks do not prove physical display timing or the live two-second target.

All 517 focused tests across 38 files, type checking and build pass, including 11 new presentation checks. Browser regression checks on the updated local notebook confirmed sample notes/uncertainty, the synthetic $350 correction, a touch color edit to Blue, complete clearing and a fresh sample afterward. The prior $500 result did not replace the corrected budget during this flow. The screenshot is private test evidence, not a committed asset. This is agent-run browser regression evidence, not a new physical-device or live-provider acceptance. Task 1c and Phase 1 remain open. No paid call, allowance change or Render deployment occurred.

Remaining integration: a browser socket/controller and session-bound edit commands, actual streaming microphone/provider adapters, measured live quality/latency and real recommendation speech cleanup. The server network harness remains unattached to the running page. All nine prior trials stay closed; paid activation still needs a separate allowance review.

### Browser connection and customer command preparation, 10 October 2026

The disabled NoteBrowserController accepts an injected simulated socket, validates ready/update/command acknowledgments, and sends edits or confirmations using the latest server field revision. It never constructs a WebSocket, acquires media or sends provider requests. Only one command may be pending. Configuration/command deadlines and the total 85-second limit clear content and close the injected connection without reconnecting. Render receipts wait until the command slot is available and must match the current committed update.

NoteSessionProbe now checks each customer edit/confirmation against the current field revision. Stale commands cannot overwrite newer speech or touch values. Accepted edits immediately invalidate the look gate and publish updated notes; a publishing failure ends and clears the session. There is no saved-profile or wardrobe-write authority. All 517 checks across 39 files, type checking and build pass. Actual local sockets verify the controller, server ownership, updates, edits, confirmations and disconnect clearing together with simulated providers. The running notebook and Render still do not attach this network path; phone HTTPS/authentication, microphone/provider transport and live timing remain unverified.

### Bounded audio connection preparation, 10 October 2026

The disabled network harness now accepts strict 968-byte simulated audio frames, with a format marker, increasing sequence and 960-byte PCM payload. A remote capture source feeds only the owning NoteSessionProbe while acquired. The browser controller waits for the begin acknowledgment, stops audio before commit and clears on disconnect. Actual local socket checks carry generated silent PCM into transcription preparation and return a tentative note from simulated transcript events. All 540 checks across 40 files, type checking and build pass. No actual microphone, provider socket, paid call or deployment was used. The running notebook remains an in-process simulation; capture orchestration and provider transport are still pending.

### Browser capture orchestration preparation, 10 October 2026

PreparedBrowserNoteSession owns an injected simulated capture source and controller. Capture starts in the explicit user action; pre-begin-ack frames are discarded locally. It stops capture before commit, cancels late permission results and clears on device loss, disconnect, deadline or caller-signaled page exit. All 554 tests across 41 files, type checking and build pass, including actual loopback integration with a simulated device and provider. This is one-turn preparation; provider-ready signaling is still needed for another turn. No browser listeners or actual microphone/socket are constructed, and the open notebook and Render are unchanged.

### Repeated-turn readiness preparation, 10 October 2026

The disabled capture orchestrator now supports bounded repeated turns. A later acquisition requires both the command acknowledgment and connection-bound readiness after provider commit plus final note extraction. Server-side enforcement prevents unfinished extraction from being canceled by another turn. Readiness has a five-second deadline and cannot be replayed or retargeted to another connection. All 572 checks across 41 files, type checking and build pass, including actual loopback integration with two generated-audio turns and a tentative color correction. This supersedes the prior one-turn preparation limitation. The running notebook and Render remain unchanged; actual microphone/provider integration, hosted authentication and live timing remain unverified.

### Visible notebook edit protection, 10 October 2026

The notebook and prepared server owner now share epoch/field revision checks for customer edits and confirmations. An edit dialog opened before a newer speech note arrives holds the old draft and offers Load latest note. Agent browser checks verified conflict recovery, normal save, confirmation, cancellation and returned focus. All 584 checks across 42 files, type checking and build pass. The running local page contains this fix; speech remains simulated and Render was not redeployed.

## Prepared session status, 10 October 2026

PreparedBrowserNoteSession exposes status() and includes the result in snapshot(). Fixed local messages distinguish connecting, ready, requesting the simulated capture source, waiting for turn acknowledgment, active capture, pending command, processing, ended and cleanup-held. Processing remains until matching provider readiness, including final extraction settlement. The first shutdown cause is preserved. Cleanup exceptions override ordinary ended text so the helper never claims the device cleanup succeeded. Messages never contain provider errors, transcript text or note values, and make no remote deletion claim. These are read-only projections, not UI notifications; a future page binding must refresh them on connection and capture state changes. The running notebook has not been connected to this helper.

Six additional checks cover transitions, commit/readiness ordering, repeated shutdown, redacted errors and timeout. All 726 tests across 53 files, type checking and build pass. No live media, paid provider call, allowance change or deployment occurred. Task 1c and Phase 1 remain incomplete.

## Simulated browser lifecycle binding, 10 October 2026

bindSimulatedNoteLifecycle explicitly binds an injected session to injected socket, page and visibility event targets. It requires simulation=true, creates no socket or device, accepts only bounded JSON text messages and forwards them to the strict controller. Socket close/error, pagehide and hidden visibility end capture and clear temporary notes through the session owner. Late events cannot revive a disposed session. It refreshes only fixed redacted status messages, deduplicated, on events and a 50ms timer so asynchronous permission and internal deadline changes are observable. The timer and all registered listeners are removed on session end, explicit dispose, setup failure or status-display failure. There is no reconnect, replay or automatic capture.

Thirteen added checks cover status transitions, asynchronous capture, visibility, pagehide, socket close/error, malformed/binary/oversized input, already-hidden setup, timeout, display failure and partial setup cleanup. All 726 tests across 53 files, type checking and build pass. These are simulated event/device checks, not Safari, hosted authentication or live provider acceptance. The visible notebook and Render are unchanged. Actual browser page attachment and provider clients remain pending; Task 1c and Phase 1 remain incomplete. No provider call, paid allowance or deployment was started.

## Lifecycle integration evidence, 10 October 2026

The browser lifecycle binding now has full local WebSocket integration checks with the prepared capture/session/controller, owned server audio source, transcription events and extraction coordinator. Two generated-silent-audio turns produce tentative green then blue notes. Status remains processing until the commit and final extraction finish, then returns to ready. Pagehide ends both owners, clears client/server notes and rejects old capture callbacks. Actual socket termination stops active simulated capture. A permission result arriving after pagehide is released without forwarding any audio or allowing restart.

All 726 tests across 53 files, type checking and build pass. These checks use actual local sockets and simulated devices/providers, not real speech recognition or physical Safari. No visible page change, provider call, paid allowance or deployment occurred. Task 1c and Phase 1 remain incomplete. Browser page attachment, provider clients, hosted authentication and real quality/timing are still pending.

## Visible local connection rehearsal, 10 October 2026

The notebook page now includes Review the prepared notebook connection, a separate local rehearsal with complete instructions before starting. It reuses PreparedBrowserNoteSession, the lifecycle binding, NoteConnectionScope, PreparedRemoteNoteCapture, NoteSessionProbe and the partial-note coordinator. Generated silent PCM and scripted transcript events produce tentative Emerald green, then tentative Blue. Confirm color uses the owned revision-bound command and marks Blue confirmed. React commits plus requestAnimationFrame submit matching render receipts. End, pagehide, hidden visibility and the deadline stop both owners and clear the rehearsal's notes. The main notebook, photos and fixture checks are isolated from rehearsal state.

The protocol preparation now uses bounded-frame btoa encoding instead of node:buffer, and the scope uses globalThis.crypto.randomUUID instead of node:crypto, permitting the same explicit simulation contracts to run in the browser without a Node polyfill. This is not a live client provider or a browser-side credential path. All simulation guards remain. The rehearsal never constructs WebSocket, acquires media, fetches services or persists notes; hosted authentication and network/provider behavior are not proven by this fixture.

All 726 tests across 53 files, type checking and build pass. Eight added checks cover both turns, confirmation, the two-turn bound, duplicate start, exit/hidden/dispose cleanup, an initially hidden page and no fetch. Agent browser checks on the final build confirmed Emerald green, the Blue correction, confirmation, receipt-driven continued control and end/clear. A private screenshot records Blue confirmed. Sabine's review of this new panel remains pending. No paid call, allowance change or Render deployment occurred. Task 1c and Phase 1 remain incomplete.

The prepared note-extraction transport requires an explicitly injected simulated request. It bounds request/response bytes, refuses redirects and unexpected destinations, and cancels reads and late responses. It contains no API key loader, default fetch or live endpoint route.

The prepared transcription socket wire accepts only an explicitly injected simulated open socket. Its tests include actual loopback framing against a synthetic provider and the combined simulated extraction/notebook chain. Live provider authentication, hosted TLS and live recognition remain unverified.

createPreparedNoteProviderSession consolidates the injected simulations with the existing note owner. External cancellation and either transport failing shut down capture, extraction and temporary notes together. The disabled browser bridge and the visible local rehearsal now use this factory. Browser readiness waits for the provider configuration acknowledgment. Provider failure notifies the browser immediately; failed socket cleanup holds the session lease.

Latest combined bridge evidence: 726 tests across 53 files, type checking and build pass. Implementer browser checks passed first color, correction, confirmation and End clearing. The application server does not enable the prepared endpoint; the visible rehearsal remains entirely local and simulated.

Combined preference scenarios cover all seven fields, missing/ambiguous values and a budget correction that invalidates a prior synthetic look check. Owned wardrobe items still hold for real matching; no production recommendation engine is implied.

The combined lifecycle checks include late permission after page exit/provider failure, device loss and pending extraction cancellation. Cleanup notification waits until the shutdown stack settles; final capture release is attempted even if stopping throws. See ../../docs/phase-1-readiness.md for the remaining live evidence and dependencies.

Combined replacement checks isolate old provider/extraction events and stale receipts; failed cleanup refuses a replacement. A combined budget correction revokes the synthetic look visual permit and speech-frame authorization. No real recommendation playback is performed by these tests.

## Disabled notebook server owner

Prepared a simulation-only owner that checks the exact request boundary and private credentials before reserving an allowance or constructing transports. It owns one startup/session at a time, closes a late reservation after cancellation, stops at the deadline, and verifies capture/socket cleanup before closing the reservation exactly once. Uncertain reservation writes, failed transport construction, failed cleanup or failed durable closure retain a hold without retries. An explicit notes-only simulation purpose prevents accidental use of the existing legacy allowance object. This is method-compatible ledger preparation, not a new durable notes allowance, live route or production authentication system.

Twenty-one new focused checks passed. Current cumulative evidence is 747 tests across 54 files, type checking and build. No credentials, actual ledger, provider requests or deployment were used. D21/D22 and Task 1c remain partial; Phase 1 remains open. Next verify current official provider contracts and document mismatches before preparing any real activation path.

### Protected owner partial-note integration

Two more deterministic checks exercise actual prepared extraction through the authenticated owner: tentative partial notes, a touch edit retained during the turn, cancellation while extraction is pending, late-result rejection, temporary-note clearing and exactly-once reservation closure. The owner now exposes a session-bound snapshot for presentation. All 749 tests across 54 files, type checking and build pass. No live request, allowance modification or deployment occurred. Next connect this owner to an explicitly simulated loopback harness without adding an application-server route.

## Protected simulated browser connection

Connected the disabled notebook server owner to the explicitly attached loopback harness. The bridge passes the original validated upgrade request to the private gate, uses a capture source bound to that connection, and waits for allowance reservation plus provider configuration before Ready. Commands, snapshots, readiness and termination stay bound to their originating connection. An aborted startup retires its late reservation without creating providers. The scope stays occupied while durable closure is pending; failed closure or provider cleanup retains a hold.

Seventeen new loopback checks cover two turns and confirmation, stale extraction, disconnect cancellation, provider failure, delayed readiness, authentication/origin/host denial, exhausted allowance, startup cancellation, commands before Ready, pending/failed closure, disposal and old session IDs. All 766 checks across 55 files, type checking and build pass. These use synthetic providers and injected allowances, with no actual durable records, credentials, paid requests or deployment. D21/D22 remain partial; Task 1c and Phase 1 remain open.

### Protected browser lifecycle evidence

Seven additional loopback checks connect the protected allowance owner to the prepared browser lifecycle and synthetic capture source. Page exit, hidden state, permission granted after page exit/provider failure, extraction pending at hide, device loss and connection termination stop capture, clear temporary notes and close the injected reservation once. Late permission cannot send audio; late extraction cannot restore notes. All 773 tests across 56 files, type checking and build pass. This is not physical-device acceptance or remote provider cleanup proof. No allowance change, provider request or deployment occurred.


### Protected deadlines and replacement evidence

Four additional loopback checks verify deadline expiry while closure is pending, failed closure retaining a hold without retries, startup expiry retiring a late reservation without a provider, and old extraction/provider results staying isolated from a replacement notebook. All 777 tests across 57 files, type checking and build pass. These use synthetic services and injected allowances. D21/D22, Task 1c and Phase 1 remain partial. No paid call, allowance change or deployment occurred.


### Official-schema fixture checks

Eight synthetic checks cover the documented session envelope, transcript deltas and completion events with token/duration usage metadata. Only transcript text reaches the note coordinator; metadata is not converted into preferences or confidence. Missing event/item IDs and contentless/unmapped deltas hold the session, and cancellation rejects a late completion. All 785 tests across 58 files, type checking and build pass. These fixtures establish conservative decoder behavior, not live model acceptance. Current session.updated documentation is retrieved; dedicated transcription startup and the conflicting delay descriptions remain unresolved. Task 1c and Phase 1 remain partial. No paid request, allowance change or deployment occurred.


### Separate notebook allowance preparation

Prepared a simulation-only allowance with a strict notes-only ledger, explicit bounded fixture amounts, lifetime attempt accounting and injected compare-and-swap persistence. It has no credentials, URL, RPC, initialization, amendment, automatic refund or retry. Missing/legacy/corrupt records, unresolved runs, failed writes and failed closure hold further work. Fifteen checks cover replacement adapter instances sharing an in-memory store, concurrent owners, a write succeeding before its response fails, failed closure, malformed records and an exhausted allowance blocking provider construction. No actual database or server restart was exercised. Fixture approval is not spending authorization. All 800 tests across 59 files, type checking and build pass. No remote data, nine-trial legacy history or deployment was changed; Task 1c and Phase 1 remain partial.


### Separate allowance connection integration

Six loopback checks now exercise the separate PreparedNoteAllowance through the protected browser lifecycle. Page exit during a pending write retires a late successful reservation without a provider; uncertain writes and failed closure retain holds. Pending closure blocks replacement, confirmed closure permits a fresh reservation, hidden-page capture stops, and two bridges sharing a simulated compare-and-swap store permit only one provider owner. All 806 tests across 60 files, type checking and build pass. These are synthetic persistence/provider checks, not Supabase or physical-device acceptance. The unapplied storage design and database verification gates are in docs/notebook-allowance-storage-plan.md. No remote records, allowance or deployment changed.


### Notebook allowance transition and database preparation

Implemented a shared pure validator permitting exactly one open append or one closure, preserving approval, record order and IDs. Seventeen focused checks reject amendments, removal, reopening, duplicate IDs, no-op updates and combined transitions. The cumulative prototype suite is 823 tests across 61 files, with type checking and build passing.

Prepared supabase/notebook-allowance-preparation.sql with a private table, row security, private privilege-elevating implementations and server-only invoker RPC wrappers. It neither initializes an allowance nor changes any legacy budget object. Forty-two checks passed in a pinned isolated PostgreSQL 17 container with no network or host ports: transition invariants, missing records, actual role denials, server reads/changes, stale and concurrent compare-and-swap, attempt caps and an unchanged synthetic legacy sentinel. Fixed a migration CASE-expression syntax error and changed the test sentinel comparison to semantic JSON equality. The temporary container was removed. No actual Supabase configuration, records or spending allowance changed. Remote privileges, database recovery and transport verification remain open; this is not hosted acceptance.


### Bounded notebook persistence transport

Prepared an explicitly simulated transport for only the two notebook RPC wrappers, with exact HTTPS project destination validation, 16 KiB request/response limits, strict JSON and response checks, an eight-second deadline, late-body cancellation and no default fetch, credentials, redirects, retries, initializer or legacy fallback. Forty new checks cover the boundary and timeout behavior. Six new protected-owner checks cover reservation/closure, uncertain writes, failed closure, browser departure, late responses and invalid snapshots. Existing six browser lifecycle/shared-store checks now run through this transport too. A missing synthetic capture cleanup source in the new test fixture was corrected; all 869 prototype checks across 63 files, type checking and build pass.

Prepared an unapplied rollback that refuses any initialized allowance and uses no CASCADE. Fifty isolated PostgreSQL checks now pass, including refused rollback preserving history, empty rollback removal, unchanged synthetic legacy data and reinstallation without automatic seeding. The temporary container was removed. No actual Supabase configuration, records, allowance or deployment changed. Transport calls remain injected simulations, not hosted RPC acceptance.


### SQL-backed notebook owner composition

Connected the prepared TypeScript allowance, bounded persistence transport and protected owner to injected RPC responses backed by real local PostgreSQL transactions. Seven scenarios pass: normal reserve/close, fresh owners preserving consumed attempt history and exhaustion, a committed reservation with a lost acknowledgment, a separate fresh Node process holding that unresolved reservation, a committed closure with a lost acknowledgment, browser departure while reservation confirmation is pending, and concurrent owners forced to read the same snapshot before compare-and-swap. Only one competing owner constructs a synthetic provider. A lost closure acknowledgment keeps the original owner held; a fresh owner reads confirmed closure only after the synthetic provider cleanup has completed. This does not establish recovery from an unknown real provider state.

All 869 prototype tests across 63 files, type checking and build pass. The database harness additionally passes 50 SQL checks and seven TypeScript composition scenarios. Scripts are included in type checking. The harness verifies the pinned container image, no network or ports, temporary storage and no host mounts before using synthetic fixtures. It removes the container in finally. No Supabase HTTP authentication, actual database records, paid provider, spending allowance or deployment was used. D21/D22, Task 1c and Phase 1 remain partial.


### SQL-backed browser lifecycle composition

Seven additional scenarios connect the prepared browser session and lifecycle to a real loopback WebSocket bridge, protected owner, bounded persistence transport and isolated PostgreSQL transactions. They verify origin/host/authentication refusal before any database or provider work, page departure while reservation confirmation is pending, replacement blocked until verified closure, failed closure preserving an unresolved record and held slot, a lost reservation acknowledgment blocking both original and fresh bridges, hidden-page capture cleanup and note clearing, and the real eight-second persistence deadline with a late response retaining the hold. All providers and capture sources are synthetic; no actual camera, microphone, Supabase HTTP connection or paid request is used.

The first run exposed a harness cleanup assumption: an intentionally held lease remains active. Corrected fixture disposal to accept a held slot while still disposing its sockets/listeners/server, and to attempt every fixture cleanup even if another fails. The application hold behavior was correct and unchanged. The database subprocess has a bounded 60-second test deadline. The project runtime dependencies must be installed to run the loopback checks.

All 869 prototype tests across 63 files, type checking and build pass. Separately, 50 SQL checks, seven SQL-backed owner scenarios and seven SQL-backed browser scenarios pass. Temporary containers and loopback servers are removed after the checks. No remote data, allowance, legacy reservation or deployment changed. D21/D22, Task 1c and Phase 1 remain partial.


### SQL-backed partial notes and correction evidence

Three further browser/database scenarios use the actual prepared extraction adapter with injected strict GPT response fixtures. They verify two successive partial/final turns with tentative notes and explicit confirmation, a touch correction preserved through older partial and final extraction, and cancellation of pending extraction on page exit with its late response unable to restore notes. The canceled response is consumed/canceled, capture refuses subsequent frames, and the database reservation closes once after cleanup. The cumulative isolated evidence is 50 SQL checks, seven owner scenarios and ten browser scenarios. All 869 prototype tests, type checking and build pass. This is synthetic provider integration with actual loopback sockets/local SQL, not live recognition, timing, device acceptance or hosted authentication. No remote data, allowance, provider call or deployment changed; D21/D22 and Phase 1 remain partial.


### SQL-backed failure cleanup and connection review

Four more browser/database scenarios verify provider disconnect during active capture, malformed extraction, permission granted after page exit and uncertain provider cleanup. Verified local cleanup closes the reservation exactly once and clears notes; late frames/events cannot restore the session. When synthetic socket cleanup throws, the reservation stays open, no closure write is attempted and replacement remains blocked. Fixed an inferred callback return type in the new harness and added an explicit wait for browser termination before asserting its cleanup state. The cumulative evidence is 50 isolated SQL checks, seven owner scenarios and fourteen browser scenarios, plus all 869 prototype tests, type checking and build. No live devices/providers, remote records, allowance changes or deployment were used.

Rechecked official OpenAI connection documentation. The discovered intent-based cookbook is archived; the transcription-token reference is deprecated. Neither resolves current server-owned dedicated startup for the selected model. Recorded this distinction and prepared four unsent clarification questions in docs/notebook-transcription-startup-questions.md. No model/protocol change was made. D21/D22, Task 1c and Phase 1 remain partial.

## Server-owned look authorization preparation, 10 October 2026

Connected the existing synthetic LookRelease to the exact NotebookState owned by each disabled prepared server session. Its check tickets and permits stay in server memory; the notebook wire has no recommendation commands. New input revokes permission before microphone acquisition, and no new check can begin during capture, pending provider commit or final extraction. Touch corrections, shutdown, deadline and uncertain cleanup revoke display and queued speech immediately. A replacement cannot revive an earlier capability. A separate internal input-start hook preserves the existing browser message order.

Nine focused checks and one additional SQL-backed owner scenario cover these boundaries. All 878 prototype checks across 63 files, type checking and build pass. The isolated harness passes 50 SQL checks, eight owner scenarios and fourteen browser scenarios. This remains synthetic authorization preparation: a trusted checker must independently validate the exact draft against confirmed notes and saved preferences. No real candidate generator, production preference agent, speech transport, provider call, remote database change or deployment is included. D21/D22/D26 and Phase 1 remain partial.

## Internally checked synthetic candidates, 10 October 2026

The disabled server owner now captures a bounded immutable candidate and derives its sample display/speech description from the same checked attributes. Its completion method runs checkFixture against the authoritative notebook itself; callers cannot supply a passed result. Exact tickets, revision checks and session readiness still apply. Malformed replacement data revokes the previous sample. Exclusions are copied/frozen; arbitrary description fields are rejected. The narrow checker holds missing or tentative required fields, unknown wardrobe/season matching, conflicting colors/style/occasion/look type, and unverified or excessive prices. Its candidate exclusions are synthetic inputs, not a connection to persisted customer preferences.

Sixteen additional focused checks bring the prototype suite to 894 across 64 files; type checking and build pass. The isolated database evidence remains 50 SQL checks, eight owner scenarios and fourteen browser scenarios, with the owner scenario now using internal candidate validation. No real product source, saved-profile preference agent, live speech, provider activation, remote change or deployment is included. D26 has independent discovery preparation only; its R1 dependencies and acceptance remain open.

## Confirmed voice correction and separate preference authority, 10 October 2026

Two additional SQL-backed owner scenarios exercise the actual prepared extraction and look checker. The first submits two synthetic PCM/transcript turns, waits for final extraction, holds tentative notes, confirms green and then blue, cancels queued speech, denies the old green candidate and releases only a freshly checked blue sample. End clears notes and closes the synthetic ledger once. The second changes a separately injected simulated profile, revokes speech/display and pending checks, rejects candidate-supplied exclusions, and holds invalid profile data without a new reservation.

Added SimulatedPreferenceSource as server-only, revisioned in-memory fixture authority for color exclusions. Constraints are normalized, copied and frozen; stale updates are refused and malformed updates permanently hold that source. Candidate input now rejects excludedColors entirely. The owner checks the profile revision and applies the source's exclusions internally; source changes synchronously invalidate the notebook and current permit. Cleanup unsubscribes the session. No conversation or browser command can update this source. When no source is injected, the existing isolated harness uses an empty synthetic profile, not a claim that a real customer has no preferences.

All 907 prototype checks across 65 files, type checking and build pass. The isolated PostgreSQL harness passes 50 SQL checks, ten owner scenarios and fourteen browser scenarios. Fixed a missing TypeScript Omit parameter during validation and reran all checks. These are synthetic providers/devices and local database evidence. No customer profile storage, authenticated ownership, session exceptions, semantic preference agent, real products, paid call, remote database change or deployment is implemented by this work. D21/D22, D26/D39 discovery and D41 remain partial; R1 dependencies and Phase 1 gates remain open.


## Simulated clarification messages and notebook presentation, 10 October 2026

Prepared a strict versioned clarification decoder and an explicitly simulated client. Only current session/notebook/profile/check bindings and whitelisted field/reason pairs are accepted; private saved values, rule IDs, profile commands and look permissions are rejected. Messages are copied and frozen. Notebook changes, local edits, new input and termination clear old explanations. A local invalidation barrier rejects delayed restoration until a newer notebook revision; an explicit server clear is accepted while that barrier holds.

The simulated NoteBrowserController and PreparedBrowserNoteSession now accept these safe messages, notify presentation callbacks and clear explanations before sending begin/edit/confirm commands. Malformed, replayed or stale explanations and renderer failure end the connection and clear notes. The command slot is reserved before the clear callback, preventing a reentrant renderer from sending an overlapping edit. The protected server bridge does not publish these messages yet; the standalone three-step notebook review uses scripted messages rather than a real saved profile or network connection.

The notebook review uses the existing paper styling, static accessible field/reason wording and a held-suggestion message. Implementer browser verification passed showing Emerald green with its explanation, editing to Blue with the explanation removed, and ending with the temporary note removed. This is not Sabine's acceptance or physical-phone accessibility verification.

Fifty-one additional checks bring the prototype suite to 1,040 tests across 71 files; type checking and build pass. The isolated database regression also passes: 50 PostgreSQL checks, thirteen SQL-backed owner scenarios and eighteen SQL-backed browser scenarios. D42 is independent preparation only; Task 1c and Phase 1 remain incomplete. No paid request, allowance change, remote configuration, customer-profile persistence or Render deployment occurred.


## Protected clarification delivery and connected rehearsal, 10 October 2026

The explicitly simulated server owner now publishes safe clarification records and clears through an injected callback. Note/profile changes, replacement checks, new input, unavailable state and cleanup invalidate the record. Publication failure ends the owner and closes the synthetic allowance once. A reentrant clear callback cannot begin another check after ending the session.

The protected loopback bridge binds publication to its original socket and session. Clarifications have a separate 512-message bound, strict copied/frozen decoding and exact notebook-session/revision checks. Initial delivery waits for readiness and notes. Unsafe fields, stale revisions and overflow close the connection. The browser cannot publish clarifications, save profiles, create exceptions or authorize looks. A server-only simulation observer supports integration checks; observer failure closes the owner without an unhandled rejection. The application server still does not attach this bridge.

The local connection rehearsal now renders safe explanations through the prepared browser-session callback. Its seven-step script includes confirmation, a scripted held preference check, a Blue correction that clears the explanation, final confirmation and end. Implementer browser verification passed all seven steps. This in-page scripted check does not connect to the protected server or an actual saved profile; real loopback server delivery is checked separately. Sabine's new-flow and physical-phone acceptance are pending.

Nineteen additional prototype checks bring the suite to 1,059 tests across 72 files; type checking and build pass. The isolated PostgreSQL harness passes 50 SQL checks, thirteen owner scenarios and nineteen browser scenarios. The added SQL-backed scenario verifies safe explanation delivery, touch correction, profile revision, session end, fresh-session isolation and two correctly closed synthetic ledger records. Initial harness typing errors were fixed before the final passing run. No paid request, actual Supabase/legacy record change, allowance amendment or Render deployment occurred. Task 1c, D21/D22 and Phase 1 remain partial; D42 remains independent discovery/prototype preparation with its R1 dependencies open.


## Multiple-field clarification and keyboard review, 10 October 2026

Extended the explicitly local connection rehearsal with scripted issues for Color, Style and Budget. Style remains tentative and Budget remains missing; neither an explanation nor a simulated requirement change confirms these values. Two rapid scripted profile revisions replace the list with only the latest Style issue. All explanations stay held, with no profile save, override or look authorization. The original seven-step review remains, with complete additional-check instructions shown before use.

Two protected loopback tests exercise actual server reconciliation with multiple saved requirements: tentative spoken Color requires confirmation while an uncertain saved Budget remains unresolved; confirming Color leaves only Budget. Rapid server profile changes/checks leave only the current revision and issue. The in-page review remains scripted and does not claim a connection to that protected server.

Implementer browser verification passed Enter activation, Tab navigation, retained button focus across successive requirement updates, the three-field issue list, replacement with only Style, and keyboard end/clear. Unit presentation checks cover all seven readable field labels, polite atomic announcements and replacement lists. No actual screen-reader speech or physical-phone acceptance was tested.

Thirteen new checks bring the prototype suite to 1,072 across 72 files; type checking and build pass. The isolated database regression passes 50 PostgreSQL checks, thirteen SQL-backed owner scenarios and nineteen SQL-backed browser scenarios. Task 1c and Phase 1 remain incomplete; D42 remains independent preparation with R1 dependencies open. No paid call, remote configuration, allowance amendment, saved customer data or Render deployment changed.


## Connected notebook touch editing, 10 October 2026

Implemented labelled touch editing for all seven rehearsal fields and confirmation for tentative non-budget notes. Native modal editing supports Escape/Cancel, returns focus to the Edit button, and retains a rejected draft for explicit reload/review. Budget editing requires an explicit bounded USD maximum and item-price scope acknowledgment; it does not infer currency, targets, ranges, tax or shipping coverage. No saved profile is changed.

Drafts bind to the connection ID, notebook epoch and displayed field revision. The browser rejects stale drafts before sending; the server retains its existing revision check. Notes update only after server publication, while edits clear obsolete clarification immediately. Connection loss/end clears notes and removes the editor. A fresh preference check is still required; an edit grants no visual or speech permission.

Seventeen focused additions bring the suite to 1,089 passing tests across 73 files; type checking and build pass. Fifty isolated PostgreSQL checks, thirteen SQL-backed owner scenarios and nineteen SQL-backed browser scenarios also pass. Implementer browser checks passed Escape cancellation/focus restoration, explicit budget scope, acknowledged USD 350 update, style correction clearing three old issues, row confirmation focus and end clearing. A lost-focus issue when Confirm disappeared was fixed by returning focus to Edit before sending. Screen-reader speech, physical-phone touch acceptance and actual provider timing remain unverified.

Complete optional manual instructions are in docs/notebook-touch-review.md. Earlier accepted review steps remain retained. Task 1c, D42/R1 and Phase 1 remain incomplete. No paid request, new allowance, Supabase change or Render deployment occurred.
