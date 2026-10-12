# AI Stylist MVP scope and discovery findings

Updated: 11 October 2026
Status: Working memory from approved requirements and actual findings. Phase 1 feasibility and launch are not approved by this file.

## Current memory checkpoint, 11 October 2026

Task 2a is accepted. Task 2b persistence/access and Task 2c account preparation are authorized locally while Phase 1 remains open. All 300 foundation tests across 31 files, type checking and build pass. Local SQL, sixteen-migration actual Storage upgrade and six Linux decoder-resource scenarios have separate recorded passing evidence. Generated-token account composition and callback exchange use simulated transports, with current-session checks, cancellation cleanup and uncertainty holds. Local account screens pass agent narrow-layout and keyboard checks; Sabine completed all eight local account preview steps and confirmed they worked and were readable. Real Auth, provider/refresh/recovery behavior and hosted activation are unverified. The last recorded prototype run passed 1,273 checks and was not rerun for this account checkpoint.

The server now internally checks immutable synthetic candidates against its own notebook and revokes visual/speech permission on input, correction or termination. This does not implement the independent saved-profile agent or validate real product suitability. D21/D22 and Task 1c remain partial; D26 has discovery preparation only, with R1 dependencies open. Phase 1 remains incomplete.

**Next action:** Continue local scoped recovery and sign-out interfaces using the shared verified-session/cleanup contract. Publish/copy verified work and update private Memory. Phase 1 remains open. Rakuten registration is postponed until the customer website is live; neither retailer inquiry was delivered. Real shopping links and affiliate commissions still require publisher and retailer approvals.

**Remaining gates:** Tavus recovery clarification, live validation of the dedicated transcription startup and remote cleanup contract, a new paid-trial allowance, permitted retailer/feed imagery and affiliate access, customer-provider privacy terms, and customer restart recovery remain open. All nine approved provider attempts are closed and the reserve is zero. No new spend is authorized; do not reset or reuse legacy reservations. Sabine asked to skip latest spending checks. Sabine authorized the OpenAI questions and received AI-assisted replies. Low delay and item correlation are documented; the selected-model startup URL remains an inference, and no stronger remote-finalization guarantee was established.

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
| Customer security | Local schema/access safeguards are prepared; hosted accounts and isolation remain unverified | Verify the revised local SQL suite, then complete the approved Phase 1/hosted activation gates before real account and Storage acceptance. |
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

### Protected seven-field editing regression

Nine additional real-loopback tests cover editing, confirmation, stale-version rejection and clearing across all seven fields, invalidation after a USD 500 to USD 350 correction, and rejection of an ended connection draft even when field/epoch revisions coincide. Values remain temporary, other fields remain unchanged, and no look permission is granted. All 1,098 tests across 73 files, type checking and build pass. The earlier local SQL regression remains passing at 50 database checks, thirteen owner and nineteen browser scenarios. Providers/devices and allowance are injected simulations; no remote data, paid call or deployment changed.


## Visible stale-draft and disconnect review, 10 October 2026

Added explicit local-only controls inside the rehearsal editor to deliver a newer tentative note or end its simulated connection. These are injected fixture actions, not additional browser protocol commands or customer profile writes. Full instructions appear before the controls are used. Pending commands, ended sessions and unknown fields refuse replacement. A newer budget remains tentative and cannot approve a look.

Implementer browser verification passed: Red draft refused after Blue arrived, Red retained until explicit reload, reload showing Blue with keyboard focus in the input, Escape discarding later draft text while retaining Blue, and connection loss removing the dialog/notes and returning focus to Start. Fixed focus loss when the reload button disappeared. Cancellation and reload now state explicitly that nothing was sent.

Five new tests bring the prototype suite to 1,103 across 73 files; type checking and build pass. The earlier database evidence remains 50 isolated PostgreSQL checks, thirteen owner scenarios and nineteen browser scenarios; this change did not alter the database or its transport. Physical-device and spoken screen-reader acceptance remain pending. Task 1c, D42/R1 and Phase 1 remain incomplete. No live provider, paid allowance, customer data, Supabase configuration or Render deployment changed.


## Interleaved correction safety and local timing, 10 October 2026

Three protected real-loopback checks interleave a displayed draft, a changed saved requirement and a late extraction result in both event orders. The touch correction survives; previous visual permits and speech-frame authorization remain revoked; the old candidate is held and only a fresh matching synthetic candidate can receive a new permit. A replacement connection rejects the previous draft, has no old notes/clarification and cannot reuse old look capabilities. Saved constraints remain server-owned and absent from the wire.

Added Local timing diagnostics to the separate connection rehearsal using existing bounded metadata only. It reports total, rendered, failed, canceled, pending, overflow and local p95, with no transcript, note values, persistence or export. Polling exists only while the rehearsal is active. Three presentation checks retain all outcomes, report unmeasured p95 honestly and show overflow. Implementer browser verification observed one acknowledged rendered sample and an explicit live-target-unverified label; ending removed the diagnostics and notes. The observed local duration is not representative live evidence.

All 1,109 tests across 74 files, type checking and build pass. Prior database evidence remains 50 isolated PostgreSQL checks, thirteen owner and nineteen browser scenarios; no SQL or persistence transport changed here. Task 1c, D42/R1 and Phase 1 remain incomplete. No paid calls, credentials, allowance amendments, Supabase changes or Render deployment occurred.


## Unacknowledged timing and replacement review, 10 October 2026

Added a clearly labeled local-only Hold timing acknowledgments checkbox with complete instructions before use. It deliberately withholds the display receipt while the notes remain visible. Disabling the control resumes normal acknowledgment; starting a fresh rehearsal resets it. It does not simulate provider latency or establish live performance.

Six focused lifecycle checks verify pending work has no measured duration, replacement cancels an unacknowledged sample, only a current acknowledgment records rendering, and disposal/disconnect/page exit isolate old receipts from a fresh rehearsal. Ending removes notes and the visible timing report; the retired in-memory owner retains cancellation metadata until released, while the new owner has zero samples. No transcript or note values are stored in timing records. The initial test incorrectly expected an active replacement owner to have no heartbeat timers; it was corrected to dispose that owner before asserting cleanup.

Implementer browser verification passed Pending 1 with p95 Not measured, a Blue touch correction changing Canceled to 1/Pending to 0, end removing the report, and restart resetting all counts and the checkbox. This is local simulated acceptance only. All 1,115 tests across 74 files, type checking and build pass. Prior SQL evidence is unchanged and was not rerun because no SQL or persistence transport changed. Task 1c, D42/R1 and Phase 1 remain incomplete. No paid request, allowance amendment, customer record, remote configuration or Render deployment changed.


## OpenAI support handoff, 10 October 2026

Sabine explicitly authorized sending the four prepared transcription questions. The official help.openai.com chat displayed the complete message, then required email or sign-in before continuing. Opened the existing OpenAI login flow; authentication needs Sabine. Submission remains incomplete: no ticket, human escalation or email receipt is confirmed. After sign-in, return to the existing support conversation and verify whether the questions are retained before sending anything again. No keys, media, account identifiers or private test records were included. No code changed, no paid call started and the latest passing test evidence remains 1,115 tests.


### Support contact alternative

Sabine reported she could not sign in. Returned to the existing help-center chat and verified that all four questions remain present. The chat offers an Email field and Continue separately from Log in for personalized support. Handed direct email entry to Sabine; no address was inferred or copied from private files. No completed ticket or technical answer is confirmed.


## AI-assisted OpenAI support reply reviewed, 10 October 2026

Sabine supplied the support reply after using the email route. This is explicitly AI-assisted support summarizing public documentation, not a human engineering confirmation or live trace. The previous sign-in/contact handoff is resolved by receipt of this reply; do not ask Sabine to sign in again for this submission.

Support proposes wss://api.openai.com/v1/realtime?model=gpt-live-transcribe with server Bearer authentication, session.created followed by session.update/session.updated, low delay, and item_id correlation through committed/delta/completed events. Current official transcription guidance supports the selected configuration, low delay and item correlation. The retrieved general WebSocket example still selects a conversational model; applying its model query to the dedicated transcription model remains the support bot’s interpretation, not independently established live acceptance. Preserve this proposed URL as a candidate, not an activated endpoint.

The reply explicitly cannot establish a dedicated transcription terminal acknowledgment. GPT-Live session.close/session.closed must not be imported into the Realtime transcription implementation. Normal socket closure can show transport closure, not remote deletion, final billing, retention or a provider-specific terminal state. Keep remote cleanup unverified and the conservative hold rules intact. No API request, credentials, allowance or deployment changed. Documentation-only review; no tests rerun, latest code evidence remains 1,115 passing checks with type checking/build.

Next: Sabine agreed on 11 October 2026 to postpone Rakuten registration until the customer website is live. Both contact forms require a publisher SID, and neither inquiry was delivered. Do not present the GitHub repository or private project memory site as the finished customer app. Continue clearly labeled, non-purchasable sample-product work. Real shopping links and affiliate commissions require publisher and retailer approvals. FARFETCH remains unsent. Next: Task 2a is implemented under Sabine’s approved sequencing exception. Sabine confirmed all local visual review steps worked on 11 October 2026; Task 2a is complete. Preserve all remaining Phase 1 and Phase 2 acceptance gates.


## Disabled transcription connection and close-evidence contract, 10 October 2026

