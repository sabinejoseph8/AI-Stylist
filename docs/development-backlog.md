# AI Stylist development backlog

Updated: 11 October 2026

Imported from prioritized backlog v1.8. Original DOCX/XLSX files are preserved. This is the working status ledger for autonomous implementation. Later explicit Sabine decisions and the approved product/design specifications refine the older baseline: use look, one look at a time, USA/USD, real product links for launch and affiliate revenue. Demo fixtures never satisfy real shopping acceptance. docs/progress.md retains phased exit gates. No incomplete dependency is marked complete merely because an independent discovery component is ready.

## Current priorities

1. Task 2c local account preparation is active under Sabine's approved exception. All 520 foundation tests pass; synthetic desktop WebKit account/reset checks also pass. Task 2b local preparation and SQL/Storage evidence remain available; hosted acceptance is open.
2. Phase 1 voice/avatar recovery and live-note acceptance remain open, with Tavus clarification, privacy decisions and a newly authorized paid-test amount required for remaining live checks.
3. D02 catalog contract and D03 clearly labeled synthetic catalog are implemented for development. Real product sources, imagery rights and affiliate approval remain open; Rakuten registration is postponed until the customer website is live.
4. Complete Task 2b only after applicable actual SQL/Storage/access checks. Later feature groups retain their Phase 1 dependencies; local preparation does not authorize hosted changes or new paid calls.

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

Priority: P0 | Release: R1 | Dependencies: None | Status: Partial local Task 2b schema/profile protections; customer account methods and hosted acceptance remain open

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

Priority: P0 | Release: R1 | Dependencies: D04 | Status: Partial: local capture prototype, sanitizer and simulated upload/recovery adapters; hosted acceptance remains open

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

Priority: P0 | Release: R1 | Dependencies: D04,D10 | Status: Partial local Task 2b persistence/access preparation; wardrobe feature and hosted acceptance remain open

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

Priority: P0 | Release: R1 | Dependencies: D13,D04 | Status: Partial local Task 2b owned/retail persistence preparation; full saved-look feature acceptance remains open

User story: As a shopper I can revisit looks.

Technical tasks: Persist outfit compositions and thumbnails.

Baseline acceptance: Save, reopen and remove outfits across sessions.

### D16: Demo shopping bag

Priority: P0 | Release: R1 | Dependencies: D13,D03 | Status: Not started

User story: As a shopper I can collect suggested products.

Technical tasks: Bag state, variants, demo pricing and nonpurchase warning.

Baseline acceptance: Owned items excluded; demo items cannot trigger payment.

### D17: Consent, deletion and retention

Priority: P0 | Release: R1 | Dependencies: D04,D08 | Status: Partial local consent/deletion recovery preparation; retention decisions and hosted acceptance remain open

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

Priority: External | Release: Future | Dependencies: None | Status: Rakuten selected by Sabine; inquiry prepared; submission rejected because SID is required. Deferred by Sabine until customer website is live. No publisher account; both forms require SID; inquiry unsent.

User story: As a team we can establish ASOS eligibility.

Technical tasks: Use prepared Rakuten inquiry; request feed, API, rights and terms.

Baseline acceptance: Message sent only when authorized; response recorded.

### X03: Negotiate retailer permissions

Priority: External | Release: Future | Dependencies: X01 | Status: Not started

User story: As a team we can legally display products.

Technical tasks: Secure catalog/image licenses, mobile app and affiliate approval.

Baseline acceptance: Written terms cover data, display, attribution and geography.

### X04: Implement approved retailer adapter

Priority: P1 | Release: Future | Dependencies: D19,X03 | Status: Real adapter not started; independent disabled affiliate-link metadata contract tested with fixtures, pending program approval and feed access.

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

Seven new focused loopback checks and three new SQL-backed browser scenarios cover these paths, including rejection of a browser profile-save command. All 914 prototype checks across 65 files, type checking and build pass. Separately, 50 isolated PostgreSQL checks, ten SQL-backed owner scenarios and nineteen SQL-backed browser scenarios pass. Fixed a duplicate local variable in the database test script and reran verification. These are synthetic devices/providers and local database checks. Real customer profiles, identity ownership, semantic preference validation, paid trials and hosted acceptance remain pending. No remote configuration, legacy records, allowance or deployment was changed. D21/D22, D26/D39 discovery, D41 and Phase 1 retain their existing incomplete status.


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


## Disabled transcription connection and close-evidence contract, 10 October 2026

Prepared an immutable inspection-only plan for the AI-assisted support-proposed endpoint. It labels startup as unverified, preserves the selected model/session.update protocol and constructs no socket, loads no credential and exposes no live enable switch. The new module is not imported into the application or existing transport owners.

A separate explicitly simulated close-evidence helper records only a matching connection’s close event after an explicit close request. It distinguishes observed transport closure from a normal code-1000 clean close, rejects malformed/other-protocol/wrong-owner records, and refuses duplicate evidence. Even a normal close cannot verify remote cleanup, final usage or deletion and cannot authorize allowance release. This helper does not replace the existing conservative cleanup holds or durable ledger logic.

Twenty-one new checks bring the suite to 1,136 tests across 75 files; type checking and build pass. An initial TypeScript parameter-property error was fixed to comply with the project’s erasable-syntax setting before the final passing run. SQL and persistence transport were unchanged; earlier isolated database evidence was not rerun. No live API call, keys, allowance amendment, Supabase change or deployment occurred. Task 1c, D42/R1 and Phase 1 remain incomplete.

Sent a narrow follow-up in the same authorized OpenAI support conversation asking for selected-model startup confirmation and the unresolved cleanup procedure, including human API support escalation if available. It contains no keys, audio, customer data or account identifiers. The reply was received: the AI support bot cannot route to human API technical support. It explicitly identifies the selected-model URL as an inference combining two guides, not a published selected-model URL example. It describes clean socket close as transport closure and per-item completed events as received application results, without a stronger remote-finalization guarantee. No new support thread was created.


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

Isolated PostgreSQL compositions add configured startup/end and pending startup/abort to the owner, plus configured startup/end and page exit during opening to the browser. Open history stays unchanged through fresh Node processes; replacement is refused before another provider is constructed. Final verification passed 50 isolated PostgreSQL checks, 19 SQL-backed owner scenarios and 27 SQL-backed browser scenarios. The temporary database container was removed. No real provider, credential path, Supabase record, legacy ledger, new allowance or deployment is changed. The running notebook uses its existing local rehearsal; Task 1c and Phase 1 remain partial.


## Project memory tooling, 11 October 2026

- [x] Build and privately publish the requested four-section document website with full source access, design swatches/tables, accessible architecture/data diagrams and durable evidence-based task update tools. Fifteen tests and synthetic preview checks pass.
- [x] Verify production authenticated task persistence. Save/reload and restoration of Task 1a passed on 11 October 2026. Shared record revision 2 preserves the original 4/41 completed tasks. This is tooling verification, not acceptance of any customer-app build phase.

See docs/project-memory-website.md and https://ai-stylist-project-memory.idealgnat256.chatgpt.site.


## Startup-backed two-turn correction evidence, 11 October 2026

Two new startup-backed loopback checks exercise two speech turns, partial/final extraction, a delayed color result after a touch correction, budget correction revoking a released look and its speech callback, and a cheaper rechecked candidate. Ending clears notes/capture and revokes remaining presentation. Page exit while extraction is pending aborts the request and rejects its late response. Both paths retain the unresolved reservation and prevent a fresh owner from opening another provider or extracting notes.

All 1,191 tests across 78 files, type checking and build pass. The first command found no local dependency link; the matching lockfile's already installed dependencies were reused, then verification passed. No production code or provider invocation changed. Earlier isolated SQL totals (50 checks, 17 owner and 24 browser scenarios) were not rerun because this increment changes test composition only. Task 1c, D21/D22 and Phase 1 remain partial. The live opener boundary was reviewed and the next disabled preparation is recorded; no new paid call, allowance, app deployment or remote database change occurred.


## Disabled dormant opener evidence, 11 October 2026

Added prepareNoteOpener with an explicitly simulated dormant transport constructor. Listeners attach before start, including synchronous first packets. Abort, error, disconnect, malformed/oversized/binary packets and throwing consumers close once without reconnect. Constructed failed resources return a guarded facade so startup cannot lose sticky listener/close failure evidence through a rejected opening promise. Cancellation before construction creates no resource. Handover detaches initial observation without closing the configured transport.

Sixteen new checks include startup configuration readiness and cancellation during opening with failed cleanup. All 1,264 tests across 81 files, type checking and build pass. The first command used the wrong working-directory prefix; the corrected command also needed authorized access to the existing dependency cache. Final verification passed. The running application is unchanged: this component has no URL, keys, actual socket constructor, live route or retry. Earlier isolated SQL totals were not rerun because persistence is unchanged. Task 1c, D21/D22 and Phase 1 remain partial.


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


## Task 2b local media adapter checkpoint, 11 October 2026

D08/D11/D15/D17 remain partial. Owner-bound media composition, sanitized upload mapping, checksum reconciliation, exact Storage acknowledgments and deletion-receipt recovery are prepared with simulated requests. Customer-authenticated deletion claims stay separate from the service credential; actual authentication/Storage acceptance is open. 171 foundation tests (excluding the denied loopback test), type checking and build pass. The revised SQL adapter-chain rehearsal and timestamp guards await an isolated Docker rerun when the execution limit clears. No hosted migration, paid call or activation is authorized by these checks.


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


## Local Task 2b acceptance audit

Reviewed the agreed phase checks against current migrations, adapters, local SQL/Storage/resource evidence and CI configuration. docs/task-2b-acceptance-audit.md records requirement-level evidence and missing real/hosted acceptance. No additional mandatory local Task 2b implementation gap was identified; Task 2b and Phase 2 remain incomplete. Task 2c is not covered by the existing sequencing exception. Sabine has been asked whether to authorize local-only Task 2c preparation, with no hosted changes, credentials, real sign-in or paid calls. Do not treat the pending question as approval.


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


Task 2c local acceptance audit: see docs/task-2c-acceptance-audit.md. Bound provider failure callbacks are prepared and tested, but real provider exchange, recovery scope, refresh/sign-out lifecycle and manual/hosted acceptance remain open. No Phase 2 item is checked complete by this audit.


Local Task 2c callback exchange orchestration is prepared with generated identity, cancellation/late-session cleanup, ambiguity holds and bounded admission. The acceptance audit still governs actual provider/refresh/recovery/hosted gaps. No Phase 2 item is marked complete.


## Shared local account lifecycle and accepted preview, 11 October 2026

Sabine completed every step of the eight-step account preview and reported that all steps worked and were readable. This accepts the local simulated screens only, not real sign-in or email delivery.

Extracted a common server-only session lifecycle and added disconnected email/password and registration ports. Password and OAuth callback methods share a four-operation admission limit and the same uncertainty hold after ambiguous creation or failed cleanup. Registration confirmation returns no account cookie. Email whitespace is trimmed; passwords are passed unchanged and never stored by these interfaces. Exact input keys and string methods are required, preventing object coercion into a supported action. HTTP origin/CSRF, rate/body limits, real provider policy and refresh adoption remain requirements before wiring any route.

All 346 foundation tests across 39 files, type checking and build pass. Six added tests cover signed session/cookie preparation, confirmation isolation, malformed input, cross-method holds, late cancellation cleanup and shared outstanding admission without consuming busy callback transactions. Existing callback tests pass after the refactor. No routes, providers, real accounts, emails, hosted settings or paid calls were activated. Next: scoped local recovery and sign-out contracts. Task 2c and Phase 2 remain open.


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


## Recovery discard audit, 11 October 2026

Found and fixed a recovery cancellation gap: discarding a grant while its password-change call was pending did not abort that call. Each reset now owns a cancellation scope; public discard aborts it, consumes permission and invokes deduplicated cleanup. The caller receives unconfirmed, and a late adapter success cannot become resetComplete. A provider may already have changed a password before cancellation, so this does not promise rollback; real adapter/reconciliation semantics remain required. Reused active or discarded adapter capability objects are rejected. A cancellation detected at the final exchange boundary discards a returned grant before exposing permission.

All 302 foundation tests across 31 files, type checking and build pass. Two new regressions cover in-flight discard and disposed-capability reuse. Tests use simulated providers; no real credentials, accounts, provider calls or hosted settings changed. The previous local reset UI browser evidence remains valid; no UI behavior changed in this audit.

Exact next action: publish the consolidated private Memory account/recovery checkpoint, then prepare the browser-bound reset-delivery contract and failure/expiration checks locally. Full Task 2c requires real-provider integration, refresh/sign-out confirmation, phone/accessibility acceptance and the existing phase gates.


## Disconnected browser reset delivery, 11 October 2026

Prepared a process-local browser delivery owner for provider-verified recovery grants. Its separate __Host-stylist_reset cookie contains a cryptographically random 256-bit opaque handle and uses Path=/, Secure, HttpOnly, SameSite=Strict and a maximum five-minute life capped by the server grant expiry. The store retains only a SHA-256 lookup hash and the server-only capability, never a normal account cookie or serialized reset capability. Duplicate installation and more than 128 retained grants are refused. A failed installation remains the trusted caller's responsibility to discard; it is not permission to leak or abandon provider state.

The disconnected submission accepts only the exact configured HTTPS origin, POST /api/account/reset, matching Origin, allowed Fetch Metadata, matching Host where supplied, no Authorization/query/hash, one bounded opaque reset cookie and exact matching password/confirmation input. Normal account cookies cannot authorize a reset. Valid delivery is removed synchronously before asynchronous work, preventing concurrent replay. The result clears the reset cookie; completion requires both reset and cleanup confirmation. Expired/abandoned delivery discards the grant. Cleanup is deduplicated and failure holds further delivery. Real HTTP body/rate protections, response header delivery, proactive expiration/disposal, browser acceptance, cross-device UX and durable restart reconciliation remain required. Deadlines and provider-purpose verification belong to the actual recovery owner/adapter; installing arbitrary browser JSON is forbidden. No route is installed.

All 309 foundation tests across 32 files, type checking and build pass. Seven new tests cover secure separate cookie/one use, hostile origins and duplicate/normal cookies, input correction, expiry/abandonment, cleanup failure holds, concurrent reset/error privacy and retained-grant limits. Existing recovery tests include the newly explicit server-only grant expiry. No actual cookies, accounts, recovery emails, provider calls, hosted changes or spending were activated.

Exact next action: compose the actual disconnected recovery owner with browser delivery in integration tests, including cancellation, expiry and response-adoption failure; then refresh private Memory. Task 2c and its real-provider/manual gates remain open.


## Composed local recovery verification, 11 October 2026

Added integration checks using the actual disconnected callback/recovery owner, browser-delivery store and account request verifier together. Provider lease replies remain simulated. A bound recovery callback produces separate reset-cookie delivery; that cookie cannot authorize a profile request. Password reset is one-use and requires cleanup confirmation. Failed response adoption discards the real grant and prevents later reset. Canceling the actual reset Request propagates through browser delivery into the reset owner, returns unconfirmed and deduplicates cleanup after late provider success. Expired delivery prevents password change and propagates failed-cleanup holds to both owners.

