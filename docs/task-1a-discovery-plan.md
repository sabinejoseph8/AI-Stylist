# AI Stylist: Task 1a discovery plan and cost proposal

Prepared: 9 October 2026  
Status: Initial $25 spending limit approved by Sabine on 9 October 2026. Supabase + Render approved for MVP hosting on 9 October 2026. React + TypeScript and Node.js + TypeScript approved; volatile unsaved notes accepted for the private prototype only. Task 1a documentation/decision review is complete; Task 1b awaits its group approval.  
Related documents: [Progress](progress.md), [technical decisions](../Project%20Memory/tech-spec.md), [product requirements](../Project%20Memory/product-spec.md), [design](../Project%20Memory/design.md).

## 1. Recommendation in plain words

Start with a small private experiment to learn whether OpenAI voice and the realistic Tavus stylist can work together. Sabine approved a **$25 total allowance for the first experiment** on 9 October 2026, including the small reserve. Use free service allowances where available. Confirm the actual account entitlements and checkout total before spending. If the free avatar allowance is unavailable or insufficient, pause and review a separate expanded trial rather than upgrade automatically.

This buys an initial feasibility experiment, not the completed app or a production launch. Twenty minutes of connected avatar time cannot establish all performance targets or complete all Phase 1 checks. Later experiments need the remaining allowance or a newly approved budget. Developer time, domains, production email, commercial catalog access and production operations are outside this service estimate.

The approved launch target is **one simultaneous consultation**. The app can have multiple registered customers, but initially only one can use the stylist at a time.

## 2. Technology choices proposed for review

| Part | Recommendation | Reason and decision status |
| --- | --- | --- |
| Customer website | React with TypeScript | Fits the approved phone browser experience, notebook editing and live events. Shared types help keep customer edits and backend records consistent. React + TypeScript approved on 9 October 2026 (D12); exact versions remain to be pinned. |
| Accounts and saved data | Supabase Auth, Postgres and private Storage | Core roles already approved: accounts, saved preferences, wardrobe photos and saved looks. Schema, permissions and account settings still need implementation review. |
| Website hosting | Render, approved host; static site proposed | Supabase + Render approved for the MVP on 9 October 2026. Propose separate static interface delivery and conversation service on Render; account settings and deployment remain unverified. |
| Conversation coordination | One small Render Node.js service | Supports an ongoing connection and one authoritative session. Separate extraction, look selection and checking are logical roles in this service, not separate paid deployments. Render hosting approved on 9 October 2026; Node.js + TypeScript approved on 9 October 2026 (D12); service sizing and configuration remain proposed. |
| Voice and realistic avatar | Test OpenAI Realtime audio with Tavus Echo audio playback | A candidate connection to prove. Keep one licensed stock female face for the initial experiment; final stylist identity remains a later review. No ElevenLabs voice or fallback. |
| Background preference check | Numeric/categorical rules plus an independent model check, then one release gate | A look and its spoken recommendation both wait for the current check. Unknown or stale results hold the recommendation. Proposed implementation of the approved requirement. |
| Optional Supabase Edge Functions | Defer initially | Keep initial token, session and bounded job handling in the coordinator. Review short independent jobs later if they offer a clear benefit. No extra Supabase responsibilities are approved by this plan. |

Render static sites use shared workspace bandwidth and build allowances; no separate paid frontend compute is assumed within those limits. Supabase's function wall-time limits support keeping long consultations in a separate coordinator. Supabase + Render hosting is approved; the deployment arrangement and integration still need implementation evidence. [Render static sites](https://render.com/docs/static-sites), [Supabase limits](https://supabase.com/docs/guides/functions/limits).

Tavus supports audio playback in Echo mode, but its alternative modes do not include its usual perception and speech-recognition layers. We must supply and prove our own transcription/camera path. A catalog voice ID can let Tavus automatically choose its provider. An unknown provider is not acceptable evidence of compliance with Sabine's ElevenLabs exclusion. [Pipeline modes](https://docs.tavus.io/sections/conversational-video-interface/quickstart/pipeline-modes), [Tavus voices](https://docs.tavus.io/sections/conversational-video-interface/voices).

Alternative if the bridge fails: bring the findings and a revised media proposal to Sabine. Do not automatically switch to Tavus's full conversation pipeline, change OpenAI's role or introduce an excluded provider.

## 3. Preliminary data boundaries