Prepared an immutable inspection-only plan for the AI-assisted support-proposed endpoint. It labels startup as unverified, preserves the selected model/session.update protocol and constructs no socket, loads no credential and exposes no live enable switch. The new module is not imported into the application or existing transport owners.

A separate explicitly simulated close-evidence helper records only a matching connection’s close event after an explicit close request. It distinguishes observed transport closure from a normal code-1000 clean close, rejects malformed/other-protocol/wrong-owner records, and refuses duplicate evidence. Even a normal close cannot verify remote cleanup, final usage or deletion and cannot authorize allowance release. This helper does not replace the existing conservative cleanup holds or durable ledger logic.

Twenty-one new checks bring the suite to 1,136 tests across 75 files; type checking and build pass. An initial TypeScript parameter-property error was fixed to comply with the project’s erasable-syntax setting before the final passing run. SQL and persistence transport were unchanged; earlier isolated database evidence was not rerun. No live API call, keys, allowance amendment, Supabase change or deployment occurred. Task 1c, D42/R1 and Phase 1 remain incomplete.

Sent a narrow follow-up in the same authorized OpenAI support conversation asking for selected-model startup confirmation and the unresolved cleanup procedure, including human API support escalation if available. It contains no keys, audio, customer data or account identifiers. The reply was received: the AI support bot cannot route to human API technical support. It explicitly identifies the selected-model URL as an inference combining two guides, not a published selected-model URL example. It describes clean socket close as transport closure and per-item completed events as received application results, without a stronger remote-finalization guarantee. No new support thread was created.


### Notes-only trial proposal prepared

Prepared docs/notes-only-trial-decision-proposal.md with one 85-second/two-turn candidate trial, no avatar/camera and a proposed new USD 2 reservation. Public model rates and existing request limits give a conservative approximate USD 1.073 estimate; this is not actual usage or a hard provider billing cap. No approval was requested, and no account spending was checked. The proposal explicitly retains unresolved cleanup holds and requires a concrete reviewed live adapter, private access and dedicated allowance before activation decisions. Financial approval cannot waive the existing security/cleanup policy.


### Remote cleanup requirement boundary, 10 October 2026

The disabled server owner now captures an explicit cleanup requirement at construction. Simulation-local remains the existing fixture default; remote-verified retains the allowance hold after provider creation because provider status explicitly reports remoteCleanupVerified=false. End, provider disconnect, request abort and deadline expiry cannot close the reservation or permit replacement. Repeated end and later caller-option changes cannot waive the requirement. A canceled reservation that never created providers can still be retired once. No live adapter, route, key loading or provider socket was added.

Seven additional focused checks pass, bringing the prototype suite to 1,143 tests across 75 files, with type checking and build passing. The isolated PostgreSQL harness readiness check was corrected to wait for the final TCP listener rather than the temporary initialization socket. This is local synthetic preparation; Task 1c, D42/R1 and Phase 1 remain incomplete.

The protected browser bridge also accepts this server-only cleanup policy. Three synthetic loopback scenarios cover page exit, provider close and explicit stop: browser capture and notes clear, the provider closes once, the ledger retains its open reservation, replacement is denied and a fresh allowance reader refuses further work. The browser cannot change this policy. Final checks: 1,146 tests across 75 files, type checking and build pass; 50 isolated PostgreSQL checks, 13 SQL-backed owner scenarios and 19 SQL-backed browser scenarios pass after the readiness fix. The new remote-required scenarios currently use injected persistence, so PostgreSQL/fresh-process composition for this policy is the exact next check.


## Remote-cleanup hold across PostgreSQL and process replacement, 11 October 2026

Added two SQL-backed owner scenarios (explicit end and request abort) and three SQL-backed protected-browser scenarios (page exit, provider failure and explicit stop). Provider resources close once locally while the original reservation stays open. Each scenario verifies unchanged PostgreSQL history through a fresh Node process; browser scenarios also construct a replacement bridge which is denied before provider creation. No closure write, retry or replacement reservation occurs. These checks restart application readers, not PostgreSQL itself, and use synthetic media/providers with an isolated temporary local database.

All 1,146 prototype tests across 75 files, type checking and build pass. Separate checks now pass 50 PostgreSQL checks, 15 SQL-backed owner scenarios and 22 SQL-backed browser scenarios. The isolated database container was removed. No Supabase records, nine-trial legacy history, credentials, paid services or deployment changed. Task 1c and Phase 1 remain partial.

Prepared docs/notebook-live-adapter-design.md with server-only ownership, access-before-reservation, session.created/configuration/readiness ordering, bounded cancellation, local shutdown versus remote cleanup, and focused implementation checks. The design exposes the next implementation gap: the existing simulated factory takes an already-open socket and cannot serve as the future live startup controller. Activation and the USD 2 trial proposal remain unapproved.


### Disabled startup controller, 11 October 2026

Implemented prepareNoteStartup with an explicitly simulated injected opener. Initial events are observed from the first packet, including a bounded creation envelope received before the opening promise resolves. Configuration is sent only after one valid session.created envelope and an open socket. The existing strict configuration decoder must accept session.updated before the controller exposes the session; capture is not started by startup itself. Duplicate creation during startup, premature/malformed events, failed opening and configuration mismatch end safely without retry.

A five-second startup deadline covers opening, creation and configuration. Abort/end/timeouts cancel the injected opening signal, detach initial listeners and close a late returned socket once. Provider-close ownership is shared through a guarded facade. Failed close/listener cleanup remains explicitly uncertain; remoteCleanupVerified and liveEnabled remain false. An ended provider cannot be exposed during its deferred stopped notification. The opener must observe events before resolving and honor cancellation for resources it has not returned; a real opener is not implemented.

Twenty-seven additional checks bring the suite to 1,173 tests across 76 files; type checking and build pass. The first run passed tests but type checking caught control-flow narrowing around reentrant cancellation; the code now checks the internal abort signal, and the final full run passes. Database code was unchanged in this increment, so the earlier 50 PostgreSQL, 15 SQL-backed owner and 22 SQL-backed browser results were not rerun. The new controller is not yet composed into the protected owner or running application. Task 1c and Phase 1 remain partial; no keys, paid calls, allowance initialization or deployment occurred.

Startup exposes openingSettled separately from end(): cancellation stops local work immediately, while openingSettled resolves only after the injected opener returns or fails and any late returned socket has been closed. Protected-owner composition must await that settlement or retain a hold, never retire a reservation while opening is still unresolved. This promise establishes local opening settlement only, not verified remote cleanup. The late-open cancellation/deadline/end checks explicitly verify this distinction.


### Startup controller composed into protected owner, 11 October 2026

The disabled owner and protected browser bridge now accept exactly one server-injected transport factory: the existing already-open simulation or the new startup-backed simulation. Private request/allowance checks still precede construction. The startup-backed owner waits for creation and validated configuration before publishing Ready or returning a session. Concurrent starts are blocked. Cancellation retains the closing state until openingSettled confirms a late socket has been handled; remote-required cleanup then holds the unresolved reservation without a closure write or replacement. Simulation-local closure is permitted only after opening settles without cleanup failure. A canceled late reservation with no transport creation can still retire once.

Thirteen new owner checks and three protected loopback browser checks cover request rejection, factory selection, readiness, abort, startup/full-owner deadlines, late sockets, cleanup failure, invalid configuration, page exit, a fresh allowance reader and reentrant cancellation from Ready. The latter now returns cancellation rather than an ended active session. An initial test-only address narrowing error was corrected before the final passing type check. All 1,189 tests across 78 files, type checking and build pass.

Isolated PostgreSQL compositions add configured startup/end and pending startup/abort to the owner, plus configured startup/end and page exit during opening to the browser. Open history stays unchanged through fresh Node processes; replacement is refused before another provider is constructed. Final verification passed 50 isolated PostgreSQL checks, 17 SQL-backed owner scenarios and 24 SQL-backed browser scenarios. The temporary database container was removed. No real provider, credential path, Supabase record, legacy ledger, new allowance or deployment is changed. The running notebook uses its existing local rehearsal; Task 1c and Phase 1 remain partial.


## Disabled dormant opener evidence, 11 October 2026

Added prepareNoteOpener with an explicitly simulated dormant transport constructor. Listeners attach before start, including synchronous first packets. Abort, error, disconnect, malformed/oversized/binary packets and throwing consumers close once without reconnect. Constructed failed resources return a guarded facade so startup cannot lose sticky listener/close failure evidence through a rejected opening promise. Cancellation before construction creates no resource. Handover detaches initial observation without closing the configured transport.

Sixteen new checks include startup configuration readiness and cancellation during opening with failed cleanup. All 1,207 tests across 79 files, type checking and build pass. The first command used the wrong working-directory prefix; the corrected command also needed authorized access to the existing dependency cache. Final verification passed. The running application is unchanged: this component has no URL, keys, actual socket constructor, live route or retry. Earlier isolated SQL totals were not rerun because persistence is unchanged. Task 1c, D21/D22 and Phase 1 remain partial.


## Dormant opener protected and SQL composition, 11 October 2026

The disabled dormant opener now has four protected-loopback checks covering creation before opening, configuration acknowledgment before capture, page exit, provider error and failed close. Late opening cannot revive the notebook. Each unresolved reservation blocks a replacement bridge before transport construction or extraction. These are synthetic integrations; no live route was changed.