All 313 foundation tests across 33 files, type checking and build pass. Four new composed tests prove these integration paths. No real provider-purpose proof, account session, password, browser cookie, email, hosted setting or paid call was used. The generated signing material and local adapter replies are test fixtures. Actual production recovery, HTTP delivery/limits, restart reconciliation, provider cleanup and physical-device accessibility still require acceptance.

Exact next action: prepare explicit recovery-delivery expiration and shutdown disposal, including an in-flight reset during shutdown, then refresh the private Memory checkpoint. This lifecycle preparation remains local and does not authorize hosted activation. Task 2c remains incomplete.


## Recovery delivery lifecycle, 11 October 2026

Added explicit expire and close operations to the disconnected browser recovery owner. Expire removes expired delivery and confirms grant cleanup. Close permanently stops new installation/submission, removes browser handles and discards all active grants, including grants already consumed by an in-flight reset. Active reset controllers are aborted during public disposal/shutdown. Normal post-reset cleanup preserves confirmed completion; cancellation remains unconfirmed. Cleanup is deduplicated and independently response-bounded to at most eight seconds. A stalled/failed cleanup holds the owner and close returns false; a repeated close returns the same result instead of retrying uncertain provider work. Retained capacity now counts active consumed grants as well as pending delivery.

All 317 foundation tests across 33 files, type checking and build pass. Four new checks cover explicit expiry, permanent/deduplicated shutdown, stalled cleanup deadline and composed shutdown during an actual recovery-owner reset with a simulated provider. No production timer, process hook, provider call, account or hosted setting was activated. The future HTTP/service owner must invoke expire on an appropriate schedule and close at graceful shutdown; forced process termination and durable reconciliation remain unproven. A true cleanup acknowledgment proves the adapter's contract only, not reversal of a password change that may already have occurred.

Exact next action: refresh private Memory with the verified 317-test recovery checkpoint, then prepare the disconnected recovery/account HTTP boundary with bounded parsing and Origin/CSRF checks. Preserve no-real-provider/no-hosted-change scope and all existing phase/spending gates. Task 2c remains incomplete.


## Prepared reset HTTP boundary, 11 October 2026

Added a disconnected reset HTTP handler factory; it is not registered in a server or deployed. It requires the exact configured HTTPS origin and POST reset path, matching Origin/Host, allowed Fetch Metadata, JSON UTF-8 content type, no content encoding or alternate Authorization, no query/hash and a declared body length within 16 KiB where supplied. Actual streamed bytes are independently bounded to 16 KiB and decoded as strict UTF-8. Only exact matching password/confirmation input reaches delivery. Errors return generic status JSON, never credentials/provider text. Cookie changes are response headers only. Responses are no-store, nosniff and same-origin resource policy with no CORS grant.

The handler has a maximum ten-second response deadline and four underlying admitted requests. Cancellation aborts delivery and cancels an active body reader. Non-cooperative delivery retains admission until it settles; timeout reports unconfirmed rather than promising rollback. Production durable rate/abuse controls, real server registration, header delivery and actual provider/restart behavior remain acceptance work. This factory alone is not a live account endpoint.

All 322 foundation tests across 34 files, type checking and build pass. Five added checks cover header-only cookies, private status JSON, hostile origin/content/body rejection, generic provider errors, stalled-body cancellation and retained admission after delivery timeout. A fixture initially returned an invalid null-cookie shape for unconfirmed delivery; type checking caught it and the fixture was corrected before final verification. No actual provider, account, password, email, hosted setting or spending changed.

Exact next action: refresh private Memory with the 322-test checkpoint, then integrate the reset HTTP factory with the actual disconnected recovery/delivery owners in simulated request tests. Task 2c and Phase 1/2 acceptance remain open.


## Full local reset HTTP composition, 11 October 2026

Verified the actual disconnected callback/recovery owner, browser delivery and HTTP handler together with simulated provider leases. A bound callback and separate reset cookie produce status-only HTTP completion plus a clearing cookie header; no normal account cookie is issued. Replaying the same request is rejected, and provider reset/cleanup each run once. A foreign-origin HTTP request is refused before consuming valid permission, allowing the legitimate same-origin attempt afterward.

All 324 foundation tests across 34 files, type checking and build pass. Two new full-composition checks provide this evidence. These in-memory Request/Response tests do not validate a real HTTP server, real browser cookie handling, actual provider purpose, email delivery, signing configuration, rate controls or hosted behavior. No route, account or paid activity was enabled.

Exact next action: refresh private Memory, then audit the remaining authorized local Task 2c requirements and implement the next ready account transport/controller contract while keeping actual provider and hosted activation gated. Task 2c remains incomplete.


## Disconnected password account HTTP preparation, 11 October 2026

Extracted the tested bounded same-origin JSON POST boundary for reuse by reset and password account handling. Existing recovery HTTP and full-composition checks pass after the refactor. The boundary preserves strict origin/path/content/body protections, a 16 KiB streamed byte limit, maximum ten-second response deadline, four admitted underlying operations, cancellation and no-store/status-only error responses. A late private response can be discarded by its owning handler rather than delivered after cancellation.

Added a disconnected /api/account/password handler factory composed with the actual prepared password account owner. Generated signed-token tests confirm that successful sign-in returns only signedIn JSON and verified secure cookies in headers. Registration confirmation issues no account cookie. Malformed input never reaches provider session creation. The server-only discardResponse capability revokes the exact returned session when response delivery or refresh-state adoption fails, with idempotent cleanup. A canceled request returns no account cookie and a late session is discarded. The future HTTP caller must actually adopt adapter-held refresh state, send headers and invoke discardResponse on failed delivery/adoption; this factory is not installed in a server. No real provider transport or refresh persistence is claimed.

All 328 foundation tests across 35 files, type checking and build pass. Four added composed checks cover signed cookie/status separation, confirmation, invalid input and canceled late-session cleanup. All providers are simulated and signing material is generated test data. No actual sign-in, account, email, browser cookie, hosted setting or paid call was created. Production rate controls, real provider policy and manual acceptance remain open.

Exact next action: prepare the disconnected recovery-request acknowledgment contract and simulated tests, including account-enumeration-safe replies and cancellation, then refresh private Memory. Task 2c remains incomplete.


## Generic recovery request preparation, 11 October 2026

Prepared disconnected POST /api/account/recover handling on the shared bounded same-origin JSON boundary. It accepts only a valid email field, trims whitespace and chooses the recovery callback internally. The trusted adapter receives that address, fixed-purpose callback and S256 challenge; no caller-selected redirect or account cookie is accepted. The same 202 recoveryRequested body and flow-cookie shape are returned for a simulated absent account and provider error. This is a generic acknowledgment, not a promise that email was sent. Cancellation abandons the bound transaction and never retries delivery. The shared response deadline and underlying admission limits remain in effect; a non-cooperative provider may still send a late email, but its canceled callback is no longer usable.

All 332 foundation tests across 36 files, type checking and build pass. Four added checks cover internal callback/challenge handoff, generic response shape, malformed input/redirect rejection and cancellation verified with the actual original browser binding. No actual email adapter, account, provider call or hosted route is installed. These checks do not prove constant-time behavior or eliminate provider timing side channels; production anti-enumeration, rate/abuse controls and actual delivery policies need acceptance. Same-browser/cross-device recovery remains a customer UX review gate.

Exact next action: refresh private Memory with the password HTTP and recovery-request checkpoint, then audit pending local account transport and refresh/session lifecycle requirements. Real provider activation, email sender setup, credentials and hosted changes remain outside this local preparation. Task 2c remains incomplete.


## Account presentation contract alignment, 11 October 2026

The browser account controller expected a user ID in signed-in replies, but the prepared password HTTP interface deliberately returns status only. Aligned the presentation controller to accept that exact status-only reply without inventing a client identity. Existing simulated ID-bearing replies remain strictly validated. Browser signed-in state is presentation only and never authorizes server access; every customer operation still needs verified server identity. No app route, fetch transport or stylist access was enabled.

All 333 foundation tests across 36 files, type checking and build pass. The added check proves status-only presentation leaves userId null and retains no password. Private Memory source 26312ecfdf8f701dfab7ecd958d248ea21ad1028 deployed successfully as appgdep_6acc46f2caf081918d224d2921d008e5 with the preceding 332-test account HTTP/recovery-request checkpoint. All 16 website checks pass; owner-only access and MCP remain. The 333rd controller check will be included in the next consolidated refresh.

Exact next action: prepare an injected, disabled same-origin browser account transport for the status-only password and recovery interfaces, with bounded response parsing, cancellation and simulated fetch tests. Real sign-in, provider credentials, hosted routes and paid calls remain gated. Task 2c is incomplete.


## Disabled injected browser account transport, 11 October 2026

Prepared a browser AccountProvider factory requiring an explicitly injected fetch implementation and configured HTTPS application origin. The visible preview still selects its sample provider; no real transport is wired. Password, recovery and sign-out use fixed same-origin POST paths with same-origin credentials/mode, JSON only, redirect refusal, no-store and no-referrer. No token, Authorization header, browser storage or client account ID is introduced. Social handoff is refused by this transport until its separate verified contract is prepared.

The parser requires exact status-only JSON, a matching response destination when available, no redirect, valid content type and at most 1 KiB actual UTF-8 response bytes. Status and HTTP code must match the requested operation; registration confirmation cannot satisfy sign-in, and sign-out requires remote confirmation. Malformed replies and raw errors become generic Account unavailable. Cancellation/deadline cancels the response reader, rejected bodies are released and late success cannot restore presentation. The maximum fifteen-second response deadline and four admitted underlying operations prevent repeated canceled requests from accumulating unlimited fetches. Ignored cancellation retains admission until actual settlement.

All 341 foundation tests across 37 files, type checking and build pass. Eight new tests cover fixed request shape/cookie transport, confirmation/recovery separation, invalid/social/pre-canceled input, response limits and unexpected fields, sign-out confirmation, ignored cancellation/admission, stalled bodies and redirected/foreign destinations. Every fetch is simulated. No provider call, credential, sign-in, email, route or hosted change occurred. Real browser/server cookie and Origin behavior, provider session adoption, rate controls and manual acceptance remain open.

Exact next action: compose the disabled browser transport/controller with the actual local password/recovery HTTP factories using simulated fetch, then prepare sign-out HTTP response handling and publish a consolidated Memory refresh. Task 2c remains incomplete.


## Simulated browser-to-account HTTP composition, 11 October 2026

Prepared disconnected sign-out HTTP response handling on the shared bounded JSON boundary. Only an empty input object is accepted; caller-selected owner/scope fields are refused before revocation. Confirmed remote sign-out returns 200; unconfirmed returns 409. Both deliver the coordinator's cookie-clearing headers separately from status-only JSON. No route is registered.

Added composed tests using the actual browser transport/controller, password/recovery/sign-out HTTP factories, generated signed identity and simulated provider/current-session authority. A test-only cookie jar and Origin header emulate browser handling; they do not prove actual browser cookies or CORS behavior. Sign-in produces verified cookie access while the controller invents no user ID. Confirmed sign-out clears cookies and the simulated revoked original token no longer authorizes a profile request. Registration and generic recovery produce no account access. Failed remote revocation clears local cookies and closes controller access, but explicitly reports unconfirmed; the simulated original token remains current, demonstrating why local clearing alone is insufficient. No real email or provider is involved.

All 346 foundation tests across 39 files, type checking and build pass. Five added checks cover sign-out header/status behavior, input rejection and the three full browser/controller/server scenarios. Actual browser cookie acceptance, real provider revocation, refresh-state adoption/persistence, rate/abuse controls, phone/accessibility and phase gates remain open. No credentials, actual account, hosted endpoint or paid activity was enabled.

Exact next action: refresh private Memory with the 346-test checkpoint, then audit remaining local Task 2c lifecycle requirements and prepare refresh/session ownership without connecting real providers. Task 2c remains incomplete.


## Discarded account session reuse protection, 11 October 2026

Sabine confirmed all eight local account preview steps worked and were readable. This accepts that sample interface only, not real authentication, the later reset screen or physical-device accessibility.

The shared session owner now refuses a provider adapter object that has already been discarded, before issuing another cookie. Cleanup remains idempotent and is not retried. A generated-token regression test proves the same disposed lease cannot restore account access, even if the simulated current-session authority still reports it current. All 347 foundation tests across 39 files, type checking and build pass. No real provider, hosted route, email or paid activity was enabled.

Exact next action: refresh private Memory from the latest committed documents, then prepare disconnected refresh/session ownership with simulated tests. Task 2c remains incomplete; actual provider configuration, session persistence, customer activation and manual phase gates remain open.


## One-time adapter session ownership, 11 October 2026

The disconnected shared account owner atomically claims each adapter session object before asynchronous cookie verification. Concurrent submissions returning the same object produce one ready result and one unavailable result; the rejected duplicate does not revoke the legitimate owner's session. Discarded object reuse remains refused. The process-local WeakSet is a programming-contract guard, not durable refresh-token storage or cross-process provider replay protection.

All 348 foundation tests across 39 files, type checking and build pass. No actual provider or route is enabled. Private Memory source 64c11ab097cfc66146dd6e7f8533bea9a1c11d47 deployed successfully as appgdep_6acc4976b8308191b73f38788c6c4379 with the preceding 347-test checkpoint. All 16 website checks pass; owner-only access and MCP remain. The additional concurrency test will be included in the next consolidated refresh.

Exact next action: prepare disconnected refresh/session ownership with bounded cancellation, one-time rotation and simulated tests, without connecting real providers or promising durable persistence. Task 2c remains incomplete.


## Disconnected early account refresh, 11 October 2026

Prepared a server-only refresh coordinator for POST /api/account/refresh. A trusted injected adapter receives only the verified request and signed owner identity and must resolve/rotate server-held refresh material. No refresh credential is accepted from JSON or returned to the browser. The coordinator requires current verified access, fixed application origin/path and cancellation checks; expired access cannot use this early-refresh preparation and must sign in again. No actual adapter, HTTP route, refresh storage or scheduler is installed.

The shared session verifier now accepts an internal expectedOwner constraint. A refreshed signed session for a different customer is discarded before any cookie is exposed. The coordinator caps outstanding work at four, bounds response time to eight seconds and propagates request/external cancellation; a late rotated session is discarded and cannot restore access. Session cleanup uncertainty remains a hold in the shared owner. Production must share this owner with password/OAuth, implement durable session-specific single-flight rotation and reconcile failures; the current coordinator alone does not prove rotation atomicity across concurrent requests or processes.

All 352 foundation tests across 39 files, type checking and build pass. Four added generated-token/simulated-adapter checks cover verified refresh, missing/foreign access rejection, wrong-owner cleanup and canceled late cleanup. No real provider, email, hosted setting or paid activity was used.

Exact next action: prepare session-specific rotation ownership and concurrent refresh tests, then compose a disconnected refresh HTTP boundary. Durable refresh persistence, expired-session behavior, real-provider rotation/revocation and customer activation remain open; Task 2c is incomplete. Private Memory remains at the preceding 347-test checkpoint pending the next consolidated refresh.


