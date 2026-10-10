# AI Stylist: Phased development plan and progress

Status: Draft plan v0.8 for Sabine's review  
Updated: 10 October 2026

Product: [Approved product specification v1.0](../Project%20Memory/product-spec.md)  
Design: [Approved design specification v1.0](../Project%20Memory/design.md)  
Technical decisions and patterns: [tech-spec.md v0.11](../Project%20Memory/tech-spec.md)

## Summary

Autonomous execution is authorized by Sabine on 10 October 2026. Routine technical decisions and task transitions do not require renewed approval. Preserve business requirements, explicit financial limits, security-sensitive approvals and dependency/acceptance gates. DEVELOPMENT_PROGRESS.md is the persistent handoff; docs/development-backlog.md tracks every imported v1.8 task.

- **Current focus:** Task 1a planning is complete. Task 1b remains in progress awaiting Tavus recovery clarification. Sabine explicitly approved independent Task 1c notebook preparation while waiting; Sabine completed the original local notebook review and the seven-step local connection rehearsal on 10 October 2026, reporting that all steps worked. Desktop and physical iPhone generated-reply/avatar audio and mouth movement are confirmed; iPhone explicit Interrupt and end, connection closure and local-device cleanup are confirmed. Continuous conversation, automatic interruption/context handling and precise timing remain open.
- **Completed planning:** Product and design baselines approved; phone website delivery, email/password, Google and Apple sign-in, and Supabase for accounts, saved preferences, wardrobe photos and saved looks approved. Supabase + Render MVP hosting is approved. React + TypeScript and Node.js + TypeScript are approved; volatile notes are accepted for the private prototype only. Remaining implementation proposals and customer MVP recovery stay under review.
- **Provider decision:** ElevenLabs is excluded. OpenAI Realtime and Tavus remain candidates; selected Tavus voice providers and fallbacks must comply with the exclusion.
- **Build status:** 894/894 focused tests, type checking and build pass. Separately, 50 isolated SQL checks, eight SQL-backed TypeScript owner scenarios and fourteen SQL-backed browser scenarios pass, including a fresh process preserving unresolved reservations. Incremental generation, paced bounded output, a connected streaming helper and verified context recovery controls are implemented and tested with mocks. These are not wired into the hosted phone page; its accepted interrupt-and-end behavior remains. Task 1b and Phase 1 remain incomplete.
- **Device check:** Physical iPhone camera preview, moving microphone meter, manual Stop, two-minute automatic stop and tab-switch cleanup are confirmed. The separate approved phone voice trial confirmed audible avatar reply, mouth movement and explicit interrupt-and-end. The bounded automatic spoken interrupt-and-end is now accepted on iPhone; conversational resume remains pending.
- **Next action:** Continue Task 1c browser/provider transport integration. The prepared session exposes fixed, redacted status messages, with an explicit simulated lifecycle binding for socket messages, disconnect, page exit and hidden-page cleanup. The lifecycle binding now passes full loopback checks for two turns, connection loss and permission granted after page exit. The visible page now offers a separate local connection rehearsal using the prepared client, lifecycle and session owners. It does not use a network or real providers. Disabled preparation now covers pinned GPT-4.1 mini extraction, partial transcription, owned bounded audio, revision-bound edits, validated note updates and capture cleanup. Visible notebook edits and confirmations now share exact epoch/field revision checks with the server owner; an old dialog draft cannot overwrite a newer note. Agent browser checks passed conflict recovery, ordinary edits, confirmation and cancel. Repeated turns wait for both provider commit and final note extraction before another acquisition; actual loopback checks with simulated devices/providers pass. The original React notebook and the new rehearsal remain in-process simulations; the actual network harness is unattached. Live quality/timing, real recommendation speech gating and hosted browser authentication remain unverified. Task 1b waits for Tavus's technical recovery reply; Sabine should share it when it arrives. All nine provider reservations are closed, no approved attempts remain and the reserve is exhausted.
- **Confirmed launch capacity:** One simultaneous consultation, as selected by Sabine on 9 October 2026. Plan for extensibility without implementing unapproved higher capacity.
- **Budget:** Original initial allocation was $25. The approved reserve-funded trials, including the repeat, change allocations to OpenAI $18, hosting $7 and reserve $0. Sabine separately approved the additional $10/month AI Stylist Supabase project. Render is on Free ($0/month). Revised ongoing and experiment totals must be reconciled before any additional charges. All nine approved provider attempts are consumed and verified closed; reservation totals are not actual charges.
- **Critical dependencies:** Voice/avatar integration, notes during speech, checking before recommendation audio, real retailer/affiliate data, customer-data isolation, provider retention, and session recovery. See R01 through R11 in tech-spec.md.
- **Spoken test:** Generated reply/avatar audio and mouth movement are accepted on desktop and physical iPhone. The phone explicit interruption and connection closure passed. The prototype supports two buffered exchanges per bounded room. Spoken interrupt-and-end is accepted on iPhone; precise lip-sync timing and conversational resume remain pending. Live notes and looks are not built.
- **Recent changes:** Sabine reported all 18 notebook review steps worked, covering the local prototype notes, photo/reference, fixture-check and control flow. This is recorded as prototype acceptance, not real speech or full Task 1c completion. Added guarded context recovery and a bounded streaming microphone component for the next Task 1b integration. Its focused checks cover small PCM frames, native-rate conversion, backpressure, permission races, device loss, page exit and the deadline. The streaming microphone is now used by a separate automatic-capture probe, with pause-triggered submission and spoken interrupt-and-end. Its response generation remains buffered and conversational resume is unimplemented. No new provider attempt or allowance was introduced.
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
2. Sabine authorized autonomous development on 10 October 2026. Explain the next actionable change briefly and proceed through routine implementation without renewed group approval. Request intervention only for business decisions, credentials, financial authorization, security-sensitive operations or irreversible actions. Preserve phase dependencies and acceptance gates.
3. Implement only that group, with its focused tests. Use synthetic fixtures for routine tests. Real provider calls and retailer checks are separate, approved integration checks.
4. Run the phase's cumulative automated suite, then walk Sabine through the numbered manual checks relevant to the group, one step at a time. Record expected versus observed results.
5. A checkbox becomes `[x]` only when its implementation and applicable automated/manual checks pass. If a group cannot yet be checked because of an external dependency, leave it unchecked and explain why.
6. Commit small working changes and push at the end of an approved build group, following AGENTS.md. Do not claim a GitHub update unless it actually succeeds.
7. End each phase with its dedicated code-review group. Use the code-review skill, fix findings, rerun the complete phase suite and recheck affected manual steps. Anything needing a product/technical decision goes to Sabine. If the skill is unavailable, resolve the review method with Sabine before calling the phase complete.
8. Update this Summary, the task evidence, tech-spec.md decisions/patterns, interview-notes.md after significant changes, and docs/mvp.md once created. Tick completed tasks on the Memory site when that site and its access have been established. Until then, record the missing site rather than claim a remote update.

