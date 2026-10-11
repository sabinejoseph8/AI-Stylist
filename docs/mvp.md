# AI Stylist MVP scope and discovery findings

Updated: 10 October 2026
Status: Working memory from approved requirements and actual findings. Phase 1 feasibility and launch are not approved by this file.

## Current memory checkpoint, 10 October 2026

989 prototype checks across 68 files, type checking and build last passed. Separate isolated verification passed 50 SQL checks, thirteen SQL-backed owner scenarios and eighteen SQL-backed browser scenarios. These are simulated providers/devices with local PostgreSQL and loopback connections, not real transcription quality, hosted notebook acceptance or production readiness.

The server now internally checks immutable synthetic candidates against its own notebook and revokes visual/speech permission on input, correction or termination. This does not implement the independent saved-profile agent or validate real product suitability. D21/D22 and Task 1c remain partial; D26 has discovery preparation only, with R1 dependencies open. Phase 1 remains incomplete.

**Next action:** Prepare strictly decoded simulated browser clarification messages and notebook presentation from the safe server records. Bind them to the current session and notebook revision; clear them on edits, replacement or end. Expose no saved values, profile commands or authorization capabilities. Use synthetic events and focused UI/protocol tests; keep live services disabled.

**Remaining gates:** Tavus recovery clarification, current dedicated transcription startup/delay contract, a new paid-trial allowance, permitted retailer/feed imagery and affiliate access, customer-provider privacy terms, and customer restart recovery remain open. All nine approved provider attempts are closed and the reserve is zero. No new spend is authorized; do not reset or reuse legacy reservations. Sabine asked to skip latest spending checks. The unsent OpenAI clarification draft has no send authorization.

This review reconciles all five memory files without changing approved scope or treating technical proposals as new business approvals. Supabase + Render remains the selected hosting; the private prototype exists, while customer accounts/isolation and complete app delivery remain pending.

## Purpose and audience

A phone website for women and men shopping in the United States, combining owned clothing and real products into one personalized look at a time. Customers create an account, then describe their preferences naturally to a consistent photorealistic female AI stylist. Affiliate commissions are the intended revenue source. Retailer checkout remains external.

## Source authority

The v1.8 PRD and prioritized backlog are the original artifact baseline. Later explicit Sabine decisions and approved Project Memory/product-spec.md and design.md refine that baseline: say look, show one current look, provide real shopping links for launch, use USA/USD and require accounts. Project Memory/tech-spec.md records architecture decisions and proposals; docs/progress.md records dependencies and acceptance gates. docs/development-backlog.md preserves each original task and tracks working status. If this file differs from those agreed decisions, update this file. Do not silently replace business scope.

## Required MVP behavior

- Email/password with recovery, Google and Apple sign-in before styling; no compulsory preference questionnaire.
- Preferences collected during the first conversation, with explicit choices for saving reusable preferences.
- Natural interruptible conversation, captions and touch/text alternatives, consistent female avatar and understandable connection states.
- Progressive notebook with occasion, season/date, color, style, budget meaning/currency, look type and owned clothing. Missing and uncertain details stay explicit; corrections take precedence over old events.
- Actual item images visible in the notebook, local permission controls, customer-confirmed stills, owned versus inspiration distinction and an explicitly saved digital wardrobe.
- One complete look at a time, real permitted product imagery/links, honest USD item totals, owned items excluded, and size/delivery uncertainty explained.
- Independent validation before display and recommendation speech, including swaps, restored looks and shopping-list additions. Saved requirements are not silently weakened.
- Likes, dislikes, requested changes and kept items, at least three refinement rounds, comparison and undo with fresh validation.
- Saved looks contain only the look, not notebook, feedback, transcripts or session history. Shopping-list and deletion/export controls are separate.
- Customer isolation, separate media/storage consent, accessible controls and failure recovery.

## Current prototype boundary

The open notebook is a local simulation. It supports paper-style notes, edits, uncertainty, stable image references, fixture recommendation gating and a separate connected-session rehearsal. The new internal catalog uses four original drawings and sample prices. It has no checkout and is not real inventory. The accepted voice/avatar experiment is separate from this notebook. No full signed-in customer app or real retailer integration is claimed.

