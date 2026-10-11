# AI Stylist development backlog

Updated: 10 October 2026

Imported from prioritized backlog v1.8. Original DOCX/XLSX files are preserved. This is the working status ledger for autonomous implementation. Later explicit Sabine decisions and the approved product/design specifications refine the older baseline: use look, one look at a time, USA/USD, real product links for launch and affiliate revenue. Demo fixtures never satisfy real shopping acceptance. docs/progress.md retains phased exit gates. No incomplete dependency is marked complete merely because an independent discovery component is ready.

## Current priorities

1. D01 voice/avatar recovery and live-note acceptance: partial evidence, blocked on Tavus recovery reply and a new paid-test allowance.
2. D02 catalog adapter contract: implemented with shared synthetic tests.
3. D03 synthetic demonstration catalog: implemented for internal development only.
4. Phase 1d source/rights/privacy discovery: desk research is actionable; partner applications and contractual commitments require Sabine.

## Items

### D01: Validate real-time avatar/voice prototype

Priority: P0 | Release: Discovery | Dependencies: None | Status: In progress: prototype evidence only; full acceptance pending

User story: As a shopper I can talk naturally to a lifelike stylist.

Technical tasks: Benchmark avatar, streaming voice, interruptions, cost and fallback. Prototype Tavus with OpenAI Realtime; validate supported audio routing, lip sync, interruptions, and access to live note events before committing to the integration.

Baseline acceptance: Demonstrate two-way speech, lip sync, interruption and audio-only fallback. Confirm the selected voice and avatar path supports concurrent progressive notebook updates.

### D02: Define catalog adapter contract

Priority: P0 | Release: Discovery | Dependencies: None | Status: Implemented; shared synthetic contract tests passed. Live source approval remains separate.

User story: As a team we can switch retailers without rebuilding styling.

Technical tasks: Define normalized product/variant, search, pricing, availability, deep-link and capability schema.

Baseline acceptance: Mock and two sample adapters pass shared contract tests.

### D03: Build synthetic demonstration catalog

Priority: P0 | Release: Discovery | Dependencies: D02 | Status: Implemented internal fixture; automated and agent browser checks passed. Live styling and launch acceptance remain separate.

User story: As a shopper I can explore outfits before a retailer is chosen.

Technical tasks: Seed rights-safe images and sample products, sizes and attributes.

Baseline acceptance: Clearly marked demo products support search and styling; cannot be purchased.

### D04: Accounts and style profiles

Priority: P0 | Release: R1 | Dependencies: None | Status: Not started

User story: As a shopper I can save sizes, style and budget.

Technical tasks: Auth, profile schema, consent and preferences.

Baseline acceptance: Save, edit and retrieve preferences across sessions.

### D05: Live voice session

Priority: P0 | Release: R1 | Dependencies: D01 | Status: In progress: prototype evidence only; full acceptance pending

User story: As a shopper I can speak and interrupt naturally.

Technical tasks: Streaming STT/LLM/TTS or speech-to-speech, state handling. Use OpenAI Realtime as the intended conversation layer; configure input transcript access for the note extractor and verify interruption behavior with Tavus.

Baseline acceptance: Speech works with interruptions, errors and captions.

### D06: Photorealistic female avatar

Priority: P0 | Release: R1 | Dependencies: D01,D05 | Status: In progress: prototype evidence only; full acceptance pending

User story: As a shopper I see a human-looking stylist speaking.

Technical tasks: Avatar renderer, sync, streaming and audio-only fallback.

Baseline acceptance: One consistent female avatar animates speech and recovers on failure.

### D07: Styling conversation orchestration

Priority: P0 | Release: R1 | Dependencies: D04,D05 | Status: Not started

User story: As a shopper I receive occasion-aware recommendations.

Technical tasks: Intent extraction, profile context, tool orchestration and guardrails.

Baseline acceptance: Understands occasion, budget and preferences; asks clarifying questions.

### D08: Photo capture and upload

Priority: P0 | Release: R1 | Dependencies: D04 | Status: In progress: prototype evidence only; full acceptance pending

User story: As a shopper I can show an owned garment.

Technical tasks: Camera/photo picker, permissions, upload security.