## Session-specific refresh and HTTP delivery, 11 October 2026

The cryptographic identity gate now retains the verified session ID as server-only context. Refresh requires that ID and prevents overlapping adapter rotation for the same verified owner/session in this coordinator. Cancellation does not release the rotation lock while an adapter ignores cancellation; the lock is released when that provider operation actually settles. The shared verifier requires both the same signed customer and exact signed session in the returned access token. A different session for the same customer is discarded. Existing media callers need only owner/current access and remain compatible. Session identity is not added to browser JSON.

Prepared disconnected refresh HTTP delivery on the bounded same-origin JSON boundary. Only an empty object is accepted; refresh tokens, owner IDs and other input fields are refused before provider work. Successful replies contain only signedIn status, with verified cookies in headers and no-store. A server-only discardResponse capability cleans the returned session if refresh-state adoption or response delivery fails. No route is registered. The future caller must use this capability and adopt refresh state atomically.

All 355 foundation tests across 39 files, type checking and build pass. Three added checks prove same-session overlap rejection even after cancellation, full HTTP cookie/status/failed-delivery behavior and refusal of another signed session for the same customer. All provider behavior is simulated. The coordinator's lock is process-local and covers the adapter operation, not durable storage/adoption, other coordinators, processes or server restarts. Actual provider rotation, durable fencing, email/account setup and hosted acceptance remain open.

Exact next action: compose refresh with the shared account lifecycle owner, verify uncertainty holds across account methods and prepare refresh-state adoption ownership with simulated tests. No provider activation, new credentials or spending is authorized. Task 2c remains incomplete. Private Memory remains at the preceding 347-test checkpoint pending the next consolidated refresh.


## Shared refresh/account uncertainty lifecycle, 11 October 2026

The disconnected account composition now optionally accepts an explicit refresh adapter and creates its refresh coordinator with the same session owner as password and OAuth. Without that injected adapter, refresh is null rather than implicitly enabled. Failed cleanup after a bad refresh session sets the shared uncertainty hold, preventing later password/OAuth provider work. Ambiguous password session creation likewise prevents refresh provider calls. The refresh adapter retains its original object binding. No HTTP route, provider transport or credential is installed.

All 358 foundation tests across 39 files, type checking and build pass. Three added composed tests verify holds in both directions and absence of an unconfigured refresh interface. This is process-local simulated evidence, not actual remote cleanup or durable adoption.

Exact next action: prepare explicit refresh-state adoption and failed-delivery ownership in the disconnected server composition, with simulated cancellation and cleanup tests. Audit real-adapter prerequisites before claiming account readiness. Actual provider setup, durable refresh storage, recovery/identity-linking policies, hosted changes and manual phase acceptance remain open. Task 2c remains incomplete; private Memory's latest verified publication reflects 347 tests pending the next consolidated refresh.


## Local Node account response delivery, 11 October 2026

Prepared a disconnected Node HTTP listener that accepts only an explicitly supplied route map and configured HTTPS application identity. It checks Host before dispatch, maps IncomingMessage into a streaming Fetch Request with cancellation, bounds buffered account responses to 16 KiB, preserves separate Set-Cookie headers and streams the final bounded JSON response through Node. Client disconnect aborts work; a handler response returned afterward invokes its idempotent discardResponse cleanup. Failed output also invokes cleanup. The default foundation server is unchanged and registers no account route. TLS/proxy trust, durable adoption and production rate controls are not configured by this listener.

All 361 foundation tests across 40 files, type checking and build pass. Three new tests use actual loopback Node HTTP with the prepared shared JSON boundary and simulated operation handlers. They verify cookie/header separation, wrong Host/Origin rejection before operation work and late-response cleanup after actual client disconnect. These tests do not compose a real provider, verify a real browser cookie jar or demonstrate hosted TLS. Prior generated-token account composition remains separate evidence.

Exact next action: compose the local Node listener with generated-token password/refresh owners and simulated adoption storage; test response loss and cancellation at that composition boundary. Add explicit delivery deadlines/resource checks before production use. Sabine's newer reset review is still pending. Task 2c remains incomplete. Private Memory remains at its preceding 347-test checkpoint pending a consolidated refresh.


## Bounded Node delivery and verified password composition, 11 October 2026

The prepared Node account listener now bounds delivery to at most ten seconds, cancels stalled response readers and closes timed-out sockets. At most four underlying handler operations are admitted. A timed-out handler that ignores cancellation retains admission until it actually settles; late returned responses are discarded. Duplicate Host/Origin/Cookie/Authorization headers are refused before dispatch. These are process-local limits, not distributed abuse protection. Routes remain unregistered in the default server.

Added actual loopback HTTP composition with the prepared password owner, cryptographic verifier, generated ES256 token, simulated current-session authority and password adapter. Returned JSON contains signedIn only, while the distinct Secure/HttpOnly/Strict access cookie can authorize the same generated owner/session through the prepared gate. This manually forwards a cookie header; it does not prove browser cookie acceptance or hosted TLS. Two more loopback scenarios verify stalled response cancellation/cleanup and retained admission for four timed-out handlers. A test-helper typing mismatch was fixed before the final clean run.

All 364 foundation tests across 40 files, type checking and build pass. No live provider, credential, hosted route or paid activity was used. Durable refresh-state adoption and reconciliation remain unimplemented. Node's successful end callback proves local response completion, not that a remote user received every byte.

Exact next action: implement and test explicit simulated refresh-state adoption ownership at the server composition boundary, then consolidate private Memory publication. Incorporate Sabine's newer reset review when received. Task 2c and phase acceptance remain open; private Memory's current verified live checkpoint is still 347 tests.


## Explicit server session adoption preparation, 11 October 2026

The trusted PendingAccountSession contract can now supply an explicit adopt(signal) capability. The shared owner first verifies the signed owner/session, then requires exact true adoption and a fresh authoritative session check before exposing ready/cookies. Adoption is claimed once with the session object. An adapter omitting this optional capability retains the existing contract that it already owns its server-held state; omission is not proof of durable ownership. No real adapter or storage is configured.

False, throwing, revoked or canceled adoption refuses access and discards the session. If a non-cooperative adoption is still running when cancellation returns, its underlying admission is retained and cleanup waits until it settles, so a late storage write cannot occur after premature cleanup in the tested flow. The adapter must make discard remove both staged and adopted state and revoke remote access. Unconfirmed cleanup keeps the shared lifecycle held. Never-settling adoption remains unresolved; durability, fencing and restart reconciliation still require real storage implementation.

All 368 foundation tests across 40 files, type checking and build pass. Four new generated-token/simulated-storage scenarios cover successful ownership before ready and failed-delivery cleanup, partial failed adoption, late adoption after cancellation and authoritative revocation during adoption. No refresh credential, provider account, hosted change or paid call is used. The storage Map holds fixture strings only and is not production persistence.

Exact next action: consolidate private Memory publication with this checkpoint, then test explicit adoption through the actual local HTTP composition and prepare durable ownership/failure reconciliation locally. Sabine's newer reset screen review is pending. Task 2c remains incomplete.


## HTTP adoption cancellation and Memory refresh, 11 October 2026

Composed explicit session adoption with generated signed identity, the actual password owner/HTTP factory and real loopback Node delivery. A real HTTP client disconnect during simulated adoption aborts the request without prematurely running cleanup. After non-cooperative storage settles and writes its fixture state, the shared owner discards once and removes that state. The adapter is simulated and no real refresh material is used. This adds transport-composition evidence to the previous direct adoption tests.

All 369 foundation tests across 40 files, type checking and build pass. Private Memory source 7bc7d55b602c23ca17e6791d1352140b3216fd95 deployed successfully as appgdep_6acc4d8337588191960f5476c57ef265. All 16 website checks pass; owner-only access and MCP are preserved. That publication includes the preceding 368-test checkpoint, current account limitations and pending reset review. The additional HTTP adoption test will appear in the next consolidated refresh.

Exact next action: prepare durable server refresh-state ownership and reconciliation locally, including generation fencing, partial adoption and restart evidence; continue to keep real provider/hosted activation gated. Sabine's seven-step reset review remains pending. Task 2c and phase acceptance remain incomplete.


## Server-only refresh encryption preparation, 11 October 2026

Prepared a disconnected encryption codec using Node's AES-256-GCM implementation, generated 96-bit nonces and 128-bit authentication tags. Authenticated context binds ciphertext to its exact signed owner, session, rotation generation, expiry and key identifier. The codec accepts an explicit server keyring of one to four 256-bit keys, copies key bytes and uses the selected current key for writes; explicitly retained old keys can read earlier envelopes. It creates no production key, store, provider connection, schedule or route. Key provisioning, secure deployment and retirement remain activation prerequisites.

The exact versioned envelope contains ciphertext/key ID/nonce/tag only. Inputs and ciphertext are bounded to 8 KiB plaintext, malformed/noncanonical/tampered envelopes fail closed, expired context cannot decrypt, and invalid storage inputs produce generic errors. Caller scope IDs must be real strings in canonical UUID form, and generation must be positive. These checks do not supply durable fencing or prevent replay into the same unchanged scope; storage must atomically enforce the expected generation. Plaintext and keys still exist in server process memory during use; this is encryption at rest preparation, not a zero-memory-retention claim.

All 374 foundation tests across 41 files, type checking and build pass. Five tests use generated keys and fixture strings only, checking context separation, nonce variation, tampering/size/unknown key refusal, explicit key rotation/caller-buffer isolation, expiry, invalid values and configuration. No actual credential was read, stored or published. No hosted or paid activity occurred.

Exact next action: prepare local durable refresh-state storage with generation compare-and-swap, service-only access and unresolved-rotation holds; integrate the codec and rehearse restart/partial-write behavior with synthetic records. Key management and actual provider/hosted activation remain gated. Task 2c is incomplete; the newer reset review remains pending. Private Memory's last verified publication includes the preceding 368-test checkpoint.


## Durable refresh ownership SQL rehearsal and accepted reset review, 11 October 2026

Prepared migration 202610110017_refresh_ownership.sql locally. A private RLS-enabled table stores bounded versioned encrypted-envelope fields with owner/session references, generation, expiry, rotation state and a random lease. Direct table access is revoked from ordinary visitors, signed-in customers and service_role; fixed-search-path SECURITY DEFINER functions grant only service_role controlled adoption, inspection, claiming, finishing, holding and confirmed-removal operations. Adoption verifies the current Auth owner/session. Atomic updates require exact owner/session/generation/lease and appropriate state. An unresolved rotation is never reclaimed merely because a process restarts or time passes. Held records require explicit reconciliation and verified revocation before removal. The trusted caller's boolean is a contract, not database proof of remote revocation. Auth session deletion cascades its refresh record.

The isolated pinned PostgreSQL 17 rehearsal uses synthetic Auth rows and placeholder ciphertext, not real credentials or the encryption codec. It proves denied direct/customer function access, duplicate-adoption refusal, cross-owner refusal, exactly one concurrent claim winner, unresolved rotation surviving a real container/database restart, wrong generation/lease refusal, hold preventing finish/reclaim, service-only held-state inspection, explicit confirmed removal, successful version increment, stale-finish refusal, malformed-envelope rejection and session-delete cascade. The initial run caught PostgreSQL's regex repetition limit; ciphertext validation now uses a bounded length plus simple alphabet check. The final rehearsal passes, and its disposable database container/volume are removed. All 374 foundation tests across 41 files, type checking and build also pass. No migration was applied to Supabase. Actual hosted Auth schema, encryption integration, provider rotation and durable application reconciliation remain open.

Sabine confirmed all seven newer reset-screen review steps worked and were readable. This accepts the local simulated reset UI, including mismatch clearing, matching completion, disabled repeat and refresh clearing. No real recovery email, password change, phone accessibility or provider recovery acceptance is implied. Both the earlier eight-step account preview and this seven-step reset review are accepted; Task 2c remains incomplete.

Exact next action: connect the encrypted envelope codec and service-only refresh ownership RPCs through a bounded disconnected adapter; test rotation/adoption/uncertain-write reconciliation with synthetic PostgreSQL records. Consolidate private Memory publication after that checkpoint. Real credentials, hosted activation, provider calls and spending remain gated.


## Encrypted refresh RPC adapter preparation, 11 October 2026

Prepared a disconnected server-only adapter for the six migration-17 RPCs: adoption, inspection, claim, finish, hold and confirmed removal. Adoption encrypts generation 1; rotation encrypts the next generation with its chosen expiry. No plaintext refresh value is sent to RPC. Claimed row shape, signed owner/session, generation, state and lease are checked before decryption. The server-only readSecret capability yields plaintext once and can be cleared without reading; JSON serialization includes no plaintext or envelope. This does not guarantee memory zeroization. Inspection returns only ownership metadata, including held or expired state for trusted reconciliation.

Exact boolean false means refused, exact true means confirmed and malformed/error/canceled/deadline results remain unconfirmed. A null inspection means absent, while a null claim means refused. Lost acknowledgments never trigger an automatic retry or hold release. Calls have an eight-second maximum response deadline and four admitted underlying operations; ignored cancellation retains admission until settlement. Removal requires exact trusted revocation confirmation plus generation/lease fencing; the adapter does not independently prove provider revocation. No actual RPC transport, account route or hosted connection is configured.

All 380 foundation tests across 42 files, type checking and build pass. Six new simulated-RPC/generated-key scenarios cover encrypted writes and version binding, scoped one-use claim capability, absent/refused/uncertain distinctions, cancellation/admission retention, invalid input and confirmed fenced removal. The prior isolated SQL rehearsal remains evidence for database behavior; this adapter has not yet been composed with actual PostgreSQL. No real credential, hosted change or paid activity was used.

Exact next action: compose the encryption/RPC adapter with isolated PostgreSQL migration 17 and rehearse adoption, concurrent rotation, restart, lost acknowledgments and reconciliation using fixture secrets only. Both local account and reset-screen manual reviews are accepted; Task 2c and hosted/provider acceptance remain incomplete. Private Memory's last verified publication contains the preceding 368-test checkpoint.


## Encrypted adapter and actual PostgreSQL composition, 11 October 2026

Added a test-only Node composition runner to the isolated PostgreSQL rehearsal. It connects the actual refresh codec/store adapter to migration-17 service-role functions through an allowlisted local psql bridge. Encryption keys are generated inside the process and never written to files/arguments/output. Only the disposable container name is passed as an argument. The bridge is a test fixture, not the production Supabase HTTP transport.

Actual encrypted fixture state survives adoption and next-generation rotation. Concurrent claims produce exactly one winner. Simulated acknowledgment loss after real adoption or finish returns unconfirmed; inspection reveals the committed generation/state without automatically retrying or overwriting. A stale finish is refused. An actual database/container restart preserves a held rotation; rebuilding process-local adapter/codec objects with the same explicit fixture key can inspect it. This does not prove OS-process restart key provisioning. Wrong-key decryption leaves durable rotation unresolved; a replacement claim is refused until trusted explicit reconciliation. Removal still depends on simulated revocation confirmation, not a real provider.

