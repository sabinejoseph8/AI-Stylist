# AI Stylist: Phased development plan and progress

Status: Draft plan v0.8 for Sabine's review  
Updated: 9 October 2026  
Product: [Approved product specification v1.0](../Project%20Memory/product-spec.md)  
Design: [Approved design specification v1.0](../Project%20Memory/design.md)  
Technical decisions and patterns: [tech-spec.md v0.11](../Project%20Memory/tech-spec.md)

## Summary

- **Current focus:** Task 1a planning is complete. Task 1b is approved and in progress. Desktop and physical iPhone generated-reply/avatar audio and mouth movement are confirmed; iPhone explicit Interrupt and end, connection closure and local-device cleanup are confirmed. Continuous conversation, automatic interruption/context handling and precise timing remain open.
- **Completed planning:** Product and design baselines approved; phone website delivery, email/password, Google and Apple sign-in, and Supabase for accounts, saved preferences, wardrobe photos and saved looks approved. Supabase + Render MVP hosting is approved. React + TypeScript and Node.js + TypeScript are approved; volatile notes are accepted for the private prototype only. Remaining implementation proposals and customer MVP recovery stay under review.
- **Provider decision:** ElevenLabs is excluded. OpenAI Realtime and Tavus remain candidates; selected Tavus voice providers and fallbacks must comply with the exclusion.
- **Build status:** 173/173 focused tests, type checking and build pass. The synthetic interruption coordinator now permits recovery only after a matching fresh-session acknowledgment; this is not wired into the hosted spoken page. The approved private Render preview is live. Basic iPhone device and bounded voice checks are accepted; Task 1b and Phase 1 remain incomplete.
- **Device check:** Physical iPhone camera preview, moving microphone meter, manual Stop, two-minute automatic stop and tab-switch cleanup are confirmed. The separate approved phone voice trial confirmed audible avatar reply, mouth movement and explicit interrupt-and-end. Automatic spoken interruption and conversational resume remain pending.
- **Next action:** Verify the bounded automatic-capture and spoken-stop probe on the physical iPhone after a separately reviewed test allowance. All seven approved attempts are consumed and closed; an eighth remains blocked. Then continue streamed response generation and safe conversational resume. The complete hands-free bridge is not yet implemented.
- **Confirmed launch capacity:** One simultaneous consultation, as selected by Sabine on 9 October 2026. Plan for extensibility without implementing unapproved higher capacity.
- **Budget:** Original initial allocation was $25. The two approved reserve transfers changed allocations to OpenAI $14, hosting $7 and reserve $4. Sabine separately approved the additional $10/month AI Stylist Supabase project. Render is on Free ($0/month). Revised ongoing and experiment totals must be reconciled before any additional charges. All seven approved provider attempts are consumed; reservation totals are not actual charges.
- **Critical dependencies:** Voice/avatar integration, notes during speech, checking before recommendation audio, real retailer/affiliate data, customer-data isolation, provider retention, and session recovery. See R01 through R11 in tech-spec.md.
- **Spoken test:** Generated reply/avatar audio and mouth movement are accepted on desktop and physical iPhone. The phone explicit interruption and connection closure passed. The prototype supports two buffered exchanges per bounded room. Precise lip-sync timing, automatic barge-in and conversational resume remain pending. Live notes and looks are not built.
- **Recent changes:** Added guarded context recovery and a bounded streaming microphone component for the next Task 1b integration. Its focused checks cover small PCM frames, native-rate conversion, backpressure, permission races, device loss, page exit and the deadline. The streaming microphone is now used by a separate automatic-capture probe, with pause-triggered submission and spoken interrupt-and-end. Its response generation remains buffered and conversational resume is unimplemented. No new provider attempt or allowance was introduced.
- **Publishing:** Source, tests and project documents are published to the public AI-Stylist repository. The protected Render Free preview deployed successfully from the verified publication commit. Credentials and private ledgers were excluded from GitHub.

## Project memory review, 9 October 2026

Sabine requested "update proj memory." Reviewed every memory location and reconciled the current conversation decisions. This is document maintenance, not a new architecture decision or approval to start Task 1b.

| Memory file | Review outcome |
| --- | --- |
| Project Memory/product-spec.md | Corrected stale technical version and planning statements. All PS-01 through PS-09 requirements and A01 through A21 acceptance scenarios retained; approved v1.0 unchanged. |
| Project Memory/design.md | Reviewed visual tokens, components, screens, accessibility and pending checks. Reconciled approved tools/current stage; approved design v1.0 unchanged. |
| Project Memory/tech-spec.md | Reviewed approved D01 through D13, proposals, system patterns, security/privacy and open R01 through R11. Updated the next-step sequence; v0.9 decisions unchanged. |
| docs/progress.md | Task 1a remains the only completed task group. Task 1b awaits approval; all implementation, automated app tests, manual phone checks and phase reviews remain pending. |
| docs/mvp.md | Checked: not yet created, as scheduled in 1e. Create it from approved scope, success criteria, risks, decisions and actual spike findings in that group. No spike results or MVP baseline approval are invented. |

The interview-notes.md update is saved locally in first person and matches these decisions. The Memory site and local Git checkout have not been established; this review does not claim a remote update, commit or GitHub publication.

## How to use this plan

1. Work in order: 1a, 1b, 1c, then later groups. Source applications may be started early with Sabine's explicit authorization, but completion still follows the dependencies below.
2. At the start of each group, explain the small proposed change in plain words and wait for approval. Approval of a document is not blanket permission for every deployment, purchase or build group.
3. Implement only that group, with its focused tests. Use synthetic fixtures for routine tests. Real provider calls and retailer checks are separate, approved integration checks.
4. Run the phase's cumulative automated suite, then walk Sabine through the numbered manual checks relevant to the group, one step at a time. Record expected versus observed results.
5. A checkbox becomes `[x]` only when its implementation and applicable automated/manual checks pass. If a group cannot yet be checked because of an external dependency, leave it unchecked and explain why.
6. Commit small working changes and push at the end of an approved build group, following AGENTS.md. Do not claim a GitHub update unless it actually succeeds.
7. End each phase with its dedicated code-review group. Use the code-review skill, fix findings, rerun the complete phase suite and recheck affected manual steps. Anything needing a product/technical decision goes to Sabine. If the skill is unavailable, resolve the review method with Sabine before calling the phase complete.
8. Update this Summary, the task evidence, tech-spec.md decisions/patterns, interview-notes.md after significant changes, and docs/mvp.md once created. Tick completed tasks on the Memory site when that site and its access have been established. Until then, record the missing site rather than claim a remote update.

## Test conventions

Keep each test narrow: a small fixture, one behavior, a clear expected result. Examples include “a late $500 event cannot replace the customer's saved $350 edit” and “customer B cannot read customer A's image.” Avoid one enormous conversation test as the only evidence.