## Actual findings

- Task 1a planning accepted; Supabase + Render, React/TypeScript and Node/TypeScript approved.
- Supabase handles accounts, saved preferences, photos and saved looks. Its additional durable private-test ledger role was separately approved and verified.
- Desktop and physical iPhone generated speech/avatar mouth movement and interrupt-and-end accepted. Continuing conversation after interruption remains unproven pending Tavus technical clarification.
- Sabine accepted the original 18-step notebook review and seven-step local connection rehearsal. Neither establishes real partial-speech extraction timing.
- D02 catalog contract and two synthetic format adapters pass shared checks. D03 original illustrated fixtures support search. Agent browser checks confirm item display, search, loaded image and empty state.
- Public source review does not establish any retailer/feed/image permission. The reviewed historical ASOS network program is closed. FARFETCH advertises an affiliate feed, with project-specific eligibility and terms unverified.

## Success criteria and evidence required

Use product acceptance A01 through A21 and the phased tests in docs/progress.md. In particular, demonstrate progressive notes before turn end with representative two-second p95 evidence, customer corrections without stale overwrite, no unvalidated look card or recommendation speech, stable confirmed photos, three feedback rounds and account isolation. Mock checks establish logic only. Real provider quality, permissions, physical devices, live catalog facts and customer-facing privacy need separate evidence.

## Risks and open decisions

| Risk | Current consequence | Next evidence/action |
| --- | --- | --- |
| Avatar interruption/resume | Cannot claim continuous conversation | Sabine supplies Tavus recovery reply; implement the supported contract and test within a separately authorized allowance. |
| Exhausted experiment allowance | No additional paid test may start | All nine attempts remain closed; reserve zero. New spending requires explicit financial authorization. |
| Real product access and rights | No shoppable launch | Select and approve a permitted program/feed and imagery terms; no scraping or assumed approval. |
| Provider privacy | Private test consent does not authorize customer launch terms | Resolve no-training/DPA/retention requirements before customer media launch. |
| Customer restart recovery | Prototype notes may be lost | Sabine accepted volatility only for private prototype; resolve customer recovery behavior before launch. |
| Customer security | Account/isolation implementation not yet built | Complete Phase 1 exit, then owner-scoped migrations/auth and independent-user tests. |
| Capacity and operating cost | One simultaneous launch consultation only | Measure provider unit cost/load and approve any expanded hosting or capacity separately. |

## Assumptions and engineering decisions

Routine technical decisions may be made autonomously under Sabine's 10 October instruction, with important assumptions recorded. Existing agreed business scope, provider exclusion, consent boundaries and spending caps remain binding. A one-day maximum evidence window is a fixture policy only; a real source needs a contract-specific freshness rule. Demo artwork provenance is recorded locally; it implies no retailer endorsement. No later phase exit is marked complete from isolated discovery code.

## Remaining gates

Phase 1 remains open. Its live media/notes/gating/timing findings, required rights/privacy resolution plan and final review must be complete before the full foundation build is treated as unlocked. No production deployment or public launch is authorized by autonomous development mode.

## Combined notebook integration evidence

On 10 October 2026, the prepared provider session was connected through the disabled private browser bridge and visible local rehearsal. Seven new integration checks cover two turns, confirmation, stale-response protection, cancellation, cleanup holds, immediate provider-failure notification and configuration-acknowledged readiness. Implementer browser verification passed the two-color correction, confirmation and End clearing. All 711 tests across 50 files, type checking and build pass. Live speech, measured timing, safe avatar resume, licensed products and customer launch remain unproven. The experiment allowance is unchanged.

### Combined seven-field scenario evidence

All 714 automated checks across 51 files, type checking and build pass. Three new synthetic scenarios cover all seven tentative fields, missing/ambiguous timing and budget values, confirmation-based fixture holds, and a budget correction invalidating the old release ticket. An over-budget sample remains blocked after confirming the lower maximum; owned items hold until matching exists. This does not prove live model quality or a production preference validator. Next: combined browser page-lifecycle and late-permission cleanup checks.

## Combined lifecycle evidence and cleanup ordering