The isolated SQL harness adds two dormant-opener server-owner scenarios and three browser scenarios, including failed close during opening. Fresh Node readers preserve the open reservation; a replacement browser owner is refused before provider construction. Final verification passes 1,264 prototype tests across 81 files, type checking, build, 50 isolated PostgreSQL checks, 19 SQL-backed owner scenarios and 27 SQL-backed browser scenarios. The temporary container was removed. No actual Supabase data, credentials, paid allowance or Render deployment changed. Task 1c, D21/D22 and Phase 1 remain partial.


## Startup edge checks and affiliate-link preparation, 11 October 2026

Six dormant-owner checks cover opening/configuration deadline expiry, duplicate open notifications and reentrant abort during construction, transport start and Ready. Each ending closes once, clears timers, returns no active capability and preserves the unresolved reservation. Two initial test assertions ran before asynchronous handover; explicit synchronization corrected the tests.

Prepared a separate disabled affiliate metadata validator using trusted injected catalog policy, program reference, tracking hosts, exact product/variant mapping and required attribution parameters. It never invents, fetches or rewrites a URL. Twenty-five fixture checks reject mismatched mappings, unsafe/unapproved URLs, duplicate attribution, stale/unknown price, unavailable products and unverified size/delivery. Returned metadata includes a qualifying-purchase disclosure and explicitly does not count clicks as revenue. Captured configuration cannot be changed through later caller mutation. This is independent source-access preparation, not a live retailer integration or permission claim, and does not authorize a look or bypass preferences.

All 1,242 prototype tests across 80 files, type checking and build pass. Type checking initially caught a test attempting to mutate a readonly host list; replacing the test's whole list corrected it before the final passing run. The prior isolated database totals remain 50 checks, 19 owner and 27 browser scenarios; they were not rerun because this increment changes no persistence. Task 1c, Phase 1d, X04 and Phase 1 remain incomplete. No paid call, credential access, actual retailer application or app deployment occurred.


## Revocable affiliate actions and Rakuten inquiry, 11 October 2026

Prepared a disabled server-side affiliate action boundary composed with the existing synthetic look release gate. Capabilities are single-use, tied to the current selection revision and exact captured product. Refreshed/unavailable/removed or differently mapped variants revoke older actions; even a source failing to increment its revision cannot retain a changed product action. Resolution rechecks freshness, current preference permission and terminal state. New issuance, invalidation and end revoke old capabilities. Reentrant cancellation during final authorization is checked after the callback, fixing an edge found during review. This is fixture preparation, not an enabled shopping route.

Twenty-two new checks pass within 1,264 prototype tests across 81 files, with type checking and build passing. The previous isolated SQL totals remain 50 checks, 19 owner and 27 browser scenarios; persistence was unchanged and those checks were not rerun. No paid request, app deployment or remote ledger change occurred. All relevant incomplete phase/retailer acceptance gates remain incomplete.

Sabine selected Rakuten first for eligibility questions about ASOS and other US fashion programs. Prepared both inquiry drafts; neither was sent. The official Rakuten request form was opened and its subject and full description filled. Sabine supplied a reply email privately. Submission was attempted, but the form rejected it with “SID: cannot be blank.” A user action card asks whether she has a publisher account. The inquiry remains unsent. No contact email or private account value is stored in these public records. Public source references and the selected route are in docs/retailer-eligibility-inquiries.md.

## Rakuten registration deferred, 11 October 2026

Sabine agreed on 11 October 2026 to postpone Rakuten registration until the customer website is live. Both contact forms require a publisher SID, and neither inquiry was delivered. Do not present the GitHub repository or private project memory site as the finished customer app. Continue clearly labeled, non-purchasable sample-product work. Real shopping links and affiliate commissions require publisher and retailer approvals. FARFETCH remains unsent. Next: Task 2a is implemented under Sabine’s approved sequencing exception. Sabine confirmed all local visual review steps worked on 11 October 2026; Task 2a is complete. Preserve all remaining Phase 1 and Phase 2 acceptance gates.

## Affiliate selection recheck, 11 October 2026

Fixed a stale-selection edge in the disabled affiliate action prototype: after final authorization, issuance and resolution re-read the trusted product and compare both revision and complete product content. A product replacement or unversioned stock change during authorization now blocks the old action. Four added regression cases pass. All 1,268 prototype tests across 81 files, type checking and build pass with loopback access; the restricted initial run could not open synthetic test sockets. No paid call, retailer request, actual shopping route or Render deployment was started. Phase 1 remains incomplete.

## Notebook observer cancellation resilience, 11 October 2026

Fixed observer failure isolation in NotebookState: once a note/reference/profile/session change is committed, a throwing screen observer cannot prevent later observers from canceling old look display or queued speech. Five added tests cover note edits, reference changes, clear, profile changes and replacing a check. All 1,273 tests across 81 files, type checking and build pass. No live provider, paid request, database change or app deployment occurred. Task 1c and Phase 1 remain incomplete.

Next action: Sabine decides whether Task 2a foundation scaffolding may proceed while Phase 1 acceptance gates remain open. The concrete bounded proposal is docs/phase-2-foundation-sequencing-proposal.md. This is a sequencing exception, not Phase 1 approval, spending or provider activation. If approved, scaffold the approved React/TypeScript and Node/TypeScript foundations with local fixtures; otherwise preserve the phase order.

## Task 2a foundation implemented, 11 October 2026

Sabine approved starting Task 2a while Phase 1 stays open. Implemented apps/foundation with the approved React/TypeScript website and Node/TypeScript local service, four navigation destinations, collapsed notebook, approved color/spacing/type tokens, a coordinator port that cannot start customer sessions, and strict local/test configuration. Production startup and non-loopback hosting are refused. Extracted the seven note fields/types to packages/style-contracts; the existing prototype reexports them. No live provider, credentials, storage, sign-in or shopping is connected.

All 17 foundation tests, type checking and build pass. All 1,273 prototype regressions, type checking and build pass after shared-contract extraction. Added GitHub Actions for both suites; both hosted jobs passed in run 38179886532: https://github.com/sabinejoseph8/AI-Stylist/actions/runs/38179886532. Agent browser checks passed four destinations, collapsed/expanded seven-field notebook and a 390px phone-width layout. This is browser emulation, not a physical-phone or screen-reader audit.

Task 2a is complete: Sabine confirmed all navigation and notebook visual review steps worked on 11 October 2026. Full Phase 2 account/isolation checks belong to 2b/2c and have not passed. Phase 1 remains incomplete. The local Vite preview runs at http://127.0.0.1:4322/ in an actual foreground development process; it may stop if this machine/session stops. No customer application deployment or paid request occurred.

Exact next action: resolve the remaining Phase 1 dependencies or obtain a specific sequencing exception for local Task 2b preparation. The approved exception covers Task 2a alone. No paid activation or production database action is implied.


## Task 2a visual acceptance, 11 October 2026

Sabine reported “All steps worked” after refreshing the local foundation, visiting all four destinations, expanding the notebook, reading all seven fields and collapsing it. Task 2a is complete with the previously passing 17 foundation checks and successful GitHub CI. Tasks 2b/2c and the full phases remain open. The Task 2a-only sequencing exception does not authorize bypassing their dependencies.


## Task 2b local preparation authorized, 11 October 2026

Sabine approved local Task 2b database and protection-test preparation while Phase 1 stays open. This exception includes no remote Supabase change or deployment. Added ordered saved-image metadata and private wardrobe-bucket migrations. Twelve actual PostgreSQL checks passed in a temporary pinned, network-disabled container: owner read, other/missing identity isolation, anonymous denial, blocked insert/update/delete and owner-prefix validation. The container was removed. Storage policy/signed-URL behavior is not proven by these checks. Task 2b remains incomplete.

Exact next action: extend local migration/test coverage for Storage owner reads and denied writes, then add strict consent/revision-controlled saved-data interfaces and same-owner references. Keep credentials, live migrations and deployment disabled.

Follow-up: 19 local checks now pass, including owner-only Storage policy reads, anonymous/other-owner isolation, blocked upload/update/delete and private bucket limits against a minimal synthetic Storage schema. This does not test real Storage APIs or signed URLs. Next: strict consent/revision-controlled saved-data interfaces and same-owner references.


## Task 2b controlled wardrobe save preparation, 11 October 2026

Added an unapplied ordered wardrobe migration with same-owner asset references, owner-only reads, blocked direct writes, explicit-save consent, server-owned timestamps and atomic expected-revision updates. The privilege-elevating save function has an empty search path and derives identity from auth.uid(), never a request-body customer ID. No live route or provider is attached. Strict request decoding rejects extra fields, transcripts, notebook payloads, ownership claims, absent consent and invalid revisions.

Evidence: 40 isolated PostgreSQL checks pass, including two concurrent edits with exactly one winner, cross-owner references, direct-write denials and function privilege configuration. Storage checks use a minimal synthetic schema, not a real Storage API. All 33 foundation tests, type checking and build pass. The first sandbox test run could not bind its loopback test socket; rerunning with authorized local execution passed. Temporary database containers were removed. No Supabase or Render change occurred. Task 2b remains open.

Exact next action: prepare strict saved-profile and saved-look persistence boundaries, controlled deletion and safe media upload interfaces; extend migration upgrade/rollback checks. Preserve explicit-save-only persistence and profile-revision invalidation. Hosted signed-URL and account-isolation acceptance remain blocked by the separate integration/Phase 1 gates. Sabine has no action for the remaining local preparation.


### Controlled deletion and continuous database checks

