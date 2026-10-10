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