Both the SQL rehearsal and encrypted-adapter composition pass, plus all 380 foundation tests across 42 files, type checking and build. The rehearsal's readiness probe initially raced PostgreSQL's temporary initialization server; switching both probes to TCP readiness fixed that harness issue before the final clean run. Disposable container/volume cleanup is checked separately. No real credentials, hosted changes or paid calls occurred.

Exact next action: prepare a trusted refresh-provider composition that uses encrypted durable ownership and the shared account adoption lifecycle; test provider failure, uncertain rotation/adoption and cleanup with synthetic providers before considering any actual transport. Both local manual reviews remain accepted; Task 2c and hosted/provider acceptance remain incomplete. Consolidate private Memory at the next checkpoint.


## Guarded refresh HTTP transport, 11 October 2026

Prepared a disconnected refresh-specific transport allowing only the six ownership RPC operations. The shared Supabase transport now accepts caller cancellation and limits admission to four underlying operations. A request that ignores cancellation retains its slot until its fetch and response cleanup settle; failed cleanup conservatively retains capacity. Destination, size, deadline and generic-error protections remain in place.

All 383 foundation tests across 43 files, type checking and build pass. New scenarios cover the operation allowlist, encrypted adoption through simulated HTTP, and cancellation with unresolved fetch admission. An initial test attached its rejection assertion too late; attaching it before cancellation fixed the unhandled rejection. Loopback tests ran with the required local-network permission. No actual Supabase request, real provider, hosted change or paid call occurred.

Both account and reset-screen manual reviews are accepted. Task 2c remains incomplete. Exact next action: compose the durable encrypted refresh store with a synthetic refresh provider and shared account adoption lifecycle, exercising uncertain rotation and cleanup before live activation. Private Memory still needs a consolidated publication after its 368-test checkpoint.


## Staged refresh rotation lifecycle, 11 October 2026

Prepared createRefreshRotation as a disconnected trusted-server capability. It claims a scoped durable record once, passes the one-use secret to an explicitly injected provider, and returns the existing PendingAccountSession adoption/discard interface. Adoption finishes the fenced encrypted rotation once. Discard waits for started adoption, requires exact provider-wide session revocation confirmation, inspects current ownership and removes only the matching claim or immediately adopted generation. Provider ambiguity leaves the durable claim blocked; no automatic retry or reclaim is added. The provider must revoke the entire session including rotated tokens, a contract still requiring actual provider evidence.

All 387 foundation tests across 44 files, type checking and build pass. Four new scenarios use simulated storage/provider adapters to cover staged adoption, ambiguous provider failure, unconfirmed revocation or different-generation removal refusal, and adoption/discard ordering. The prior isolated database rehearsal remains separate evidence; this new coordinator is not yet composed with PostgreSQL or the shared session verifier. No actual provider request, hosted change, credential activation or paid call occurred.

Exact next action: compose this coordinator with the real encrypted store in the isolated PostgreSQL rehearsal and the shared account-session verifier using synthetic provider results. Add wrong-session, expired and uncertain-adoption cases before actual HTTP activation. Task 2c and Phase 1 remain open. Private Memory publication still needs consolidation beyond its 368-test checkpoint.


## Refresh coordinator and verified-session database composition, 11 October 2026

Extended the isolated PostgreSQL rehearsal to compose the real encryption codec, durable refresh store, staged rotation coordinator and shared account-session verifier. Generated ES256 tokens use a generated in-memory signing key; current-session authorization is checked by the actual SQL function. Provider rotation and revocation remain explicitly synthetic.

Four composed scenarios pass: a cookie is returned only after verified next-generation adoption; a rotation write with lost acknowledgment returns unavailable and removes the reconciled record only after synthetic confirmed revocation; a wrong signed session is refused and cleaned up; expired signed access is refused and cleaned up. Earlier concurrent-claim, restart, wrong-key and fencing scenarios also pass. All 387 foundation tests across 44 files, type checking and build pass. Docker inspection confirms no rehearsal containers or volumes remain. No actual Supabase HTTP call, provider credential, hosted change or paid activity occurred.

Exact next action: consolidate the private Memory publication with these account/reset acceptance and database evidence updates, then prepare the account-refresh port that derives ownership from verified request identity and the inspected durable generation. Preserve the existing early-refresh limitation, explicit provider revocation contract and all live activation gates. Task 2c, Phase 1 and hosted/provider acceptance remain incomplete.


## Verified stored-refresh port and HTTP composition, 11 October 2026

Prepared createStoredRefreshPort to derive owner/session from reverified request identity and generation from durable inspection. It refuses missing, held or expired records, rechecks current authorization after inspection, and surfaces uncertain storage without starting a provider. No browser-supplied scope is accepted. The port is explicitly injected and no application route is enabled.

All 392 foundation tests across 45 files, type checking and build pass. Five new focused scenarios cover scope derivation, owner mismatch, unusable ownership, uncertain inspection and revocation/origin refusal. The isolated PostgreSQL rehearsal also composes the actual port, account-refresh coordinator and Request/Response HTTP factory with generated signed tokens: identity JSON is refused before rotation, valid cookie-derived refresh advances generation and returns only status plus cookie headers, and failed-delivery discard revokes synthetically then removes ownership. Existing SQL restart, fencing and signature-verification cases still pass. These HTTP factories are not a deployed server; provider rotation/revocation remain synthetic. No hosted changes or paid activity occurred.

Exact next action: extend actual loopback HTTP delivery coverage to stored refresh and inspect the provider activation checklist against the implemented account contracts. Keep the early-refresh limitation and actual provider revocation evidence gate open. The private Memory site currently contains the preceding 387-test checkpoint; consolidate it at the next meaningful publication. Task 2c and phase exit gates remain incomplete.


## Stored refresh over actual loopback HTTP, 11 October 2026

Added real loopback server tests composing generated signed identity, encryption/store adapter, staged rotation, verified stored-refresh port, account-refresh coordinator, HTTP factory and Node listener. Storage RPC and provider behavior remain simulated. Successful refresh delivers a status-only body and the secure cookie after generation adoption. Disconnecting during stalled adoption produces no accepted response and invokes provider revocation once before fenced ownership removal. The tests close their loopback servers.

All 394 foundation tests across 46 files, type checking and build pass. This complements the earlier actual isolated PostgreSQL Request/Response rehearsal; it does not claim PostgreSQL and network delivery were exercised in one scenario or that TLS/hosted/provider behavior is accepted. Updated the activation checklist to distinguish completed local evidence from remaining hosted checks. No real accounts, provider calls, hosted changes or paid activity occurred.

Exact next action: audit the real provider refresh/revocation contract against primary documentation and the activation checklist; prepare only disconnected transport behavior permitted by the local Task 2c exception. Keep unknown remote revocation, hosted schema, HTTPS/callback, email, social credential and Phase 1 gates open. Private Memory last published the 387-test checkpoint and should be consolidated after the next implementation checkpoint. Task 2c and Phase 2 remain incomplete.


## Supabase provider contract audit, 11 October 2026

Reviewed official refresh, session and sign-out documentation against the prepared account lifecycle; findings and primary links are in docs/task-2c-provider-contract-audit.md. Failed-delivery cleanup must target the exact current session explicitly, since a default sign-out scope can affect other devices. Signature validity alone is not remote session authority. Provider refresh reuse exceptions do not authorize blind retries. Local envelope expiry is not provider refresh expiry, and valid-JWT requirements leave expired/ambiguous cleanup authority as an unresolved adapter case.

No runtime change or new provider test occurred in this audit. The last verified foundation run remains 394 tests across 46 files with type checking/build passing; no new run is claimed. No hosted configuration, real credential, paid call or customer session was used. Task 2c and phase acceptance remain open.

Exact next action: prepare a disconnected, explicitly injected provider adapter with isolated operation state, explicit refresh input and local-session cleanup scope; use simulated responses to test malformed data, cancellation and uncertain revocation. Audit exact pinned SDK error semantics before any live enablement. Do not promise seamless refresh after access expiry or change customer session lifetime without an agreed contract.


## Disconnected refresh provider bridge, 11 October 2026

Prepared createRefreshProvider with explicitly injected refresh/revoke operations and an explicit application expiry policy. It supplies the claimed refresh token, requires bounded bearer-token output, requests cleanup with literal local scope, deduplicates cleanup and returns false for failed or uncertain revocation. Four-operation admission and an eight-second maximum response deadline propagate cancellation; unresolved underlying operations retain their capacity. There are no retries, default SDK client, environment reads, credentials or route activation. The injected operations must independently prove accepted remote revocation; the bridge does not establish that proof.

All 398 foundation tests across 47 files, type checking and build pass. Four new simulated-operation scenarios cover explicit token/scope, malformed replies/expiry, ambiguous cleanup and unresolved cancellation capacity. No actual HTTP provider request, SDK integration, remote session or paid call occurred. Malformed/late results can leave remote state unknown; durable rotation remains blocked and no cookie is accepted. The actual HTTP transport, bounded provider response reading, signed identity binding and expired cleanup authority still need integration evidence.

Source inspection of upstream auth-js refresh and admin sign-out code confirmed explicit refresh-token request input and scoped logout routing. The inspected master source is not a pinned runtime dependency and does not authorize copying its retry/debug behavior. Primary source links: https://raw.githubusercontent.com/supabase/auth-js/master/src/GoTrueClient.ts and https://raw.githubusercontent.com/supabase/auth-js/master/src/GoTrueAdminApi.ts .

Exact next action: implement the fixed-project provider HTTP operations with bounded body reads, no redirects/retries, private injected configuration and explicit session-local logout. Test with simulated HTTP before connecting this bridge to the isolated database/session rehearsal. Preserve live activation and session-lifetime decisions. Task 2c and phase gates remain open.


## Fixed-project refresh provider HTTP preparation, 11 October 2026

Prepared createRefreshProviderHttp with explicitly injected project, private API key and fetch. Only fixed HTTPS Supabase project destinations are allowed. Refresh POSTs to the token endpoint with explicit refresh-token JSON; cleanup POSTs only to logout with local scope and its staged access JWT. Redirects and browser credentials are disabled. Responses are bounded to 64 KiB, deadlines to eight seconds, underlying admission to four and errors are generic. No retry, SDK persistence, environment reads or default routes are added. Requests that ignore cancellation retain capacity until actual settlement and confirmed body cleanup.

All 402 foundation tests across 48 files, type checking and build pass. Four simulated-HTTP scenarios cover exact destination/headers/body, uncertain remote cleanup, malformed/oversized replies and retained cancellation capacity. The initial test mock omitted typed arguments; correcting that signature resolved its type-check failure before the successful full run. No real provider call, credential activation, hosted change or paid activity occurred.

Only an empty 204 logout response is accepted by the prepared transport. This conservative acceptance rule is a local contract requiring exact hosted/provider evidence before enablement, not a claim that all provider success variants were verified. Errors, redirects and unexpected success shapes remain unconfirmed. Returned token identity, expiry policy and remote revocation evidence still require full composition; malformed or lost refresh replies can leave a blocked remote session.

Exact next action: compose the real HTTP operations and provider bridge with synthetic HTTP and isolated PostgreSQL/session verification, including malformed provider response, lost rotation acknowledgment and cleanup refusal. Then consolidate private Memory beyond its 387-test publication. Keep real activation, session-lifetime and phase gates open.


## Provider HTTP, bridge and database composition, 11 October 2026

Extended the isolated PostgreSQL rehearsal through the actual provider HTTP operations, provider bridge, encryption/store, staged rotation, verified-session lifecycle and HTTP Request/Response factory. Provider fetch is injected synthetic HTTP, so no remote provider was contacted. Four scenarios pass: verified adoption; committed rotation with lost acknowledgment and confirmed synthetic cleanup; malformed provider response retaining a rotating claim; refused logout retaining storage and setting the account coordinator's cleanup hold. Exact provider request counts confirm no automatic retries. Synthetic teardown confirmations dispose fixture records only and are not remote revocation evidence.

All 402 foundation tests across 48 files, type checking and build pass. The full isolated SQL/composition rehearsal passes, and Docker inspection finds no rehearsal containers or volumes remaining. No hosted configuration, real credential or paid activity was used.

Known gap found by this composition: refused cleanup after adoption retains a ready database record while the cleanup hold is process-local. Another server process could attempt refresh. Before activation, quarantine the matching durable ownership generation without deleting it or rotating a provider credential. Cancellation, stale generations and unknown quarantine acknowledgments must stay conservative. This is an implementation gap, not an approved production behavior.

Exact next action: implement fenced durable quarantine for failed adopted-session cleanup and prove refusal persists across database restart and replacement coordinator. Then consolidate private Memory beyond its 387-test checkpoint. Task 2c and all live/phase acceptance gates remain incomplete.


## Durable adopted-session cleanup quarantine, 11 October 2026

Fixed the ready-record gap found in the combined rehearsal. Discard now inspects adopted ownership, claims its exact next generation and requests a durable hold before calling remote revocation. The claim itself blocks competing refresh if the hold acknowledgment is lost. Cleanup records its quarantine lease and removes only its matching generation/lease after confirmed revocation. Provider refusal leaves the credential stored and held; no provider rotation occurs during quarantine. A refused/stale claim never authorizes removal of a different generation. No new SQL migration or hosted change is needed; this reuses existing fenced claim/hold operations.

All 402 foundation tests across 48 files, type checking and build pass. Updated simulated lifecycle/loopback fixtures exercise the extra quarantine operations. The actual isolated PostgreSQL pipeline confirms refused provider cleanup leaves generation 2 held, then restarts the database and constructs a replacement store: the hold remains and claiming generation 2 is refused. Other SQL/composition scenarios pass. Disposable database containers/volumes were removed and verified absent. Provider calls remain synthetic.

Limits: if database inspection or claiming cannot be confirmed before remote cleanup, durable quarantine is not proven; process-local uncertainty remains and production reconciliation still needs explicit handling. The restart result proves the confirmed quarantine path, not every outage path. Task 2c and live/phase acceptance remain open.

Exact next action: test lost quarantine acknowledgments, stale competing generations and database failure during cleanup, then document the remaining reconciliation contract. Consolidate private Memory with the resulting evidence beyond its 387-test publication. No real provider, hosted activation or paid activity is authorized by this local fix.


## Cleanup uncertainty and competing-generation evidence, 11 October 2026

Extended the actual isolated PostgreSQL pipeline with lost quarantine-claim and lost hold acknowledgments. A committed claim with lost acknowledgment remains rotating; a committed hold with lost acknowledgment remains held. In both cases refused provider cleanup retains storage, an actual database restart preserves the state, and a replacement store cannot claim that generation. Synthetic provider request counts confirm no retries. Fixture teardown removes records using explicit synthetic confirmation only; it does not resolve a real remote session.

All 404 foundation tests across 48 files, type checking and build pass. Two new focused tests confirm unavailable inspection never removes ownership and a newer competing generation is neither quarantined nor deleted. The complete SQL/composition rehearsal passes. Disposable containers and volumes are verified absent. No real provider, hosted configuration or paid call was used.