Prepared wardrobe deletion requires owner identity, explicit confirmation and the current revision. It removes only the selected wardrobe metadata; shared image objects are preserved pending reference-aware cleanup. Fifty local database checks pass. Added a dedicated GitHub job for the pinned isolated database rehearsal and included migration changes in its triggers. Hosted Storage and signed URLs remain unverified. Next: saved profile/look schemas and safe upload/reference-aware cleanup interfaces. Task 2b is still incomplete; no action is needed from Sabine for local preparation.


### Explicit profile request preparation

Added a strict, immutable profile-save decoder with explicit consent and expected revision. It whitelists preferred/excluded colors, styles, excluded categories and integer USD budget cents; it rejects conflicting colors, duplicates, oversized values, extra customer IDs, transcripts and session occasion fields. This is a bounded initial profile contract, not the complete profile schema or a connected save endpoint. Sizes and further approved requirements must be added with typed validation before customer acceptance. All 51 foundation tests, type checking and build pass. The preceding GitHub run 38181663127 passed all three jobs, including 50 database checks and prototype regressions.

Exact next action: add matching strict SQL profile persistence and atomic revision-controlled mutations, with tests for second-tab invalidation before connecting saves. Then continue saved-look schemas and safe image upload/reference-aware cleanup. Task 2b remains open; no human action is required for this local preparation.


### Atomic profile persistence preparation

Prepared an unapplied profile migration matching the initial typed preference subset. Database validation rejects unknown keys, invalid/contradictory colors, duplicate/oversized terms and invalid USD amounts. Explicit consent and expected revision are required. A successful save commits a minimal private revision event in the same transaction; failed or stale saves create no event. Direct customer writes and reads of the private event table are denied. This does not yet consume events, invalidate live look releases or implement the full profile schema.

Latest evidence: 74 actual local PostgreSQL checks pass, using synthetic Auth/Storage schemas in a network-disabled temporary container that was removed. Foundation evidence remains 51 passing checks plus type checking and build. No remote migration, provider call or deployment occurred. Task 2b remains incomplete.

Exact next action: add second-tab/competing-profile-save tests and the revision-event consumption contract, then prepare saved-look schemas and safe image upload/reference-aware cleanup. The broader Phase 1 and hosted acceptance gates remain open. No action is needed from Sabine for this authorized local preparation.


Latest checkpoint: 85 local database scenarios now cover concurrent profile saves, second-tab stale revisions and rollback of both profile and revision event. Only one competing save succeeds. Local foundation evidence remains 51 checks with type checking/build passing. Next: the revision-event consumption contract, saved-look schemas and safe image upload/reference-aware cleanup. Task 2b remains open. No action is required from Sabine for continued local preparation.


## Profile revision fence, 11 October 2026

The active persistent Goal is now created; subsequent idle turns can resume authorized work automatically. Previous goal turn created that authoritative state. Added a local profile revision fence: initial readiness requires an observation; advancing revision synchronously cancels old permits; stale/invalid observations or cancellation failure close the fence. Issued permit identity prevents reuse across fence instances or copied stamps. Fourteen focused checks bring the foundation suite to 65 passing tests; type checking passes. Build passed before the permit-identity follow-up, which changes server-only code.

This fence has no live subscription or database release transaction attached. It cannot prove a current database revision by itself; release must perform an authoritative, serialized revision check. Task 2b and Phase 1 remain open. No remote migration, paid call or deployment occurred.

Exact next action: implement the local revision-event read/consumption boundary and its owner/isolation checks, then saved-look persistence and safe media upload/reference-aware cleanup. Preserve local-only Task 2b authorization and all spending limits. No Sabine action is required for this preparation.


## Owner revision snapshot preparation, 11 October 2026

Added an unapplied authenticated revision-reader RPC with no customer-ID argument. Its single SQL snapshot returns only the calling owner's current revision and latest event sequence, including zero/zero for an absent saved profile. Anonymous and missing identities are refused; another customer cannot observe the first customer's sequence. Added a strict local snapshot consumer: unknown fields, inconsistent/backward observations and read failures revoke the attached revision fence. Duplicate snapshots are idempotent and skipped committed revisions are supported.

Evidence: 92 isolated database scenarios and all 78 foundation tests pass, with type checking and build. These are local Auth/Storage simulations, not hosted integration. No API client, live event subscription or transaction-serialized look release is attached. Task 2b remains open. Previous goal turn made concrete progress by committing the revision fence; this turn implements the next consumption boundary.

Exact next action: prepare saved-look tables, same-owner components and controlled explicit-save/revision mutations; then safe media upload/reference-aware cleanup and migration compatibility checks. Keep hosted integration and paid calls disabled under the existing authorization. No action required from Sabine for local preparation.


## Owned saved-look persistence preparation, 11 October 2026

Added an unapplied saved-look/header and ordered component migration with same-owner image references, owner-only reads and blocked direct writes. Controlled explicit saves require consent and expected revision. Component fields are whitelisted to asset ID and label; duplicates, empty/oversized lists and foreign assets are rejected. Header updates and component replacement share a transaction, so an invalid replacement preserves the prior saved look. This is the owned-item subset, not the full retail snapshot contract or current-look approval.

Evidence: 108 isolated local database scenarios pass, including read isolation, consent, stale edits, malformed components and rollback after duplicate references. No hosted migration, paid call or customer deployment occurred. Task 2b remains open. Previous goal turn committed the owner revision reader; this turn adds saved-look persistence.

Exact next action: add controlled saved-look deletion, concurrency/reference checks and a strict server request decoder. Then prepare source-backed retail snapshot contracts, safe media upload/reference-aware cleanup and migration compatibility. Keep all live routes disabled and preserve remaining Phase 1 dependencies. No Sabine action required for local preparation.


## Saved-look deletion and request validation, 11 October 2026

Added an unapplied controlled saved-look delete function requiring owner identity, explicit confirmation and current revision. Deletion cascades only its component records and preserves image metadata. Concurrent saves allow one winner, and stale deletion/repeated deletion are refused. Added an immutable, whitelisted owned-look request decoder rejecting ownership claims, transcripts, unverified retail fields, duplicate image IDs including case differences, empty/oversized lists and invalid revisions. No live save/delete route is attached.

Evidence: 122 local database scenarios and all 90 foundation tests pass; type checking and build pass. Storage/Auth remain synthetic schemas, not hosted acceptance. Task 2b remains open. Previous goal turn committed saved-look storage; this turn verifies concurrent edits and controlled deletion.

Exact next action: prepare source-backed retail saved-look snapshot contracts and safe media upload/reference-aware cleanup, then migration compatibility checks. Preserve current Phase 1 gates and local-only authorization. No human action required for this preparation.


## Shared retail snapshot preparation, 11 October 2026

Moved the existing catalog validator into packages/catalog-contracts with a prototype reexport, preserving one source of URL/rights/source validation. Prepared a source-fact-only retail history snapshot: copies IDs, name/category/size, dated USD price (including explicit unknown), source URL and image-rights reference; omits transient/customer fields and marks saved-history. Rejects stale/new-save source facts, sample products, invalid URLs, unapproved rights and unknown input fields. Trusted adapter policy remains server configuration; no live retailer or database retail mutation is attached. This is not current-look approval or completed retail persistence.

Evidence: 103 foundation tests pass; all 1,273 prototype checks across 81 files, both type checks and builds pass. Fixed a test import path during type checking. The 122 database scenarios remain the preceding unchanged database evidence. No paid call, hosted migration or customer deployment occurred. Task 2b remains open.

Exact next action: implement safe local image-byte decoding/metadata stripping with bounded dimensions/size, then owner-bound upload staging and reference-aware cleanup. Complete retail persistence only with source-backed snapshot validation and recheck-before-reuse semantics. Continue migration compatibility checks. No Sabine action needed for local preparation.


## Local image sanitizer preparation, 11 October 2026

