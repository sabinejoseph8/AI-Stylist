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

554 tests across 41 files, type checking and build pass. Tests use synthetic inputs and mocked providers. They do not prove real provider behavior or authorize additional spending.

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
