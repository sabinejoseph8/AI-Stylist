## Later local restart rehearsal

See docs/local-tavus-replay-restart.md for the required replay-port factory, disposable durable journal and fresh-process evidence. The volatile limitation below still applies to the original no-port fixture. Neither variant is hosted or accepted for live Tavus use. Coordinated journal rollback, credential revocation and real provider correlation remain open.

# Local protected CVI endpoint candidate

Sabine approved local safeguards and tests on 15 October 2026, with no new spending or hosted changes. This extends the disconnected flow in docs/local-tavus-cvi-styling.md. It is a Request/Response harness only: no listener, public route, environment credentials, provider, account, room or media device is connected. Only tests import it.

## Proposed request boundary

One endpoint owner captures one fixed HTTPS origin, fixture conversation ID, injected 64-hex-character bearer secret and absolute fixture expiry. Secret comparison uses Node timingSafeEqual after equal-length checking. Mutable caller configuration cannot change this binding. Tokens in tests are public synthetic constants, not credentials. There is no new credential storage or rotation.

Only POST `/v1/chat/completions` is accepted. Query strings, unexpected origins/paths/methods, conflicting explicit Host, browser Origin/Cookie, wrong/missing/combined credentials, mismatched conversation, unsupported content type/encoding, invalid request IDs and pre-canceled requests are refused before draft work. Forwarded headers never select authority. The harness assumes a trusted Request constructor/HTTP adapter; it does not resolve real ingress, TLS or upstream log guarantees.

Proposed metadata headers are `X-Cvi-Conversation` and `X-Cvi-Request-Id`. They are a test contract, not documented Tavus-generated or signed identifiers. The bearer belongs to this single owner. A holder can impersonate that conversation. No body field or header can select another owner or provide notebook confirmation authority. Live binding/secret delivery, request IDs, retries and supported request fields must be independently verified before connection.

Body reading is capped at 16 KiB regardless of Content-Length, with fatal UTF-8 decoding, JSON shape checks and a total operation deadline covering body read, preparation and unconsumed response delivery. The minimal fixture envelope accepts only model=local-simulation, stream=true and bounded textual user/assistant/system messages. Unknown fields, tools and multimodal content are rejected. Prompts are deliberately not used to mutate notes or confirm requirements; trusted app updates remain separate. This is not complete Chat Completions compatibility and does not yet extract notes from actual Tavus transcripts.

## One-use request and delivery lifecycle

- Up to 64 authenticated, well-headed request IDs per owner are retained without refund. Failed body/check, busy, canceled and completed attempts cannot reuse an ID.
- One operation owns the response until delivery, cancellation or timeout. A competing valid request is refused and its ID stays consumed, rather than replacing pending work.
- Complete text is withheld until the existing CVI gate approves it against current notes.
- A response body with highWaterMark=0 performs the final check on first pull. Cancellation, expiry, terminal owner, correction or interruption prevents unsent output.
- The total deadline stays active while a response waits to be consumed. An expired old response cannot clear a newer operation's ownership.
- Malformed data and unknown/check failures return fixed errors, without provider details or generated speech fallback. Every response is no-store/no-referrer/nosniff. No CORS permission or browser cookie is issued.
- End cancels the active request, clears notes through the flow and permanently closes the owner. Nonmonotonic/invalid/throwing clock reads close the owner rather than extending its authority.

Cancellation asks simulated work to stop but does not prove a remote provider stopped. Once SSE bytes are delivered, this endpoint cannot recall downstream buffered audio. Tavus error/fallback speech, greeting, speculative inference and playback still need actual observation. A blocked HTTP response is not evidence that Tavus remains silent.

## Tests and evidence

53 new tests cover valid composition, wrong credentials/conversation/Host, forwarded header isolation, immutable config, minimal schemas, bytes/UTF-8 limits, prompt authority separation, duplicates, bounded evidence, concurrency, body/read deadlines, canceled and unconsumed delivery, clock rollback/expiry, terminal owners, checker failure and redaction. Existing full-CVI gate tests exercise simulated outfit checking. No real payload, voice or photo is used. All 1,472 foundation tests across 135 files, type checking/build and 16 local Memory checks pass. Backup/operations tests and real device checks were not rerun for this disconnected server candidate.

Volatile replay limitation is explicitly tested: recreating the owner with the same binding permits the same request ID. Restart protection is not implemented here. Real activation requires a permanent reservation plus fresh, revoked-on-restart per-conversation credentials or proven durable admission; neither is inferred from the 64-entry Set. Aggregate one-consultation limits, real spend/time guards, distributed workers and proxy body/request bounds are separate requirements. A requester can consume the local fixture limit if it holds the secret. The fixture numbers are local resource caps, not a new production retention or spending policy.

No business requirements, task completion counts, $51 allocation, held records, voice selection or production architecture change. Real provider compatibility and acceptance remain open. Local Memory is refreshed only; GitHub and hosted Memory are unchanged.

## Exact next action

Prepare a live-readiness checklist and disconnected consultation-owner adapter covering fresh credential lifecycle, restart refusal, durable experiment reservation, authenticated app note updates and actual Tavus request correlation. Before hosted activation, verify the permitted non-ElevenLabs voice and current account entitlements, then present one priced bounded trial for explicit financial/private activation approval. Do not mount this fixture as a production endpoint.