Known outage behavior: an inspection exception exits cleanup before provider revocation is attempted. This avoids an unsupported cleanup success claim but can leave remote state active and the record ready. The current local hold is not a durable reconciliation plan for a database outage. Keep activation blocked on this failure path; do not describe all uncertain cleanup as durably quarantined.

Exact next action: improve cleanup to attempt bounded remote revocation even when quarantine inspection fails, while reporting uncertainty and retaining ownership unless scope and revocation are confirmed. Test that failure path and cancellation explicitly. Then consolidate private Memory, whose last publication is the 387-test checkpoint. Task 2c and phase gates remain incomplete.


## Cleanup outage revocation attempt and cancellation, 11 October 2026

Fixed quarantine inspection/claim/hold exceptions suppressing remote cleanup: quarantine now has its own guarded block, so an uncanceled cleanup still attempts the bounded provider revocation. Failed final inspection/removal remains false. Already canceled cleanup starts no storage or provider work; cancellation during revocation prevents removal even if a late adapter returns true. Cleanup remains deduplicated, and no automatic retry is added.

All 406 foundation tests across 48 files, type checking and build pass. Updated outage test confirms one revocation attempt despite inspection exceptions and no unsupported removal. Two new tests cover pre-canceled cleanup and cancellation during revocation. The complete isolated PostgreSQL/provider composition, lost-acknowledgment and restart scenarios still pass. Disposable containers/volumes were verified absent. All provider responses remain synthetic; no hosted change, real credential or paid call occurred.

Remaining limit: simultaneous database unavailability and unconfirmed provider revocation cannot establish durable quarantine or remote termination. This fix attempts revocation but does not resolve that distributed failure. Cleanup remains unconfirmed, account adoption stays unavailable in that coordinator, and live activation still requires a durable reconciliation mechanism and its failure evidence. Do not claim outage recovery complete.

Exact next action: consolidate private Memory with the 406-test checkpoint and recorded remaining distributed-cleanup risk, then prepare a disconnected trusted reconciliation path with explicit scope and evidence, without silently retrying rotation or resetting uncertain ownership. Task 2c and phase gates remain open.


## Trusted cleanup reconciliation preparation, 11 October 2026

Prepared createRefreshReconciliation as an explicit server-only capability. It snapshots owner/session/generation/lease, inspects current ownership, refuses stale generations/leases, requires an independently injected exact-session revoked proof, then uses fenced removal. Even absent local ownership requires revocation proof before confirmed completion. Wrong-session, malformed, unavailable or canceled evidence remains unconfirmed. A refused/uncertain remove is not silently retried. Four-operation admission and an eight-second maximum deadline retain underlying authority capacity until settlement. No route, scheduler, rotation retry, ownership reset or real authority is installed.

All 411 foundation tests across 49 files, type checking and build pass. Five new simulated-authority/storage scenarios cover scoped removal, stale or wrong evidence, absent-local/unknown-remote state, removal/cancellation failures and unresolved authority admission. Prior isolated database evidence is retained but this new reconciliation capability has not yet been composed with actual PostgreSQL. No real provider call, hosted configuration or paid activity occurred.

Remaining risk: the independent revocation authority and durable discovery of unresolved cleanup work still need implementation/evidence. This capability does not by itself recover lost process-local work or establish remote revocation. Task 2c and live/phase gates remain open.

Exact next action: compose reconciliation with the actual encrypted SQL store and synthetic exact-session authority, including lost removal acknowledgment, stale-generation races and restart persistence. Then define the durable unresolved-cleanup discovery mechanism before hosted activation. Private Memory currently contains the verified 406-test checkpoint.


## Cleanup reconciliation actual database composition, 11 October 2026

Composed reconciliation with the real encrypted SQL store in isolated PostgreSQL. Synthetic exact-session authority provides proof only in this rehearsal. Unknown authority retains a held record; an actual database restart preserves it; stale scope is refused; a committed removal with lost acknowledgment remains unconfirmed; an explicit trusted invocation with fresh proof then confirms local absence. A concurrent claim/finish advancing generation between inspection and proof causes fenced removal refusal and preserves the newer record. Fixture teardown is not evidence of real provider termination.

The complete SQL/composition rehearsal and all 411 foundation tests across 49 files, type checking and build pass. Disposable containers/volumes were verified absent. No real provider request, hosted change, credentials or paid activity occurred.

Limits: this proves supplied-scope reconciliation, not automatic discovery, durable scheduling or actual revocation authority. No background job or deployed route exists. Remaining simultaneous storage/provider failure remains an activation gate.

Exact next action: prepare durable unresolved-cleanup discovery and its service-only SQL access, explicitly tracking pending cleanup before it can be lost across process restart. Reuse existing scoped reconciliation and never reset blocked rotation automatically. Test intent persistence, stale work and account-deletion cascade locally before any hosted setup. Private Memory currently contains the 406-test publication and needs consolidation after the next implementation checkpoint. Task 2c and phase gates remain open.


## Durable metadata candidate discovery, 11 October 2026

Prepared local migration 18 and a seventh allowlisted refresh RPC for bounded keyset discovery of existing ownership records. Service-only access returns owner/session/generation/expiry/state/lease metadata without envelopes or secrets. The store validates exact shape, count, cursor order and scope. Pages are limited to 100 records; no route or scheduler is installed. Existing durable ownership is the discovery source, including ready records that may contain unresolved cleanup after an outage. Candidates are a superset including legitimate active sessions: discovery alone never authorizes revocation or deletion.

All 413 foundation tests across 49 files, type checking and build pass. Two new focused tests cover safe metadata and invalid limits/order/credential-bearing output. Actual isolated PostgreSQL verifies ordinary-role denial, page bounds, cursor behavior and disappearance after session-deletion cascade. The composed rehearsal obtains reconciliation scope from discovery, restarts the database, constructs a replacement store and rediscovers the held record. The final full SQL rehearsal passes and disposable containers/volumes are verified absent. Migration 18 has not been applied to hosted Supabase.

Limits: discovery provides candidates, not a dedicated cleanup-intent ledger or proof that active records should be terminated. A real independent revocation authority and trusted bounded scan orchestration remain required. Unknown authority must preserve records; no automated provider calls or rotation retries are enabled. Task 2c and phase gates remain open.

Exact next action: prepare a bounded explicit scan that uses metadata discovery and scoped reconciliation with injected authority, preserving unknown/active records and reporting resumable cursors. Test page progress, stale records, cancellation and underlying operation retention before scheduling or real activation. Private Memory last published the 406-test checkpoint.


## Bounded explicit reconciliation scan, 11 October 2026

Prepared createRefreshScan to process one metadata page sequentially through scoped reconciliation. It reports visited/confirmed/stale/unconfirmed counts and the last fully processed session cursor. Cancellation does not advance past unresolved work. A maximum eight-second deadline propagates abort; one underlying scan at a time retains its slot until actual completion, including ignored cancellation. No route, scheduler, provider revocation initiation, automatic rotation retry or ownership reset is installed.

All 417 foundation tests across 50 files, type checking and build pass. Four new simulated scenarios cover mixed outcomes, stale scope/cursor progress, cancellation during reconciliation and unresolved discovery admission. Existing SQL evidence remains separate; this scan has not yet been composed with actual PostgreSQL. No hosted configuration or paid/provider call occurred.

Semantics: endOfSweep only means the returned metadata page was shorter than the requested limit, not that all cleanup succeeded. Unconfirmed records remain stored and need a later full sweep from a null cursor; keyset pagination is not a transactional snapshot, so new earlier keys are picked up by a later full sweep. A canceled in-flight operation may have committed removal; scoped reconciliation and independent proof must resolve that uncertainty on an explicit subsequent invocation.

Exact next action: compose the actual scan with encrypted PostgreSQL discovery/reconciliation and synthetic authority, proving unknown records persist, confirmed records are removed and a replacement scanner resumes from the returned cursor. Then consolidate private Memory beyond its 406-test checkpoint. Task 2c and live/phase gates remain open.


## Reconciliation scan database composition, 11 October 2026

Composed the actual scan, metadata discovery, scoped reconciliation and encrypted store with isolated PostgreSQL. Three synthetic sessions exercise unknown/confirmed/unknown outcomes in one-record pages. Unknown records remain stored; only the independently confirmed fixture is removed. After an actual database restart, a replacement store/scanner resumes from the first page's cursor. An empty final page marks sweep end while two unknown records still exist. A later explicit full sweep with fresh synthetic authority resolves those two records. Temporary synthetic sessions are removed.

The full isolated SQL/composition rehearsal and all 417 foundation tests across 50 files, type checking and build pass. Disposable containers/volumes are verified absent. Provider authority remains synthetic; no hosted migration, actual provider call or paid activity occurred. This is explicit local invocation, not a running or scheduled background worker.

Remaining requirements: real independent revocation authority, operational authorization and durable scan cursor scheduling still need evidence before activation. Candidate discovery includes legitimate ready records, so the scanner cannot infer that they should be revoked. Simultaneous database/provider failure remains unconfirmed rather than automatically reset.

Exact next action: consolidate private Memory with the 417-test and complete scan/database evidence, then implement an independent, error-distinguishing server-side revocation authority contract using verified provider/session semantics. Keep hosted configuration, real credentials and phase gates closed until separately authorized. Task 2c remains incomplete.


## Account requirement reconciliation, 12 October 2026

Reviewed actual account source and corrected the current acceptance audit, preserving historical evidence below it. Durable adoption, encryption, refresh rotation and local HTTP/database composition are no longer listed as wholly missing. Concrete password/registration provider transport, durable sign-out port, OAuth initiation/exchange and provider-verified recovery remain incomplete. All account factories remain disconnected and hosted acceptance remains gated. No new test run or functionality is claimed for this documentation audit.

Exact next action: prepare a disconnected password/registration provider boundary with injected synthetic responses and shared staged-session ownership, then test confirmation-only registration, cancellation, malformed replies and exact-session cleanup. Preserve all live/financial gates. Consolidate private Memory at the next implementation checkpoint.


## Sign-out HTTP and primary database evidence, 12 October 2026

Extended the isolated database pipeline through the concrete stored sign-out port, sign-out HTTP factory, password HTTP logout and primary Auth session-presence authority. A synthetic accepted 204 without session-row deletion returns remoteUnconfirmed (409), clears browser cookies through headers and retains held ownership. When the injected provider actually deletes the synthetic Auth session, foreign-key cascade removes encrypted ownership, independent absence confirms signedOut (200), and the same still-signed token fails authorization. Explicit request counts show no automatic retries. Refused initial cleanup remains quarantined across the earlier actual restart.

All 443 foundation tests across 56 files, type checking/build and the complete isolated SQL rehearsal pass. A missing cancellation argument in the test harness was corrected before the passing final run. Provider fetch is synthetic; no hosted or real-account acceptance is claimed. No live routes, credentials, emails or paid calls were used.

Exact next action: consolidate private Memory with the complete 443-test account checkpoint, then prepare OAuth initiation/exchange transport contracts locally with synthetic responses and one-use PKCE transactions. Recovery purpose verification, real provider configuration, HTTPS browser/device checks and Phase 1/hosted approvals remain open. Task 2c remains incomplete.

## Local OAuth initiation checkpoint

Prepared fixed-destination Google and Apple authorization links with browser-bound, one-use PKCE transactions. Three focused synthetic checks pass: both providers round-trip through the existing callback validator, missing browser binding and replay fail, and external destinations/return paths are rejected. No route, credentials, real sign-in or hosted configuration was activated. This does not prove provider compatibility or complete Task 2c.

Exact next action: prepare the bounded PKCE code-exchange HTTP transport, then compose it with verified initial session ownership using synthetic provider responses. Full-suite evidence is recorded in DEVELOPMENT_PROGRESS.md after completion.

## Local OAuth exchange preparation

Prepared PKCE code exchange through the existing bounded Supabase HTTP transport. Only auth_code and code_verifier are sent to the fixed token endpoint; requests refuse redirects and browser cookies. Google and Apple reuse shared token normalization, initial-session staging and late-result cleanup. Five new synthetic tests cover request validation, malformed responses, late canceled results and the composed browser-bound callback to verified cookie preparation. All 451 foundation tests across 58 files, type checking and build pass. No real provider, credentials, account route or hosted settings were activated. Database composition of this OAuth path remains pending, and Task 2c stays open.

Next action: compose OAuth code exchange with the actual isolated PostgreSQL refresh-ownership store and confirm failed adoption and callback replay cannot issue access. Then update the private Memory publication, currently at 443 tests.

Protocol reference: https://github.com/supabase/auth-js/blob/master/src/GoTrueClient.ts (_exchangeCodeForSession). The reviewed upstream source is not a pinned installed SDK or evidence of live compatibility.

## OAuth database composition verified

The disposable PostgreSQL rehearsal passes with the prepared OAuth HTTP transport, generated signed identities and actual encrypted refresh ownership. Google and Apple each adopt generation one, reject callback replay, and clean up the staged ownership. A lost adoption acknowledgment combined with refused synthetic logout blocks access and keeps the ownership unclaimable after an actual database restart. All provider/network responses are synthetic. No hosted database changes or real provider calls occurred; this does not complete Task 2c. The earlier 451-test suite, type checking and build passed.

Exact next implementation action: prepare provider-verified recovery authorization, without treating an ordinary account JWT as recovery proof. Private Memory publication follows this checkpoint.

## Signed recovery-purpose verification prepared

The existing bounded asymmetric identity verifier now exposes a separate recovery check. It requires a signed amr recovery method with a valid recent timestamp, normal issuer/audience/role/identity checks, and a current authoritative Auth session. Recovery authority expires at the earlier of token expiry or five minutes after the recovery authentication, and isCurrent rechecks both expiry and session status. Normal identity verification keeps its original result shape. This is an application freshness rule, not a claim that Supabase promises this reset lifetime. No reset grant, password update, email or hosted route was activated.

All 453 foundation tests across 58 files, type checking and build pass. New synthetic signed-token tests reject missing/password/stale/future/malformed recovery methods and confirm independent recovery expiry. Source: https://supabase.com/docs/guides/auth/jwt-fields documents amr recovery and timestamps; real project claims and provider/device behavior remain unverified.

Exact next action: connect this proof to a prepared recovery provider adapter that creates reset-only capability, rechecks purpose/current authority before updating a password and independently confirms session cleanup. Keep normal account cookies unavailable through recovery. Private Memory currently publishes the earlier 451-test database checkpoint.

## Reset-only recovery provider prepared

Prepared an injected recovery adapter using signed recovery-purpose verification and current identity checks. Its server-only capability exposes one password update attempt, rechecks current recovery authority, and issues no normal account cookie. Discard always attempts scoped logout, then requires exact independent owner/session absence proof; logout acceptance alone is insufficient. Malformed proof or failed identity verification cannot authorize a reset. A late verification failure retains the remote cleanup capability, with unconfirmed cleanup held by the existing recovery owner.

All 458 foundation tests across 59 files, type checking and build pass. Five new simulated tests cover one-use reset, ordinary-login refusal, revoked authority, unknown cleanup, lost logout reply with independent proof, and verification exceptions. No provider HTTP recovery transport, real password change, email, hosted configuration or route was activated. Task 2c remains incomplete.