Baseline acceptance: Capture/upload succeeds; denial and errors are handled.

### D09: Live camera item showing

Priority: P0 | Release: R1 | Dependencies: D05,D08 | Status: Not started

User story: As a shopper I can show clothing while talking.

Technical tasks: Video frame sampling, consent and vision session integration.

Baseline acceptance: Recognizes shown item with permission; no default raw-video retention.

### D10: Clothing recognition and correction

Priority: P0 | Release: R1 | Dependencies: D08 | Status: Not started

User story: As a shopper I can verify garment details.

Technical tasks: Vision extraction of type/color/style, confidence and edits.

Baseline acceptance: User can correct incorrect or uncertain attributes.

### D11: Persistent digital wardrobe

Priority: P0 | Release: R1 | Dependencies: D04,D10 | Status: Not started

User story: As a shopper I can save and manage owned clothing.

Technical tasks: Wardrobe storage, media, CRUD and category filters.

Baseline acceptance: Items persist; edit and delete work; multiple items selectable.

### D12: Outfit recommendation engine

Priority: P0 | Release: R1 | Dependencies: D03,D07,D11 | Status: Not started

User story: As a shopper I get looks using what I own.

Technical tasks: Candidate retrieval, compatibility rules, ranking and budget constraints.

Baseline acceptance: Returns three coherent looks combining owned and demo catalog pieces.

### D13: Visual outfit builder

Priority: P0 | Release: R1 | Dependencies: D12 | Status: Not started

User story: As a shopper I can see complete outfits.

Technical tasks: Product cards, layout, owned/demo labels, responsive design.

Baseline acceptance: Every outfit shows component items and clear owned/demo distinctions.

### D14: Voice/touch item swapping

Priority: P0 | Release: R1 | Dependencies: D13 | Status: Not started

User story: As a shopper I can change shoes or tops.

Technical tasks: Outfit state, substitution search and action tool.

Baseline acceptance: Voice or touch swap updates outfit and totals correctly.

### D15: Saved outfits

Priority: P0 | Release: R1 | Dependencies: D13,D04 | Status: Not started

User story: As a shopper I can revisit looks.

Technical tasks: Persist outfit compositions and thumbnails.

Baseline acceptance: Save, reopen and remove outfits across sessions.

### D16: Demo shopping bag

Priority: P0 | Release: R1 | Dependencies: D13,D03 | Status: Not started

User story: As a shopper I can collect suggested products.

Technical tasks: Bag state, variants, demo pricing and nonpurchase warning.

Baseline acceptance: Owned items excluded; demo items cannot trigger payment.

### D17: Consent, deletion and retention

Priority: P0 | Release: R1 | Dependencies: D04,D08 | Status: Not started

User story: As a shopper I control my data.

Technical tasks: Permission prompts, retention policy, delete endpoints, audit.

Baseline acceptance: Camera/mic permission revocable; wardrobe data deletable.

### D18: Accessibility and resilient UX

Priority: P1 | Release: R1 | Dependencies: D05,D13 | Status: Not started

User story: As a shopper I can use touch and captions.

Technical tasks: Captions, keyboard/touch navigation, offline/error states.

Baseline acceptance: Core journey works without audio or camera access.

### D21: Live preference schema and incremental extraction

Priority: P0 | Release: Discovery | Dependencies: D05,D07 | Status: In progress: prototype evidence only; full acceptance pending

User story: As a shopper, I can see my styling preferences captured as I speak.

Technical tasks: Define typed fields for occasion, season/date, color, style, budget type/currency, outfit type, and selected wardrobe items; add confidence, status, source, and update time; stream updates from conversation orchestration. Consume partial and completed user transcript updates; reconcile them by item/turn ID, keep extraction confidence separate, and reject stale events after customer corrections.

Baseline acceptance: A representative utterance progressively populates structured fields; ambiguous values remain To confirm; no unsupported values are invented. Stable preferences appear before a continuous multi-sentence turn ends; later events do not undo touch or voice corrections.

### D22: Notebook-style Live Styling Notes panel

Priority: P0 | Release: R1 | Dependencies: D21,D05 | Status: In progress: prototype evidence only; full acceptance pending

User story: As a shopper, I can review my preferences in an editable notebook while talking.