Pinned Sharp 0.35.5 after checking its supported npm release and official security/output documentation (https://sharp.pixelplumbing.com/security/ and https://sharp.pixelplumbing.com/api-output/). Prepared buffer-only JPEG/PNG/WebP signature and MIME matching, 10 MiB input/output limits, 16 million pixel and 8,192-side bounds, single-frame admission, strict warning failure, orientation correction and metadata-stripping WebP re-encoding. One in-flight decode is allowed with no pending queue; native image processing has a five-second timeout. Output includes server-computed dimensions and SHA-256 checksum. It never fetches a URL or writes an image to disk.

Evidence: nine synthetic-image tests bring the foundation suite to 112 passing tests; type checking and build pass. Tests cover supported formats, EXIF stripping/orientation, fake formats, MIME mismatch, byte/dimension overflow and concurrent admission. This is local preparation, not an upload endpoint or process sandbox. Sharp explicitly recommends OS resource limits; process/container memory and CPU isolation, queued-time deadline and hosted load tests remain required before customer upload activation. The earlier 122 database scenarios are unchanged. No personal image, live provider, remote migration or customer deployment was used.

Exact next action: prepare owner-bound, explicit-consent upload staging and reference-aware image cleanup; add missing animated/truncated/pixel-limit fixtures and process-level resource safeguards. Continue full retail persistence and migration compatibility before Task 2b acceptance. No Sabine action required for local preparation.


## Image lifecycle orchestration preparation, 11 October 2026

Prepared a trusted server adapter contract for durable staging, put-if-absent object writes, commit, reference-safe deletion claims and finalization. Image saving requires explicit consent, sanitizes bytes, generates an opaque owner-prefixed key, persists staging before upload and commits only after upload acknowledgment. Ambiguous stage/upload/commit failures preserve pending reconciliation; no automatic deletion guesses whether a save succeeded. Deletion requires confirmation/current revision, a reference-safe adapter claim, an exact owner/asset key and a deletion token; an uncertain object deletion never finalizes metadata. Customer IDs must come from verified server auth, not request bodies.

Evidence: eleven new simulated-adapter/synthetic-image scenarios bring foundation tests to 123 passing tests; type checking passes. Build passed before the server-only exact-key follow-up. This is orchestration preparation, not a durable adapter, database lock, live upload route or hosted verification. The adapter must implement atomic reference claims and forbid new references to deleting assets. No Supabase/Render change or personal image was used. Task 2b remains open.

Exact next action: implement unapplied database staging/deletion states and reference locks, with real isolated SQL races and reconciliation checks. Then add image malformed/animated/pixel-bound fixtures, hard process limits and migration compatibility. Complete retail persistence separately. No human action needed for authorized local preparation.


## Database image lifecycle and reference locking, 11 October 2026

Added an unapplied migration with staged/ready/deleting image states, checksum and deletion token. Service-only stage/commit/finalize RPCs prepare opaque owner keys; customer mutation cannot initialize or finalize storage records. Owner-confirmed deletion locks the image row, checks current revision and refuses existing wardrobe/look references. Reference triggers acquire a compatible lock and refuse assets that are not ready. Legacy local fixture rows remain ready with optional checksum for additive compatibility; legacy-key deletion compatibility is still to be reviewed.

All isolated database scenarios pass, including staged-reference refusal, service-only permissions, foreign/checksum mismatch, referenced-image deletion refusal, lost-finalization hold and a concurrent save-versus-delete race with exactly one winner and a consistent final state. The test runner now reports suite success rather than a manually maintained scenario total. The temporary network-disabled PostgreSQL container was removed. This is real local SQL with synthetic Auth/Storage schemas, not actual object deletion or hosted acceptance. Foundation evidence remains 123 passing tests. No remote change or paid call occurred. Task 2b remains open.

Exact next action: add server-only pending-operation reads and reconciliation, wire the prepared lifecycle to a simulated SQL-backed adapter, then hard image-process limits and migration compatibility checks. Preserve retail snapshot persistence work and all hosted/Phase 1 gates. No human action required for local preparation.


## Pending image reconciliation preparation, 11 October 2026

Added an unapplied service-only exact-owner operation reader and a prepared reconciliation state machine. Staged uploads commit only with matching verified byte checksum. Missing or unknown staged objects remain pending without deletion. Confirmed deletion operations finalize only after known absence or acknowledged removal; read/remove/commit failures remain pending. Foreign owners, wrong keys, malformed records and extra fields cannot reach storage operations. Ready/deleted results are lifecycle status, never recommendation permits. Actual object inspection must verify bytes rather than trust arbitrary metadata.

Evidence: all isolated SQL checks pass, including server-only pending reads and wrong-owner absence. Foundation tests increase to 136 passing tests; type checking and build pass. Reconciliation uses simulated storage evidence, not a hosted object store or SQL-connected TypeScript adapter. Task 2b remains open. No remote change, personal image or paid call occurred.

Exact next action: run the TypeScript lifecycle/reconciler against an isolated SQL-backed adapter with simulated storage, including lost acknowledgment recovery. Then harden image process limits/fixtures, complete retail persistence and migration compatibility. Preserve hosted and Phase 1 gates. No Sabine action required for local preparation.


## SQL-backed image recovery rehearsal, 11 October 2026

Connected the prepared TypeScript image lifecycle and reconciler to isolated PostgreSQL RPCs with simulated object storage. Six paths cover normal operation and lost acknowledgments after staging, upload, commit, object removal and metadata finalization. The rehearsal exposed a finalization gap: a missing record could not prove deletion. An unapplied migration now writes an owner-scoped deletion receipt atomically with metadata deletion and prevents retired image IDs from being reused. Receipts contain IDs, owner, opaque key, deletion token and timestamp, with no image checksum or image bytes. Direct table access is revoked. Receipt retention/purge must be settled before hosted activation.

Evidence: 137 foundation tests, type checking and production build pass. The complete isolated SQL suite and all six recovery paths pass, including wrong-owner absence. Storage remains simulated; this does not prove hosted deletion, signed URLs, a production adapter or remote finalization. No hosted migration, provider call or spending change occurred. Task 2b remains open.

Exact next action: harden image decoding fixtures and process resource isolation, then continue migration compatibility and source-backed retail persistence. Hosted acceptance and Phase 1 gates remain unchanged. No Sabine action is required for this local preparation.


## Image boundary fixtures, 11 October 2026

Added synthetic truncated JPEG/PNG/WebP, 16-million-pixel overflow with valid side lengths, and actual two-frame animated WebP rejection checks. Verified failed decoding releases admission for the next image. The first animation fixture encoded identical frames and was optimized into a still image; corrected it to two different raw frames and asserted the fixture really has two pages before testing rejection.

Evidence: 140 foundation tests, type checking and build pass. No customer media or provider call was used. These tests strengthen existing validation; they do not establish OS-enforced memory/CPU isolation. Task 2b remains open and new database migrations remain local.

Exact next action: implement an isolated decoder process with a parent-enforced wall-clock deadline and deployment resource-limit contract; verify timeout/crash cleanup and bounded admission. Then continue migration compatibility and retail persistence. No Sabine action required for local preparation.


## Isolated image decoding preparation, 11 October 2026

Moved Sharp decoding and WebP conversion into a separate child process. The server admits one image decode at a time, caps input and child output, enforces a seven-second parent deadline and kills a stalled child. The child disables Sharp cache, uses one decoder thread, checks format, frame count, dimensions, pixels and output size; the server rechecks its result and computes the checksum. Process errors are redacted. A 128 MiB V8 heap argument limits JavaScript heap only; native libvips memory still needs an OS/container limit before customer uploads. No upload route is activated.

Evidence: 142 foundation tests pass, including real child crash and hang scenarios; type checking and build pass. The hung child is killed and a later valid image decodes. No personal media, provider call or hosted deployment occurred. Task 2b remains open.

Exact next action: define and verify OS/container resource limits for the decoder on the intended host, then continue migration compatibility and source-backed retail persistence. This local preparation requires no Sabine action.


## Legacy media migration compatibility, 11 October 2026

The isolated migration rehearsal now carries an existing JPEG record from the first schema through all eleven local migrations. Its key uses an older safe filename unrelated to the record ID, and its checksum is null. Owner-scoped reads recognize it as ready; a reference-safe deletion removes its simulated object, writes the durable receipt and confirms deletion. New checksums still require the exact new ID-based WebP key. Both deletion paths refuse foreign folders or nested paths; the legacy allowance is restricted to a single safe image filename inside the verified owner's folder.

Evidence: isolated SQL and six newer recovery paths plus legacy JPEG deletion pass with simulated storage. 143 foundation tests, type checking and build pass. No hosted migration or actual Storage API was used. Task 2b remains open.

Exact next action: complete the OS/container resource-limit decision and local verification, then persist source-backed retail snapshots and check schema upgrade behavior with hosted Supabase when Phase 1 and approval gates permit. No Sabine action is required for continued local preparation.


## Protected retail history preparation, 11 October 2026

Added an unapplied owner-scoped retail history table and service-only save function for dated product facts. It stores source/product/variant IDs, name, category, size, USD price or unknown, US country, product and image URLs, image rights reference, source timestamps and a saved-history marker. Direct writes by customers and anonymous users are blocked. The server boundary requires a verified owner, explicit consent and the existing trusted catalog policy before submitting an immutable whitelisted snapshot. Saved history is not a fresh availability or recommendation approval.

Evidence: the isolated PostgreSQL suite passes direct-write denial, owner isolation and malformed payload rollback. A TypeScript-to-SQL rehearsal persists validated source facts while unsafe URLs and stale facts never reach the database. 145 foundation tests, type checking and build pass. Local synthetic source facts and synthetic Auth/Storage schemas were used. The retail record is not yet linked atomically to a saved look; no live retailer, hosted migration or customer deployment occurred. Task 2b remains open.

Exact next action: link retail history to saved looks through an atomic mixed-item save while retaining owned-item behavior and owner isolation. Resolve OS/container limits for image decoding before customer upload activation. No Sabine action is required for this local preparation.


## Atomic mixed saved-look preparation, 11 October 2026

Added an unapplied migration that lets saved-look components reference either an owned wardrobe image or an owner-scoped retail history record. A service-only transaction creates or revises the look, stores validated retail snapshots, links all components and rolls everything back if any component fails. A trigger removes retail history when its look item is replaced or deleted; the existing owned-look path remains functional. The final migration revokes the temporary standalone retail-history write privilege, so retail records are created inside a saved-look transaction.

The server-side mixed-look boundary accepts item identifiers and labels from the customer. It fetches retail facts through a trusted injected catalog adapter, checks the approved source policy and freshness, then passes only validated snapshots to the database adapter. It requires verified owner identity and explicit consent, rejects duplicate components and extra customer-supplied product facts, and has no live route or source credential.

Evidence: 146 foundation tests, type checking and build pass. The isolated PostgreSQL suite verifies mixed owned/retail save, cross-owner invisibility, stale revision refusal, invalid-component rollback, replacement and deletion cleanup. A TypeScript-to-SQL rehearsal verifies trusted catalog lookup through the atomic write. These use synthetic source facts and synthetic Auth/Storage schemas; they do not prove hosted Storage, signed URLs, retailer permission or live customer access. Task 2b remains open.

Exact next action: define and verify decoder OS/container limits and a hosted-safe retail/source adapter boundary. Continue local schema and access checks; apply no hosted migration until the agreed Phase 1 and security gates are met. No Sabine action is needed for local preparation.


## Database-level source timestamp checks, 11 October 2026

Tightened the local retail history function to reject future source checks, fractional timestamps, source update times after the check time, and fractional or out-of-range prices even if callers bypass the TypeScript validator. Added SQL rejection cases for those values.

Evidence: the 129 foundation tests outside the loopback-boundary file, type checking, build and whitespace checks pass. The full suite earlier passed 146 tests, and the isolated SQL suite passed before this latest SQL-only validation change. I could not rerun PostgreSQL after the change because the system usage limit blocks approval for the Docker execution. The new SQL cases remain unverified.

Exact next action: rerun `python3 apps/foundation/scripts/check-data-protections.py` when the execution approval limit clears; fix any SQL failure. Then copy the mixed-look checkpoint to the AI stylist folder, publish GitHub and refresh the private Memory site. Do not bypass the approval limit. Task 2b remains open and local-only.


## Disabled Supabase RPC adapter preparation, 11 October 2026

Added an explicitly constructed server-only RPC transport and mixed-look Supabase port. It accepts only an HTTPS Supabase project root, uses the injected service key only in protected request headers, refuses redirects, bounds UTF-8 request and streamed response sizes, applies one eight-second deadline to request and response reads, cancels stalled/oversized responses, validates JSON output and returns fixed redacted failures. No key is read from the environment automatically, no route constructs the adapter and all checks use simulated fetch responses.

Evidence: 138 tests pass when excluding the existing HTTP test that cannot bind loopback under the current execution limit; type checking, build and whitespace checks pass. Simulated checks cover destination validation, headers, redirect refusal, request/response sizes, malformed/status errors, timeout, cancellation and mixed-look RPC response validation. No live Supabase request was made. The migration's latest timestamp guards remain unverified because the approval system blocked the isolated Docker run.

Exact next action: rerun the isolated PostgreSQL suite after approval is available. Then copy the pending commits to the AI stylist folder, push to GitHub and publish the refreshed private Memory site. Continue local work without exceeding Phase 1 or spending boundaries.


## Local media persistence risk checkpoint, 11 October 2026

Task 2b now prepares an owner-bound media composition with separate customer-authenticated deletion claims and service-only persistence calls. Simulated checks cover sanitized uploads, full-byte checksum recovery, false deletion acknowledgments and deadline/cancellation failures. The updated SQL-backed adapter-chain rehearsal is typechecked but awaits execution, alongside the newest timestamp guards. Hosted identity verification, actual Storage behavior, signed URL protection, decoder OS limits and receipt retention remain acceptance gates. This changes no launch/privacy/spending decision and does not complete Task 2b or Phase 1.


## SQL adapter-chain verification, 11 October 2026

The isolated PostgreSQL suite passed after execution became available, including latest source timestamp guards, owner-only mixed-look history and media lifecycle recovery through prepared RPC/Storage adapters. Six lost-acknowledgment paths and legacy JPEG deletion pass. Storage HTTP and customer authentication remain simulated. This supersedes earlier pending-rerun checkpoints; hosted Storage, signed URLs and decoder OS resource limits remain unverified. Task 2b and Phase 1 remain incomplete.


## Local decoder containment verified, 11 October 2026

Six isolated Linux resource scenarios pass through the actual sanitizer and Sharp 0.35.5: kernel limits/read-only non-root runtime, PNG/JPEG/WebP through 16 MP, corrupt/dimension refusal, hung-child kill/reap, measured CPU throttling and native-buffer OOM containment. Each temporary container has no network, 384 MiB memory/no swap, half a CPU and 64-process cap and is removed after its scenario. The app uses no Docker runtime or new hosted service. See docs/image-decoder-resource-rehearsal.md for the command and limits of evidence. Actual Render containment, hosted identity, Storage and signed URLs remain gates; Task 2b remains local-only and incomplete. No spending, customer media or hosted changes occurred.


## Actual local Storage API verification, 11 October 2026

The disposable Storage API rehearsal passes owner-only reads, public/foreign/anonymous denial, direct customer mutation protection, signed-link issuance/expiry, exact service acknowledgments and the prepared transport against actual HTTP responses. It exposed and fixed missing-object recovery: a bounded NoSuchKey JSON envelope under HTTP 400 or 404 is required; ambiguous responses remain unknown. All 189 foundation tests, type checking, build and isolated SQL/media recovery checks pass. See docs/local-storage-api-rehearsal.md for scope and evidence. Hosted Auth/Storage and account-bound image delivery remain unverified. Signed links are bearer credentials before expiry; do not expose them as account-bound URLs. Task 2b remains local-only and incomplete.


## Account-bound image interface preparation, 11 October 2026

Prepared a disconnected image-read handler with a fresh trusted identity gate per request, owner/ready metadata validation, bounded verified bytes, a second metadata/session check, cancellation/deadlines, no-store/same-origin headers and four-request admission. It exposes no signed Storage URL. The actual local SQL/Storage rehearsal verifies owner bytes and copied-URL denial for another generated identity; authentication remains simulated. All 209 foundation tests across 16 files, type checking and build pass. See docs/account-bound-image-delivery.md for evidence and remaining hosted/auth/race gates. No app route constructs it; Task 2b remains incomplete and local-only.


## Actual Storage upgrade compatibility, 11 October 2026

The disposable API/database rehearsal now seeds a legacy JPEG, wardrobe item and saved-look reference before lifecycle migrations. The newer chain preserves exact bytes, owner isolation and both references, including account-bound legacy delivery. A deletion claim is refused while either reference remains; after explicit removal of both, actual object deletion, owner-only receipt finalization and retired-ID protection pass. The existing 209-test foundation evidence is unchanged because only this integration harness and documentation changed. Hosted activation and actual Auth remain gated. A concrete seven-day technical-receipt/minimal-retired-ID retention proposal is in docs/deletion-receipt-retention-proposal.md for Sabine's business/privacy decision; it is not approved or implemented.


## Approved deletion-receipt retention, 11 October 2026

Sabine approved seven days for detailed technical photo-deletion receipts, followed by only the retired image ID linked to the account until account deletion. Migration 014 prepares this policy locally. Expired receipts cannot establish successful deletion, even before maintenance runs. A service-only bounded cleanup removes expired receipt details; the retired-ID trigger continues preventing reuse and account deletion cascades the minimal ledger. No photo, notes or conversation are retained by these records.

Local PostgreSQL checks pass for the cutoff, customer denial, invalid limits, repeat cleanup, owner isolation, no ID reuse and account deletion. Hosted scheduling, monitoring and activation remain required before customer launch. Task 2b is still incomplete. No new provider attempts, spending, hosted changes or Auth activation occurred.


## Concurrent receipt maintenance evidence, 11 October 2026

The local PostgreSQL rehearsal now runs eight cleanup transactions across four workers with a two-receipt batch limit. Exactly seven expired synthetic receipts are removed; every result respects the batch limit. Recent receipts, the live-media count and all minimal retired IDs remain unchanged. Anonymous callers, null limits and limits over 1,000 are denied; repeated cleanup returns zero. The full local protection rehearsal passes. No production cleanup scheduler has been installed.


## Local single-consultation slot, 11 October 2026

Migration 015 prepares the approved one-consultation capacity limit in a private singleton database row. Real local PostgreSQL checks pass for simultaneous claims with one winner, owner/session/token-bound reconnect, exactly-once provider authorization, heartbeat, expired-provider cleanup holds, verified release, expired unused reservation reclamation and stale-generation fencing. Direct table access and browser function calls are denied. Provider work must be marked before the call; expiry alone never frees possibly active remote work. See docs/consultation-slot-preparation.md. No actual Auth, coordinator or provider route is wired. The existing spending ledger and Phase 1/hosted gates remain unchanged.


## Prepared consultation-slot adapter, 11 October 2026

Added a disconnected server port bound to one trusted owner. It validates UUIDs, exact lease fields, safe fences, explicit-offset timestamps and boolean mutation acknowledgments. It rejects overlapping calls, enforces an eight-second maximum response deadline, sanitizes errors and never retries. A timed-out mutation may still complete remotely; the caller must treat it as uncertain and use the same reservation evidence for reconciliation, without starting provider work. No token is exposed through a route and no key is read from the environment.

All 215 foundation checks across 17 files, type checking and build pass. A separate actual local SQL rehearsal connects this TypeScript adapter to migration 015 and verifies reservation, reconnect, foreign isolation, provider authorization fencing and verified cleanup holds. Auth and transport identities in this rehearsal are synthetic. Actual provider/coordinator integration and hosted acceptance remain gated.


## Lost acknowledgments and consultation races, 11 October 2026

The prepared adapter now passes actual local SQL checks that deliberately discard successful claim, provider-transition and end acknowledgments. An unknown claim keeps the unused reservation held until safe expiry; reconnect after a lost provider-transition reply observes provider state, and another provider transition is refused. A lost end reply does not let the old generation affect the next reservation. Two independent provider-start SQL transactions permit exactly one transition. Concurrent heartbeat and verified end leave the slot free, and later stale heartbeats are refused. Full local data-protection rehearsal and type checking pass. Foundation source is unchanged, with the existing 215-test evidence retained. Auth/provider usage is simulated and hosted activation remains gated.


## Local Task 2c preparation approved, 11 October 2026

Sabine explicitly approved local Task 2c account preparation while Phase 1 remains open. This extends the earlier local Task 2b sequencing exception only to account interfaces and simulated tests. It includes no hosted configuration, real sign-in, new credentials, paid calls or customer launch. Prepare email/password, recovery, Google and Apple flows against injected provider interfaces, then real server identity-verification boundaries. Preserve every existing hosted, privacy, financial and Phase 1 acceptance gate. The pending-question wording in the preceding audit is now superseded by this approval.


## Local account-flow controller

Added a disconnected UI controller with injected provider operations, generation fencing, cancellation and a bounded deadline. It covers email/password, confirmation-required registration, generic recovery acknowledgment, Google/Apple pending/canceled states and immediate local sign-out. Failed remote sign-out is explicitly unconfirmed. Snapshots contain no passwords, email addresses, session tokens or raw provider errors. Canceled-before-dispatch operations never invoke the provider; late replies cannot restore local identity. Browser state is not server authorization.

All 223 foundation tests across 18 files, type checking and build pass. These eight new controller checks use synthetic responses; email delivery, actual OAuth, server tokens, cookies, callback/recovery validation and remote revocation are not implemented. The controller is not yet displayed in the foundation UI. Task 2c remains in progress and local-only.


## Cryptographic identity gate preparation

Prepared a disconnected jose 6.2.12 verifier with exact Supabase issuer/audience, asymmetric-only signing, required user/session claims and an injected current-session authority. It refuses expiry, malformed/anonymous/forged tokens and revoked/uncertain sessions. Downstream current-session checks are available without exposing tokens. Eight-second deadlines and four underlying operations bound unresolved work; timed-out underlying checks keep admission until they settle. All 231 foundation tests across 19 files, type checking and build pass. Generated keys and simulated session status are the only identities used. See docs/server-identity-preparation.md for source references and remaining real Auth/JWKS/cookie/callback requirements.


## Protected current-session lookup

Migration 016 prepares a service-only boolean lookup joining auth.sessions and auth.users by both signed IDs. It rejects missing/expired sessions and deleted, banned or anonymous users. It never creates or changes managed Auth tables. A disconnected authority adapter accepts only exact true and discards canceled/error replies. The isolated fixture now includes a minimal synthetic Auth schema; a generated signed token passes the actual local SQL lookup and is rejected after its session row is removed. Direct browser table/function access is denied.

All 234 foundation tests across 20 files, type checking and build pass. Full local PostgreSQL and actual Storage upgrade rehearsals pass with sixteen migrations. This does not prove actual GoTrue sign-out, live schema privileges, configured inactivity/timebox policies or email/OAuth behavior. Supabase model fields were reviewed from its official source; the actual hosted schema and session configuration still require verification before activation.


## Local public signing-key transport

Prepared a disconnected fixed-project JWKS resolver using jose and injected fetch. Only the configured HTTPS Supabase endpoint is fetched, never a token-supplied URL. Requests refuse redirects, omit credentials and bound response time to five seconds, body size to 64 KiB and key count to 32. Private/symmetric key material is refused. Public keys expire after ten minutes; refresh attempts have a thirty-second cooldown. Unknown signing keys can trigger one allowed refresh, with concurrent callers sharing the request. A response deadline also covers injected transports that ignore cancellation; their pending operation stays retained so repeated calls cannot launch unlimited requests. Production native fetch is expected to honor abort; a non-cooperative injected operation can leave this resolver unavailable until it settles. No automatic retries or stale-cache fallback after expiration.

All 240 foundation tests across 21 files, type checking and build pass. Generated ES256 keys verify cryptographically through simulated HTTP responses. Rotation, unknown-key request storms, private keys, excessive response bodies, unsupported algorithms, ignored cancellation and stalled bodies are checked. No live JWKS request, actual signing configuration inspection or hosted account activation occurred. Cookie/origin and OAuth/recovery callback boundaries remain next.


## Local account request boundary

Prepared a disconnected cookie-only identity gate for a configured HTTPS application origin. It refuses foreign URL/Host/Origin, cross-site and same-site browser requests, query strings, duplicate or malformed account cookies and alternate Authorization credentials. Mutations require exact Origin. Owner headers and forwarded-host headers do not determine identity. The single __Host-stylist_access token is passed only to the prepared signature/current-session verifier; cancellation and errors return no identity. This is a prepared cookie contract, not cookie issuance or a customer endpoint. Secure/HttpOnly/Path=/ and SameSite controls must be enforced when the issuer is implemented.

All 245 foundation tests across 22 files pass, with type checking and build. The request suite includes a real generated ES256 signature, simulated session revocation and malformed/cross-origin request rejection. This proves local composition only; no browser cookie, actual Auth sign-in, OAuth or password recovery is accepted yet. No route, customer feature or hosted configuration is enabled.


## Verified account cookie preparation

Added a disconnected cookie issuer that first verifies the token and rechecks its current session. It produces a host-only __Host-stylist_access session cookie with Path=/, Secure, HttpOnly and SameSite=Strict. It sets no Domain or persistent Max-Age. Clearing uses the identical scope with Max-Age=0; remote sign-out is a separate requirement. Token size is capped at 3800 characters to leave room within common cookie limits; malformed tokens, revoked identity, canceled checks and errors produce no cookie. Request routes must enforce the prepared origin/CSRF boundary before invoking issuance. OAuth/recovery needs a separate short-lived callback contract; the strict account cookie is not that contract.

All 249 foundation tests across 23 files, type checking and build pass. These cookie checks use simulated verifier results. No actual browser cookie, credentials, provider connection or hosted feature was activated.


## Local callback transaction preparation

Prepared a disconnected process-local callback store for Google, Apple and recovery. Each flow gets independent 256-bit random state, browser binding and a 43-character PKCE verifier, with S256 challenge. The verifier stays in server memory; the temporary host-only cookie holds only its separate browser binding and uses Secure, HttpOnly, SameSite=Lax and a five-minute maximum age. At most 128 flows are retained, expired entries are purged and a valid transaction is consumed synchronously once before any future code exchange. Wrong browsers or purposes cannot consume another flow. A restart loses pending transactions and requires a new sign-in/recovery attempt; this is not storage of customer session notes.

The request parser allows only an exact configured origin and purpose-specific GET callback path, one flow field and one bounded code field, with an unambiguous binding cookie. It supports cross-site top-level redirects but rejects non-navigation Fetch Metadata when present, foreign hosts, duplicate or extra query fields, malformed codes and duplicate cookies. Return destinations are a fixed internal allowlist. Recovery always resolves to /account/reset and never implies normal stylist access. A matched callback does not authenticate a person: actual provider exchange, cryptographic token/session checks and separate recovery authorization are still required. Failed exchange must restart the consumed flow.

All 257 foundation tests across 24 files, type checking and build pass. New checks cover challenge derivation, replay/concurrent winner, wrong browser/purpose, expiration/restart, admission bounds, safe return paths and hostile callback requests. No provider code was exchanged, actual OAuth state/redirect preservation verified or hosted setting changed. Same-browser recovery and process-restart UX need acceptance review before activation; cross-device recovery is not silently declared unsupported by the product. Actual Supabase flow-ID/version handling and Apple redirect behavior must be verified at integration.

References: [Supabase PKCE flow](https://supabase.com/docs/guides/auth/sessions/pkce-flow), [RFC 7636](https://www.rfc-editor.org/rfc/rfc7636.html). The prepared flow uses an application-owned browser transaction alongside provider code exchange; it is not a replacement for provider OAuth state validation.


## Simulated local account screens

Profile now displays an account panel, also reached by Preview account screens on Stylist. It uses approved design tokens and offers email/password, account creation, recovery, Google and Apple preview actions. Every screen states that only made-up details should be used, no account/email/provider connection is created and simulated sign-in never unlocks the stylist. Inputs are labeled, status uses a live region, errors use an alert, modes expose pressed state and pending/handoff work can be canceled. Password input clears after submission; sample sign-out clears local input fields. Leaving Profile cancels its controller and discards its local state. No browser storage or network provider is used.

All 261 foundation tests across 25 files pass, with type checking and build. Static markup and simulated provider/controller checks cover the available methods and outcomes. Agent browser QA verified sample sign-in, sign-out, confirmation, recovery, both social handoffs and cancel in the actual local page, plus a desktop layout inspection. Sabine's visual review, narrow viewport, keyboard/screen-reader acceptance and real providers remain open; Task 2c is not complete. The existing loopback preview on port 4322 was reused after a duplicate start reported the port occupied; no second service was launched.


## Account composition and local usability checks

Added createAccountSecurity to compose the fixed-project key resolver, cryptographic/current-session verifier, request gate, secure cookie issuer and one-time callback store. Configuration and server-only RPC/fetch remain explicit injected dependencies. No environment, HTTP route, actual account, provider credential or customer activation is added. Generated-token integration checks verify the whole cookie-to-request path with simulated HTTP/RPC: owner comes from the signed identity, revoked sessions cannot issue cookies or authorize requests, anonymous/forged tokens fail and a callback transaction alone does not authorize access.

Fixed canceled account-controller operations retaining unlimited non-cooperative provider promises: at most four underlying operations are admitted, timed-out/canceled work retains its admission until it settles, and stale results cannot replace a newer identity. A focused test proves admission recovers after settlement. The UI now moves keyboard focus to completed/canceled status messages; errors announce assertively. Agent browser QA confirmed focus moves to the result, Tab reaches Cancel and Enter cancels with focus returning to status.

Viewport overrides of 390 and 320 pixels produced measured document widths of 375 and 305 pixels respectively, with no horizontal overflow; the browser scrollbar accounts for the difference. Inputs and action buttons measured at least 50 pixels high in the narrow view. Controls wrap and remain readable. The temporary viewport override was reset. These checks are browser layout/keyboard evidence, not actual iPhone or screen-reader acceptance. Sabine has received the complete eight-step local visual review, with independent local work continuing while the response is pending.

All 265 foundation tests across 26 files pass. Type checking and build are rerun for the final source before publication. Task 2c and Phase 2 remain incomplete.


## Canceled and failed callback handling

The disconnected callback parser now distinguishes exchange-required success from a bound provider failure. A valid failure consumes its transaction once and returns only canceled purpose plus /account; it exposes no verifier, code or raw error text. Duplicate fields, mixed error/code input, unknown fields, oversized error fields and oversized URLs fail without consuming a valid transaction. This prepares safe account-access return behavior, not a real provider callback route or styling session. Actual provider error field/redirect preservation still requires integration verification.

All 267 foundation tests across 26 files, type checking and build pass. The new checks prove one-time failure consumption, sensitive error-text suppression and rejection of ambiguous success/failure callbacks. docs/task-2c-acceptance-audit.md separates local evidence from every remaining real-provider, recovery, refresh, sign-out, identity-linking, email, Apple maintenance, phone and accessibility requirement. No Task 2c or phase completion is claimed.


## Disconnected account exchange orchestration

Added a provider-independent callback exchange coordinator. It consumes a bound Google/Apple callback once, passes only its bounded code and PKCE verifier to an injected trusted server adapter, verifies the returned signed token/current session and prepares secure account/flow-clear cookies plus the verified owner and stored internal return path. The ready result is a server-only capability, not a customer JSON response. The caller must send cookies only as response headers, adopt the adapter-held session/refresh lifecycle and invoke its idempotent discard capability if response delivery or adoption fails. No HTTP route or real adapter is installed.

A newly created session has an adapter-owned discard operation that must revoke that exact session and remove its refresh material. Invalid identity or cancellation triggers discard. Late sessions after timeout/cancellation are also discarded and cannot restore access. Cleanup is bounded and deduplicated. Failed, stalled or malformed cleanup and ambiguous provider failures place a coordinator hold on further exchanges. Only an explicit exact notCreated acknowledgment avoids an ambiguity hold. There is no automatic retry/reset. This process-local hold and pending work must become durable/reconcilable before hosted activation; a restart is not proof of remote cleanup.

Responses are bounded to eight seconds and at most four underlying exchanges are admitted. Timed-out work retains its admission until it settles, so repeated attempts cannot create unlimited pending provider work. A busy response does not consume the callback. Recovery is refused by the normal access path before consuming its transaction, preserving it for a separate provider-verified reset flow. Provider cancellation returns no account access.

All 277 foundation tests across 27 files, type checking and build pass. Generated signed-token integration and simulated adapter tests cover ready identity/cookies, replay, invalid identity cleanup, cancellation/late arrival, failed/ignored cleanup, ambiguous failure holds, explicit no-session proof, recovery isolation, admission recovery, pre-canceled/invalid requests and malformed cleanup capabilities. No real session, OAuth exchange, refresh token, sign-in, email, credential or hosted configuration was created or used. Actual adapter cleanup semantics and response-delivery handling remain acceptance requirements.


## Shared local account lifecycle and accepted preview, 11 October 2026

Sabine completed every step of the eight-step account preview and reported that all steps worked and were readable. This accepts the local simulated screens only, not real sign-in or email delivery.

Extracted a common server-only session lifecycle and added disconnected email/password and registration ports. Password and OAuth callback methods share a four-operation admission limit and the same uncertainty hold after ambiguous creation or failed cleanup. Registration confirmation returns no account cookie. Email whitespace is trimmed; passwords are passed unchanged and never stored by these interfaces. Exact input keys and string methods are required, preventing object coercion into a supported action. HTTP origin/CSRF, rate/body limits, real provider policy and refresh adoption remain requirements before wiring any route.

All 287 foundation tests across 29 files, type checking and build pass. Six added tests cover signed session/cookie preparation, confirmation isolation, malformed input, cross-method holds, late cancellation cleanup and shared outstanding admission without consuming busy callback transactions. Existing callback tests pass after the refactor. No routes, providers, real accounts, emails, hosted settings or paid calls were activated. Next: scoped local recovery and sign-out contracts. Task 2c and Phase 2 remain open.


## Local sign-out coordinator, 11 October 2026

Prepared a disconnected POST-only sign-out coordinator for the exact configured HTTPS origin and account sign-out path. Valid same-origin requests return access-cookie and flow-cookie clearing headers independently of remote revocation. Only a verified signed identity reaches the injected trusted revocation adapter; only its exact true acknowledgment reports signedOut. Invalid identity, errors, cancellation, deadline and admission exhaustion report remoteUnconfirmed. No response claims that clearing a browser cookie revokes the remote session. The future HTTP caller must deliver these headers, close local customer state immediately and arrange durable retry/reconciliation for unconfirmed revocation.

At most four underlying operations are admitted, with an eight-second maximum response deadline. A stalled operation retains admission until it settles; late success never changes a returned unconfirmed result. Four new tests cover verified owner/revocation, local clearing on failure, hostile request refusal and stalled admission. The initial deadline test incorrectly combined fake timers with asynchronous cryptography; it now verifies identity first and isolates the stalled revocation stage. All 287 foundation checks across 29 files, type checking and build pass. No real accounts, cookies, provider calls, hosted changes or spending were activated.

Next action: prepare provider-verified recovery authorization and scoped reset contracts locally, then refresh the private Memory site with the account checkpoints. Actual provider revocation, refresh-material adoption and response delivery remain open. Task 2c is incomplete.


## Scoped local recovery preparation, 11 October 2026

Added a disconnected recovery owner that consumes only a bound recovery callback. Its trusted adapter must establish provider recovery purpose, identity and expiry; an ordinary signed account token is insufficient. The resulting server-only capability exposes reset and discard, never normal account cookies or stylist access. The effective grant expiry is the earlier of the provider expiry and five minutes. Reset consumes the grant before calling the adapter, so simultaneous, repeated or timed-out attempts cannot repeat a password change. Invalid input does not consume valid permission. No new production password policy is invented.

ResetComplete requires exact password-change confirmation and confirmed cleanup of the recovery session/refresh material. Failed or timed-out work is unconfirmed; late completion is cleaned up without changing the returned result. At most four underlying operations and 128 retained grants are allowed. Stalled work retains admission until it settles. Expired grants are discarded on use or a subsequent recovery attempt. The future HTTP/session owner must bind this server capability to the browser separately, enforce Origin/CSRF and rate/body limits, arrange proactive expiration/disposal and durable reconciliation, and provide reviewed cross-device recovery UX. These process-local contracts do not prove provider purpose, remote cleanup or restart recovery in production. No HTTP route or provider adapter is installed.

All 295 foundation tests across 30 files, type checking and build pass. Eight added checks cover one-time reset, no account access, expiry/input validation, rejection of ordinary access-token proof, cleanup failure holds, canceled late exchange, wrong/canceled callbacks, outstanding admission and delayed reset without retry. Tests use simulated trusted capabilities only. No real account, password, recovery email, provider call, hosted setting or spending changed. Task 2c and Phase 2 remain incomplete.

Exact next action: audit recovery failure/cleanup and browser-binding integration requirements, prepare local recovery UI/controller behavior, and refresh private Memory after the next verified account checkpoint. Real provider activation, refresh lifecycle and physical-device/screen-reader acceptance remain open.


## Simulated reset interface, 11 October 2026

Recover access now offers a clearly labeled simulated reset step after its no-email acknowledgment. It requires matching made-up passwords, clears both fields after submission, announces errors/results with focus, disables completed or unconfirmed attempts and returns to account options without authentication. The independent browser controller stores no password in its snapshot, consumes a valid dispatch once, refuses expired permission, cancels on unmount and discards late results. Timeout and cancellation cannot retry an uncertain change. The sample five-minute permission is presentation only, never provider proof or a server authorization boundary. No new credential is actually created or changed.

All 300 foundation tests across 31 files, type checking and build pass. Five new checks cover confirmation matching/one dispatch, expiry, cancellation/late results, timeout/no retry and accessible labeled simulated markup. Actual local browser QA confirmed mismatch feedback, matching completion, cleared fields, disabled repeat submission, status focus and continued signed-out messaging. Screenshot: /private/tmp/ai-stylist-reset-preview.png. Physical iPhone, screen reader and Sabine review of this newly added reset step remain open; the earlier eight-step account preview is already accepted and is not reopened.

Exact next action: audit and strengthen recovery expiration, discard and cross-method cleanup behavior, then publish a consolidated private Memory refresh. Real providers, browser-bound server recovery delivery, refresh lifecycle and hosted acceptance remain gated. Task 2c remains incomplete.