Exact next action: compose the recovery adapter with generated signed recovery identities and the existing recovery owner/browser binding, then prepare bounded recovery HTTP operations. Private Memory remains at the verified 451-test checkpoint.

## Recovery owner/browser composition verified locally

Three new composed synthetic checks use generated ES256 recovery JWTs, actual identity verification, the recovery provider adapter, one-use callback owner, reset browser binding and reset HTTP response. The correct reset cookie permits one update and clears itself without issuing an access cookie. Wrong browser binding and callback replay fail. An ordinarily signed password token fails recovery-purpose verification and is cleaned up. An update with unproved primary session cleanup returns HTTP 409/unconfirmed, clears the reset cookie and holds both recovery and browser owners.

All 461 foundation tests across 60 files, type checking and build pass. Provider operations and session presence are simulated here, not actual hosted or isolated database evidence. Real password changes and email delivery remain disabled. Task 2c stays open.

Exact next action: prepare bounded HTTP recovery-request, PKCE exchange and password-update operations, then compose with the isolated primary database. No real provider call, credential or route is authorized by this checkpoint. Private Memory remains at 451 tests.

## Bounded recovery HTTP preparation

Prepared explicit injected HTTP operations for recovery requests, PKCE code exchange and password updates. Requests use fixed Supabase HTTPS/default-port destinations, refuse redirects and browser credentials, validate the exact recovery callback and flow, and send allowlisted fields only. Transport has four underlying operations, an eight-second maximum deadline, bounded request/response sizes, redacted failures and retained admission while ignored cancellation or late response cleanup is unresolved. Password-update confirmation requires a matching returned owner ID; decoding the input JWT only correlates this response, while the recovery adapter performs signature/purpose/current-session authorization. Existing scoped logout transport is composed separately.

All 468 foundation tests across 61 files, type checking and build pass. Seven new synthetic checks cover destination/callback restrictions, exact recovery and PKCE bodies, owner correlation, ignored cancellation and malformed/oversized/non-JSON/failure responses. No real email, password update, provider request, route or hosted configuration was activated. Task 2c stays open.

Protocol reference: https://github.com/supabase/auth-js/blob/master/src/GoTrueClient.ts (resetPasswordForEmail, _exchangeCodeForSession, _updateUser). Upstream source is research, not a pinned installed SDK or live acceptance. Exact next action: compose recovery HTTP with signed recovery identity and actual isolated primary database cleanup, then refresh private Memory from its current 451-test checkpoint.

## Recovery database composition verified

The disposable PostgreSQL rehearsal now composes the prepared recovery request/PKCE/password-update HTTP transport, generated signed recovery identity, callback owner, browser reset cookie and independent primary-session presence RPC. Synthetic confirmed reset deletes the actual synthetic Auth session, while accepted-only logout leaves cleanup unconfirmed. An ordinary signed password token is rejected and cleaned up. Replay and repeated reset are refused; no normal account cookie is issued. Provider and password-update responses are synthetic, not real hosted password changes or email delivery. Containers and volumes were verified removed.

Current foundation evidence: 468 tests across 61 files, type checking and build pass. Full isolated ownership rehearsal passes including password, OAuth, recovery and sign-out compositions. Task 2c stays open for real configuration, cross-device/restart policy, HTTPS/device/accessibility checks and phase gates. Next: review the remaining local account acceptance gaps and prepare the highest-priority authorized one; do not activate hosted Auth or spend.

## OAuth callback HTTP delivery prepared

Added the previously missing disabled callback-response adapter for Google and Apple. It delivers verified account cookies only with an allowlisted relative redirect, returns no response body containing tokens, sets no-store/no-referrer headers, sanitizes failures and clears the flow cookie. Ready results arriving after cancellation or carrying a disallowed return path are discarded. Undelivered successful responses retain a server-only cleanup capability. The real exchange owner remains responsible for one-use callback validation and cleanup holds. No route is installed.

All 472 foundation tests across 62 files, type checking and build pass. Four new synthetic checks cover cookie/redirect delivery, failure sanitization, canceled/external return cleanup and origin/method/path refusal. Actual callback browser delivery and Node disconnect composition remain separate checks; this is not hosted sign-in acceptance.

Exact next action: add the analogous reset-only recovery callback delivery, then compose both callback handlers with the prepared Node transport and actual signed identities. Preserve all hosted and spending gates. Private Memory currently publishes the 468-test database checkpoint.

## Recovery callback delivery, 12 October 2026

Prepared a reset-only recovery callback HTTP adapter. A verified grant is installed in the existing opaque browser binding and redirects only to /account/reset, with reset/flow cookies and no account-access cookie or provider token body. Canceled delivery and refused installation clean the grant; undelivered successful responses retain cleanup. Failure statuses are sanitized with no-store/no-referrer headers. The Node listener now explicitly accepts only google/apple/recovery callback routes alongside its account API paths. No route is registered in the running application.

All 477 foundation tests across 63 files, type checking and build pass. Five new tests cover reset-only delivery, cancellation/install cleanup, failure/path validation, exact Node callback allowlisting and actual loopback redirect/separate-cookie transport. The loopback transport fixture is synthetic and does not yet prove the generated-identity callback/disconnect composition. Hosted TLS/browser acceptance remains open.

Exact next action: compose actual signed OAuth/recovery callback handlers with Node delivery, including a disconnected client and late provider result; keep the server activation disabled. Private Memory currently publishes the 468-test database checkpoint.

## Signed callbacks and disconnect cleanup, 12 October 2026

Five new composed loopback HTTP tests use generated ES256 identities and actual OAuth/recovery owners with callback response adapters. Google and Apple deliver account cookies/relative redirects and refuse replay. Recovery delivers only its reset cookie. A late OAuth session after client disconnect is discarded. A late recovery result is revoked without installing reset permission.

The recovery disconnect test exposed an unnecessary unresolved-cleanup hold: cancellation prevented initial identity verification, leaving cleanup unable to correlate primary absence. Fixed by verifying identity with the independent bounded cleanup signal before revocation, solely for cleanup correlation. Failed verification still attempts logout and remains unconfirmed. This does not restore reset authority or issue cookies.

All 482 foundation tests across 64 files, type checking and build pass. Provider/current-session responses in these loopback cases are simulated. Earlier isolated database evidence remains separate and must be rerun after this cleanup change before claiming the new path is database-verified. No route, hosted setting, email or real sign-in was activated.

Exact next action: extend the isolated recovery database rehearsal with the canceled/late result case and rerun it, then update private Memory from the 468-test checkpoint. Task 2c and hosted/device gates remain open.

## Late recovery cleanup database verification, 12 October 2026

Extended the actual isolated PostgreSQL rehearsal with a canceled caller and delayed recovery result. Cleanup verifies the signed identity with its independent signal, invokes scoped synthetic logout, and confirms actual primary-session deletion. No password update or reset permission occurs, and cleanup does not remain unnecessarily held. The full ownership rehearsal passes and disposable containers/volumes were verified removed. Provider replies remain synthetic; no hosted changes occurred. Foundation evidence remains 482 passing tests, type checking and build.

Next authorized local work: prepare the missing OAuth initiation HTTP boundary, then compose disabled account handlers into an explicit route factory. Do not register real account routes or configure providers. Task 2c remains open.

## Same-origin OAuth initiation delivery, 12 October 2026

Prepared the missing JSON initiation HTTP boundary at /api/account/oauth, without registering it. It accepts only provider and returnPath, uses the existing same-origin/JSON/body/deadline checks and the fixed Google/Apple authorization builder, and delivers only a public handoff URL plus a Secure/HttpOnly browser-binding cookie. The verifier remains server-only. Pending transactions now expose a server-only idempotent discard capability; undelivered responses remove them. Also rejected nondefault Supabase ports in the URL builder.

All 485 foundation tests across 65 files, type checking and build pass. Three new synthetic checks cover public handoff shape/binding, abandoned transaction refusal, cross-origin/extra-field/provider/external-return rejection and destination-port restrictions. No sign-in page, provider call, route or hosted configuration was activated.

Exact next action: compose the prepared initiation, password, callback, refresh, recovery and sign-out handlers into one explicit disabled account route factory, sharing lifecycle owners and preserving undelivered-response cleanup. Task 2c remains open. Private Memory remains at the verified 482-test checkpoint.

## Dormant account route registry, 12 October 2026

Added an explicit nine-route registry for password, OAuth initiation, refresh, sign-out, recovery request/reset and the three callbacks. It snapshots handlers and preserves undelivered-response cleanup without opening a listener or invoking a provider. Two focused tests cover exact route membership, cleanup forwarding, snapshot isolation and missing/extra handler refusal. All 487 tests across 66 files, type checking and build pass with authorized local loopback access. The first restricted run was interrupted after loopback refusals; it is not acceptance evidence.

Shared owner construction and recovery shutdown composition still need implementation. The registry alone does not prove those lifecycles. No hosted routes, real sign-ins, emails or spending were enabled. Exact next action: build the explicit account composition around this registry with shared session ownership and recovery close, then test cross-route capacity and shutdown cleanup.

## Shared account composition, 12 October 2026

The explicit dormant factory now builds all nine handlers with one shared account-session lifecycle for password, OAuth and refresh. It preserves response-discard callbacks, cancels pending requests on shutdown, closes browser reset grants and refuses new requests after closure. No listener is opened and no environment configuration activates these routes. The close result describes reset-grant cleanup only, not remote termination.

All 489 foundation tests across 67 files, type checking and build pass. New synthetic composition checks prove construction without provider calls, idempotent closure/refused admission and password capacity shared with OAuth while requests are pending. Existing signed-identity and isolated database tests remain separate evidence. Cross-route refresh, signed recovery shutdown and actual database factory composition still require focused checks.

Exact next action: extend composition tests with signed recovery grant shutdown and shared refresh admission, then use the factory in the isolated database rehearsal. Preserve hosted, business-policy and spending gates. Private Memory is still at the 482-test checkpoint and needs reconciliation after these checks.

## Account composition shutdown checks, 12 October 2026

Two additional synthetic composition checks confirm that a delivered browser reset grant is discarded on shutdown, uncertain cleanup remains held, later reset requests are refused and no password change is attempted. Authenticated refresh shares the four-operation session capacity with password requests and cannot bypass it. These fixtures inject trusted identity/recovery ports; they do not verify real provider signatures or hosted recovery.

All 491 foundation tests across 67 files, type checking and build pass. Task 2c remains open. Exact next action: compose the factory with generated signed identities and the isolated PostgreSQL adapters, then reconcile the private Memory publication and current summaries. No live routes, emails, credentials or paid calls were activated.

## Account factory database rehearsal, 12 October 2026

Replaced direct recovery-owner assembly in the isolated PostgreSQL rehearsal with the actual account composition factory and its route registry. Generated signed recovery identities now pass through request, callback delivery and reset handlers, backed by actual local primary-session presence. Checks cover ordinary-token rejection, callback replay, single reset, no account cookie, confirmed deletion, unconfirmed cleanup and post-close refusal. Provider replies and password updates remain synthetic.

The full isolated ownership rehearsal passes; disposable containers and volumes were verified absent. All 491 foundation tests across 67 files, type checking and build pass. This verifies the factory recovery path, not every factory route or real hosted Auth.

Exact next action: update and publish the private Memory site to this checkpoint, then extend the factory rehearsal to password/OAuth/refresh/sign-out routes. All hosted, sequencing, customer-policy and spending gates remain unchanged.

## Password and OAuth factory database checks, 12 October 2026

The isolated PostgreSQL rehearsal now uses the actual dormant factory for password confirmation/sign-in and Google/Apple initiation/callback delivery. It verifies confirmation without cookies, signed account-cookie delivery, encrypted generation-one ownership, one-use callback refusal, allowlisted return paths and response-discard cleanup removing stored ownership. Existing lost-acknowledgment/restart cases remain separately exercised through their direct owners. Provider responses remain synthetic.

The full isolated rehearsal passes and disposable resources were verified removed. All 491 foundation tests, type checking and build pass. No hosted account route or paid request was enabled. Exact next action: move the remaining refresh and sign-out database compositions through the factory, then reconcile acceptance gaps before any activation. The private Memory publication remains the earlier 491-test recovery checkpoint.

## Refresh and sign-out factory database checks, 12 October 2026

Moved stored refresh and sign-out through the actual dormant account factory in the isolated PostgreSQL rehearsal. Refresh derives scope from verified cookies, refuses browser identity fields, advances encrypted ownership and discards undelivered results. Sign-out clears browser cookies but remains unconfirmed until actual primary-session deletion; the old signed token then loses authorization. Provider operations remain synthetic.

The full isolated rehearsal passes and disposable resources were verified removed. All 491 foundation tests across 67 files, type checking and build pass. Password, OAuth, recovery, refresh and sign-out now have factory-level Request/Response/database evidence; this is not full factory Node/browser/hosted acceptance. Task 2c remains open. Exact next action: reconcile the activation checklist and remaining local abuse-protection/shutdown gaps, implementing independent local work before any hosted activation. Private Memory still publishes the earlier 491-test recovery checkpoint.

## Recovery expiry maintenance hook, 12 October 2026

Exposed the existing reset-grant expiry cleanup through the dormant account factory as expireRecovery. A focused synthetic test advances time after callback delivery and verifies maintenance discards the expired grant once without another customer request. No timer or background job starts automatically. A future host must explicitly schedule this maintenance and call close on shutdown; hosted lifecycle acceptance remains open.

All 492 foundation tests across 67 files, type checking and build pass. No hosted changes or paid calls occurred. Exact next action: add bounded local account abuse-admission preparation and test it before host activation; keep durable/multi-process limits and real provider settings as acceptance gates.

## Local aggregate account admission, 12 October 2026

Prepared an explicitly configured process-local aggregate request guard for account route maps. It snapshots routes, shares one allowance across methods, refuses excess requests before handler/provider work with Retry-After, preserves response-discard cleanup and refuses invalid/regressing clock readings. Canceled requests start no work. No IP, email or account identifier is stored. Policy has no automatic/default activation.

All 494 foundation tests across 68 files, type checking and build pass. Two focused synthetic tests verify shared limits, replenishment, cleanup forwarding, invalid policy, clock regression and cancellation. This bounded single-process guard is not durable/multi-process abuse protection and does not replace provider email/password limits or production policy acceptance. Exact next action: compose the guard with the real dormant account factory and verify rejected requests make no provider calls, then reconcile remaining activation gaps and private Memory.

## Guarded factory and local HTTP composition, 12 October 2026

The aggregate admission guard is now tested around the actual dormant account factory. Excess password/OAuth/recovery requests stop before provider calls, and refused OAuth callbacks remain unconsumed for a later allowed attempt. A generated signed-identity fixture also exercises guarded factory password delivery through the actual Node loopback listener: secure cookie headers are delivered separately, no token appears in JSON, and the second request is refused without another provider call. Provider/session authority in this HTTP case is simulated; separate PostgreSQL factory evidence remains valid.

All 496 foundation tests across 68 files, type checking and build pass. No live listener, route, provider configuration or paid call was activated. Exact next action: inspect the remaining complete factory disconnect/shutdown cases and deployment acceptance checklist, then consolidate private Memory with current evidence. Task 2c remains open.