| Information | Proposed location and handling |
| --- | --- |
| Account identity and explicitly saved preferences | Owner-scoped Supabase records. Saving preferences is a distinct customer action. |
| Saved wardrobe photos and look images | Private Supabase Storage, with owner checks and limited access links. Save only the requested asset. |
| Active notebook, uncertainty, feedback, revisions and unsaved reference images | Temporary coordinator/browser memory. No default database, browser persistent storage, analytics or session replay copies. |
| Saved look | Only the selected arrangement, item facts, links, visual assets and dated estimate. Do not include notes, feedback, transcript or session history. |
| Provider keys | Server secret configuration only. No keys in the website, Markdown, logs or public GitHub repository. |
| Operational evidence | Timing, usage totals and redacted reason codes. No raw audio, transcript, notebook text or signed image URLs. |

Keep the domain rules independent of vendors through adapters and versioned contracts. Apply explicit ordering and field revisions so an older extraction cannot overwrite a newer touch or voice correction. Bind each approval to the current brief, saved preferences, reference and candidate versions. A correction invalidates old recommendations, including queued speech.

Sabine accepted volatile session memory on 9 October 2026 for the private prototype only (D13). A server restart loses active notes, feedback and unsaved reference images; saved Supabase records remain. A brief connection loss can resume only if the owned server session still exists. Explain restart loss, cancel obsolete work and queued recommendation speech, reject old session events and offer a new consultation using explicitly saved data. This is not approved customer MVP behavior; review recovery before launch, including the privacy implications of any temporary recovery store. Reconnect grace, idle timeout, metrics retention and production recovery remain proposed settings in the technical spec. Do not store full session events simply to simplify recovery.

## 4. Cost worksheet

### Approved first experiment: $25 total ceiling

Prices checked against official sources on 9 October 2026. Dollar amounts are USD. Allowances below are planning limits, not guarantees that a vendor billing alert enforces a hard stop. Existing account usage and tax must be checked before purchase.

| Service | Amount allocated | Assumption |
| --- | ---: | --- |
| Tavus | $0 | Free CVI allowance available; plan at most 20 connected minutes, leaving room within the advertised 25-minute allowance. |
| OpenAI API | $10 | Maximum initial funding/usage allocation across voice, transcription, images and other model calls; existing paid credit counts toward this allowance. |
| Render | $7 | One smallest paid web-service instance for up to one month, using a free Hobby workspace if eligible. Reconfirm price, memory needs and workspace charges before creation. |
| Supabase | $0 additional target, unverified | Sabine reported an existing Pro plan on 9 October 2026. Verify the organization, existing projects, available compute credit and usage before assuming the AI Stylist adds no charge. A separate project may add compute costs. |
| Render static website | $0 additional target | Within the chosen workspace's included bandwidth and build allowance, shared with other Render services. Verify actual usage and pricing; no paid add-ons assumed. |
| Tax and contingency reserve | $8 | Leave unused unless a reviewed charge fits within the total. It does not authorize a new subscription or larger API allocation. |
| **Total approved maximum** | **$25** | **$17 allocated services + $8 reserve. Approved by Sabine on 9 October 2026; remaining technology/account preflight still applies.** |

Tavus advertises Free CVI minutes and a $59/month paid tier with 100 minutes. Its pricing page also contains alternative plan tables, so verify the developer account's actual offer. Paid plans permit uncapped overage. Billing can start at conversation creation, including abandoned joins; connected-time limits must include setup and retries. [Tavus pricing](https://www.tavus.io/pricing).