Technical tasks: Build a collapsible notebook-inspired panel with ruled page treatment, clear labels, readable type, responsive layout, and field status affordances. Title the notebook My Styling Notes. On mobile, place the photorealistic stylist above it and outfit recommendations below it; show outfits once sufficient confirmed preferences are captured.

Baseline acceptance: Notes remain visible and understandable while the stylist speaks; panel collapses and reopens without losing session state; decoration does not impair reading. The upper stylist, middle collapsible notebook, and lower outfits remain usable; customers can see understood preferences without interrupting speech.

### D23: Missing, uncertain, and confirmed preference states

Priority: P0 | Release: R1 | Dependencies: D21,D22,D07 | Status: In progress: prototype evidence only; full acceptance pending

User story: As a shopper, I can see what the stylist understood and what still needs confirmation.

Technical tasks: Implement Not provided, To confirm, Confirmed, and customer-edited states; confidence thresholds; concise clarification prompts; status updates.

Baseline acceptance: All fields expose a text status; uncertain or missing values are not applied as hard recommendation filters; useful follow-ups are asked when needed.

### D24: Touch editing for live notes

Priority: P0 | Release: R1 | Dependencies: D21,D22,D04 | Status: In progress: prototype evidence only; full acceptance pending

User story: As a shopper, I can correct any note directly.

Technical tasks: Add field-level edit controls, validated inputs, save/cancel behavior, and state synchronization with the active session.

Baseline acceptance: Customer can edit occasion, date/season, color, style, budget meaning, outfit type, or wardrobe selection; saved value is reflected in session context within 1 second.

### D25: Voice corrections and conflict handling

Priority: P0 | Release: R1 | Dependencies: D05,D21,D23 | Status: In progress: prototype evidence only; full acceptance pending

User story: As a shopper, I can correct a preference naturally while speaking.

Technical tasks: Parse correction intent, prioritize the latest explicit value, resolve conflicts, update note state, and acknowledge meaningful changes.

Baseline acceptance: A correction such as “make my budget $350” updates the note and styling context within 2 seconds after understanding; ambiguous conflicts prompt clarification without silent overwrite.

### D26: Confirmed-note recommendation integration

Priority: P0 | Release: R1 | Dependencies: D07,D11,D12,D21,D23 | Status: R1 implementation not started; independent synthetic candidate/gate discovery prepared

User story: As a shopper, I receive outfits that reflect what I confirmed and what I own.

Technical tasks: Map confirmed note fields and selected wardrobe items into recommendation constraints; invalidate stale results and recalculate affected looks/totals after edits.

Baseline acceptance: Recommendations use confirmed values and selected owned items; uncertain or missing values are not hard filters; corrected constraints refresh affected results.

### D27: Privacy and accessibility for live notes

Priority: P0 | Release: R1 | Dependencies: D17,D18,D21,D22,D24 | Status: In progress: prototype evidence only; full acceptance pending

User story: As a shopper, I can control my notes and use the feature accessibly.

Technical tasks: Apply session-only defaults, consent-gated persistence, clear/delete controls, least-privilege access, semantic announcements, captions, keyboard/switch access, contrast, focus, target-size, and reduced-motion support.

Baseline acceptance: Notes follow consent and deletion controls; changes are announced without focus jumps; status is not conveyed by color alone; audio-only operation is not required.

### D28: Live notes acceptance and resilience

Priority: P0 | Release: R1 | Dependencies: D21,D22,D23,D24,D25,D26,D27 | Status: In progress: prototype evidence only; full acceptance pending

User story: As a team, we can verify the notes journey end to end.

Technical tasks: Add acceptance coverage for progressive capture, uncertainty, touch/voice edits, recommendation refresh, permissions, retention, accessibility, latency, and service failures. Cover the supplied wedding example, continuous speech updates, the My Styling Notes title, and mobile section order.

Baseline acceptance: A wedding-in-November example captures all stated preferences; missing fields stay open; touch and voice corrections update results; consent denial and service errors have usable fallbacks. A budget correction from $500 to $350 replaces the note and refreshes affected outfits; the stylist asks dress or pantsuit when outfit type is unspecified.

### D29: Capture outfit feedback by voice and touch