Proposed tools are Vitest for domain/adapter tests, Playwright for a few focused browser journeys, and Supabase database tests for schema and access policies. Exact supported versions are pinned when scaffolding is approved. [Vitest guide](https://vitest.dev/guide/), [Playwright practices](https://playwright.dev/docs/best-practices), [Supabase database testing](https://supabase.com/docs/guides/database/testing)

**The Phase 1 command now exists in prototypes/voice-avatar/ for Task 1b only.** Its 135 focused tests cover P1-01/P1-07 and supporting fixtures; P1-02 through P1-06 are not implemented. The later phase commands below remain planned script names. Phase 2 creates the app harness. Each later group adds its tests to the relevant script. The scripts must fail on failed assertions and must not make hidden paid provider calls.

| Phase | Planned cumulative command | Scope |
| --- | --- | --- |
| 1 | `npm run test:phase-1` | Prototype adapter, transcript ordering, timing instrumentation and release-gate fixtures. |
| 2 | `npm run test:phase-2` | App scaffold, account guards and database/Storage isolation. |
| 3 | `npm run test:phase-3` | Phase 2 regressions plus notebook/session contracts. |
| 4 | `npm run test:phase-4` | Earlier regressions plus image/camera state and wardrobe. |
| 5 | `npm run test:phase-5` | Earlier regressions plus catalog, pricing, links and affiliate contracts. |
| 6 | `npm run test:phase-6` | Earlier regressions plus candidate selection, validator and feedback. |
| 7 | `npm run test:phase-7` | Earlier regressions plus saved records, list, export/deletion and retention. |
| 8 | `npm run test:phase-8` | All deterministic regressions plus integrated browser and failure/recovery checks. |

Database commands must point to the local/test project, never production. Browser tests use two isolated synthetic users. OAuth automation uses controlled provider responses; real Google/Apple success remains a separate manual integration check. Fixtures and logs contain no real customer credentials or photos. Passing mocked tests never proves real avatar quality, provider latency, stock, affiliate approval or accessibility on a physical phone.

## Phase 1: Agree decisions and prove the hardest dependencies

**Goal:** Establish a viable technical path before building the full app.  
**Dependencies:** Approved product/design baselines; approval of each discovery group; appropriate provider access and a spending cap before billed calls.  
**Risk coverage:** R01, R02, R03, R05, R07, R08, R09, R10, R11.  
**Status:** In progress: Task 1a planning review complete. Task 1b local implementation is in progress; live media and provider preflight remain pending. Phase 1 is not complete.

### Task groups

- [x] **1a: Agree the bounded discovery plan.** Record the approved core Supabase roles; review optional Edge Function uses, framework/host candidates, preliminary data boundaries, a prototype cost estimate/spending cap and the confirmed one-consultation launch target. Record each accepted or deferred decision in tech-spec.md with date and reason. Document the required provider recording/retention inspection and consent preflight for 1b preparation before any real-person prototype media; use synthetic inputs until those checks are complete. Identify needed account/dashboard actions for Sabine. No paid setup before its authorization.
- [ ] **1b: Prototype voice and avatar.** Create a small isolated harness; prove one voice, a consistent realistic avatar, lip synchronization, interruptions and cancellation. Record the exact working provider contracts or failed assumptions. Verify that actual voice settings and fallbacks comply with the ElevenLabs exclusion, including any automatically assigned Tavus voice provider. Do not change media architecture without Sabine's decision.
- [ ] **1c: Prototype live notes, recommendation gating and live camera.** Feed partial speech into structured notes before turn end; test a voice correction and a late event. Demonstrate that unvalidated products cannot appear or be spoken. Start/stop camera and confirm a still without replacing it from later frames.
- [ ] **1d: Check source access and provider privacy.** Identify approved retailer/affiliate data paths, imagery permissions, USD/US coverage, price/size/delivery evidence and attribution. Inspect provider retention/recording settings before real-person test media. Record gaps and launch blockers; applications/contacting partners need Sabine's authorization.
- [ ] **1e: Review findings and refine the baseline.** Show measurements and tradeoffs to Sabine, update the architecture decision log and risk status, agree remaining performance targets and create docs/mvp.md from approved scope, risks and findings. Record the eventual Memory-site location/access. Do not mark a failed prototype as accepted feasibility.
- [ ] **1f: Review all Phase 1 changes.** Follow the phase review protocol; rerun prototype tests and affected manual checks. Close only when the architecture path and required follow-ups are explicitly accepted.

### Task 1a evidence and review

Sabine authorized proceeding with 1a on 9 October 2026. [Discovery plan and cost worksheet](task-1a-discovery-plan.md) now contains the recommendations, source-backed price assumptions, provider privacy desk review, preliminary data boundaries and account actions. tech-spec.md v0.9 records the approved hosts, budget, tools and private-prototype memory decision, with other implementation settings still pending.

- Documentation checks: reviewed current links, version pointers, retained task groups/acceptance references, proposed-cost arithmetic and approval wording. No app tests were run; there is no app test harness for this documentation group.
- Manual decision review complete: Sabine approved tools and accepted private-prototype-only volatile notes by replying "1a and 2a" on 9 October 2026. Supabase + Render and the $25 cap were already approved. Customer MVP recovery remains a pre-launch review; no account inspection or integration check is claimed.
- Account preflight remains mandatory before any real-person prototype media. Public documentation has been reviewed, but provider account settings, free entitlements and actual retention/voice settings are unverified. This is a checkpoint for 1b preparation and 1d follow-up, not a passed check.
- The $25 allowance is for a small initial feasibility experiment. It does not fund all Phase 1 verification or prove production viability. Extension requires reviewed remaining funds or a new spending decision.

### Task 1b evidence and remaining checks

Sabine authorized Task 1b on 9 October 2026: "proceed with 1b." The isolated prototype is in prototypes/voice-avatar/. [Task 1b evidence and preflight](task-1b-voice-avatar.md) records current provider contracts, exact dependencies, test results and the remaining account/manual steps.

- Local simulation retains captions, silent frames, stale-event rejection and restart notice. Separate --scripted mode connects a fixed OpenAI Realtime clip to a Tavus Audio Echo avatar; microphone/camera remain disabled.
- Automated: 68/68 focused checks, type checking and build pass. These do not cover P1-02 through P1-06 or prove provider quality.
- Desktop repeat: 338 paced chunks; Sabine confirmed hearing the sentence and seeing mouth movement. Provider closure was verified. Exact lip-sync accuracy, speaking/playback correlation and natural conversational latency remain unmeasured.
- Both attempts retain closed reservations totaling $4 and ten minutes. Actual charges/minutes need dashboard reconciliation. An empty Tavus end response caused a false cleanup hold on the first attempt; independent status verification and the parser fix resolved it, with regression coverage.
- Remaining: provider retention/consent before human media, continuous conversation, audible interruption/context reset, physical-phone tests and final feasibility review. Task 1b remains unchecked; no risk closure, deployment or remote publication is claimed.

### Focused automated tests to build

| ID | Small test and expected result |
| --- | --- |
| P1-01 | A mocked interruption cancels queued output and the previous response; old playback acknowledgments cannot restart it. |
| P1-02 | Two partial speech clauses produce structured note changes before a final-turn event. |
| P1-03 | Save budget $350, then deliver an earlier $500 event; active budget remains $350. |
| P1-04 | Block, timeout, malformed check and obsolete version each produce zero recommendation-display or recommendation-speech events. |
| P1-05 | Confirm still A, observe frame B, then stop camera; the notebook reference remains A. |
| P1-06 | Timing records include input, extraction and rendering timestamps; reported p95 is calculated from all eligible samples, not only successful fast ones. Failures are reported separately. |
| P1-07 | Provider policy rejects ElevenLabs as a direct voice/agent dependency, selected Tavus provider or fallback before session creation. Unknown voice-provider configuration is held for review, not accepted as compliant. |

Groups 1a and 1e mainly document decisions; their checks are document consistency and Sabine's review. P1 tests validate prototype logic, while the following real-device checks validate the actual integration.

### Manual verification with Sabine

1. On a phone, start the approved prototype. Verify actual voice provider/configuration against D09, then confirm one realistic female stylist, one audible voice and captions. Speak over her and confirm old speech stops; record quality observations and interruption timing.
2. Say continuously: “An outdoor wedding in November, elegant, emerald green, budget five hundred dollars,” then continue speaking. Confirm notes appear before finishing, with uncertainty labeled. Run enough representative samples to calculate A02's two-second p95; one successful sample is insufficient.
3. Change the budget to $350 by touch and voice. Confirm A03's active-context timing and that delayed events do not restore $500.
4. With a saved exclusion fixture, force a conflicting candidate and a check timeout. Confirm neither the card nor spoken product recommendation is released.
5. Start camera, show a jacket, capture and confirm a still, show something else, then stop camera. Confirm the actual jacket image stays in the notebook. Deny camera access and confirm an upload alternative.
6. Inspect the evidence checklist for one permitted real product source and provider privacy settings. Missing rights, access, price or required availability evidence remain explicit. Agree the unresolved decisions instead of assuming approvals.

**Exit gate:** Sabine accepts a demonstrated media path and its findings. Live-note targets and recommendation gating have evidence; required privacy/source gaps have an agreed resolution plan. No full feature build is unlocked by an unchecked failed dependency.

## Phase 2: Foundation, accounts and customer isolation

**Goal:** A secure signed-in shell with the approved visual language.  
**Dependencies:** Phase 1 exit; framework/hosting and Supabase roles approved; necessary account configuration.  
**Product coverage:** PS-01, PS-09; A18 and foundational A12/A13.  
**Status:** Not started.

### Task groups

- [ ] **2a: Scaffold modules and checks.** Create the approved app/coordinator structure, shared schemas, design tokens, typed configuration, test scripts and continuous checks. Configure development/test separately from production; exclude secrets and private test assets from public GitHub.
- [ ] **2b: Set up persistent data protections.** Add versioned database migrations, owner-scoped policies, private image buckets and controlled mutation interfaces. Reject access from an anonymous or different customer, including direct database/Storage requests.
- [ ] **2c: Build all approved account methods.** Email/password with recovery, Google and Apple sign-in, callback/cancellation states and sign-out. Verify server tokens; resolve identity-linking behavior and provider configuration. Add production email and Apple credential-maintenance tasks.
- [ ] **2d: Review Phase 2.** Review code, rerun the complete suite and affected manual checks; document decisions and fixes before completing the phase.

### Focused automated tests to build

| ID | Small test and expected result |
| --- | --- |
| P2-01 | Unauthenticated session request is denied; a valid signed-in request may proceed. |
| P2-02 | For each personal table, user B's select/insert/update/delete targeting user A is denied, including an attempt to change ownership. |
| P2-03 | A private image cannot be read using another customer's token or an expired signed URL. |
| P2-04 | Canceled/failed provider callback returns to account access without creating a styling session. |
| P2-05 | Sign-out invalidates coordinator access; an old socket or token cannot continue the session. |
| P2-06 | Duplicate or unverified account-linking input cannot merge two customers' saved data. |
| P2-07 | Two simultaneous start requests acquire at most one active consultation lease. A valid reconnect reuses its own lease; expired/ended leases release capacity without allowing stale work. |

### Manual verification with Sabine

1. Create a synthetic email account, confirm access as configured, sign in and use password recovery. Expected: return to the correct account without a required styling questionnaire.
2. Separately try Google and Apple sign-in, cancel each once, then complete each. Expected: correct account access, clear cancellation recovery and no guest styling.
3. Sign out and try to reopen protected data and continue an old session. Expected: sign-in is required.
4. Use a second test customer and try to open the first customer's private record/image using a copied URL. Expected: access is refused.
5. Inspect the phone shell, four navigation destinations, readable text and focus. Expected: approved design tokens and usable account controls.
6. Start a consultation, then attempt another with a different test customer. Expected: only one active consultation, a clear busy/retry message for the second, and availability restored after the first ends.

**Exit gate:** All three real account methods and recovery work in the test environment. Cross-customer access tests pass. No provider credentials or customer assets are committed.

## Phase 3: Session state and live notebook

**Goal:** A notebook that visibly captures, confirms and corrects preferences during speech.  
**Dependencies:** Phase 2; verified partial-transcription contract from Phase 1.  
**Product coverage:** PS-02/03; A01–A03, A08/A09 foundations and A19.  
**Status:** Not started.

### Task groups

- [ ] **3a: Build authoritative session state.** Add typed fields, origin/scope/status, ordered revisions, idempotency, epoch invalidation, expiry and session clearing under the approved retention settings.
- [ ] **3b: Add progressive extraction and edits.** Connect partial input to structured proposals, confirmation/follow-up behavior, touch Save/Cancel and voice corrections. Reconcile late transcript changes without overriding newer explicit edits.
- [ ] **3c: Build notebook and permission alternatives.** Start collapsed, update summary/pending count progressively, preserve expand/collapse choice, support captions/text and restrained accessible announcements. Keep reusable profile saving a separate explicit action.
- [ ] **3d: Review Phase 3.** Review code, rerun the phase suite and manual timing/correction checks.

### Focused automated tests to build

| ID | Small test and expected result |
| --- | --- |
| P3-01 | November creates a month value without inventing a season; an ambiguous currency or budget scope remains To confirm. |
| P3-02 | Partial input updates visible summary before turn completion; missing fields remain Not specified. |
| P3-03 | Touch Cancel changes nothing; Save updates once even if the request is repeated. |
| P3-04 | Older transcript, extraction and second-tab edits cannot overwrite a newer committed field revision. |
| P3-05 | Clear/end removes transient notes and exceptions and cancels outstanding work; delayed results cannot restore them. |
| P3-06 | Saving selected profile preferences stores only those confirmed fields; conversation input alone stores no profile changes. |

### Manual verification with Sabine

1. Start a consultation. Expected: collapsed notebook, no mandatory profile questionnaire and no invented item photo.
2. Speak the wedding example without pausing at each field. Expected: progressively visible summary and correct uncertainty labels, meeting A02 on repeated representative samples.
3. Expand the notebook, edit the amount, Cancel, then Save $350. Expected: Cancel preserves the prior value; Save updates active context within one second.
4. Say a budget correction while another extraction is pending. Expected: understood voice correction applies within two seconds and remains after delayed events.
5. Collapse/reopen, type instead of speaking and clear the session. Expected: state is preserved while active, text works, clear removes session data without deleting saved preferences.
6. Choose which reusable preferences to save, end, then start again. Expected: only explicitly saved fields return; prior notebook notes do not.

**Exit gate:** Notebook and correction requirements pass; no unintended persistent notes; focus and expansion do not jump during updates.

## Phase 4: Item images, live camera and digital wardrobe

**Goal:** Actual customer clothing remains visible and reusable under explicit save controls.  
**Dependencies:** Phase 3; approved media processing/retention limits and camera contract.  
**Product coverage:** PS-04; A04/A05/A14/A20.  
**Status:** Not started.

### Task groups

- [ ] **4a: Upload and confirm actual items.** Preview actual photos before recognition; validate/normalize images, strip location metadata, handle several garments/photos, ownership ambiguity, replace/remove and accessible enlargement.
- [ ] **4b: Integrate live camera and still selection.** Permission/preview/active indicator, stop and fallback, bounded frame processing, voice/touch capture and explicit reference confirmation. Prevent later frames/recognition from replacing the active reference.
- [ ] **4c: Add wardrobe and media lifecycle.** Explicit Save to wardrobe, private images, retrieve/select several items, edit/delete and asset reference accounting. Clearly identify separately saved copies in looks.
- [ ] **4d: Review Phase 4.** Review code, rerun tests and recheck image persistence, privacy and camera failure behavior.

### Focused automated tests to build

| ID | Small test and expected result |
| --- | --- |
| P4-01 | Reference preview renders the actual image before analysis; collapsed notebook shows that image's thumbnail. |
| P4-02 | Confirm reference A, replace with B, then finish A's recognition; active reference stays B. |
| P4-03 | A multi-garment photo is uncertain until selection; a photo does not imply owned status or a retail product match. |
| P4-04 | Camera stop/denial does not clear confirmed reference or other session notes; no frames enter persistent storage. |
| P4-05 | An unsaved session photo creates no wardrobe row; explicit save creates one owner-scoped row with correct actual photo. |
| P4-06 | Deleting/replacing assets respects saved-record references and cleanup without allowing another customer access. |

### Manual verification with Sabine

1. Upload a jacket, enlarge it and collapse the notebook. Expected: real image and thumbnail with garment proportions preserved.
2. Upload a multi-item photo and several images, select a garment and confirm owned/inspiration. Expected: no confident guessing or fabricated product identity.
3. Start camera, capture and confirm a still by touch and voice, show another item and stop. Expected: confirmed still remains; camera indicator stops.
4. Deny camera access and simulate recognition failure. Expected: upload/editable description recovery without losing the existing reference or notes.
5. Save an owned item, end the session and reuse it from Wardrobe; edit/delete it. Expected: explicit saving only, actual image reused, and associated separately saved look copies are explained.

**Exit gate:** Camera works on physical target phones, actual images remain stable, wardrobe is isolated, and session media is not silently saved.

## Phase 5: Real product data and affiliate links

**Goal:** Recommendations can resolve real US products with honest source evidence.  
**Dependencies:** Phase 4; permitted source access and affiliate configuration from Phase 1. Without access, this phase remains incomplete even if fixture tests pass.  
**Product coverage:** PS-05/08; A15–A17.  
**Status:** Not started.

### Task groups

- [ ] **5a: Implement catalog adapter contracts.** Normalize stable product/variant IDs, USD prices, imagery rights, source/retrieval times, availability, sizes and delivery evidence. Add freshness/health policy per source.
- [ ] **5b: Resolve shopping links and estimates.** Source URLs only, owned items excluded, explicit missing prices and unknown shipping/tax, US/USD scope, variant/delivery uncertainty and broken-link recovery.
- [ ] **5c: Add approved affiliate attribution.** Program-specific links and nearby disclosures, non-affiliate distinction, minimal click records and provider-confirmed commission states. No suitability ranking bypass and no retailer cart automation.
- [ ] **5d: Review Phase 5.** Review adapters, source permissions and attribution handling; rerun tests and real-source manual checks.

### Focused automated tests to build

| ID | Small test and expected result |
| --- | --- |
| P5-01 | Catalog IDs resolve to the supplied source URL and variant facts; unknown IDs and invented URLs are rejected. |
| P5-02 | Two retail prices total correctly in integer USD cents; an owned anchor contributes zero purchase cost. |
| P5-03 | A missing required price yields an incomplete estimate, not a complete budget-compliant total. |
| P5-04 | Unknown required size/delivery or stale evidence cannot become verified availability; unsupported currency/country is explicit. |
| P5-05 | Approved affiliate link preserves the program's parameters and shows disclosure; ordinary links do not claim affiliate status. |
| P5-06 | One click does not create earned commission; duplicate provider transaction events do not double-count revenue. |

### Manual verification with Sabine

1. Open selected real US product pages and compare names, garment/variant imagery and available USD prices with the app. Expected: correct source products and dated estimates.
2. Add an owned item, then a product missing a price. Expected: owned cost excluded and incomplete total visibly explained.
3. Test unavailable size, unverified destination and stale source data. Expected: explicit uncertainty or a checked replacement, never invented delivery/stock.
4. Follow an approved affiliate link and a non-affiliate link. Expected: correct destinations and disclosures, with retailer checkout outside the app.
5. Review click versus provider-confirmed commission records with synthetic transaction fixtures. Expected: clicks are not reported as earnings and reversal states remain distinct.

**Exit gate:** Launch sourcing and affiliate approvals are evidenced, with usable links and permitted images. Sample/synthetic products cannot close this phase.

## Phase 6: One look, independent checking and feedback

**Goal:** Every look and revision follows the customer's current confirmed requirements.  
**Dependencies:** Phases 3–5; proven audio/display gate and approved validator settings.  
**Product coverage:** PS-05/06/07; A06–A09 and A11.  
**Status:** Not started.

### Task groups

- [ ] **6a: Build one candidate and its collage.** Select real catalog IDs plus owned references, preserve source imagery/arrangement, explain suitability and estimate costs. No unvalidated candidate in recommendation UI.
- [ ] **6b: Implement independent validation.** Separate deterministic hard checks and semantic evaluation, unknown/blocked outcomes, scoped saved/session requirements and explicit session exceptions. Version-bound release controls both card and recommendation speech.
- [ ] **6c: Add feedback and kept items.** Capture Likes, Dislikes, Requested changes and Items to keep by voice/touch/text; target item versus attribute and clarify ambiguity. Preserve anchor and kept pieces through repeated changes.
- [ ] **6d: Add comparison, undo and recovery.** At least three rounds, earlier-look comparison, revalidation on restore, bounded attempts and clear no-match/timeout states. Cancel stale work on any relevant change.
- [ ] **6e: Review Phase 6.** Review race handling, privacy boundaries, evaluator failures and audio gating; rerun tests and conflicting-look manual checks.

### Focused automated tests to build

| ID | Small test and expected result |
| --- | --- |
| P6-01 | Known high heels violate a saved no-high-heels requirement and produce no release event. |
| P6-02 | Over-budget, missing kept/owned item, unknown required fact and semantic uncertainty each block or request clarification as appropriate. |
| P6-03 | An AI pass cannot override a deterministic failure; timeout/refusal/malformed output never passes. |
| P6-04 | Change budget/profile/reference while checking; old result and old speech authorization cannot release the candidate, including a second-tab profile update. |
| P6-05 | A visible confirmed session exception affects this session only; profile changes require explicit save. |
| P6-06 | Keep dress and bag, change shoes three times; kept IDs and anchor remain, totals refresh and item-scoped dislikes do not become global exclusions. |
| P6-07 | Undo restores the previous feedback state, then rechecks the look before treating it as current. |
| P6-08 | The approved attempt limit stops regeneration and explains an unmet requirement without silently relaxing it. |

### Manual verification with Sabine

1. Ask for a look using an owned jacket. Expected: one coordinated collage, real item details/links, owned label and dated estimate.
2. Ask for an item conflicting with a saved exclusion. Expected: no contradictory card or spoken recommendation; a focused clarification instead.
3. Confirm a session-only exception. Expected: visible notebook label and no automatic profile change.
4. Keep the dress and bag, replace the shoes, and repeat three times. Expected: notebook feedback, retained pieces and clear change summaries.
5. Change budget while a candidate is being checked. Expected: obsolete result held; previous look marked for recheck and current actions disabled where necessary.
6. Compare and undo, then restore an earlier look. Expected: understandable comparisons and fresh current-requirement checks.
7. Force unavailable validator/no suitable catalog match. Expected: useful feedback remains, bounded retries and an explanation; no unchecked recommendation.

**Exit gate:** Hard contradictions and stale versions are held before card/audio release. Subjective compatibility evaluation has an agreed regression set and uncertainty policy. Repeated refinement works without dropping requirements.

## Phase 7: Saved looks, shopping list and privacy controls

**Goal:** Persistent data contains only what customers explicitly chose to save.  
**Dependencies:** Phase 6; approved retention and export/deletion settings.  
**Product coverage:** PS-08/09; A10/A13/A20/A21.  
**Status:** Not started.

### Task groups

- [ ] **7a: Save and reopen look-only records.** Whitelist arrangement, component items, links, permitted visual assets and dated estimate. Exclude notebook, feedback, transcript and session revision history; reopen with fresh checks and no restored brief.
- [ ] **7b: Add shopping list controls.** Explicit shoppable-item additions, checks before addition/current reuse, no owned products, refresh/removal/unavailable states and external retailer actions.
- [ ] **7c: Complete export, clear and deletion.** Separate data-type controls, scoped exports, cancellation and late-job safety, database/media/reference cleanup and retryable provider cleanup with honest limitations.
- [ ] **7d: Implement approved retention and diagnostics.** Session expiry warnings, disconnect grace, cleanup jobs where agreed, minimal validation reason codes and metrics, no raw input in logs or crash reports.
- [ ] **7e: Review Phase 7.** Review persistence projections and deletion races, rerun tests and inspect stored records with synthetic data.

### Focused automated tests to build

| ID | Small test and expected result |
| --- | --- |
| P7-01 | Save look rejects notebook/feedback/history fields and persists only the allowed look projection. |
| P7-02 | Reopen preserves saved arrangement/items but creates no old notebook values; a new check uses current requirements. |
| P7-03 | A stale, owned or unvalidated list addition is rejected; a repeated valid action creates one entry. |
| P7-04 | Save look does not create wardrobe rows or change saved preferences. |
| P7-05 | Clear/end invalidates pending jobs; a late upload/response cannot recreate deleted transient state. |
| P7-06 | Account deletion removes owned rows and appropriate private assets; a failed cleanup remains retryable without storing the deleted payload. |
| P7-07 | Export is owner-scoped; logs contain no photo, transcript, preference values, account email or credential; agreed expiry removes transient buffers. |

### Manual verification with Sabine

1. Save a look, end the conversation, then reopen it. Expected: arrangement/items/dated estimate available, fresh preference check and an empty new notebook rather than old feedback/history.
2. Inspect profile and wardrobe after Save look. Expected: no automatic profile or wardrobe entry; separately saved look imagery is explained.
3. Add a retail product to the list, attempt to add an owned piece, remove one entry and open retailer checkout. Expected: explicit checked addition, owned exclusion and no automatic cart/purchase.
4. Clear notes while a response is pending. Expected: no late data reappears and separately saved records remain under their own controls.
5. Export a test account and compare its saved data and any current-session export. Expected: only authorized data, no other account data, and no discarded session history falsely claimed as recoverable.
6. Delete a wardrobe item, look, then a test account. Expected: affected copies/references are clear, cleanup tracked and inaccessible afterward; backup/provider limits honestly explained.
7. Disconnect and wait through the agreed grace/idle windows, then restart the coordinator. Expected: accurate recovery/expiry messages, no fabricated restored notebook and no raw session content in operational logs.

**Exit gate:** All explicit-save boundaries are proven through stored-record inspection and tests; customer controls and cleanup work without silent retention or recreation.

## Phase 8: Full consultation, accessibility and release readiness

**Goal:** A working end-to-end phone experience that meets all 21 product acceptance scenarios.  
**Dependencies:** Phases 1–7; technical baseline approval, real source access, provider privacy agreement, host/domain configuration and agreed operating/spending limits.  
**Product coverage:** A01–A21, with emphasis on A11/A12 and integrated timing/recovery.  
**Status:** Not started.

### Task groups

- [ ] **8a: Connect the proved media adapter to the complete app.** Authenticated private room, captions, interruption, notebook updates, camera and checked look speech; one authoritative session and no double audio.
- [ ] **8b: Complete accessibility and responsive behavior.** Keyboard/switch, VoiceOver/TalkBack, touch/text equivalence, focus, contrast, large text, 44 by 44 CSS pixel targets and reduced motion across the full journey.
- [ ] **8c: Validate failures, capacity and cost.** Real phones/networks, authentication expiry, provider/feed outage, reconnect/restart, agreed simultaneous load and measured session cost. No bypass to achieve timing; add shared expiring state only if separately approved and required by evidence.
- [ ] **8d: Prepare test deployment and operations.** Secure host configuration, HTTPS/callback allowlists, migrations, redacted monitoring, bounded durable cleanup jobs, backup/restore rehearsal with synthetic saved data, credential rotation, incident steps and rollback. No automatic public release.
- [ ] **8e: Review all Phase 8 changes and final regressions.** Run code review, fix findings, rerun the complete suite and all affected manual acceptance checks; do not call the phase complete with critical unresolved findings.
- [ ] **8f: Sabine verifies and approves launch.** Review results against A01–A21, remaining risks, measured cost and provider/affiliate status. Launch only after this explicit approval and record the actual deployed version and links.

### Focused automated tests to build

| ID | Small test and expected result |
| --- | --- |
| P8-01 | Signed-in fixture journey updates notes, supplies reference, receives one checked look, refines, saves look and shops the matching source URL. |
| P8-02 | Interrupt/end/sign-out cancel active media and candidate work; stale speech cannot resume. |
| P8-03 | Simulated media/feed/model/validator failures follow the correct recovery path without recommendation release on failed checks. |
| P8-04 | Keyboard focus order/return and semantic status labels remain usable as notes and looks update; reduced motion is respected. |
| P8-05 | The approved one-consultation limit rejects a second active consultation safely, keeps customers isolated and emits redacted health/timing metrics. Reconnect/expiry does not leak a slot or release stale work. |
| P8-06 | Production build contains no secret credentials; unauthorized origins, expired tokens, forged callbacks and disallowed outbound URLs are rejected. |
| P8-07 | A clean test database migrates correctly; restore of synthetic saved data succeeds; rollback compatibility preserves explicitly saved records. |

### Manual verification with Sabine

1. Complete a first consultation on a physical iPhone, including each sign-in option in separate test runs, voice/captions and the notebook. Expected: no questionnaire gate and measured A02/A03 performance.
2. Show clothing live, confirm a still, generate one checked look, keep items and refine three times. Expected: actual reference retained, clear feedback and no contradictions.
3. Save/reopen a look, retrieve wardrobe, use the shopping list and follow real US product links. Expected: correct storage boundaries, current checks, USD estimate and affiliate disclosure.
4. Repeat the core journey through text/touch, VoiceOver on iPhone, TalkBack on Android, keyboard/switch and enlarged text. Expected: no essential voice-only action, clipped critical text or unexpected focus movement.
5. Deny permissions, interrupt, lose network, background the phone, expire authentication and simulate service outage. Expected: accurate states and recovery without lost saved records or unchecked suggestions.
6. Review load/cost measurements, privacy/export/deletion, permitted sources, retention settings and test restore/rollback evidence. Expected: all critical gates closed, limits understood and no unapproved paid/public launch.

**Exit gate:** All A01–A21 have automated and/or manual evidence appropriate to the requirement. Real-media, source, privacy and accessibility checks pass. Critical findings are resolved; Sabine approves the launch and its costs.

## Known issues and unresolved decisions

| Item | Current state | Owner/next checkpoint |
| --- | --- | --- |
| Core Supabase roles | Accounts, saved preferences, wardrobe photos and saved looks approved | Implementer records setup/security evidence in Phase 2; no setup is completed yet. |
| MVP hosting | Supabase + Render approved on 9 October 2026; Render website and conversation service, Supabase accounts/data/photos | Verify actual Pro project costs and Render settings before billed setup; implementation evidence still required. |
| Framework/runtime | React + TypeScript website and Node.js + TypeScript service approved on 9 October 2026 | Pin supported versions and review exact dependencies in the approved prototype/scaffold groups. |
| Optional Supabase uses and operational settings | Remain proposed, not approved | Review before use in the relevant prototype group and baseline review 1e. |
| Prototype budget | $25 initial-experiment limit approved on 9 October 2026; expanded and production budgets unapproved | Verify account entitlements and stopping controls before billed calls. Review remaining implementation settings before use in the relevant groups. |
| First-launch simultaneous load | One consultation approved | Implementer adds atomic slot/lease in Phase 2 and checks it in Phase 8. |
| OpenAI/Tavus speech bridge and interruption control | Unproven | Implementer, 1b; Sabine reviews findings. |
| ElevenLabs exclusion / actual Tavus voice provider | Exclusion approved; selected voice path compliance needs proof | Implementer, 1b/8a; do not add an excluded provider or unverified fallback. |
| Before-turn notes and before-speech preference gate | Unproven | Implementer, 1c. |
| Real catalog/affiliate program access | No access or approval assumed | Sabine for application/account actions, implementer for technical review, 1d/Phase 5. |
| Provider retention and optional recordings | Desk review prepared; actual account controls and API-specific Tavus retention unverified | Sabine and implementer, 1d; before real customer media. |
| Volatile session restart tradeoff and exact retention limits | Restart loss accepted for the private prototype only; customer MVP recovery and exact retention settings remain pending | Demonstrate prototype behavior; review recovery in 1e/7d and before customer launch. |
| Code-review skill and Memory-site access | Availability/site not established | Resolve review method before first phase completion; establish site in 1e. |
| Local Git checkout and connection to AI-Stylist repository | Not established by this planning task | 2a, before build-group commits and pushes. |
| docs/mvp.md | Planned, not yet created | 1e from approved decisions and spike results. |

## Evidence log

Add entries as work happens. Do not replace planned checks with “looks good.”

| Date | Group/test ID | Version/commit | Environment/device | Expected and observed result | Status and next action |
| --- | --- | --- | --- | --- | --- |
| 9 October 2026 | Planning only | Documents v0.4/v0.1 | Local documents | Technical decision/pattern proposal and phased plan prepared. No application build or test execution. | Awaiting review and Phase 1a approval. |
| 9 October 2026 | 1a preparation | Technical v0.7 / progress v0.4 / discovery plan | Official documentation and local Markdown | Cost arithmetic and recommendation/privacy boundaries reviewed. Actual account settings and provider integration unverified; no app tests or billed calls. | Task 1a in progress; Sabine decision review pending. |
| 9 October 2026 | 1a decision review | Technical v0.9 / progress v0.6 | Local documents and Sabine approval | Tool and private-prototype memory approvals recorded; document links, task/acceptance retention and decision status checked. No app tests or provider checks executed. | Task 1a planning complete; 1b awaits group approval. Memory site unavailable; Git publication not performed. |
| 9 October 2026 | Project memory maintenance | Product/design v1.0 / technical v0.9 / progress v0.6 | Local Markdown | Reviewed all five memory locations, reconciled latest approvals/status and corrected stale references. Documentation consistency checked; no application tests or provider verification. | Task 1b still awaits approval; docs/mvp.md remains planned for 1e. |

## Change record

- 9 October 2026: Created progress.md v0.1 with eight phases, sequential task groups, small focused automated checks, numbered manual verification steps, dependency gates, phase code reviews and evidence tracking. No implementation task is marked complete.

- 9 October 2026: Incorporated Sabine's clarifying answers: budget not yet known, and one simultaneous consultation for first launch. Added the cost-estimate checkpoint and explicit capacity lease tests.

- 9 October 2026: Sabine approved the core Supabase roles for accounts, saved preferences, wardrobe photos and saved looks. Updated plan status to v0.2 and technical pointer to v0.5. Group 1a and all implementation groups remain unchecked because their other decisions and checks are not complete.

- 9 October 2026: Recorded ElevenLabs exclusion, added provider-policy test P1-07 and actual Tavus voice/fallback verification, and updated technical pointer to v0.6. Progress plan is v0.3; no implementation group was completed.

- 9 October 2026: Started Task 1a after Sabine's authorization. Updated progress to v0.4 and technical pointer to v0.7; linked the prepared discovery/cost proposal and recorded pending manual decision review. Kept 1a and all build groups unchecked. No app tests, purchases, account setup or GitHub publication occurred.

- 9 October 2026: Recorded approval of the $25 initial-experiment limit. Task 1a remains unchecked pending technology and experimental memory review; Task 1b has not started. No app tests, payments or provider setup occurred.

- 9 October 2026: Recorded Supabase + Render MVP hosting approval, updated plan to v0.5 and current technical pointer to v0.8. Existing Supabase Pro is reported, not account-verified. Remaining framework/runtime and experimental memory review keep 1a unchecked; 1b has not started. No app tests, purchase, deployment or publication occurred.

- 9 October 2026: Sabine selected 1a and 2a for tools and private-prototype restart behavior. Updated progress to v0.6 and technical pointer to v0.9; completed planning group 1a after document checks and recorded manual decision review. All build groups remain unchecked; provider preflight, MVP recovery, Memory-site setup and publication remain outstanding in their designated checkpoints.

- 9 October 2026, project memory review: Reviewed all five required locations, recorded the missing docs/mvp.md as planned for 1e, corrected stale planning/version text in specifications and confirmed the updated interview story. Task and phase completion status, approved decisions and spending limits are unchanged. Progress version remains v0.6 for this maintenance-only update.

- 9 October 2026, Task 1b provider setup: Both private keys passed read-only authentication checks. OpenAI Realtime model listing succeeded, optional data sharing was disabled when inspected, and the separate prototype project has an enforced $8 monthly limit. Corrected synthetic stream-completion ordering and repaired copied dependency launchers using the existing lockfile. The focused suite now passes 43/43; type checking and build pass. No live media call, phone acceptance, risk closure or Task 1b completion is claimed.

- 9 October 2026, scripted Task 1b probe: Updated progress to v0.8 and technical pointer to v0.11. Recorded two bounded provider attempts, Sabine's successful repeat observation, verified closures, retained reservations and empty-response cleanup fix. 68 focused tests/typecheck/build pass. Natural conversation, exact playback position, privacy/consent, billing reconciliation and phone acceptance remain pending.

- 9 October 2026, usage follow-up: Tavus dashboard displayed Free and 1.9 of 20 CVI minutes used after the two scripted attempts. Conservative reservations remain unchanged. No new media call or payment action; OpenAI billing reconciliation and privacy preflight remain pending.

- 9 October 2026, usage/privacy inspection: OpenAI prototype spend $0.02, credit $4.98, auto-reload off and $8 project limit enforced. Optional sharing disabled; Standard Retention applies. Tavus 1.9/20 minutes and both rooms ended. Documented unresolved Free Audio Echo retention/training/deletion/processor questions and a draft support request, not sent. Human media remains held under the agreed preflight; no settings or implementation changed.

- 9 October 2026, authorized Tavus contact: Sabine approved sending the prepared privacy questions. The Tavus form showed Sending and then closed without a displayed error. No ticket number or delivery receipt appeared. Saved submission evidence and the exact question, without account email or secrets. Await provider response; do not duplicate the request. Task 1b and privacy gate remain open.

## Spoken attempt follow-up, 9 October 2026

The fifth, specifically approved spoken attempt connected to the stock avatar, then stopped at Exchange 0 before a human spoken turn was observed. Read-only ledger inspection now shows five closed reservations, none unresolved, $10 and twenty-five minutes conservatively reserved. Closure is recorded only after the existing end-and-status verification. Reservations are not actual charges. Current dashboards show Tavus Free 3.2/20 CVI minutes and OpenAI AI Stylist Prototype $0.03 across three requests for Last 7 days; rounded figures may lag. The exact reason for the fifth stop was not captured and is not inferred.

The spoken test now explains the avatar location, Talk/Send steps, tab visibility requirement and automatic room limit before Start. It shows remaining room time while active. Future server automatic stops distinguish the approximately 85-second local cutoff from a lost heartbeat; leaving the tab shows an explicit local stop message. The 90-second provider limit, immediate stop on hidden tab, microphone privacy, retained reservations and sixth-attempt block are unchanged. No extra attempt, provider call, account funding or upgrade was performed during this follow-up.

120/120 synthetic/mocked tests, type checking and build pass. This includes separate heartbeat-loss and room-expiry checks with verified cleanup. Human spoken acceptance, interruption during a reply and physical-phone checks remain pending; Task 1b stays unchecked. A further attempt requires an explicit allowance amendment after this usage review.

## Approved reserve-funded spoken test, 9 October 2026

Sabine approved exactly one further spoken test capped at $2 and five avatar minutes, moving $2 from the $8 reserve to the OpenAI allocation. Overall initial budget stays $25: OpenAI allocation $12, hosting $7, reserve $6. This does not change account spend settings, fund an account or upgrade a plan. Actual OpenAI project stopping controls remain in place and may stop work before the allocation is spent.

Applied a separate durable reserve-transfer amendment only after all five previous attempts were closed. All five prior records remain unchanged. One sixth spoken attempt is available; scripted tests remain exhausted, a seventh attempt is refused and cleanup holds still block new use. No provider call or reservation was created by applying the amendment. The test must be started by Sabine when she is ready at the visible spoken page, to avoid consuming room time while she locates it.

124/124 synthetic/mocked checks, type checking and build pass, including preservation of earlier records, refusal of early/altered transfers, exclusion of scripted use and the seventh-attempt cap. Human spoken acceptance and Task 1b completion remain pending.

## Actual spoken test evidence, 9 October 2026

The sixth approved test reached Exchange 2 of 2. The notebook displayed a generated response acknowledging a structured look and asking which sleeve length the customer preferred. Sabine explicitly confirmed hearing the reply and seeing the avatar mouth move. This is actual private microphone-to-generated-reply/avatar evidence, not a synthetic test. It does not establish precise lip-sync timing, full conversation quality, phone acceptance or interruption during playback.

The browser then displayed: the test time limit was reached and provider connection closure was checked. The final spoken reply was not explicitly confirmed through the page button before expiry; verbal acceptance is recorded separately. No third exchange is available, and no seventh attempt is approved. Further guidance must not invite another spoken turn in this ended room. Local ledger inspection confirmed six reservations, all closed. Task 1b remains in progress pending remaining manual checks.

## Approved durable prototype ledger preparation

Sabine explicitly approved Supabase for preserving the private prototype's spending/test-limit records across Render restarts. This approves that additional role only, not storing human audio or transcripts, starting another provider test, funding, plan upgrades or a public launch.

Prepared src/supabase-budget.ts as a server-only adapter and supabase/prototype-budget.sql as an unapplied migration. The adapter validates the existing ledger schema, allows only HTTPS Supabase project destinations, bounds request time, refuses redirects, sanitizes failures and makes no automatic retry, seed or local fallback. Writes compare the complete prior ledger under a database row lock. The migration enables RLS, revokes direct table access and limits function execution to the service role. Allowance changes through the hosted adapter are refused. Validation accepts JSON field reordering without relaxing approved amounts.

129/129 synthetic/mocked checks, type checking and build pass. These checks do not prove the SQL runs on Supabase or its live access policies. No Supabase project was selected, no migration applied, no ledger imported and no hosted adapter activated. The existing local server still uses its file ledger. The six closed reservations remain unchanged and no seventh test is approved. Remote private access, production origin/port configuration, durable ledger import/verification, restart/concurrency checks and deployment remain pending. Confirm the dedicated AI Stylist Supabase project before database actions.

Sources reviewed: https://supabase.com/docs/guides/database/functions and https://supabase.com/docs/guides/database/postgres/row-level-security.

## Approved new Supabase project cost

After being told that a new project in her Pro organization adds $10/month, Sabine explicitly said "Create it." This authorizes one AI Stylist project at that displayed recurring charge as a specific exception to the earlier $7 hosting allowance. It does not approve other hosting charges, plan upgrades or another provider attempt. Reconcile the total revised ongoing/experiment budget before any additional charges; do not keep claiming the original $25 ceiling covers all revised allocations.

Prepared the new-project form with name AI Stylist, Micro compute, Americas region, Data API enabled, automatic table exposure disabled and automatic RLS enabled. No project was submitted or created yet. Database password entry and final creation are handed to Sabine because they involve a new credential. Do not read, save, print or echo her database password in chat or project documents. The unrelated existing project remains unchanged.

## AI Stylist Supabase project and live storage verification

Sabine completed project creation herself. The dashboard verifies AI Stylist, Healthy, Micro, West US (Oregon), with no GitHub repository connected. The authorized prototype-budget migration was executed in this project through its SQL editor and returned Success. No other project was modified.

Live privilege checks returned true for RLS enabled, anonymous and authenticated direct-table access blocked, anonymous read-function access blocked, authenticated write-function access blocked, and service-role read/write-function access allowed. The table currently has zero ledger rows: all six existing private reservations still need import, and no reservation was reset or initialized remotely. This verifies schema/privileges only, not the REST adapter, concurrent updates or restart behavior. No provider room/test was started.

Next dependency is a server-only Supabase key saved privately, followed by importing and comparing the existing ledger, live adapter checks, a private remote-access gate and Render configuration. Never paste keys in chat or publish them to GitHub. The optional Supabase ledger role and one project at the displayed $10/month were approved; no seventh provider attempt or further charge is approved.

## Private server-key handoff completed

Sabine could not paste the copied key and explicitly authorized direct transfer into the private configuration file without displaying it. The existing Supabase server key was copied from AI Stylist's Secret keys control and saved to the ignored owner-only prototypes/voice-avatar/.env.supabase file. A private temporary transfer file was removed. No credential value is recorded in documentation or chat.

A bounded, redirect-refusing REST call with the saved key reached the authorized ledger read function and returned PostgreSQL P0002 (no row), consistent with the verified empty ledger table. This confirms authenticated reachability only; import and successful adapter reading are still pending. No ledger was seeded, attempt approved or media/provider call started. Do not confuse the expected missing-row response with a completed durable migration of the six prior reservations.

## Durable history import and private phone preview preparation

Imported the existing six closed reservations into the approved AI Stylist Supabase project using a one-time function that cannot overwrite its singleton row. Compared the full imported ledger with the private original using deep equality; all records and approval metadata match. A new adapter instance read the same state, and reserve('spoken') was rejected at the six-attempt cap before provider work. The import function's execution was then revoked from service_role as well as public/anon/authenticated; a live query returned six historical attempts, six closed attempts and importer_disabled=true. No seventh reservation or media/provider request was made.

Prepared a Render Free private-preview configuration, pinned Node 24.20.0, manual deploys, health check and explicit --preview --spoken startup. Preview mode requires a valid HTTPS onrender.com origin and a strong password, gates both pages and APIs with HTTP Basic access, issues a Secure HttpOnly SameSite owner cookie only after authentication, validates exact Host/Origin and limits failed password guesses with bounded memory. It uses Supabase for the existing ledger with no file fallback or automatic seeding. Local mode remains loopback-only. A detected server replacement stops local media and clears transient conversation context. This is private-prototype access, not the customer account system.

135/135 focused synthetic/mocked checks, type checking and build pass. Render/iPhone operation is unverified; deployment and phone permission/playback checks remain pending. Render-generated password format and nested root-directory settings were checked against https://render.com/docs/blueprint-spec and Node selection against https://render.com/docs/node-version. The GitHub repository was cloned read-only for preparation; the local primary folder is not a Git checkout and GitHub CLI is not authenticated. No code was pushed, Render service created, secret uploaded to Render or additional charge accepted. A GitHub publishing connection is the next dependency.

## GitHub publishing connection verified

Sabine completed GitHub permission review and password confirmation. GitHub CLI authentication succeeded for the repository owner. The prepared publication contains source, tests and project documents only; the credential scan found no private keys or test ledgers. Task 1b remains in progress, with no additional provider attempt or Render secret transfer approved by this connection.

Published the prepared source, tests and project documents to the existing public AI-Stylist repository after Sabine completed authorization. Private configuration, credentials, media and lifetime test ledgers were excluded. Render deployment and physical-phone acceptance remain pending; the six-attempt cap is unchanged.

## Render private configuration handoff

Sabine explicitly approved sending the existing OpenAI, Tavus and Supabase API keys to Render private server settings. Imported only those keys, the Supabase project URL and pinned Node version into the new-service form. The form targets the public AI-Stylist repository, main branch, prototypes/voice-avatar, Node, Oregon, Free ($0/month), manual deploys and /healthz. No service has been submitted yet. PREVIEW_PASSWORD is prepared with an empty value for Sabine to generate herself. Key values are masked and are not included in screenshots or project files. The six-attempt cap remains unchanged.

## Live Render preview verification, 9 October 2026

Sabine submitted the prepared service after generating the preview password. Render reports Deploy succeeded | Live on its Free instance, using pinned Node 24.20.0 and the prepared --preview --spoken startup. A read-only HTTPS request without credentials received HTTP 401 and the expected Basic password challenge. The health endpoint returned {ok:true}. Startup succeeded with the Supabase ledger adapter enabled. These checks do not prove authenticated browser operation, physical iPhone permissions/playback or a new voice conversation. No provider test was started and Task 1b remains unchecked.

## iPhone microphone-meter follow-up

Sabine reported seeing the camera but no microphone-meter movement, first in the app browser and then in Safari. Her screenshot shows the check in its On state, so permission/startup completion alone is not microphone acceptance. Prepared a compatibility change: create/resume Web Audio in the original button gesture, connect the analyser through a zero-gain output, show numeric level and separate paused-input/paused-processing/no-signal states, and offer an explicit Resume microphone meter button. Media stays local, with no recording or provider transport. Existing 135 tests, type checking and build pass; these tests do not establish Safari meter behavior. Physical iPhone recheck is pending. This is a plausible compatibility fix, not a confirmed root cause. Apple Web Audio documentation demonstrates analyser-to-output graphs: https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/Using_HTML5_Audio_Video/PlayingandSynthesizingSounds/PlayingandSynthesizingSounds.html.

## Physical iPhone meter confirmation

Render deployed the microphone-meter compatibility update successfully. After refreshing the page in iPhone Safari and starting the device check, Sabine answered Yes when asked whether the numeric microphone level rises above 0% while speaking. Her earlier camera preview confirmation and this microphone-meter confirmation establish these two private device checks on her iPhone. Manual Stop and two-minute cleanup on iPhone, avatar playback, interruptions and full phone conversation remain unverified. No provider call was started, no additional allowance was approved, and Task 1b remains unchecked.

## Physical iPhone device cleanup confirmed

Sabine confirmed that pressing Stop removes the camera preview and changes the status to Off. She then restarted the check, left it open, and reported that both devices automatically turned off with the message “Two-minute check finished.” Camera preview, microphone-meter movement, manual Stop and the two-minute automatic stop are now confirmed on her physical iPhone. Phone tab-switch cleanup, avatar playback, interruption and conversation acceptance remain pending. This device check sent no media to Tavus or OpenAI and did not use another provider attempt. Task 1b remains unchecked.

## Physical iPhone tab-switch cleanup confirmed

Sabine confirmed that switching to another Safari tab stops the device check and shows “Stopped because you left this page” with the camera off. All planned local-only iPhone device checks now have human confirmation. Phone avatar playback and interrupt-and-end acceptance remain pending; automatic conversational barge-in is not implemented. No additional provider test was started or approved. Private provider account telemetry is omitted from this public update. Task 1b remains unchecked.

## Approved single iPhone voice trial

Sabine explicitly approved one additional private iPhone voice test after the completed device checks and a private usage review. The separate phoneTrial amendment permits only one additional spoken reservation, preserves prior approvals and all six closed records, retains the bounded two-exchange room and blocks an eighth attempt. The hosted application cannot grant its own allowance amendment.

138 focused tests, type checking and build pass. Applied the restricted transactional Supabase amendment, verified full historical deep equality, and confirmed the database rejects an eighth-attempt write with state unchanged. RLS remains enabled and function access remains service-role only. An initial SQL syntax error was corrected before successful execution; the transaction prevented a partial amendment. No new reservation or provider request was created by setup. Phone playback and interrupt-and-end acceptance remain pending, and Task 1b is unchecked. Private usage/spend telemetry is excluded from this public record.

## iPhone interrupt-and-end result

The approved phone-trial deployment succeeded. Sabine reported that pressing Interrupt and end stopped the avatar sound and the page confirmed connection closure. A private durable-ledger read verified the latest trial is closed, no reservations remain unresolved, and the next unapproved attempt is rejected before provider work. No additional attempt was created during verification. This confirms the explicit interrupt-and-end control on her physical iPhone, not automatic conversational barge-in or resume. Separate confirmation of audible reply and visible mouth movement before interruption is pending. Task 1b remains unchecked.

## iPhone avatar audio and mouth movement confirmed

Sabine explicitly confirmed hearing the generated reply and seeing the avatar mouth move on her iPhone before pressing Interrupt and end. Together with her preceding interruption and closure confirmation, this establishes basic phone microphone-to-reply/avatar playback and explicit end control. Local phone camera/meter and cleanup checks also passed. It does not establish precise lip synchronization, response latency, repeated natural interruptions, automatic barge-in or resuming a conversation. All approved attempts are consumed and closed; further provider work requires a separate reviewed allowance. Task 1b remains unchecked pending continuous-conversation/context-cancellation evidence, timing/quality review and the agreed feasibility decision.
