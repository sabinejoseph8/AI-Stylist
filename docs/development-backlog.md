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

Priority: P0 | Release: R1 | Dependencies: D07,D11,D12,D21,D23 | Status: Not started

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

Priority: P0 | Release: R1 | Dependencies: D04,D21,D23,D30 | Status: Not started

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

Priority: P0 | Release: R1 | Dependencies: D07,D22,D24,D25,D27,D39,D40,D41 | Status: Not started

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