Priority: P0 | Release: R1 | Dependencies: D05,D07,D13,D21,D25 | Status: Not started

User story: As a shopper, I can say what I like and dislike about a suggested outfit.

Technical tasks: Extract likes, dislikes, and change intent; resolve the visible look and item targets; support Keep, Change, and text input; clarify uncertain references.

Baseline acceptance: Mixed feedback targets the right items; voice and touch agree; ambiguous references are clarified before exclusions are applied.

### D30: Notebook feedback and items to keep

Priority: P0 | Release: R1 | Dependencies: D22,D23,D24,D27,D29 | Status: Not started

User story: As a shopper, I can see and correct feedback in My Styling Notes.

Technical tasks: Add Feedback on this outfit with Likes, Dislikes, Requested changes, and Items to keep; bind entries to a revision and item/attribute; retain scope and confirmation status.

Baseline acceptance: Feedback appears progressively; touch/voice corrections update it; a single rejected item stays scoped to the session/look unless the customer confirms a broader preference.

### D31: Refine outfits while preserving constraints

Priority: P0 | Release: R1 | Dependencies: D12,D14,D26,D29,D30 | Status: Not started

User story: As a shopper, I receive another outfit that reflects my feedback.

Technical tasks: Search and rank coordinated replacements; keep explicitly liked pieces; enforce confirmed notes, wardrobe selection, budget, and scoped exclusions; recompute totals; handle conflicts and no-match results.

Baseline acceptance: The dress and bag remain when only shoes are rejected; a lower-heel request changes the shoes; confirmed limits hold; owned pieces are excluded from purchase totals; conflicts require a customer choice.

### D32: Outfit revision state and repeated feedback

Priority: P0 | Release: R1 | Dependencies: D13,D31 | Status: Not started

User story: As a shopper, I can keep refining without losing my earlier choices.

Technical tasks: Version look, feedback, and confirmed-note state; cancel/supersede requests; reject obsolete results; retain session history; implement undo and validated restoration of earlier looks.

Baseline acceptance: At least three feedback rounds retain constraints and kept pieces; an interruption or budget correction supersedes old results; undo works and restored looks meet current constraints.

### D33: Explain and compare revised outfits

Priority: P0 | Release: R1 | Dependencies: D13,D15,D18,D30,D31,D32 | Status: Not started

User story: As a shopper, I can understand changes and choose my preferred look.

Technical tasks: Show retained/replaced pieces, reasons, and totals; add comparison and more-feedback controls; connect save; preserve prior look during loading/errors; add captions and semantic announcements.

Baseline acceptance: The new look explains changes; customer can compare, refine, or save; timeouts preserve feedback and prior look; keyboard/switch, screen-reader, and touch flows remain usable.

### D34: Feedback refinement acceptance and resilience

Priority: P0 | Release: R1 | Dependencies: D29,D30,D31,D32,D33,D27 | Status: Not started

User story: As a team, we can verify the full feedback and refinement journey.

Technical tasks: Cover mixed feedback, scoped rejection, kept items, repeated rounds, budgets/owned totals, no matches, conflicting notes, stale responses, undo, consent, accessibility, and recovery.

Baseline acceptance: The emerald-dress example keeps dress/bag and replaces high heels; three rounds preserve confirmed limits; late results cannot overwrite corrections; privacy and accessible fallbacks pass.

### D35: Session item images and protected thumbnails

Priority: P0 | Release: R1 | Dependencies: D08,D17 | Status: In progress: prototype evidence only; full acceptance pending

User story: As a shopper, my supplied item photo can appear in the styling notebook.

Technical tasks: Create session asset references and thumbnail/full-image access; local preview and upload states; minimize metadata; apply media access, clear, export, and consent/deletion controls.

Baseline acceptance: Valid photo preview is available before recognition finishes; media access is protected; session clearing removes linked previews; wardrobe persistence requires consent and save.

### D36: Visible item photo in the notebook

Priority: P0 | Release: R1 | Dependencies: D22,D27,D35 | Status: In progress: prototype evidence only; full acceptance pending

User story: As a shopper, I can see the item the stylist is building my outfit around.