## Test conventions

Keep each test narrow: a small fixture, one behavior, a clear expected result. Examples include “a late $500 event cannot replace the customer's saved $350 edit” and “customer B cannot read customer A's image.” Avoid one enormous conversation test as the only evidence.

Proposed tools are Vitest for domain/adapter tests, Playwright for a few focused browser journeys, and Supabase database tests for schema and access policies. Exact supported versions are pinned when scaffolding is approved. [Vitest guide](https://vitest.dev/guide/), [Playwright practices](https://playwright.dev/docs/best-practices), [Supabase database testing](https://supabase.com/docs/guides/database/testing)

**The Phase 1 command exists in prototypes/voice-avatar/.** The current 869 checks cover voice/avatar preparation and synthetic notebook/provider/browser integration. Real partial speech, real recommendation/speech gating, connected garment interpretation and P1-06 timing measurements remain pending. See [Phase 1 readiness](phase-1-readiness.md) for the current evidence matrix. The later phase commands below remain planned script names. Phase 2 creates the app harness. Each later group adds its tests to the relevant script. The scripts must fail on failed assertions and must not make hidden paid provider calls.

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

### Independent catalog discovery evidence, 10 October 2026

- [x] D02: normalized catalog contract, trusted rights/URL policies and two synthetic format adapters; shared focused tests passed.
- [x] D03: internal searchable synthetic catalog with four original SVG illustrations, sample prices/sizes and disabled checkout; automated and agent browser checks passed. These are discovery tasks, not real retailer or complete styling acceptance.
- [x] X01 public comparison: docs/retailer-comparison.md records current source evidence and unknown terms. Partner selection/approval remains open.
- Phase 1d source/rights/privacy desk review is in docs/task-1d-source-access.md; live permission and launch risk resolution remain incomplete. docs/mvp.md now records known scope, findings and open decisions without marking 1e complete.

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

## Approved automatic repeat trial, 9 October 2026

Sabine explicitly approved one repeat test capped at $2 and five avatar minutes, funded by the remaining $2 reserve. The initial experiment allocation remains $25: OpenAI $18, hosting $7, reserve $0. The separately approved recurring Supabase charge is unchanged. Reservations are not actual charges. No tenth attempt is approved.

A separate repeatTrial amendment permits only one further spoken attempt after eight closed historical records. The hosted adapter cannot grant amendments. Applied the transactional database amendment and verified full history/approval equality. A ten-record mutation was rejected, with a fresh read unchanged. RLS and existing restricted function privileges are retained. No provider call or ninth reservation was created during setup.

179/179 focused synthetic/mocked checks, type checking and build pass. Tests cover preserved records, one repeat only, early/unclosed/repeated approval refusal, unchanged scripted cap, malformed approval and tenth-attempt refusal. The same automatic-capture/spoken-stop behavior is retained; this repeat is not a fix or proof of natural barge-in. Sabine wants all instructions before starting, with no chat guidance during the test. Task 1b stays open.

### Repeat deployment ready

Published commit a2c0afa and manually deployed it to the existing Render Free preview. Render reports Deploy succeeded / Live for dep-db4pl1ajnfac73837u7g. Read-only checks confirm health HTTP 200 and automatic test page HTTP 401 without authentication. The approved ninth reservation has not been started by this setup. Next action belongs to Sabine: complete the self-contained iPhone test.

## Physical iPhone spoken-stop repeat result, 9 October 2026

Sabine supplied the repeat screenshot showing the detector-triggered stop message at Exchange 1 of 2, with microphone/playback reported off and controls disabled. When asked whether she said “Actually, I prefer blue” while the avatar was still speaking and whether it stopped her, she explicitly answered: “Yes, my words stopped her mid-reply.” This accepts the bounded spoken interrupt-and-end check on her iPhone. The screenshot alone does not establish the trigger; her confirmation supplies that observation. It does not measure stop latency, exclude all false triggers or establish ongoing conversational resume. Keep the uploaded screenshot private.

A read-only durable ledger check confirms nine reservations, all verified closed, including the latest. No approved attempts remain, and the experiment reserve is exhausted. No further provider request or reservation was created during verification. Task 1b stays open for streamed response generation, safe context handling and conversational resume.

## Incremental output and guarded recovery components, 9 October 2026

Implemented the next Task 1b building blocks without changing the hosted phone test or its nine-attempt cap:

- streamSpokenReply accepts verified Realtime audio deltas before generation completes. It splits them into at most 20 ms identified PCM16 frames, rejects malformed/stale identities, deduplicates events, bounds total audio and stops on downstream refusal, cancellation or timeout. It does not retain a second full audio buffer in streaming mode. Existing buffered generation remains available.
- IncrementalEcho paces accepted frames with a maximum fifty-frame queue, bounded transport messages, no catch-up burst and no retry. Cancellation clears local pending frames and sends an interrupt even after all audio chunks were sent, because sent is not heard. A completed stream cannot be reused until stopped.
- startStreamedBridge connects generation to this output queue and cancels both on failure. Its result explicitly reports playbackConfirmed=false. It does not reserve allowance, create a room, expose an endpoint or commit conversation history. Its future owner must enforce those boundaries and the room deadline.
- ContextRecovery stops local output, verifies old model closure and renderer cleanup, then admits only a distinct verified replacement context for the matching held epoch. It refuses concurrent/repeated attempts, has an eight-second maximum deadline, discards late replacements and holds on failed cleanup. The transport adapters and confirmed-history restoration are not implemented.

215/215 focused synthetic/mocked checks, type checking and build pass. New tests cover incremental delivery, partial output failure, backpressure, pacing, post-send cancellation, stale callbacks, duplicate identities, close/renderer verification failure, timeout, late replacement cleanup and ended-session protection. No real provider/media request, new reservation, allowance, package or architecture change was made. Task 1b remains unchecked. The hosted phone page still ends on interruption.

The inspected Tavus speaking-event schema describes role plus duration/interrupted for stopped events but does not establish an inference-correlated queue-clear acknowledgment or a client playback offset. Do not substitute a server speaking span for what the user heard. Prepared [technical support questions](task-1b-tavus-recovery-question.md) for Sabine to approve sending. Resolve this contract before enabling safe same-room resume; this is a documentation gap, not proof the capability is unavailable.

Sources: https://developers.openai.com/api/docs/guides/realtime-conversations and https://docs.tavus.io/sections/event-schemas/conversation-started-stopped-speaking.md.

Next verification after integration: with a separately approved private trial, interrupt while replying, verify no old audio returns, give a correction and check the fresh reply uses confirmed context only. Repeat end/tab-hide/deadline checks. This physical verification has not been run; no further attempt is approved.

## Authorized Tavus recovery question submitted, 9 October 2026

Sabine explicitly approved sending the prepared technical questions. Submitted them once through the authenticated Tavus Contact support form with subject “Audio Echo interruption: queue-clear acknowledgment and safe resume.” Tavus displayed Message sent and stated support will reply by email. No ticket number or independent delivery receipt appeared. The message contained technical questions only, with no private records, keys or attachments. The confirmation screenshot remains private. Await Sabine sharing the reply before enabling live recovery that depends on the unresolved contract. No test, spending allowance or provider configuration was changed. Latest implementation checks remain 215 passing tests, type checking and build; this documentation-only step did not rerun them.

## Confirmed context restoration preparation, 9 October 2026

Added server-only volatile ConfirmedConversation memory and connected it to the local SpokenService. Generated replies remain pending until the existing explicit whole-reply confirmation; interrupted pending replies are excluded. The memory retains at most one confirmed pair within the unchanged two-exchange cap. It validates audio/text bounds, rejects duplicate/stale reply identities and invalidates old generation revisions. End, expiry and replacement clear it. It is not the saved preference store, and no raw history is added to public status or logs.

ContextRecovery now discards pending content and captures an immutable confirmed-history snapshot before recovery. After verifying old model closure, renderer cleanup and a distinct configured fresh context, it requires an explicit successful context-restoration acknowledgment before releasing the coordinator. Changed context revisions, negative/failed acknowledgment, cancellation, expiry or ended sessions hold recovery and discard the replacement. Cleanup starts on deadline even when restoration never resolves; pending/failed cleanup is visible and blocks further recovery. No transport acknowledgment is fabricated.

231/231 synthetic/mocked tests, type checking and build pass. New checks cover confirmed-only history, immutable copies, stale/duplicate confirmations, bounded volatile storage, reset behavior, failed/stalled restoration, changed memory, late acknowledgment after end and unresolved cleanup. The full focused suite includes the existing buffered-service lifecycle checks. No paid call, tenth reservation, provider setting or database change occurred. The code is prepared locally and published; it has not been deployed to Render, and the phone page still uses its previously accepted interrupt-and-end flow.

Live recovery adapters and physical acceptance remain pending the requested Tavus queue-clear contract. When Sabine receives the support email, she should share it here. After integration and a separately approved trial, verify that interrupted/unheard reply content is absent from the next answer, confirmed context is retained, no old audio resumes and end/tab-hide/deadline cleanup still works. These manual checks have not been performed, and Task 1b stays unchecked.

## Streaming lifecycle cleanup fix, 9 October 2026

The prepared streaming bridge now retains its parent cancellation connection after all output frames are sent. Remote playback may continue after sending finishes, so ending the owning session must still send the interrupt. Cancellation releases the listener and repeated cancellation does not resend the interrupt. Completion racing with cancellation is rejected rather than reported as successful. Sending an interrupt still requires independent renderer/room cleanup verification.

233/233 synthetic/mocked tests, type checking and build pass. Two new regression checks cover parent cancellation after output delivery and cancellation during final output handoff. No provider call, reservation, deployment or budget change occurred. The fix is local and published only; live recovery and physical acceptance remain pending Tavus clarification and integration. Task 1b remains unchecked.

## Combined recovery checks, 9 October 2026

Added three combined synthetic checks using the real streaming bridge, paced output queue, session coordinator, confirmed memory and recovery gate, with mocked generation and transport acknowledgments. They verify that interruption clears queued audio and rejects late frames; only confirmed memory is restored before a new response is accepted; unverified renderer cleanup blocks replacement; and ending during restoration disposes the replacement without reviving the session. These checks validate component coordination, not Tavus's actual cleanup guarantees.

236/236 tests across 24 files, type checking and build pass. No provider calls, paid attempts, deployment or architecture changes occurred. Live recovery adapters and physical verification remain pending Tavus's technical reply and later test authorization. Task 1b remains unchecked.

## Task 1c preparation authorized while Task 1b waits, 10 October 2026

Sabine approved starting the independent notebook prototype before Task 1b completes. Implemented a local notebook page, editable and uncertain notes, progressive synthetic clauses, stale-correction rejection, image confirmation/thumbnail, local camera ownership and version-bound synthetic look checks. The full [Task 1c evidence and complete review guide](task-1c-notebook-prototype.md) records scope and remaining acceptance. 265/265 tests, type checking and build pass. Computer browser checks and a synthetic image selection passed; physical camera, accessibility and actual speech/timing remain pending. Nothing new is deployed and no paid call or allowance change occurred. Task 1b, Task 1c and Phase 1 stay unchecked. Later task groups remain unapproved.

### Task 1c instruction visibility fix, 10 October 2026

Sabine reported that the full review instructions were missing. The prior on-page content was a shortened checklist. Added all 18 steps behind a prominent top-of-page Read full test instructions control and reused the same complete guide in the lower section. Browser inspection verified the complete numbered guide and left it open. 265/265 tests, type checking and build pass. Notebook review remains pending.

### Task 1c notebook manual review passed, 10 October 2026

After receiving the complete 18-step instructions in chat, Sabine said: “finished, all steps worked.” Recorded her manual notebook review as passed. The reviewed scope includes simulated progressive notes, uncertainty, edits/corrections, look holds and checks, local photos/camera instructions, clearing and keyboard/readability checks. Device/browser and individual optional camera sub-checks were not separately reported; no physical iPhone acceptance, measured timing, comprehensive accessibility audit or actual AI integration is inferred.

- [x] Complete the local simulated notebook manual review with Sabine.
- [ ] Complete actual partial speech/extraction integration and voice corrections.
- [ ] Verify real recommendation display/speech gating and representative timing.

Task 1c remains in progress. Latest implementation evidence is 265 passing tests, type checking and build; this documentation-only acceptance update did not rerun them. No provider call, budget amendment, deployment or later task approval occurred.

## Partial speech coordinator and timing preparation, 10 October 2026

Added a provider-independent coordinator with an injected extraction interface. It accepts versioned user partials before turn end, rejects duplicate/retired/stale events, coalesces cumulative text, and starts extraction within 400 ms under continuous partial updates. Rewritten text cancels obsolete work. A turn retains each field's original revision plus its own updates, so a touch edit stays protected throughout that turn. A later turn can express a new correction. Strict patch validation requires known fields and evidence from the submitted segment; real adapter results remain tentative. Only an explicitly synthetic fixture may mark known sample values confirmed. Work is bounded by session limits, transcript size and a 1.5-second extraction deadline. No automatic retry or provider connection is added.

Added bounded in-memory timing metadata separating input, extraction and acknowledged rendering, with failed, canceled and pending counts. The p95 calculation includes slow completed samples and always reports liveTargetVerified=false. No transcript, notes or media enter the timing records. A cleared session does not reuse sample IDs. Actual UI rendering callbacks and representative live measurements are still pending.

All 282 tests across 28 files, type checking and build pass, including 17 new synthetic checks. These modules are not yet connected to the notebook UI or a real speech/extraction service. The accepted notebook interface and deployed phone behavior remain as previously reviewed. Next: integrate the coordinator with the existing synthetic notebook path, then establish real extraction and live timing evidence. Task 1c remains open. No provider calls, budget changes or Render deployment occurred.

### Synthetic notebook connection verified, 10 October 2026

Connected Play sample description to the partial-note coordinator through the existing canned clause extractor, explicitly marked synthetic. Cumulative versioned partials now take the extraction path rather than directly writing each note. The interface acknowledges committed note updates on the next animation frame; this is a browser callback, not physical display or representative live latency evidence. Pause/page-hide cancel pending extraction; clearing resets the coordinator and invalidates old render receipts. The direct correction fixture shares capture sequence numbering.

All 282 tests, type checking and build pass after integration. Browser verification showed the five captured fields, uncertain season/date and budget, and the older $500 result rejected after the $350 correction. Sabine's earlier manual review applies to the earlier interface; this subsequent integration received automated and implementer browser checks, not a new full user review. Existing notebook photo/camera and synthetic recommendation behavior are retained. Real microphone transcription/extraction, actual voice corrections, measured live p95 and recommendation speech gating remain pending. No Render deployment or paid call occurred.

## Shared look display and speech permission, 10 October 2026

Added LookRelease, a synthetic discovery gate binding an immutable sample description to its exact validation ticket, session and notebook revision. Display and speech use the same permit. A pending, blocked, unknown, malformed, timed-out, stale or copied approval cannot authorize either path. A description cannot be swapped after checking. Speech starts at most once per permit; each queued frame must recheck permission immediately before enqueue, and the transport receives an abort signal. Notebook edits, captured corrections, reference changes, saved-preference fixture changes, clearing, a new check and ending synchronously revoke the permit. Frames already heard cannot be undone.

The notebook now uses this shared permit for the illustrated sample and its description. Browser checks verified hidden-during-check, release after confirmed fixture values, and immediate disappearance after enabling Avoid emerald green. Synthetic transport tests verify queued-frame cancellation, exceptions and changes inside the start callback. 303 tests across 29 files, type checking and build pass. No real speech output, independent AI validator, database transaction, second-tab synchronization or remote renderer cleanup is established. The provider speech adapter must honor abort and separately verify cleanup; this is still an open Task 1c gate. No paid call or Render deployment occurred.

## Approved disabled transcription preparation, 10 October 2026

Sabine answered Approve preparation with simulated tests. This approves preparing the OpenAI live transcription path disabled, with simulated provider events only. It does not approve a paid call, new allowance, production model baseline, deployment or an avatar architecture change.

Implemented server-only PreparedLiveTranscription protocol adapter with an explicitly injected simulated wire. Default construction refuses live use before sending configuration. No socket factory, API key loading, HTTP/WebSocket route or browser integration enables it. It prepares the documented transcription session configuration for gpt-live-transcribe, 24 kHz PCM and client-owned turn commits. It accepts the existing microphone component's 960-byte frame format, but that component is not connected to this adapter in a running page.

Configuration acknowledgment precedes input; incompatible settings hold. Frame ordering, buffered transport bytes, overall audio size, transcript size, turn count, event count and deadlines are bounded. Provider deltas accumulate into versioned user partials. Item mappings and commit acknowledgments prevent an old turn's delayed completion from reviving its notes. Final text may correct a partial. Provider failures, cancellation, disconnect, consumer errors and timeout stop the adapter without retries. In-memory content is cleared on end; status contains counters and codes only. Cleanup is recorded as requested, never remotely verified, and a wire-close exception is reported as cleanup-unverified.

All 327 tests across 30 files, type checking and build pass. The 24 added checks include synthetic provider-event delivery into PartialNoteCoordinator: a note appears before completion, remains tentative and preserves a subsequent touch edit. These tests use an injected canned extractor, not a real extraction model. No provider connection, key access, microphone capture, real recognition measurement, remote cleanup, price reconciliation or Render deployment occurred. Existing browser assets are unchanged by this server-only preparation.

Remaining: an authenticated live session owner and transport wiring; approved/pinned structured extraction model and schema; allowance review before paid activation; actual microphone-to-notebook quality and complete latency measurement; real recommendation speech cancellation; and Tavus recovery clarification. Task 1c remains unchecked.

## Simulated note-session ownership integration, 10 October 2026

Added NoteSessionProbe to connect the existing prepared transcription protocol, partial-note coordinator and an injected capture source in-process. It refuses default live construction. The source is acquired only after transcription configuration acknowledgment, and its exact existing 960-byte frame interface is used. No actual browser microphone, provider socket, extraction model, key loading, route or authenticated production session is constructed.

The owner stops capture before committing a turn and invalidates the old capture callbacks. Session end, notebook clearing, disconnect, capture failure, provider failure, extraction failure, display callback failure and deadlines cancel extraction, request transport closure, release the source and clear volatile notes. A late permission result is released; late extraction and render callbacks cannot update the cleared notebook. Cleanup failures remain explicit, and remote provider cleanup is never claimed verified. No reconnect or automatic retry is added.

346 tests across 31 files, type checking and build pass, including 19 new ownership/integration checks. Simulated frames and provider partials flow through a canned extractor before turn completion; tentative values and touch-edit protection are verified. Configuration deadlines, the overall deadline during capture acquisition, stop/commit ordering, synchronous initial send failure, cleanup exceptions and late asynchronous results are covered. This is synthetic integration evidence, not live recognition, physical-device acceptance, authentication, two-tab isolation or measured end-to-end latency. Browser assets and the hosted phone preview are unchanged. No paid call, new allowance or deployment occurred. Task 1c and Phase 1 stay open.

## Structured extraction contract preparation, 10 October 2026

Added a provider-independent JSON extraction schema and strict application decoder. The output contains only the originating turn and up to seven unique known fields with literal value/evidence pairs. Every resulting note is tentative. Additional confirmation, save/profile authority, unknown fields, duplicate fields, wrong turns, malformed/oversized JSON and evidence outside the current fragment are rejected atomically. Values must equal trimmed evidence, preserving negation and avoiding invented seasons, currency or budget scope. This deliberately narrow prototype contract does not yet provide typed normalized budgets, separate exclusions or automatic voice confirmation.

A bounded 1,000-character prior context is now supplied alongside the current fragment for field identification, including clauses split across partials. Prior context alone cannot support a new patch. Prompt instructions are separate from the JSON-encoded untrusted speech data. These safeguards do not prove a model assigns the correct field or fully resists prompt injection; actual extraction quality still needs evaluation.

The simulated extractor adapter accepts an injected request function and refuses default live construction. Cancellation before or after a request holds the result; errors expose only generic codes. No model, API request, endpoint, keys or live switch is selected or enabled. All 368 tests across 32 files, type checking and build pass, including 22 new contract/integration checks. The canned notebook retains its interaction flow. No paid call or deployment occurred. Task 1c remains open.

## Approved pinned extraction adapter, 10 October 2026

Sabine approved GPT-4.1 mini preparation with simulated responses only. Added a server request builder pinned to gpt-4.1-mini-2025-04-14 and a Responses wire decoder. Requests specify strict JSON schema under text.format, store:false, no tools, no streaming and a 2,048-token output ceiling. store:false requests no Responses application-state storage; it does not promise zero retention or alter provider training policies. The protocol version uses a single-value enum in the provider schema, with the application decoder retaining its exact version check. [Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs), [Responses migration and storage](https://developers.openai.com/api/docs/guides/migrate-to-responses).

The decoder accepts one completed assistant text message from the pinned model. It rejects refusals, failed/incomplete/cancelled results, tool outputs, multiple messages, invalid JSON, wrong turns and unsupported evidence. Notes stay tentative. The simulated transport forwards cancellation, discards late results, redacts errors and performs no retries or model fallback. The existing coordinator owns the 1.5-second extraction deadline. No API client, credentials, live endpoint or activation path was added; simulation must be explicit.

All 396 focused tests across 33 files, type checking and build pass, including 28 new adapter checks. A simulated transcription envelope flows through the session owner and this adapter into tentative notebook notes; ending clears the session. Tests also cover the deadline and ignored late responses. This proves local contract handling only, not provider schema acceptance, account availability, semantic quality, live latency or physical-device behavior. No paid call, additional allowance or Render deployment occurred. All nine prior trials remain closed. Task 1c and Phase 1 remain incomplete.

## Recognition rewrite correction, 10 October 2026

Found and fixed a stale-note case: a revised transcript could remove evidence from a partial that had already produced a note. The coordinator now tracks exactly which field revisions it wrote during each turn. On a rewrite it immediately retracts those unchanged speech revisions, cancels obsolete render receipts and re-extracts the revised text. Retraction invalidates current look approvals synchronously. Touch edits and customer confirmations are protected by their newer revisions, and notes from previous turns are not erased. A conservative rewrite can temporarily clear unchanged speech fields from that same turn until they are extracted again; the prototype does not guess which old evidence remains valid.

The notebook receives an immediate invalidation update and explains that speech changed. The simulated session owner accepts the same display callback and ends safely if display updates fail. All 408 focused tests across 34 files, type checking and build pass, including 12 new correction checks. They cover removed evidence, replacement values, confirmed/manual/cleared fields, prior turns, stable appends, stale render receipts, look approval revocation and callback cancellation/failure. These are synthetic correction tests; actual recognition and physical-device timing remain unverified. No provider call, allowance or deployment occurred. Task 1c remains open.

## Simulated connection ownership preparation, 10 October 2026

Added NoteConnectionScope as a disabled, process-local control boundary around the simulated note-session owner. One opaque server connection object owns each random session identity. A second tab cannot take over using a matching user label or a guessed session ID. Strict versioned commands bind the session, a monotonically increasing sequence and the exact command payload; duplicate, old, malformed and foreign commands are rejected. Provider callbacks are accepted only through the original connection binding. This reference is supplied by trusted server code, never parsed from browser JSON.

The slot is reserved before constructing resources, preventing a reentrant second start. End, disconnect and the existing probe deadline retire the simulation; late starts, provider events and commands cannot revive it or control a new session. Cleanup failures hold the slot rather than admit another session. Session identities are never reused within the bounded process history. Ending remains possible after the command limit is reached. Diagnostics contain flags and counts only.

All 430 focused tests across 35 files, type checking and build pass, including 22 new checks. Integration with a real NoteSessionProbe and simulated transcription confirms that another connection cannot update notes, while the owned connection can; disconnect clears the notebook and closes the simulated wire once. No HTTP/WebSocket upgrade route, authentication verification, browser connection, provider socket, key loading or deployment is added. These tests do not establish authenticated customer isolation, real two-tab browser behavior, remote provider cleanup or a distributed production lease. The process-local guard is for the approved disabled prototype only; production lease/heartbeat settings remain undecided. Task 1c remains open, all nine paid trials remain closed and no spending is authorized by this work.

## Disabled network control bridge, 10 October 2026

Prepared attachSimulatedNoteBridge using the existing pinned ws dependency and PreviewGate. Explicit simulation is required before any listener is attached. The bridge checks the configured host, exact origin, GET method, exact /api/notebook-simulation path without query credentials, and existing private-preview Basic credentials before upgrade. It rejects subprotocol credentials and a second connection before constructing session resources. The opaque socket owner is bound to NoteConnectionScope. The upgrade/authorization pattern follows the [official ws authentication example](https://github.com/websockets/ws/blob/master/README.md#client-authentication).

Control messages are limited to 1,024 bytes, compression is disabled, send backlog is bounded, and pending commands cannot accumulate. Invalid JSON, binary/control misuse, wrong ownership, duplicate commands and transport errors end the simulation. An end command can cancel an in-progress start. Disconnect, disposal and the existing 85-second prototype limit stop the owned session; late asynchronous starts cannot revive it. Only readiness and command acknowledgments are sent. No audio, transcript or notebook-value transport is implemented by this control-only bridge.

All 453 focused checks across 36 files, type checking and build pass, including 23 new bridge tests using actual loopback WebSocket connections with fixture credentials and simulated providers. Checks cover wrong/missing credentials and origins, host/path/query/subprotocol rejection, a second socket, malformed/oversized/binary messages, command replay, disconnect, pending-start cancellation, disposal and the deadline. A real NoteSessionProbe driven by simulated transcript events gains a tentative note and clears it when its socket disconnects. The disconnect test waits for the server cleanup event rather than assuming the client's close event proves cleanup already occurred.

The application server, CLI, browser assets and Render preview do not attach or enable this bridge. Loopback tests use HTTP with configured preview headers; they do not verify HTTPS termination, Render routing, Safari Basic-auth behavior, real two-tab UI behavior, Supabase customer authentication, provider behavior, live latency or remote cleanup. The existing browser notebook remains an isolated simulation. Next: prepare browser updates and provider transport adapters, then review activation and allowance before any paid trial. No account changes, API keys, paid calls, new allowance or deployment occurred. Task 1c and Phase 1 remain incomplete.

## Notebook update transport preparation, 10 October 2026

Extended the disabled bridge with connection-bound notebook publishing. A strict whitelist sends only seven notes, statuses, field/notebook revisions, the originating notebook session and an optional render receipt. Transcripts, photo/reference data, saved profiles and look approvals are excluded. Updates have their own increasing sequence and a bounded count. A publisher captures its original socket; an old session callback cannot target a replacement connection. One validated initial snapshot may be buffered during construction and is sent only after readiness. An invalid initial update ends and cleans up the newly constructed session.

Added the browser-compatible NoteUpdateClient state helper. It requires a simulated ready event, rejects foreign/replayed updates, changed notebook sessions, regressed revisions and changed values without a new field revision. Missing/uncertain values remain explicit. New retraction snapshots can remove obsolete notes. Snapshot access returns copies. Disconnect clears all client note content and prevents reuse. A render acknowledgment can be built once for the exact current update/receipt, after the future UI commits it. The helper does not itself measure physical rendering or display HTML.

All 476 focused checks across 37 files, type checking and build pass, including 23 added checks. Actual loopback sockets deliver simulated transcription through NoteSessionProbe as tentative note snapshots, and the client helper returns a matching receipt over the connection. Checks cover content whitelisting, malformed/oversized notes, revision regression, replay, retractions, stale receipts, duplicate acknowledgments, disconnect clearing, initial ordering/cleanup and an old publisher after replacement. The simulation remains unattached to the running application server, React notebook and Render. No browser socket, real microphone-to-provider transport, model call, actual rendering acceptance or paid trial occurred. Task 1c and Phase 1 stay open.

Next integration work: connect the prepared browser state helper to React with commit-time acknowledgments and cleanup, provide authenticated browser transport, and prepare the real provider adapters. Review an additional allowance before paid activation; the original nine trials remain closed with no reserve.

## Validated update rendering in the notebook, 10 October 2026

Connected the visible React notebook's existing simulated conversation to NotebookPresentation and the prepared NoteUpdateClient/decoder. Displayed note values now pass through the strict seven-field wire schema and revision checks in-process. Local photo/reference and look-gate controls remain local. This does not open a socket, relax the notebook's connect-src restriction or connect a provider. Existing touch edits, confirmations, synthetic speech corrections and session clearing use the same presentation path.

After React commits an update and reaches the next animation frame, the exact current wire update may produce one matching extraction render receipt. Superseded updates, touch edits, clearing, retired notebook sessions and disconnects cannot acknowledge an older receipt. Wire update sequences never repeat across local clears, preventing a late callback from accidentally acknowledging a new session. These callbacks do not prove physical display timing or the live two-second target.

All 487 focused tests across 38 files, type checking and build pass, including 11 new presentation checks. Browser regression checks on the updated local notebook confirmed sample notes/uncertainty, the synthetic $350 correction, a touch color edit to Blue, complete clearing and a fresh sample afterward. The prior $500 result did not replace the corrected budget during this flow. The screenshot is private test evidence, not a committed asset. This is agent-run browser regression evidence, not a new physical-device or live-provider acceptance. Task 1c and Phase 1 remain open. No paid call, allowance change or Render deployment occurred.

Remaining integration: a browser socket/controller and session-bound edit commands, actual streaming microphone/provider adapters, measured live quality/latency and real recommendation speech cleanup. The server network harness remains unattached to the running page. All nine prior trials stay closed; paid activation still needs a separate allowance review.

### Disabled extraction transport preparation, 10 October 2026

Added a simulation-only HTTP boundary for the pinned extraction request. Request and streamed response bodies are capped at 32 KiB; redirects, unexpected destinations, non-JSON, malformed UTF-8/JSON and non-200 responses hold without retries. Cancellation stops an unfinished read and also cancels a body returned late by an injected request. Errors are redacted. No credentials, default network client, live route or deployment was added. All 674 tests across 47 files, type checking and build pass. Task 1c and D21 remain partial until real partial speech, voice edits and timing evidence are accepted. Next: prepared transcription socket lifecycle integration.

### Disabled transcription socket integration, 10 October 2026

Implemented a simulation-only socket wire with no socket constructor or credentials. It requires an open injected socket, rejects malformed/binary/oversized input, caps incoming events, checks outgoing bytes and backlog, and removes listeners on cancellation/disconnect. Cleanup failures are explicit and remote cleanup is never claimed. A combined synthetic flow traverses the socket, transcription protocol, bounded extraction transport, strict decoder and session owner into tentative notebook state; disconnect clears it. A separate actual loopback WebSocket test proves framing against a synthetic provider. All 698 tests across 48 files, type checking and build pass. No real microphone/provider request or Render deployment occurred. Next: consolidate the combined session construction and cancellation ownership while keeping live activation disabled.

### Consolidated prepared provider session, 10 October 2026

Added one simulation-only factory that composes both prepared transports with NoteSessionProbe and shared external cancellation. Disconnect cancels pending extraction; extraction failure closes the socket; temporary notes clear and capture ends once. Cleanup exceptions remain visible as failures. All 704 tests across 49 files, type checking and build pass. Next: use the factory through the existing disabled loopback browser bridge and verify two-turn edits, stale extraction and disconnect. No live activation, new financial allowance or deployment occurred.

### Combined browser/provider bridge and visible rehearsal, 10 October 2026

Attached the combined prepared provider factory through the explicit simulation-only private network bridge. Seven added checks exercise two turns, touch confirmation, stale extraction after correction, disconnect during extraction, failed socket cleanup holding the lease, immediate provider-failure notification and readiness only after the provider configuration acknowledgment. The visible local rehearsal now uses the same combined components with canned Responses envelopes and silent generated PCM. Implementer browser verification passed Emerald green, Blue correction, confirmation and End clearing all rehearsal notes. All 711 tests across 50 files, type checking and build pass. No live endpoint is enabled on the application server, no real provider or microphone was used, and nothing was deployed to Render. Task 1c remains partial. Next: combined seven-field/missing/uncertain/budget-correction and confirmed-only fixture gating scenarios.

### Full preference and fixture-gating scenarios, 10 October 2026

Three added combined-factory scenarios verify all seven fields remain literal and tentative, missing values remain missing, November does not become an inferred season, and $500 does not become an inferred USD scope. Required confirmation holds the synthetic sample; owned wardrobe items remain held for real matching. A later budget correction invalidates the passed ticket immediately, rejects the old result and blocks a sample above the newly confirmed maximum. The scenario explicitly waits for final extraction settlement before starting the next turn. All 714 checks across 51 files, type checking and build pass. No real extraction quality, product matching or recommendation agent is inferred. Next check page lifecycle/late-permission cancellation through the combined factory.

### Combined page lifecycle and cleanup-order fix, 10 October 2026

Seven combined loopback scenarios cover pagehide, hidden state, permission granted after exit/provider failure, extraction cancellation, device loss and connection termination. A separate regression reproduced an owner notification arriving before capture cleanup failure was recorded. Notification now runs after the shutdown stack settles, and terminal capture release is attempted independently if stopping throws. All 722 tests across 52 files, type checking and build pass. These simulated-device checks do not replace physical Safari acceptance. The current Phase 1 evidence and remaining dependencies are consolidated in docs/phase-1-readiness.md. Next: combined session-replacement isolation and cleanup-hold checks.

### Replacement isolation and display/speech revocation, 10 October 2026

Three new combined bridge checks verify that old extraction/provider events cannot update a fresh connection, old render receipts are rejected, and failed provider cleanup prevents replacement. One combined extraction/fixture-release check verifies that a budget correction aborts existing speech authorization, rejects further frames and removes the old visual permit. All 726 tests across 53 files, type checking and build pass. No actual recommendation speech or provider call was made. Next prepare the bounded live-trial activation plan and full manual script; keep live activation disabled pending financial/security prerequisites.

### Notes-only live-trial proposal

Prepared docs/combined-notes-live-trial-plan.md with explicit disabled status, prerequisites, a complete future manual script and honest evidence limits. This notes-only experiment is separate from Tavus conversational resume. No trial allowance, model-cost estimate, live route, credential transfer or deployment is approved by the plan. Next prepare the disabled server owner with injected gate/budget/session interfaces and refusal/cleanup tests before considering activation.

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