## Factory disconnect and shutdown HTTP checks, 12 October 2026

Upgraded the existing late-adoption disconnect test to use the guarded account factory over actual local HTTP. Added server-shutdown coverage: cancellation delivers unconfirmed with no account cookie, late simulated adoption is discarded once after settling, and new requests receive unavailable. Generated identities are signed; provider/current-session/storage fixtures remain synthetic.

All 497 foundation tests across 68 files, type checking and build pass. The initial new test expected unavailable HTTP 400, but the existing JSON cancellation boundary correctly returns unconfirmed HTTP 409; corrected the assertion without changing runtime behavior. No hosted route or paid work was activated. Exact next action: reconcile current summaries and private Memory, then audit remaining authorized local implementation against the full account acceptance checklist.

## Complete factory callback HTTP lifecycle, 12 October 2026

Upgraded the five signed callback Node composition checks to use the actual dormant account factory instead of separately assembled handlers. Google and Apple cookie/redirect delivery and replay refusal pass; signed recovery delivers only reset permission and closes it on shutdown. Added late OAuth/recovery results after factory shutdown alongside browser disconnect cases. Cleanup occurs without granting account/reset access or changing a password. Provider/session-presence authority remains simulated; generated signatures are verified.

All 499 foundation tests across 68 files, type checking and build pass. No hosted or paid operation occurred. Exact next action: review the account preparation against the approved user requirements and remaining acceptance gates, prioritizing concrete runtime gaps rather than repeating completed checks. Private Memory remains at the 497-test checkpoint.

## Undelivered recovery request cleanup, 12 October 2026

Fixed a concrete factory lifecycle gap: successful recovery-request responses now retain an idempotent server-only discard callback. The account factory forwards it to transport cleanup, so an undelivered response consumes its pending browser transaction immediately rather than leaving it until expiry. The existing callable recovery-request interface is preserved; provider emails cannot be recalled by this local cleanup.

All 500 foundation tests across 68 files, type checking and build pass. A new focused factory check verifies double discard makes the recovery callback unusable without a recovery exchange. No real email or hosted action occurred. Exact next action: verify this recovery-request discard over actual Node disconnect/delivery failure, then consolidate current acceptance evidence. Private Memory remains at the 497-test checkpoint.

## Recovery request actual disconnect verification, 12 October 2026

Added a complete-factory Node loopback check that disconnects the client while a synthetic recovery request is pending. A test-only observer confirms the runtime consumes the transaction, then a single callback attempt is refused. The assertion does not poll the consuming callback API, avoiding a false pass caused by the test consuming state itself. Immutable callback methods are observed through copied injected dependencies rather than patched.

All 501 foundation tests across 68 files, type checking and build pass. No real email, hosted change or paid call occurred. This covers pending-request cancellation; successful-response discard remains separately covered by the factory test. Exact next action: consolidate account acceptance and inspect remaining customer requirements, avoiding duplicate checks of already verified local paths. Private Memory remains at the 497-test checkpoint.

## Disabled browser OAuth handoff, 12 October 2026

Closed a browser transport gap: createAccountHttp can now accept an explicitly injected Google/Apple handoff adapter. The new adapter requests only the same-origin initiation endpoint with cookie credentials and no redirects, bounds response bytes/deadline/admission, validates the exact fixed Supabase authorize URL, provider, S256 challenge and browser callback flow, then invokes injected navigation. External/duplicate/wrong-provider destinations and canceled late responses cannot navigate. No preview selects it and no real navigation or provider call occurred.

All 504 foundation tests across 69 files, type checking and build pass. Three synthetic checks cover browser/account transport composition, hostile handoff refusal and cancellation. Hosted/browser OAuth acceptance remains open. Exact next action: compose browser handoff with the actual server initiation factory in a synthetic integration check, then review reset-browser transport and current acceptance summaries. Private Memory remains at the 497-test checkpoint.

## Browser/server handoff and reset transport, 12 October 2026

Composed the browser OAuth handoff with the actual server initiation response using synthetic fetch and navigation. The returned flow cookie binds the Apple callback once. Added the missing disabled browser reset HTTP adapter, reusing an extracted bounded same-origin status transport with an exact four-endpoint allowlist. It sends password/confirmation once with cookie credentials, accepts resetComplete or unconfirmed only, rejects token-bearing JSON and never creates account access. Preview selection remains unchanged.

All 507 foundation tests across 70 files, type checking and build pass. Three added checks cover server/browser social composition and reset-only request/response semantics. No real email, navigation, sign-in or hosted change occurred. Exact next action: compose the browser reset adapter with the actual reset-only server/browser-grant owner, including one-use refusal and unconfirmed cleanup, then reconcile private Memory.

## Browser/server reset composition, 12 October 2026

Composed the reset-only browser HTTP adapter with the actual prepared reset handler and browser-grant owner using synthetic fetch. Confirmed cleanup returns resetComplete; failed cleanup returns unconfirmed. Both clear the reset cookie without account access, permit only one password operation and reject subsequent client/server attempts. Grant/provider operations are simulated; this is not real password change acceptance.

All 509 foundation tests across 70 files, type checking and build pass. No hosted or paid work occurred. Exact next action: audit callback/reset page routing and preview-versus-live adapter selection against approved account flows, then consolidate current summaries/private Memory. Hosted activation, customer recovery/linking policy and phase gates remain open.

## Account return-page routing preparation, 12 October 2026

Reviewed App/AccountPanel/RecoveryPanel: current preview intentionally uses sample adapters and does not render live callback return paths. Added a disabled presentation-only resolver for /account and /account/reset. Only canceled/busy/unavailable notices are recognized; signedIn, token/grant query data, duplicate statuses, fragments, foreign origins and browser-side callback URLs are refused. Reset routing explicitly requires server permission and cannot infer it from the URL. This resolver is not selected in the preview.

All 511 foundation tests across 71 files, type checking and build pass. Two focused checks cover accepted presentation routes and hostile/authority-like URL refusal. Live page mounting, server reset-permission readiness, provider selection and browser acceptance remain open. Exact next action: prepare explicit non-preview account/reset panel configuration and server-bound reset readiness without inferring authorization from URL state; preserve hosted activation gates.

## Explicit reset panel configuration, 12 October 2026

RecoveryPanel now optionally accepts an explicit reset provider and expiry, with separate customer wording and new-password autocomplete. It defaults to the existing simulated preview, starts no provider work on render and clears inputs/cancels the prior flow when configuration changes or the panel unmounts. Server verification remains mandatory; configuration is presentation wiring, not reset authority. The app does not select a real configuration.

All 512 foundation tests across 71 files, type checking and build pass. A static rendering check covers explicit wording, autocomplete and no provider activation; existing preview checks pass. Initial test expected lowercase HTML attribute spelling; corrected to a case-insensitive assertion. Hosted/browser acceptance remains open. Exact next action: prepare server-bound reset-readiness metadata for page mounting without token disclosure or URL-derived permission, then connect explicit page configuration locally.

## Cookie-bound reset readiness, 12 October 2026

Prepared a server-only recovery-browser readiness method for exact same-origin POST /api/account/reset-ready. It validates the opaque reset cookie without consuming valid permission and returns only resetReady/expiry metadata. It refuses duplicate cookies, hostile origins, Authorization headers, expired/used grants, canceled requests and closed/held ownership. Expired grants are discarded without password work. Reset submission still independently claims and validates permission. No HTTP route is registered.

All 514 foundation tests across 71 files, type checking and build pass. Two synthetic tests verify metadata-only non-consuming readiness, hostile refusal, post-use refusal and expired cleanup. A header fixture type was corrected after type checking. Exact next action: wrap readiness with the bounded JSON HTTP boundary and explicitly compose it into the dormant account factory, then prepare the browser readiness adapter. No hosted or paid activity is authorized by this preparation.

## Reset readiness HTTP and browser preparation, 12 October 2026

Prepared a metadata-only reset readiness endpoint in the dormant account factory. It accepts only an empty same-origin JSON request, checks the server-owned reset cookie without consuming it, returns only status and expiry, and sets no cookie. The browser adapter validates bounded expiry before preparing the explicit reset panel. Password submission independently checks the server-owned permission again. Missing, expired, consumed or closed permission cannot enable this configuration. No live routes, provider calls, email or hosted settings were activated.

Evidence: 516 foundation tests across 72 files pass; type checking and production build pass. The new integration checks cover repeated non-consuming readiness, missing cookie, extra input, metadata response and browser configuration refusal after shutdown. This is local synthetic-provider evidence, not real recovery acceptance. Task 2c and both phase exit gates remain open.

Next action: connect the explicit account return-page resolver and reset configuration in a disabled local composition, retaining the sample preview as the default; then run its focused browser checks. Private Memory still publishes the earlier 497-test checkpoint and needs reconciliation.

## Optional recovery-page composition, 12 October 2026

Prepared an explicit recovery page that accepts only the clean reset return path, waits for server-cookie readiness metadata before showing password fields, cancels on page changes/unmount, and ignores late or stale configurations. The default sample App does not mount it. No live authentication, email, hosted change or paid call was enabled.

Evidence: 519 foundation tests across 73 files pass; type checking and build pass. Tests cover forbidden return paths, expired readiness, canceled late preparation and request-free initial rendering. This is not physical browser or real recovery acceptance.

Next action: add browser lifecycle verification for the optional reset page, then review remaining local Task 2c activation prerequisites. Private Memory publishes the prior 516-test checkpoint.

## Reset-page browser lifecycle verification, 12 October 2026

A local WebKit run using synthetic reset data verified readiness before fields appear, immediate cancellation on Return, refusal of a late response after Return, reset submission, clearing both password fields, disabled replay and cancellation on unmount. Fixed Return to cancel immediately even if the parent does not unmount the screen. The optional connected screen remains absent from the default App. No provider, email or hosted account operation was started.

The full foundation suite still passes 519 tests across 73 files, type checking and build. Browser script: apps/foundation/scripts/check-recovery-browser.cjs; serve the foundation on loopback port 4325, supply PLAYWRIGHT_MODULE and optionally WEBKIT_EXECUTABLE for an existing installation. Fixture: tests/browser/recovery.html. Desktop WebKit simulation does not replace physical iPhone, accessibility or real recovery acceptance.

Next action: review remaining local Task 2c prerequisites and explicit account-panel composition. Private Memory remains at the 516-test checkpoint; update it with the next consolidated publication.

## Explicit account presentation mode, 12 October 2026

Prepared opt-in connected account wording with an explicit injected provider requirement. The sample provider cannot enable connected mode. Connected labels, password-manager autocomplete and status messages describe account operations accurately; simulated reset entry remains preview-only. Rendering does not call the provider. The default App stays in sample mode, and no live route or hosted operation is enabled.

Evidence: 520 foundation tests across 73 files pass, including connected configuration refusal, labels and request-free rendering. Type checking and build pass. Connected browser interaction and real-provider acceptance remain open.

Exact next action: verify connected account presentation with a synthetic browser provider, including recovery messaging and cancellation, then reconcile the Memory site. Preserve all activation and spending gates.

## Connected account WebKit evidence, 12 October 2026

The repeatable local WebKit check passed with synthetic account responses: sign-in/sign-out, clearing email and password on sign-out, password clearing after creation, new-password autocomplete, confirmation and non-enumerating recovery messages, absence of the sample reset shortcut, and Google/Apple cancellation with late handoff refusal. Script: apps/foundation/scripts/check-account-browser.cjs; fixture: tests/browser/account.html. Uses the existing loopback-only port 4325 and injected Playwright installation, as documented for the reset browser check. No external provider, email or hosted setting was used.

The last full foundation run remains 520 passing tests across 73 files with type checking and build passing. This browser evidence does not close physical-device, accessibility, live Auth or phase gates. Next: reconcile the private Memory website with current account/browser evidence and audit authorization prerequisites for the remaining backlog.

## Account configuration-change isolation, 12 October 2026

Changing the explicit account provider or connected/sample mode now remounts account presentation and cancels the old flow. This clears old sign-in state and entered details. Local WebKit verified replacement after sign-in clears fields, replacement during Google handoff aborts the old request, and its late reply cannot restore handoff state. Existing synthetic browser account scenarios also pass. All 520 foundation tests, type checking and build pass. No hosted or provider operation was activated.

Exact next action: audit remaining local preparation against Phase 1 and Phase 2 requirements, distinguishing additional implementation from decisions and hosted acceptance. Private Memory remains at the prior 520-test browser checkpoint and will receive this fix in the next consolidated update.

## Current account database rehearsal and next-stage audit, 12 October 2026

Re-ran apps/foundation/scripts/check-refresh-ownership.py against current source. The isolated PostgreSQL rehearsal passed account factory password, Google/Apple, recovery, refresh and sign-out composition, encrypted ownership, concurrency fencing, restart holds, key transition and primary-session cleanup. Provider responses remained synthetic; no hosted data or paid request was used. Disposable rehearsal resources were removed. This supplements the 520-test foundation and desktop WebKit evidence and does not establish hosted acceptance.

The next substantial customer-account stage is gated by the existing local-only exception. Two decisions have been presented to Sabine and remain unanswered: whether recovery must work on another device, and whether hosted Tasks 2b/2c may begin before Phase 1 closes. Do not infer either answer from elapsed time. Phase 1 also needs the pending Tavus technical reply and a newly approved bounded paid-test allowance. Rakuten registration remains deferred until the customer site is live.

Exact next action: incorporate Sabine's recovery and hosted-sequencing answers when received, then prepare the selected recovery contract or hosted database/account setup under that scope. Until then, preserve all current activation and spending gates; no backlog task or phase is marked complete by this audit.

## Approved hosted setup and cross-device recovery, 12 October 2026

Sabine explicitly approved hosted Tasks 2b and 2c before Phase 1 finishes, including applying prepared customer database protections and configuring accounts in the existing AI Stylist Supabase project. This supersedes the previous local-only sequencing boundary for that work. It authorizes no extra spending or paid voice test. Credentials and any new financial or irreversible action retain their gates. Phase 1 and all hosted acceptance checks remain open.

Sabine selected password recovery that works when the emailed link is opened on another device. The existing browser-bound PKCE rehearsal does not satisfy that requirement. Prepare a server-verified cross-device recovery contract using current official Supabase guidance; inspect actual project/email/callback settings before applying changes. Do not present same-browser-only recovery as completed MVP behavior.

Exact next action: inspect the existing AI Stylist Supabase project and current recovery contracts, review the prepared migration chain against hosted state, then implement/configure the approved scope. No hosted change has occurred merely from recording this approval.

## Cross-device transport and hosted preflight, 12 October 2026

The bounded recovery provider transport now supports token-hash verification with a fixed recovery purpose and fixed Supabase destination. Malformed/canceled proofs are refused before fetch. All 522 foundation tests across 73 files, type checking and build pass. This is transport preparation, not a completed cross-device flow. The receiving-browser confirmation, reset-only lifecycle composition, email configuration and real-device acceptance remain to implement.