Technical tasks: Add Style around this item with actual photo and pasted-photo details; preserve aspect ratio; keep a collapsed thumbnail; add accessible enlarge, replace, remove, and selected-reference controls.

Baseline acceptance: The supplied image is visible in expanded notes and as a collapsed thumbnail; enlarge and edit controls work by touch/keyboard; readable labels and image descriptions are available.

### D37: Image anchor and outfit refinement context

Priority: P0 | Release: R1 | Dependencies: D10,D11,D26,D31,D35,D36 | Status: In progress: prototype evidence only; full acceptance pending

User story: As a shopper, outfit suggestions and revisions keep my selected reference item.

Technical tasks: Bind asset and selected garment to confirmed notes; clarify multi-item images and owned/inspiration status; synchronize voice/touch selection; invalidate stale recognition and outfit results; retain anchor during refinement.

Baseline acceptance: A confirmed owned item remains through three feedback rounds and is excluded from totals; replacement/removal updates notes and results; uncertainty stays visible; inspiration alternatives are labeled.

### D38: Notebook image acceptance and recovery

Priority: P0 | Release: R1 | Dependencies: D35,D36,D37,D27 | Status: In progress: prototype evidence only; full acceptance pending

User story: As a team, we can verify visible item references throughout the session.

Technical tasks: Cover upload/analysis errors, original-image visibility, collapsed preview, multiple references, selection/replacement/removal, ownership ambiguity, three refinement rounds, stale events, accessibility, and privacy.

Baseline acceptance: AC-IMG-01–04 pass; recognition failure retains photo with manual description; voice/touch edits agree; stale events cannot restore an old selection; clear/deletion and accessible controls work.

### D39: Saved preference contract and authority

Priority: P0 | Release: R1 | Dependencies: D04,D21,D23,D30 | Status: R1 implementation not started; independent simulated server profile authority prepared

User story: As a shopper, my saved requirements stay authoritative during styling.

Technical tasks: Define scoped, confirmed preference constraints and versions; merge saved profile, notes, feedback, and anchor; distinguish requirements/exclusions from ranking preferences; define explicit session exception and separate profile save.

Baseline acceptance: Requirements are never silently softened; ambiguity stays visible; conflicting requests require confirmation; session exceptions expire without changing the saved profile.

### D40: Background outfit validation agent

Priority: P0 | Release: R1 | Dependencies: D02,D12,D39 | Status: Not started

User story: As a shopper, every suggested outfit respects my preferences.

Technical tasks: Implement independent validator using current snapshot; structured rules for budget/currency, occasion, color, type, wardrobe and supported saved requirements; constrained subjective assessment; Pass/Conflict/Needs clarification verdict with item/rule reasons.

Baseline acceptance: Entire candidate is checked; owned items excluded from totals; explicit exclusions enforced; unknown required data cannot pass; subjective uncertainty requires clarification.

### D41: Mandatory outfit publication gate

Priority: P0 | Release: R1 | Dependencies: D13,D14,D26,D32,D37,D40 | Status: In progress: prototype evidence only; full acceptance pending

User story: As a shopper, conflicting outfits never reach my recommendation view.

Technical tasks: Await exact candidate/version approval before initial looks, revisions, swaps, restored/reopened looks and bag transfers; gate streaming; reject stale verdicts; invalidate/recheck affected visible looks after profile, notes, feedback or anchor changes.

Baseline acceptance: Only current passing candidates appear; blocked candidates remain hidden; late approvals cannot release obsolete looks; affected visible looks cannot be acted on as current before revalidation.

### D42: Preference clarification and recovery

Priority: P0 | Release: R1 | Dependencies: D07,D22,D24,D25,D27,D39,D40,D41 | Status: R1 implementation not started; independent safe clarification records, protected loopback publication and connected local UI review prepared

User story: As a shopper, I can resolve a preference conflict during the conversation.

Technical tasks: Show Checking your preferences and accessible focused questions; record explicitly confirmed session exceptions in notebook; separate profile save; bound regeneration/retries; hold on timeout/error/missing data; minimize private decision logs.

Baseline acceptance: Voice/touch clarification agrees; no silent overrides or bypass on failure; no-match explains unmet preference; session exceptions are visible and expire; customer isolation and deletion controls apply.

