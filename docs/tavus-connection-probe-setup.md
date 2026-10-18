# Connection-only replacement probe

## Approved scope

18 October 2026: Sabine replaced the unused full styling trial. One room/start, five included minutes, $0 additional charges. Fixed neutral replies only. No retry, upgrade, paid OpenAI request, notebook extraction/confirmation, outfits, shopping or recommendation release. Original reservations and $51 historical allocation remain unchanged. No room, provider configuration, credential or new reservation has been created.

## Implemented locally

Dedicated strict zero-charge record and transitions, consumed before creating a room. No runtime initializer, reset or refund. Same-process competing starts and independent durable-store owners admit only one. Restart after reservation holds. Room identity cannot change. End requires a known room and provider-ended confirmation. Uncertain creation/closure holds permanently. The service starts its absolute clock before reservation/create and stops work at 270 seconds, leaving cleanup headroom within the 300-second provider maximum. Owner heartbeat loss stops work. A late create response is awaited and cleaned up once, without creating a replacement.

A separate provider ingress authenticates a per-probe Bearer credential, requires the exact host/path, bounds JSON to 32 KiB and a three-second body timeout, and emits constant OpenAI-compatible SSE. User text cannot change the reply. It stores no request body/transcript and performs no upstream AI request. Browser Basic/cookies do not authenticate this ingress. The larger protected styling owner and its history infrastructure are not mounted.

## Concrete hosted security change prepared for review

File: `prototypes/voice-avatar/supabase/cvi-connection-probe-preparation.sql`. Sabine approved this guard and the verified backup-proof refresh. Applied in the existing project; live readback verifies the $0 unused row and restricted privileges. No reservation was consumed.

Adds one private schema/table and fixed zero-charge approval row, immutable validators and two narrow public RPCs. Only the existing server-side service role may execute read/change. Public/anonymous/customer roles have no execution rights. Even service_role has no direct table access, initializer, deletion or reset RPC. Compare-and-swap locks the row and validates every transition. Existing trial tables/functions/records are untouched.

The current database-only backup job rejects unexpected schema changes. Applying this SQL would change its fingerprint. Therefore the change must be accompanied by a newly captured schema, local restore rehearsal and verified replacement proof for the additive schema, before normal scheduled operation. Preserve the old proof/archive, all attempt/usage history, original expiry and free-budget limits. Do not disable schema validation, reset counters, unhold a failed attempt or initiate an extra backup transfer. A failure remains held under the existing stop-on-failure policy. Backup credentials cannot be reused for probe administration without the applicable authorization.

Local SQL checks passed using isolated PostgreSQL 17 with networking disabled: role denial, fixed limits, row-locked racing reservations, no refund, immutable room identity, terminal state, denied deletion and consumed-state dump/restore (21 checks). This is not evidence that hosted permissions or the current hosted backup snapshot have been verified.

## Remaining implementation and preflight

1. Local provider/HTTP/page/Daily implementation, 1,763-test prototype regression, typecheck and build pass. Built browser page verified unavailable with Start still disabled after consent; no microphone. Active media/device behavior and hosted runtime/configuration readback remain open.
2. Complete: guard applied/read back; fresh 498,998-byte encrypted candidate captured under a separate nonrefundable source-egress reservation, 32 actual local restore checks passed with container cleanup, matching schema fingerprint published and original proof preserved. No B2 transfer, scheduled attempt or schedule change. The failed first local startup receipt is retained; waiting for final TCP readiness fixed the rehearsal.
3. Use existing protected preview and existing server credentials only. Fresh callback credential, operator-controlled PAL provisioning, no automatic room. Configure and read back explicit Cartesia/model/voice/custom endpoint; no auto/fallback provider, tools, perception, recording or persistent memory. Any incompatible readback holds.
4. Refresh actual Free-account quota/concurrency and $0 conditions before enabling Start. Account display may lag, so refuse insufficient or uncertain headroom. No additional charge is authorized merely because a card exists.
5. Sabine starts only after visible complete instructions and consent. Observe native request/SSE delivery, audible Cartesia/avatar, interruption and ending. Browser closure is not proof of provider deletion or final billing. This does not close full styling acceptance or any production criterion.

References: [custom LLM contract](https://docs.tavus.io/sections/conversational-video-interface/pal/llm), [PAL API](https://docs.tavus.io/api-reference/pals/create-pal), [private conversation API](https://docs.tavus.io/api-reference/conversations/create-conversation).

## Backup readiness after proof refresh

Read-only readiness returned waiting, empty-source-database scope, unchanged next-due and expiry, with no operator hold. The scheduled job was not run or rearmed. Operations regression: 596 tests pass.