Read-only hosted inventory confirms the existing AI Stylist project has only the prototype budget table in the inspected app schemas and no tracked customer migrations. Required managed Auth columns match the prepared checks. No customer schema migration, email or provider operation has been activated yet. See docs/cross-device-recovery.md for the selected direction, primary sources and remaining checks. Hosted Tasks 2b/2c are now explicitly authorized before Phase 1 finishes; prior local-only and pending-question statements are historical. Spending limits remain unchanged.

Exact next action: review and apply the customer migration chain to the verified project with post-application privilege checks, and compose cross-device token verification with receiving-browser confirmation and reset-only authority. Credentials/new financial decisions still require Sabine.

## Cross-device reset-only lifecycle, 12 October 2026

The cross-device token provider now uses the same signed identity, recent recovery purpose, current-session check, one-use password operation and independently verified scoped cleanup as the existing PKCE provider. It accepts no requesting-browser verifier and exposes only a reset capability. Ordinary login purpose is refused while cleanup is retained. Malformed proof is rejected before the provider operation. The receiving-browser confirmation and HTTP owner are still to be composed; no live email or customer migration has been activated.

Evidence: 525 foundation tests across 73 files pass; type checking and build pass. Provider replies remain synthetic. Exact next action: compose receiving-browser confirmation with bounded recovery ownership and delivery cleanup, then apply/review the approved hosted migration chain. Hosted setup and cross-device behavior are approved; spending remains unchanged.

## Bounded cross-device recovery ownership, 12 October 2026

Token-hash verification now enters the same bounded recovery owner as PKCE recovery. It preserves four underlying operations, five-minute reset-only grants, one-use password submission, cancellation, late-result cleanup and holds after uncertain cleanup. The server-only token owner accepts no original-browser verifier. It is not an HTTP endpoint; receiving-browser confirmation must authenticate its binding before invoking it. Three focused synthetic checks cover reset-only permission, malformed proof and cancellation with a late capability. All 528 foundation tests across 73 files, type checking and build pass.

Next: implement the receiving-browser landing/confirmation binding and compose delivery cleanup, then review/apply the approved hosted migration chain. Hosted accounts, email configuration and physical-device acceptance remain open; no paid calls or hosted changes occurred.

## Receiving-browser confirmation binding, 12 October 2026

Prepared a server-only confirmation binding for cross-device recovery. Email landing creates an opaque Secure/HttpOnly/SameSite cookie and separate confirmation nonce without verifying provider proof. Explicit same-origin confirmation claims that binding before asynchronous verification. Foreign origins, another browser, duplicate cookies, expired proof, malformed landings and replays are refused. Shutdown cancels active verification. Five focused synthetic checks and the complete 533-test foundation suite across 74 files, type checking and build pass.

This module is not yet mounted or rendered. Next: add the no-store/no-referrer landing page and bounded confirmation HTTP delivery with reset-cookie cleanup, then integrate with the explicit account host. Apply the approved customer migrations with post-application privilege checks. Real email configuration, hosted acceptance and physical-device tests remain open. No paid call or hosted schema change occurred. Private Memory still shows the earlier 522-test checkpoint and needs a consolidated refresh.

## Cross-device confirmation HTTP composition, 12 October 2026

The prepared account composition now optionally includes the email landing page and bounded confirmation POST. The page uses no-store, no-referrer and a script-hash CSP, removes proof from the visible URL, makes no provider call on opening and requires an explicit confirmation click. Verified permission is installed only as a reset cookie; failed delivery or installation retains scoped cleanup. No normal account cookie is issued. The existing Node adapter accepts the exact landing path when explicitly registered. The composition remains dormant with no environment activation.

Evidence: 538 foundation tests across 75 files, type checking and build pass. A synthetic composed journey opens the link without original-device PKCE material, confirms it, changes the password once and cleans reset permission. Four HTTP checks verify page protection, failed-delivery cleanup, malformed input and failed cookie installation. No actual email, hosted route or customer migration is activated.

Exact next action: browser-verify the rendered confirmation journey and refresh the private Memory site, then review/apply the authorized hosted customer migration chain and configure the exact HTTPS recovery origin/email endpoint. Proxy URL redaction, durable abuse controls, hosted provider behavior and physical-device acceptance remain required. Task 2c and Phase 2 remain incomplete.

## HTTPS browser confirmation verification, 12 October 2026

Desktop WebKit passed the rendered confirmation through the actual local Node HTTPS adapter using an ephemeral self-signed certificate and synthetic recovery provider. It verified scanner-safe opening, removal of the proof from the visible URL, CSP-authorized script execution, explicit click, secure HttpOnly reset-only cookie, removal of the confirmation cookie, redirect to the reset-form destination, replay denial and scoped cleanup. The test destination is a placeholder; the React password form and real Supabase email/device journey remain separate acceptance checks. The local server, browser and temporary certificate are closed/removed after the check.

Foundation evidence remains 538 passing tests across 75 files, type checking and build. No hosted account route, email or customer migration has been activated. Next: refresh private Memory, review/apply the authorized hosted migration chain with privilege checks, then configure the exact HTTPS recovery email endpoint and complete hosted account acceptance. No new paid voice allowance exists.

## Hosted database foundation applied, 12 October 2026

Applied migrations 202610110001 and 202610110002 in the verified existing AI Stylist Supabase project under Sabine's hosted Tasks 2b/2c approval. Migration 001 included an additional refusal if the media table already existed. The SQL editor returned Success for each transaction. Live read-only verification returned true for all nine checks: RLS enabled and forced, anonymous access blocked, authenticated direct writes blocked, authenticated owner-read grant, media owner policy, bucket owner policy, private 10 MiB JPEG/PNG/WebP bucket configuration, and existing prototype budget table present. No prototype ledger statement was executed. Source hashes and execution method are recorded in docs/hosted-database-deployment.json. SQL Editor execution is not Supabase CLI migration-history registration.

Remaining: migrations 003 through 020, then complete schema/function/grant checks and live adapter isolation acceptance. This is partial hosted setup, not completion of Task 2b or 2c. Accounts, recovery emails and customer-facing hosted routes remain disabled. Foundation evidence remains 538 tests plus the separate synthetic WebKit HTTPS check; no extra spending or paid voice call occurred.

Exact next action: inspect and apply migration 003 controlled wardrobe, continue the remaining chain sequentially, and verify the resulting functions/privileges. Do not rerun 001/002 blindly. Private Memory still shows the pre-migration recovery checkpoint and needs the hosted receipt in the next consolidated refresh.

## Hosted wardrobe and preferences applied, 12 October 2026

Applied migrations 003 through 006 sequentially in the existing AI Stylist Supabase project. Each transaction returned Success. The created wardrobe functions require explicit save/deletion confirmation and owner/revision checks; no save or deletion function was invoked. Saved preferences validate the approved bounded USD subset and keep a private revision signal. The private log has schema and table access revoked rather than customer grants. Live metadata verification returned 16 checks, all_passed=true: public-table RLS enabled/forced, anonymous table denial, direct-write denial, authenticated owner-select grants, private-schema/log denial, four security-definer functions with empty search_path and correct role grants, and the two SELECT policies.

Source hashes and the verification scope are in docs/hosted-database-deployment.json. This proves installation and privileges, not real customer CRUD isolation or app acceptance. No account, customer record, email or provider call was created. Foundation source is unchanged from the 538-test/WebKit checkpoint.

Exact next action: review/apply migration 007 saved looks, then 008 through 020 in dependency order and verify their privilege contracts. Migrations 001 through 006 are already applied; do not rerun blindly. Task 2b/2c and phase gates remain open. Refresh private Memory with the consolidated hosted receipt after the chain advances.

## Hosted saved looks and photo lifecycle applied, 12 October 2026

Applied migrations 007 through 010 sequentially to the existing AI Stylist Supabase project. Each transaction returned Success. Saved looks and their components have owner SELECT policies, forced RLS and no direct browser writes. Controlled functions require explicit consent/confirmation and expected revisions. Photo staging, commit and final deletion are service-only; deletion claims remain owner-authorized. Enabled triggers prevent references to non-ready images. No save or deletion function was invoked.

Live metadata checks returned 23 checks, all_passed=true, covering table privileges/policies, seven function access/search-path contracts, two enabled triggers, three lifecycle columns and the private guard's denied browser execution. This verifies installation and privileges; live customer CRUD, actual upload/deletion and application isolation acceptance remain pending. The source hashes and scope are recorded in docs/hosted-database-deployment.json. No accounts, customer records, emails or paid provider calls were created.

Exact next action: inspect/apply migration 011 deletion receipts, then 012 through 020 in dependency order and verify the remaining schema/function grants. Migrations 001 through 010 are applied; do not rerun blindly. Task 2b/2c remain incomplete. Private Memory needs the consolidated hosted changes after the chain advances.

## Hosted deletion receipts and retail history applied, 12 October 2026

Applied migrations 011 and 012 sequentially in the verified AI Stylist Supabase project. Each returned Success. Private deletion receipts now support lost-finalization acknowledgment handling and retired-image-ID protection. Retail history stores bounded US/USD historical snapshots through a service-only function, with owner SELECT access and forced RLS. No deletion, snapshot insert, retailer request or customer operation was invoked.

Live metadata verification returned 15 checks, all_passed=true: private receipt direct-access denial for anon/authenticated/service_role, private schema denial, enabled retired-ID trigger and denied browser guard execution, three service-only public function contracts with fixed search paths, retail RLS and direct-access/write denial, owner SELECT grant and policy. This is installation/privilege evidence, not functional customer acceptance. The approved seven-day receipt compaction still requires migration 014 and scheduled host maintenance before activation. Source hashes and scope are recorded in docs/hosted-database-deployment.json.

Exact next action: inspect/apply 013 mixed saved looks and 014 approved receipt retention, then 015 through 020 and complete schema/function verification. Migrations 001 through 012 are applied; do not rerun blindly. Real account/email/retailer activation and all acceptance gates remain open. No extra spending or paid voice call occurred. Refresh private Memory with the consolidated hosted receipt after the chain advances.

## Hosted mixed looks, retention and consultation controls, 12 October 2026

Applied migrations 013 through 016 sequentially in the verified AI Stylist Supabase project. Each returned Success. Mixed saved looks now enforce one owned or retail source per component and same-owner references; the standalone retail writer is revoked from service_role. Approved seven-day receipt expiry and minimal retired IDs are installed, but expiry has not been invoked or scheduled. The single consultation slot and service-only current Auth session lookup are installed without starting any provider work or modifying managed Auth records.

Live read-only verification returned 21 checks, all_passed=true: mixed constraints, cleanup/retired-ID triggers, denied private table/schema access, five service-only function grants and empty search paths, revoked standalone retail writer, receipt age filters and initially free single consultation slot. Source hashes are recorded in docs/hosted-database-deployment.json. This proves installation and privilege metadata, not customer CRUD, sign-in, recovery or concurrent consultation acceptance. Foundation source remains at the 538-test/WebKit checkpoint. No account, email, media deletion or paid provider call occurred.

Exact next action: inspect/apply migration 017 refresh ownership, then 018 through 020 in order and verify service-only grants and private table protections. Migrations 001 through 016 are applied; do not rerun blindly. Schedule bounded receipt maintenance before customer activation. Hosted account configuration, email origin, durable abuse controls, physical-device checks and all remaining phase gates stay open. Private Memory needs the consolidated hosted receipt.

## Full reviewed customer migration chain installed, 12 October 2026

Migrations 017 through 020 are now applied in the verified AI Stylist Supabase project, completing installation of the existing 001 through 020 chain. Migration 017 returned Success separately; 018 through 020 ran in source order in one submission, preserving their individual transactions, and returned Success. The private refresh table stores only bounded encrypted envelopes through service-only lifecycle functions. Managed Auth tables are referenced/read, not altered by these migrations.

Live metadata verification returned 17 checks, all_passed=true: refresh RLS, denied direct table access for anon/authenticated/service_role, two cascading Auth foreign keys, empty refresh table, all nine service-only security-definer functions with empty search_path, expected function count and prototype budget presence. Together with the preceding group checks, this proves installation and access contracts, not live customer isolation, credential rotation or end-to-end account acceptance. No real account, credential, recovery email or provider call was created. Task 2b/2c and phase gates remain incomplete.

Exact next action: refresh the owner-private Memory site with the consolidated hosted deployment receipt; inspect the hosted account/recovery configuration and deployment runbook. Complete live adapter/isolation checks, durable abuse controls and bounded receipt maintenance before customer account activation. Preserve the approved recovery/linking decisions and existing financial limits. Do not rerun the installed migrations blindly; SQL Editor execution is not CLI migration-history registration.

## Consolidated hosted checkpoint published to private Memory, 12 October 2026

The owner-private Memory update succeeded with MCP enabled and its existing one-user/no-group audience unchanged. All 16 site checks and artifact validation passed. Published source a9b2d3a07867a52698b1a5cb71d2c4f43963bcd6; deployment appgdep_6acc87d9a600819187ec3906722f17b2; saved version appgprj_6acbce5b11a88191beb15ff1046a9d3c~appgver_4e85326dbb7c8191b12ec0d200df2e72. The site now includes installation of migrations 001 through 020 and the distinction between metadata checks and customer acceptance. No task was marked complete by publication.

Read-only hosted Auth inspection found Site URL http://localhost:3000, no redirect allowlist entries, built-in email service with a production-use warning, and the reset template still using ConfirmationURL. No setting was changed and no email was sent. The exact customer HTTPS origin and working reset destination must be deployed before changing template/redirect settings; custom SMTP needs a sender service/account and credentials. Next: document the activation sequence and complete the rendered confirmation-to-password-form journey locally, preserving the hosted activation gates.

## Complete rendered reset journey and WebKit origin fix, 12 October 2026

Extended the actual local HTTPS confirmation check to build and serve the real React RecoveryPage and connect its readiness/reset transports to the prepared Node handlers. The earlier placeholder destination is replaced in this synthetic test. Browser evidence now includes scanner-safe opening, explicit confirmation, secure reset-only cookie, readiness, password form submission once, cleared password fields/cookie, disabled replay, unavailable state after refresh and scoped cleanup. Provider verification/password update remain synthetic, not real Supabase or physical iPhone acceptance.

The integration exposed a WebKit behavior: no-referrer on the browser POST produced Origin: null, which the server correctly refused. Fixed the account transport to use same-origin referrer policy with an explicit fixed origin-root referrer. No proof-bearing path/query is sent; exact server Origin checks remain unchanged. The transport test asserts this configuration. All 538 foundation tests across 75 files, type checking, production build and the complete WebKit HTTPS check pass. The first full-suite attempt lacked sandbox loopback permission and was stopped; the authorized rerun passed. Temporary browser/server/cert/build resources were removed.

Exact next action: prepare the explicit customer account host and durable abuse/maintenance wiring before hosted activation; configure exact HTTPS URLs/email only when that destination works. Hosted inventory still has localhost/no redirect allowlist, built-in SMTP and the default ConfirmationURL reset template. Private Memory publishes the complete 20-migration checkpoint; include this rendered-browser fix in its next consolidated update. Task 2c and all phase acceptance gates remain open.