On 10 October 2026, seven new combined loopback scenarios checked page exit, hidden state, late permission, provider failure, device loss, connection loss and cancellation during extraction. A regression proved that the owner callback could observe cleanup before a capture failure was recorded. The callback is now deferred to the next microtask so shutdown completes first; terminal capture release is attempted even when the stop step throws. All 722 tests across 52 files, type checking and build pass. This is synthetic-device evidence, not live provider/Safari acceptance. docs/phase-1-readiness.md consolidates remaining gates. Next: session-replacement isolation through the combined bridge.

## Combined replacement and release isolation

Four additional synthetic integration checks verify old extraction/provider isolation after replacement, rejection of a prior connection render receipt, refusal of replacement after cleanup failure, and immediate visual/speech-frame permission revocation after a budget correction. All 726 tests across 53 files, type checking and build pass. No real playback or live cleanup is established. Next prepare a bounded combined-note trial plan and full manual instructions while leaving activation disabled.

The next proposed real-input experiment is notes-only, with no avatar/camera/shopping. Its full future script and prerequisites are in docs/combined-notes-live-trial-plan.md. It needs a concrete new trial allowance before activation; safe avatar resume still separately awaits the Tavus technical reply. This is a proposal, not a change to the approved MVP scope or privacy terms.

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


## Separate profile invalidation through the browser, 10 October 2026

The protected simulated bridge accepts an optional server-injected SimulatedPreferenceSource. A valid source change synchronously revokes old look and speech permissions and publishes the notebook revision plus existing session notes. Raw saved constraints, profile-save operations and look authorization remain outside the browser protocol. Changes during startup wait for readiness; changes during extraction preserve the field-level correction rules. A malformed source stops capture, cancels extraction, clears notes and retires a late confirmed reservation without constructing a provider. The held source refuses new reservations. Session cleanup removes its subscription, so later profile updates affect only the current replacement.

Seven new focused loopback checks and three new SQL-backed browser scenarios cover these paths, including rejection of a browser profile-save command. All 914 prototype checks across 65 files, type checking and build pass. Separately, 50 isolated PostgreSQL checks, ten SQL-backed owner scenarios and seventeen SQL-backed browser scenarios pass. Fixed a duplicate local variable in the database test script and reran verification. These are synthetic devices/providers and local database checks. Real customer profiles, identity ownership, semantic preference validation, paid trials and hosted acceptance remain pending. No remote configuration, legacy records, allowance or deployment was changed. D21/D22, D26/D39 discovery, D41 and Phase 1 retain their existing incomplete status.


## Rapid corrections, timing accuracy and reentrant closure, 10 October 2026

The connected browser checks now interleave successive simulated profile updates with a touch correction and final speech settlement. Blue stays confirmed despite an older green transcript; a subsequent voice turn can propose red tentatively. Old render receipts cannot acknowledge the newer notebook. A fresh current receipt is accepted, while raw saved exclusions remain outside the browser protocol.

Fixed two issues. First, superseded render samples remained pending until an acknowledgment or session end. The coordinator now watches notebook revisions and immediately cancels obsolete unrendered receipts. Previously rendered timing evidence remains intact; cancel removes the subscription and reset restores it once. Second, synchronous publication during cleanup could re-enter end before its shared completion promise existed and attempt durable closure twice. The server now installs that promise before cleanup. Repeated ends share one operation; publication failure still stops and clears safely, with uncertain cleanup held.

Six new prototype checks bring the suite to 920 across 65 files. Type checking and build pass. Separate isolated verification passes 50 PostgreSQL checks, twelve SQL-backed owner scenarios and eighteen SQL-backed browser scenarios. The new owner regression initially failed on duplicate closure, then passed after the fix. These are synthetic provider/device and local database results. No real profile access, hosted configuration, paid trial, spending allowance, legacy ledger or deployment changed. Task 1c and Phase 1 remain incomplete; D21/D22 and D41 retain prototype-only status, with D26/D39 discovery separate from R1 implementation.


## Versioned saved-preference contract discovery, 10 October 2026

Prepared a strict version 1 server-only contract for required, excluded and optional preferred rules over the seven notebook fields. Rules carry confirmed/uncertain status, bounded values and a profile revision. Exact keys, unique IDs, bounds, immutable copied snapshots and malformed-data holds prevent unknown authority or automatic save/exception fields from entering the contract.