Render lists its smallest paid web compute at $7/month, separate from workspace and usage charges. Its free service sleeps after 15 idle minutes, so it is a poor baseline for startup timing. The $7 plan is a candidate, not a demonstrated capacity result. [Render pricing](https://render.com/pricing), [free service limits](https://render.com/docs/free), [Hobby workspace terms](https://render.com/blog/better-pricing-for-fast-growing-teams).

Sabine reported an existing Supabase Pro plan on 9 October 2026; the account has not been inspected. This replaces the earlier Free-project assumption. Pro includes $10/month in compute credit, enough for one Micro instance across the organization; additional projects start from $10/month. Existing projects may already use that credit. Record the existing recurring subscription separately from any additional experiment charges, and show both in the full cost estimate. The approved $25 experiment ceiling is unchanged: do not incur new project, compute, add-on or overage charges unless the reviewed experiment total fits it. This disclosure does not approve another subscription, higher spending or a hosting change. Revisit availability, backups and production support before launch. [Supabase pricing](https://supabase.com/pricing), [billing scope](https://supabase.com/docs/guides/platform/billing-on-supabase).

### Illustrative OpenAI calculation, not the entire AI bill

For a 20-minute connected experiment, assume 10 minutes of fresh customer audio and 8 minutes of fresh stylist audio. Published tokenization gives approximately 600 input audio tokens and 1,200 output audio tokens per spoken minute. At the published gpt-realtime-2.1 audio rates of $32 input and $64 output per million tokens:

- Fresh input: 10 × 600 × $32 / 1,000,000 = $0.1920.
- Fresh output: 8 × 1,200 × $64 / 1,000,000 = $0.6144.
- Fresh audio subtotal: **$0.8064**.
- If a separate live transcription path processes all 20 minutes at $0.017/minute, add **$0.34**.

This illustration excludes repeated context input, text tokens, cache behavior, images, extraction, look selection, checking, retries and special tokens. The $10 allocation is a reserve for the combined API work, not a prediction that all experiments fit it. Measure actual usage before extending. Model access and IDs must be checked and pinned in the prototype; this priced example does not select the final model. [Official OpenAI pricing](https://developers.openai.com/api/docs/pricing), [voice cost calculation](https://developers.openai.com/api/docs/guides/voice-latency-cost).

### Optional expanded trial, separate future approval

If the first experiment is promising but more avatar time is needed, an illustrative first paid month is $59 Tavus + $7 Render + $10 OpenAI + $0 Supabase + $0 static hosting = **$76 before tax and contingency**. The $0 Supabase entry remains conditional on no additional charges under Sabine's existing Pro plan; the existing subscription must also be shown separately in an all-in monthly view. A proposed $100 total ceiling leaves $24 reserve. Reconfirm the plan and cap connected time below its allowance. This alternative is not authorized by approving the $25 experiment. Production cost and affiliate revenue viability remain unknown until measured usage and actual program terms are available.

### Spending controls required before billed experiments

1. Review the actual account balance, free minutes, plan duration, auto-renewal, tax and total together before any purchase. Count existing project spend; do not fund another account on top of the cap.
2. Start with no more than four runs of up to five connected minutes each. Count failed setup, reconnects and retries in the total 20-minute limit. Shorten runs if the actual plan's per-call maximum is lower.
3. Reserve time and estimated token cost before each run; stop new calls at an $8 OpenAI estimated-usage threshold, leaving $2 of the allocation for in-flight work and reconciliation. Stop earlier if projected total spend reaches the ceiling.
4. Set provider call-duration/join limits, explicitly end abandoned rooms, cancel work on exit, bound output and retry counts, and inspect usage after every run. Vendor alerts alone are insufficient. Billing may lag; reconcile against provider totals before resuming.
5. Use no automatic upgrades, refill or scaling. Review recurring subscriptions before renewal; suspend the experiment's compute when no longer needed. Charges or capabilities outside the assumptions require Sabine's review.

Tavus documents call-duration and join timeouts. The prototype must demonstrate cleanup and stopping behavior; documenting these controls does not mean they exist yet. [Duration controls](https://docs.tavus.io/sections/conversational-video-interface/conversation/customizations/call-duration-and-timeout).

## 5. Privacy review and account preflight

**Public documentation reviewed; account settings have not been inspected.** Synthetic text, generated test audio and permitted garment fixtures can support early work. Sabine speaking into the microphone is real-person media, even when the styling request is fictional. Complete the account preflight and consent explanation before that step.

| Provider/boundary | Finding | Evidence needed before real-person media |
| --- | --- | --- |
| OpenAI | API data is not used for training by default unless opted in. Realtime lists no application-state retention, but default abuse-monitoring content retention can last up to 30 days, with exceptions. Zero Data Retention requires eligibility/approval. | Record actual organization/project controls, endpoint/model choices, tracing and sharing settings. Use store=false where applicable for extraction responses; it does not eliminate abuse logs. Explain remaining retention accurately. |
| Tavus | Recording controls and conversation deletion are documented. Neither a stopped call nor an unset recording destination proves that provider transcripts or logs disappear. The public privacy policy covers multiple services and does not settle our API-specific retention. | Confirm actual room/persona recording and transcript settings, processors, training use, retention, deletion coverage and fallback voice providers. Disable optional recording, memory and post-call transcript persistence. Obtain provider-specific clarification if controls are unclear. |
| Media transport | Tavus's room layer uses additional transport infrastructure. A private room needs authenticated joining. | Record the actual transport/subprocessors and their retention. Require private rooms, narrowly issued join tokens and redacted URLs/logs. Do not expose a public join link. |
| App, Supabase and hosts | App code controls which fields it persists or logs, but account storage/logging/backups need configuration. | Use synthetic test accounts, private images and owner policies; inspect request logs, analytics, traces and error reporting for accidental content capture. Record regions and applicable backup/deletion behavior before customers. |

Sources: [OpenAI data controls](https://developers.openai.com/api/docs/guides/your-data), [Tavus recordings](https://docs.tavus.io/sections/conversational-video-interface/quickstart/conversation-recordings), [Tavus deletion API](https://docs.tavus.io/api-reference/conversations/delete-conversation), [Tavus privacy policy](https://www.tavus.io/privacy-policy), [private rooms](https://docs.tavus.io/sections/conversational-video-interface/conversation/customizations/private-rooms).

Create a redacted preflight record in the approved prototype group with date, account tier, endpoint/model, recording/transcript/tracing settings, remaining provider retention, deletion limitations, selected voice provider, consent text and reviewer. Do not put credentials or customer media in the repository. If retention or provider compliance is unresolved, hold real-person media and continue synthetic/offline checks. Risks R07 and R11 stay open.

## 6. Remaining work and account actions

| Checkpoint | Work | Sabine's involvement |
| --- | --- | --- |
| Finish 1a review | Complete: $25 cap, Supabase + Render, React + TypeScript, Node.js + TypeScript and private-prototype-only memory tradeoff recorded. Remaining implementation settings stay pending in their designated groups. | Approve the separate 1b group plan before prototype implementation. |
| 1b preparation | Establish private prototype access and a small isolated harness; inspect actual OpenAI/Tavus accounts, credits, controls and compatible API contracts. | Sign in or create missing accounts only when needed, one step at a time. Credentials go into protected settings. |
| 1b media proof | Validate format conversion, streaming, lip synchronization, interruption, cancellation, provider policy and per-run usage. | After privacy preflight, try the same stylist on her phone and review realism. |
| 1c note/camera/gate proof | Prove notes during continuous speech, immediate corrections, stale-event safety, confirmed still preservation, and blocking visual/spoken recommendations until checked. | Follow the listed manual scenarios. No full catalog needed for clearly labeled synthetic fixtures. |
| 1d source/privacy review | Check permitted US product data, image rights and affiliate eligibility; close provider-specific privacy gaps. | Choose/apply to programs or contact providers only after explicit authorization. |
| 1e baseline review | Review measured costs, quality and failures; decide production limits, model IDs, session recovery, final media path and source plan. | Accept tradeoffs or request revisions; create MVP memory from accepted findings. |

Google/Apple configuration, production email, public hosting and live customer recruitment are later setup checkpoints. No account creation, payment, deployment, application implementation or GitHub publication occurred in Task 1a.

## 7. Task 1a review checklist

- [x] Record existing Supabase, account-method, phone-website, provider-exclusion and single-consultation decisions without changing them.
- [x] Prepare framework/hosting recommendations, preliminary data boundaries, cost assumptions, critical dependencies and account preflight requirements.
- [x] Identify what is still unknown: actual account entitlements/settings, bridge behavior, model costs, real catalog access and production operating cost.
- [x] Sabine approved React + TypeScript and Node.js + TypeScript, and accepted volatile notes for the private prototype only, by replying "1a and 2a" on 9 October 2026. Recorded D12/D13; customer MVP recovery still requires pre-launch review.
- [x] Sabine approved the $25 total initial-experiment ceiling on 9 October 2026 in response to the spending-limit question. Allocation: up to $10 OpenAI, $7 hosting and $8 reserve, using available free Tavus minutes. The $100 expanded option, upgrades and recurring renewal beyond this experiment are not approved.

Group 1a is a documentation/review group. No app test harness exists, no automated app tests were run, and no phone/provider integration is reported as passed. The manual decision review is now recorded above and the documentation consistency checks are complete. Task 1a is complete as a planning group. Account preflight and integration evidence remain required in the prototype groups; Task 1b is not approved or started. The remaining Phase 1 automated and real-device checks belong to their prototype groups.

## Approval record

- 9 October 2026: Sabine replied "approved" to the question asking for a $25 total spending limit for the first private prototype experiment. Recorded this budget approval only. At that point technology choices, experimental memory behavior and starting Task 1b still required their planned review; the later hosting approval is recorded below. No purchase or billed call has occurred.

## Account information update

- 9 October 2026: Sabine reported that she already has Supabase Pro. Corrected the worksheet assumption; organization, project allocation, available compute credit and actual incremental charges remain unverified. This is account information, not approval of the pending Supabase + Render hosting proposal.

- 9 October 2026: Sabine selected "Supabase + Render for the MVP." Supabase retains accounts/preferences/wardrobe photos/saved looks; Render hosts the website and conversation service. This supersedes the Cloudflare Pages proposal. Framework/runtime, service configuration and experimental memory remain under review. The $25 experiment limit is unchanged; no billed setup or deployment is reported.

- 9 October 2026: Sabine replied "1a and 2a." Recorded tool and private-prototype restart approvals in D12/D13. Task 1a planning review complete; customer MVP recovery remains a pre-launch decision. The $25 cap and existing save/privacy boundaries are unchanged.