### D43: Preference validation acceptance and resilience

Priority: P0 | Release: R1 | Dependencies: D39,D40,D41,D42,D27 | Status: Not started

User story: As a team, we can demonstrate that every outfit path respects saved preferences.

Technical tasks: Cover exclusions, merged constraints, budget/anchor totals, conflicting requests, session exception/save, unknown data, all publication paths, timeouts, concurrent changes, stale approvals, bounded retries, customer isolation and accessible states.

Baseline acceptance: AC-PREF-01–07 pass; no unvalidated or obsolete candidate reaches display/bag; high-heel exclusion survives refinement/swaps; logs omit raw audio/transcripts/photos.

### D19: Contract tests and integration telemetry

Priority: P0 | Release: R2 | Dependencies: D02,D12 | Status: Not started

User story: As a team we can add approved retailers safely.

Technical tasks: Adapter contract tests, stale price flag, error logs.

Baseline acceptance: Provider changes do not require stylist or wardrobe rewrites.

### D20: End-to-end QA and release gate

Priority: P0 | Release: R2 | Dependencies: D06,D11,D14,D16,D17,D34,D38,D43 | Status: Not started

User story: As a shopper I can finish the demo styling journey.

Technical tasks: Automated E2E, privacy and mobile performance tests. Include repeated outfit feedback, refinement, and saving the preferred look. Cover the visible notebook item image and continuity through outfit revisions. Cover background saved-preference validation on every outfit publication path.

Baseline acceptance: Voice → owned photo → wardrobe → 3 looks → swap → saved look → demo bag passes. Mixed feedback → revised look → three feedback rounds → preferred saved outfit passes with confirmed constraints and kept pieces preserved. The supplied item photo is visible in the notebook; anchor selection, replacement/removal, and stale-event handling pass. Every suggestion passes current preference validation before display/bag; conflicts, unknown required data, stale approvals and failures remain gated.

### X01: Compare ASOS and FARFETCH

Priority: External | Release: Future | Dependencies: None | Status: Public comparison implemented in docs/retailer-comparison.md; partner selection and commercial permission remain blocked business decisions.

User story: As a team we choose a feasible partner.

Technical tasks: Compare catalog access, rights, pricing, region, attribution, commission.

Baseline acceptance: Written evidence and decision record; no partner presumed.

### X02: Send Rakuten ASOS feed inquiry

Priority: External | Release: Future | Dependencies: None | Status: Not started

User story: As a team we can establish ASOS eligibility.

Technical tasks: Use prepared Rakuten inquiry; request feed, API, rights and terms.

Baseline acceptance: Message sent only when authorized; response recorded.

### X03: Negotiate retailer permissions

Priority: External | Release: Future | Dependencies: X01 | Status: Not started

User story: As a team we can legally display products.

Technical tasks: Secure catalog/image licenses, mobile app and affiliate approval.

Baseline acceptance: Written terms cover data, display, attribution and geography.

### X04: Implement approved retailer adapter

Priority: P1 | Release: Future | Dependencies: D19,X03 | Status: Not started

User story: As a shopper I see live licensed products.

Technical tasks: Build adapter, inventory timestamps, localization and affiliate links.

Baseline acceptance: Approved feed maps to normalized schema; stale data handled.

### X05: External retailer checkout

Priority: P1 | Release: Future | Dependencies: X04 | Status: Not started

User story: As a shopper I can buy on retailer site.

Technical tasks: Deep-link checkout, clear redirect and attribution.

Baseline acceptance: Only approved live items link out; no embedded checkout assumed.

### X06: Embedded checkout feasibility

Priority: P2 | Release: Future | Dependencies: X03 | Status: Not started

User story: As a shopper I may check out in-app if supported.

Technical tasks: Investigate explicit partner authorization and SDK/API.

Baseline acceptance: Only enabled after documented approval and tested flow.

## Incremental evidence: extraction HTTP preparation

D21 remains partial. The pinned extraction adapter now has a simulation-only bounded HTTP transport, with 24 focused tests including cancellation and a completed strict-decoder chain. Total phase evidence is 674 passing tests across 47 files, type checking and build. No paid request, credential access, live activation or Render deployment occurred. Next actionable dependency is transcription socket lifecycle integration.

