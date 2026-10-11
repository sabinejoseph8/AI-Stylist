# Notebook live adapter boundary design

Prepared: 11 October 2026. Disabled engineering design, not activation or spending approval.

## Current implementation status, 11 October 2026

The disabled startup controller is now composed into the protected server owner and loopback browser bridge. Exact private access and allowance checks run before transport construction; startup readiness is awaited before Ready is published. Pending opening cancellation keeps the owner closing until late sockets are handled, then remote-required cleanup retains a hold. Existing already-open simulation remains a separate explicit factory choice. These are injected simulations, not a live opener or route. The current full suite passes 1,191 tests across 78 files, type checking and build. Two startup-backed synthetic turns, extraction, touch corrections, stale-look/speech revocation and fresh-owner isolation now pass. Cancellation during pending extraction also rejects late work. The future opener boundary has been reviewed; no real opener, credential loader or live route exists. The next preparation is the separately disabled socket opener described below.

## Scope

Prepare one private notes-only connection with two turns and an 85-second owner deadline. No avatar, camera, saved customer profile, recording, shopping or customer launch. The existing simulation owners remain explicitly simulated. Do not change their discriminator to make a live connection work.

The candidate endpoint and selected models remain those in transcription-connection-plan.ts and the approved extraction preparation. The selected-model startup URL has no live acceptance evidence. This document makes no new provider-contract claim.

## Ownership and access

A future server-only composition root must explicitly construct live transports after private request authorization and a successful dedicated durable reservation. It must load keys from private server settings, never browser configuration or request payloads. It must have no automatic initializer, retry, fallback provider or legacy-ledger access. Missing configuration fails before resource creation.

Use exact GET/path/Host/Origin checks and the private-preview access gate before upgrading or reserving. Bind the accepted socket to one opaque owner, revisioned commands and bounded audio frames. The browser cannot select a provider destination, model, credentials, cleanup requirement or reservation identity. No new live route is implemented by this design.

## Startup and microphone boundary

1. Authorize the private request and reserve the dedicated allowance.
2. Open exactly one candidate provider socket with server authentication. Start the owner deadline before awaiting startup; cancellation must cover pending opening as well as active work.
3. Require the connection-bound session.created before sending session.update. Do not replay configuration or reconnect on missing, malformed, duplicate or unexpected startup events.
4. Validate session.updated against the selected transcription type, model, PCM format/rate and manual turn configuration before reporting Ready. An open WebSocket is not readiness.
5. Start browser microphone capture only after that readiness and an explicit user gesture following the privacy notice. Reject earlier or late audio. Commit each bounded turn and correlate provider results by item_id.

The current simulated provider factory sends configuration to an injected already-open socket. It cannot be reused as a live startup controller without this separate handshake boundary and tests.

## Shutdown and accounting

End, deadline, abort, disconnect or provider failure must synchronously revoke note/look publication and stop local capture. Cancel pending extraction, detach listeners, discard late results and request transport closure once. Redact diagnostics and retain no transcript or media in allowance records.

Use the remote-verified cleanup requirement for every provider-created live attempt. A normal code-1000 close proves transport closure only. Completed transcript events prove receipt of those items only. Neither verifies remote termination, final usage, deletion or retention. No current provider evidence can set remoteCleanupVerified=true.

Therefore an attempt that created provider resources retains its open reservation and blocks replacement until an independently reviewed resolution exists. Local ending may finish while the reservation remains held. The UI must distinguish microphone stopped from provider cleanup unverified, without claiming a refund or deletion. Cancellation before any provider construction may retire a late successful reservation once, as checked in the simulated owner.

## Required implementation evidence before activation

| Boundary | Focused checks required |
| --- | --- |
| Access/configuration | Unauthorized and wrong-origin requests create no provider or reservation; missing keys fail safely; browser values cannot select destinations or waive cleanup. |
| Startup | Opening timeout/abort, wrong-owner events, missing/duplicate session.created, malformed configuration acknowledgment and premature audio fail without retry. |
| Cancellation | Abort before open, during configuration, during extraction and after end leaves no active local capture or publish capability. Late open must be closed once. |
| Cleanup/ledger | Every provider-created ending retains the unresolved hold, including a fresh process reading PostgreSQL; no replacement provider or closure write occurs. |
| UI/privacy | Complete notice and manual script are visible before the microphone gesture; stopped media and unresolved remote cleanup have separate messages. |

After implementation, run the phase suite, type checking/build, isolated database checks and review the affected code. Only then make any security-sensitive deployment or specific financial/activation request. The USD 2 trial proposal remains unapproved. This design does not add a credential path, create sockets, initialize remote storage or deploy anything.


## Disabled implementation checkpoint, 11 October 2026

prepared-note-startup.ts now owns the simulated opening deadline and creation/configuration sequence, including early creation envelopes, late returned sockets and cancellation. It delegates configuration validation to the existing prepared provider session and exposes that session only after readiness. Initial observation remains attached until readiness to reject duplicate creation during configuration, then detaches. The injected opener must deliver initial events from its first packet and honor cancellation for resources not returned. There is no real opener, live route or key loader. Integration with the protected owner/allowance is next, and the remote-cleanup hold is not relaxed. Twenty-seven new tests pass within 1,173 total checks, with type checking and build.

Startup exposes openingSettled separately from end(): cancellation stops local work immediately, while openingSettled resolves only after the injected opener returns or fails and any late returned socket has been closed. Protected-owner composition must await that settlement or retain a hold, never retire a reservation while opening is still unresolved. This promise establishes local opening settlement only, not verified remote cleanup. The late-open cancellation/deadline/end checks explicitly verify this distinction.

The startup-backed protected compositions also pass isolated PostgreSQL checks: final totals are 50 SQL checks, 17 owner scenarios and 24 browser scenarios, including fresh-process unresolved holds. No remote database was used.


## Next disabled opener preparation

The startup controller currently trusts the injected opener to observe the first packet and clean up resources not yet returned. Prepare and test that ownership boundary next with an injected transport constructor and synthetic events only. A real destination, key loader, invocation and route remain absent. An open transport does not imply configured readiness or verified remote cleanup. Do not attach it to the running application or weaken the unresolved reservation hold.