The pure reconciliation step preserves saved hard rules and confirmed session constraints separately, keeps optional ranking and uncertain preferences distinct, and requests clarification for unresolved requirements, excluded requests, tentative values or conflicting saved rules. It never saves a preference, creates an exception or approves a look. Comparison is lexical only; budget parsing, subjective meaning, full-look validation, feedback/kept-item and anchor semantics remain separate. The existing simulated color source now produces this contract, and the owner runs reconciliation before its existing narrow candidate checker. Only color exclusions are currently supplied by that integrated source.

Twenty-eight contract fixtures and one source-adapter check bring the prototype suite to 949 across 66 files. Type checking and build pass. The existing isolated suite was rerun with the integration and passes 50 PostgreSQL checks, twelve SQL-backed owner scenarios and eighteen SQL-backed browser scenarios. Corrected a parameterized-test array that was being expanded into separate arguments, then reran verification. docs/preference-contract-discovery.md records the shape, merge rules and limitations. No real customer profile access, saved-profile endpoint, paid request, remote configuration, legacy records, allowance or deployment changed. D39 remains independent discovery with its R1 implementation dependencies open; Task 1c and Phase 1 remain incomplete.


## Generalized simulated preference authority, 10 October 2026

Added a separate SimulatedContractPreferenceSource and shared server-only authority interface while preserving the original color fixture adapter. The new source copies immutable contracts, assigns its own next revision, refuses stale updates, permanently holds malformed data or revision overflow, and notifies all observers even if another observer throws. No browser command, conversation tool or candidate can construct or save this authority.

The owner now checks confirmed required/excluded rules directly against the synthetic candidate's color, style, occasion and lookType, after conservative notebook reconciliation. Optional preferences remain separate and do not implement ranking. Uncertain hard rules and unsupported hard season, budget or wardrobe rules hold the candidate; they cannot disappear when a notebook value is missing. Held current checks receive generic reasons instead of staying in Checking. Profile updates revoke pending checks, visual permits and queued speech. Raw rule identities/values stay outside browser updates.

Twenty-one new checks bring the prototype suite to 970 across 67 files. Type checking and build pass. The final isolated run passes 50 PostgreSQL checks, thirteen SQL-backed owner scenarios and eighteen SQL-backed browser scenarios. Its new owner scenario verifies requirement changes, optional ranking separation, uncertainty, unsupported owned-item requirements and malformed data stopping and closing once. docs/preference-contract-discovery.md records the narrow supported semantics. This remains independent D39/D41 discovery; real profile ownership/persistence, complete preference validation, session exceptions and R1 acceptance remain open. No live provider, paid request, remote configuration, legacy record, allowance or deployment changed. Task 1c and Phase 1 remain incomplete.


## Safe server clarification records, 10 October 2026

The simulated owner now retains an immutable revision-bound clarification for a current held saved-preference check. Its server-only getter exposes the affected notebook field and a whitelisted reason plus profile/notebook/check version metadata. It excludes saved values, private rule identities, candidate descriptions, profile-save/exception commands and look permissions. The constructor requires a current held check, rejects unsafe or unbounded issues and deduplicates field/reason pairs.

The record clears on notebook/profile changes, new checks, malformed replacement candidates, new voice input, unavailable state and closure. Cleanup removes its subscription, and replacement sessions cannot inherit it. Tests verify that a saved explanation cannot complete a check, authorize display/speech or change the saved source. Current browser protocol and visible notebook UI are unchanged; safe transport/rendering remains next. D42 gains independent discovery preparation only, with its R1 dependencies and customer acceptance still open.

Nineteen additional checks bring the suite to 989 across 68 files. Type checking and build pass. The final isolated verification passes 50 PostgreSQL checks, thirteen SQL-backed owner scenarios and eighteen SQL-backed browser scenarios. The existing generalized-profile SQL scenario now asserts safe clarification reasons, revision invalidation and end clearing. No real profile persistence/ownership, session exception, paid request, remote configuration, legacy records, allowance or deployment changed. Task 1c and Phase 1 remain incomplete.