## Incremental evidence: transcription socket preparation

D21/D22 remain partial. The simulated transcription socket lifecycle is implemented with 24 focused checks, including actual loopback framing and a combined synthetic extraction-to-notebook flow. Total phase evidence is 698 tests across 48 files, type checking and build. Physical-device/provider performance remains pending; no launch acceptance is inferred. Next: consolidate the combined session factory and cancellation owner.

## Incremental evidence: combined provider session

D21/D22 remain partial. The shared simulation-only session factory composes the prepared transports and note owner. Six new cancellation/failure checks bring the suite to 704 passing tests across 49 files, with type checking and build passing. No real-provider or physical-device acceptance is claimed. Next integrate the factory through the disabled loopback browser bridge.

## Incremental evidence: combined browser/provider bridge

D21/D22/D24 remain partial. The prepared combined session is integrated through the disabled private browser bridge and the local visible rehearsal. Two turns, confirmation, late correction protection, disconnect cancellation, cleanup holds, provider-failure notification and delayed readiness have seven new focused checks. All 711 tests across 50 files, type checking and build pass; implementer browser verification passed the two-color correction/confirmation/end flow. This is synthetic integration evidence, not live recognition, latency or customer acceptance.

### Combined seven-field scenario evidence

All 714 automated checks across 51 files, type checking and build pass. Three new synthetic scenarios cover all seven tentative fields, missing/ambiguous timing and budget values, confirmation-based fixture holds, and a budget correction invalidating the old release ticket. An over-budget sample remains blocked after confirming the lower maximum; owned items hold until matching exists. This does not prove live model quality or a production preference validator. Next: combined browser page-lifecycle and late-permission cleanup checks.

## Combined lifecycle evidence and cleanup ordering

On 10 October 2026, seven new combined loopback scenarios checked page exit, hidden state, late permission, provider failure, device loss, connection loss and cancellation during extraction. A regression proved that the owner callback could observe cleanup before a capture failure was recorded. The callback is now deferred to the next microtask so shutdown completes first; terminal capture release is attempted even when the stop step throws. All 722 tests across 52 files, type checking and build pass. This is synthetic-device evidence, not live provider/Safari acceptance. docs/phase-1-readiness.md consolidates remaining gates. Next: session-replacement isolation through the combined bridge.

## Combined replacement and release isolation

Four additional synthetic integration checks verify old extraction/provider isolation after replacement, rejection of a prior connection render receipt, refusal of replacement after cleanup failure, and immediate visual/speech-frame permission revocation after a budget correction. All 726 tests across 53 files, type checking and build pass. No real playback or live cleanup is established. Next prepare a bounded combined-note trial plan and full manual instructions while leaving activation disabled.

Prepared the notes-only private trial proposal and complete future manual instructions in docs/combined-notes-live-trial-plan.md. D21/D22 remain partial until actual partial speech and timing evidence exist. No provider trial is enabled or funded by this planning. Next: disabled server owner with private access and durable allowance interfaces, using simulations only.

## Disabled notebook server owner

Prepared a simulation-only owner that checks the exact request boundary and private credentials before reserving an allowance or constructing transports. It owns one startup/session at a time, closes a late reservation after cancellation, stops at the deadline, and verifies capture/socket cleanup before closing the reservation exactly once. Uncertain reservation writes, failed transport construction, failed cleanup or failed durable closure retain a hold without retries. An explicit notes-only simulation purpose prevents accidental use of the existing legacy allowance object. This is method-compatible ledger preparation, not a new durable notes allowance, live route or production authentication system.

Twenty-one new focused checks passed. Current cumulative evidence is 747 tests across 54 files, type checking and build. No credentials, actual ledger, provider requests or deployment were used. D21/D22 and Task 1c remain partial; Phase 1 remains open. Next verify current official provider contracts and document mismatches before preparing any real activation path.

Official guide review is recorded in [notebook-provider-contract-review.md](../docs/notebook-provider-contract-review.md). The approved models and prepared configuration match the fetched guides; complete wire metadata and dedicated connection startup remain unverified because full reference retrieval failed. No model migration, live activation or cost approval is inferred.

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
