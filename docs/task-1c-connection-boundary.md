# Task 1c connection boundary preparation

Status: disabled simulated preparation, 10 October 2026.

## Reviewable contract

- The future server authenticates a connection before calling open. It supplies an opaque connection object, not a user ID from the message body. The current module does not authenticate anyone.
- open returns a random session ID and admits one simulation at a time. No browser route calls it today.
- Commands require version=1, sessionId, sequence and type. begin additionally requires turnId; rendered requires receipt. commit and end permit no additional fields.
- The connection reference, session ID and increasing sequence must match before invoking the session owner. A foreign command cannot end the legitimate owner's session.
- Provider events use a server-bound callback, separate from browser commands. Browser messages cannot supply provider events through the command schema.
- Disconnect/end retire the session. No reconnect or silent retry occurs. Failed cleanup holds the slot. New sessions receive new identities; old callbacks have no authority.
- The module contains no network client, credential loading or live activation path. Simulation must be explicit. Its one-process slot is not the future production distributed lease.

## Remaining network work

The HTTP/WebSocket upgrade still needs existing private preview access checks, exact origin/host checks, bounded frames and transport queues, connection deadlines, socket cleanup and private settings. The UI still needs a bridge and safe display updates. Customer Supabase authentication and production isolation remain Phase 2 work. Live activation also needs a separate allowance because all nine prior trials are closed and the reserve is exhausted. No phase or task group is marked complete by these checks.

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
