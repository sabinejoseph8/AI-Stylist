# AI Stylist: Product specification

Status: Approved product baseline, v1.0  
Approved by Sabine: 8 October 2026  
Updated: 9 October 2026  
Basis: AI Personal Stylist retailer-independent PRD and prioritized backlog v1.8, plus Sabine's subsequent instructions.  
Related document: [Approved design specification](design.md)

## Purpose and audience

Help a customer choose a look by talking naturally with a highly realistic AI personal stylist. The customer can explain an occasion, show clothing they already own, see what the stylist has understood, and refine suggestions until they find a look they like.

The first version will serve both women and men in the United States, as confirmed by Sabine. Prices and budgets use US dollars (USD). The app's revenue model is affiliate program commissions on qualifying purchases made through its affiliate shopping links. The experience should work primarily on a phone, with touch and text alternatives to voice.

## Decisions already established

- Customers can use email/password with password recovery, Google sign-in or Apple sign-in in the first version, as approved by Sabine on 9 October 2026.
- Customers must create an account and sign in before using the stylist. Returning customers sign in to their existing account; guest styling is outside the first-version scope.
- The stylist collects initial style preferences during the first conversation. Customers do not need to complete a separate style questionnaire before starting.
- One consistent, photorealistic female AI stylist is central to the experience. Realism, natural conversation, interruptions, and speech synchronization require a prototype before implementation is finalized.
- The notebook is a core MVP feature. Its visible title is **My Styling Notes**.
- The first version includes a digital wardrobe. Customers choose which owned-item photos to save and reuse in later conversations.
- Customers can upload a photo, take a photo, or show clothing through a live camera during the conversation. The uploaded photo or customer-confirmed still image must appear in the notebook and remain visible while styling around that item.
- Present one look at a time. Customers can repeatedly give likes and dislikes and receive a revised look.
- Saving a look saves only the look, not its related notebook notes, feedback, or conversation history.
- A background validation agent checks every look against current saved preferences and confirmed session requirements before it is shown.
- The first launch market is the United States, with prices and budgets in US dollars (USD).
- Revenue comes from affiliate program commissions on qualifying purchases through approved affiliate shopping links. Specific programs, retailer approvals, commission rates, and attribution terms still need confirmation.
- The first version includes real product links customers can shop from on retailer websites. The app remains independent of any single retailer. Sample or synthetic catalog content may support development, but cannot satisfy the launch requirement for shoppable recommendations.
- Sabine has selected **Supabase** as the platform and approved its role for accounts, saved preferences, wardrobe photos and saved looks on 9 October 2026. Supabase + Render is approved for MVP hosting on 9 October 2026, with Render for the website and conversation service. Remaining architecture and operational details are under technical review.

This document is the agreed product baseline approved by Sabine on 8 October 2026. It specifies customer needs and observable behavior. Sabine separately approved design.md v1.0 on 9 October 2026. The [technical decision document v0.11](tech-spec.md) records the approved phone website delivery, Supabase + Render hosting, React + TypeScript website and Node.js + TypeScript service, alongside remaining proposals. Task 1a planning review is complete; Task 1b is approved and in progress; a local simulation and scripted desktop provider connection exist, with continuous conversation and phone verification still pending. These planning decisions do not change the agreed customer behavior in this product scope. Restart loss of unsaved notes is accepted only for the private prototype; customer MVP recovery must be reviewed before launch.

## Customer journeys

1. Create an account and sign in before using the stylist, or sign in to an existing account. Start the consultation without completing a separate style questionnaire. Choose permissions when needed and what may be remembered.
2. During the first conversation, the stylist collects initial style preferences, exclusions, relevant sizes, and budget through natural questions. Describe the occasion, timing, colors, desired style, budget, and look type in ordinary language.
3. Watch the notebook update while speaking. Correct it by touching a field or saying a correction.
4. Optionally upload a photo, take a photo, or show clothing through a live camera while talking with the stylist. Select and confirm a still image for the notebook, the relevant item, and whether it is owned clothing or inspiration.
5. Receive one coordinated look at a time using confirmed requirements and any selected owned items. Every look passes the preference check before presentation.
6. Say what to keep or change, or use touch controls. Review another look, repeat feedback, compare earlier looks, or undo the latest feedback.
7. Save a chosen look without its related notebook notes or conversation history. Separately choose which owned-item photos to save in the digital wardrobe, and retrieve those items in later styling conversations. Optionally save new product links in a shopping list. Follow a product link to the retailer website to buy it.
8. Revisit saved looks and preferences, correct them, export personal data, or delete it.

## MVP requirements

### PS-01: Profile and customer control

Account creation and sign-in are required before a customer can start a styling consultation, receive personalized looks, or show clothing to the stylist. Returning customers sign in to their existing account. Provide understandable account creation, sign-in, sign-out, and account access recovery flows. Support email/password with password recovery, Google sign-in and Apple sign-in. A successful first social sign-in may create the account; customer access still requires completed authentication. If sign-in fails, explain the problem and let the customer retry or recover access. Creating an account does not automatically grant microphone or camera access or consent to permanent storage of session notes and images.

Collect initial preferences during the first conversation, rather than requiring a style profile form before the consultation. Capture them progressively in the notebook, allow voice or touch corrections, and distinguish confirmed preferences from uncertain or missing information. Ask only the next useful question; an incomplete profile does not prevent starting the conversation. Request information needed to check a look before presenting it. Offer an explicit choice to save confirmed, reusable preferences to the profile for future sessions; conversation answers alone do not grant permanent-save consent.

Customers can save, retrieve, edit, and remove their style preferences, sizes, budgets, and wardrobe information across sessions. Distinguish an explicit requirement or exclusion from a preference used to rank suitable options. A session instruction does not silently change the saved profile.

Ask separately for microphone access, camera access, and permanent wardrobe storage. Explain the purpose at the moment each is needed. Customers can revoke access and continue through available alternatives.

### PS-02: Realistic stylist and natural conversation

The customer sees one consistent photorealistic female stylist and can speak naturally, interrupt, ask questions, and correct information without restarting the consultation. The stylist collects initial preferences during the first consultation and asks concise follow-ups when important information is missing or ambiguous. Returning sessions use saved preferences and ask about the current occasion or changes instead of repeating the full initial interview.

Show captions and provide a touch/text path. If video fails, offer an audio-only session; if voice is unavailable or permission is denied, offer touch/text styling. Make listening, speaking, reconnecting, and error states understandable. Clearly identify the stylist as AI.

OpenAI Realtime and Tavus are the intended conversation and avatar candidates from the existing plan. Sabine excluded ElevenLabs on 9 October 2026; voice and agent services, including provider choices inside Tavus and fallbacks, must comply with that constraint. The candidates' suitability and connection are pending discovery; this is not a finalized technical architecture.

### PS-03: Live Styling Notes

The notebook captures structured information progressively during the customer's speech, including a continuous turn that has not yet ended. Customers can see what the stylist understood without interrupting it.

| Styling detail | Required behavior |
| --- | --- |
| Occasion | Capture the event or use case, such as an outdoor wedding. |
| Season and date | Preserve season, month, exact date, or approximate date as supplied. Confirm ambiguity; do not infer season from a month alone. |
| Color | Capture preferred colors and explicit color exclusions with their intended scope. |
| Style | Capture descriptions such as elegant or casual using the customer's meaning. |
| Budget | Show amount, currency, and whether it is a maximum, target, or range. |
| Look type | Capture a dress, pantsuit, separates, or another requested type; ask when it matters. |
| Owned wardrobe | Show the customer's selected items and their confirmed details. |

Each field shows **Not specified**, **To confirm**, or **Confirmed**. Mark customer edits clearly. “Not specified” is the display label for a value not yet provided. Uncertain extraction never becomes a hard requirement without confirmation.

Touching a field opens an edit with Save and Cancel. Voice corrections such as “Actually, make my budget $350” replace the earlier value promptly and refresh affected suggestions. Late transcription or analysis cannot undo a newer customer correction. Missing information prompts only the next useful question.

Customers can collapse and reopen the notebook without losing its contents. Confirmed notes and saved requirements govern recommendations together; contradictions prompt clarification.

### PS-04: Item images and wardrobe

Support photo upload, taking a photo, and live camera showing during the styling conversation in the first version. Customers explicitly start the live camera after permission, see their camera preview and a clear active indicator, and can stop it at any time while continuing the conversation. The stylist can consider the clothing shown and ask for a closer or clearer view when recognition is uncertain.

Let the customer capture a still image by voice or touch and confirm it as the item reference. Display that actual image in the notebook and retain it when the camera stops, subject to the existing session privacy controls. Showing another item on camera does not silently replace the confirmed reference. Live camera viewing does not automatically record or permanently save the stream. If camera access or connection fails, offer photo upload or an editable item description without losing the conversation or confirmed reference.

Display the actual supplied photo in **Style around this item** inside the notebook. Show a preview before recognition finishes, preserve the garment's proportions, and allow accessible enlargement. Keep the thumbnail and label visible when the notebook is collapsed.

If a photo contains several items, ask which one to style around. If several images are supplied, show their thumbnails and identify the active reference. Customers can select, replace, remove, and correct the reference by voice or touch. Recognition errors retain the image and offer retry or an editable description.

Confirm whether the item is owned or is inspiration. An owned anchor stays in subsequent looks until the customer changes that instruction and is excluded from purchase totals. Inspiration alternatives are labeled clearly; a photo alone must not imply an exact retail product, price, or availability.

Include a digital wardrobe in the first version. Customers can choose to save owned-item photos and confirmed item details to their account through an explicit Save to wardrobe action. They can retrieve saved items in later conversations, select one or several to build a look around, and edit or delete them. The actual saved photo remains available as the notebook reference when an item is reused. Reusing a wardrobe item applies the current session requirements and preference checks. A session photo is not automatically saved permanently; choosing not to save an item does not prevent styling around it during the current conversation. Replacing or removing an active reference refreshes affected suggestions; delayed recognition cannot restore the previous reference.

### PS-05: Visual look suggestions

Present one coordinated look at a time, containing selected owned items and suitable real products for new items. Each new product shows its image, name, retailer, available price and currency, and a clearly labeled Shop at [retailer] link to the actual product page. Distinguish owned items from items available to shop. Explain why the look fits the request. After customer feedback, present one revised look. Earlier looks remain available for the existing comparison and undo flow.

Exclude owned items from purchase totals. Show the total for new items using verified source prices in the customer's confirmed currency, with a last-checked time. Label it as an estimate and explain whether shipping and tax are included or unknown; the retailer confirms the final price and availability. Never invent a product, price, size availability, or shopping URL, and do not report a complete total or a confirmed budget match when required prices are missing. Clarify whether the budget covers item prices only or also shipping and tax.

For the first version, use US product pages and USD prices from retailers serving the United States. Check delivery eligibility for the customer's confirmed US destination and requested size when the necessary information is available; do not assume a retailer delivers to every US location. Show uncertainty and ask when it affects the recommendation. Other shopping countries and currencies are outside the initial launch scope. If a product link fails or an item becomes unavailable, explain it and offer a replacement that passes the same preference check while keeping the customer's selected pieces. Provide clear loading, empty, and failure states. If no look meets the confirmed requirements, explain the unmet requirement and ask what the customer would like to change.

### PS-06: Feedback and refinement

Customers can give positive, negative, or mixed feedback about a look, an item, or an attribute. Support voice, Keep, Change, and free-text input. Clarify ambiguous references such as “I like that but not this.”

Record **Likes**, **Dislikes**, **Requested changes**, and **Items to keep** under **Feedback on this look** in the notebook. Identify the relevant look and item. Keep tentative feedback visible as To confirm and allow corrections.

Keep explicitly liked or kept pieces, change rejected pieces, and coordinate replacements with the retained look. Honor the scope of feedback: rejecting this pair of shoes does not automatically mean rejecting every high heel or saving a permanent preference.

Support at least three consecutive feedback rounds in one session, comparison with earlier looks, and undo of the latest feedback. Explain what changed, what stayed, and the updated total. Use the latest budget, occasion, preferences, and owned anchor for every revision. Ask before changing a conflicting requirement or a kept item.

While revising, retain the previous look with an appropriate status. If changed requirements make it obsolete, label it as needing a new check and disable actions that treat it as current. Late results cannot replace newer choices. A failure preserves useful feedback and offers retry or touch editing.

### PS-07: Background preference validation

Before presenting a look, a separate background agent checks the complete look against the customer's latest saved requirements, confirmed notebook values, scoped feedback, kept items, and owned reference. Apply this check to initial suggestions, revisions, swaps, restored or reopened looks, and additions to the shopping list.

Conflicting candidates stay out of the recommendation view while the stylist modifies and checks them again. Unknown information required to check a constraint prompts clarification or a different candidate. Subjective style compatibility must not be presented as certain when it remains ambiguous.

Show **Checking your preferences** while the check runs. Failure, timeout, or disconnection holds the new suggestion and offers recovery. Repeated attempts must eventually explain an unmet requirement rather than continue indefinitely or relax it silently.

If a new request contradicts a saved preference, ask the customer. An explicit session exception must be confirmed, visible in the notebook, and expire with the session. Updating a saved preference requires a separate save action. A change to the profile, notebook, feedback, or item image invalidates affected checks immediately; an old approval cannot release an obsolete look.

### PS-08: Saved looks and shopping links

Customers can save, reopen, and remove looks. Saving a look retains the look itself, including its visual arrangement, component items, shopping links, and the dated price estimate available when saved. It does not save the related notebook notes, feedback, full conversation, or session revision history. It does not automatically save preferences to the profile or clothing photos to the digital wardrobe; those use their separate explicit save actions. Reopening or restoring a look checks current saved preferences and confirmed requirements from the new session before treating it as a current recommendation. Do not restore old notebook values as new session requirements.

Customers can explicitly save shoppable products in a shopping list and remove them. Owned items are excluded. Each shopping action opens the corresponding retailer product page, with a clear indication that the customer is leaving the app. Purchases, payment, shipping, and returns are handled on the retailer website. A multi-retailer look may require separate purchases. Accepting a look does not automatically save preferences, add products, or buy anything. Recheck product information and current requirements before treating a saved look or list item as a current recommendation; mark unavailable products and offer a suitable replacement.

Disclose clearly, close to affiliate shopping links, that the app may earn a commission from qualifying purchases. Use approved affiliate links where a program is confirmed and preserve the program's required attribution. A non-affiliate product link must not be represented as commission-earning. Do not present a retailer partnership or affiliate arrangement as established unless it is confirmed. Commission opportunities must never override the customer's saved requirements, confirmed notebook values, budget, kept items, or feedback.

### PS-09: Privacy and accessibility

Keep notebook notes, feedback, and session revision history within the current session; saving a look does not retain them. Obtain consent and an explicit action before saving reusable profile preferences, wardrobe items, or looks beyond the session. Provide correction, session clearing, export, deletion, and understandable retention choices.

Protect each customer's profile and images from other customers. Do not infer sensitive attributes from style preferences. Do not retain raw audio, full transcripts, or live camera streams by default. Validation records contain only necessary decision reasons and references, without raw photos, transcripts, or audio.

Provide readable text, sufficient contrast, visible focus, screen-reader support, keyboard and switch access, captions, reduced motion, and touch targets of at least 44 by 44 CSS pixels. Changes must not unexpectedly move focus or repeatedly interrupt speech. Notebook decoration and color are never the only way to understand a value or status.

## Acceptance scenarios

| ID | Scenario and expected result |
| --- | --- |
| A01 | Customer describes an outdoor wedding in November, elegant style, emerald green, and $500. The notebook captures supplied details progressively. Currency, season, and budget meaning are confirmed when ambiguous; look type and wardrobe stay Not specified until provided. |
| A02 | Stable notes appear within 2 seconds at the 95th percentile and before a continuous multi-sentence turn ends. |
| A03 | A saved touch correction reaches the active styling context within 1 second. A voice correction reaches it within 2 seconds after understanding. A correction from $500 to $350 refreshes affected results. |
| A04 | A jacket photo appears before analysis completes, remains as a collapsed thumbnail, can be enlarged, and stays the owned anchor through three feedback rounds. Its cost is excluded from totals. |
| A05 | Multi-item photos, uncertain recognition, and ownership ambiguity prompt confirmation. Replacing or removing the reference works by voice or touch, without late events restoring it. |
| A06 | The customer receives one coordinated look at a time with clear owned/shoppable labels and real retailer product links for new items. After feedback, one revised look is presented. A saved no-high-heels exclusion blocks high heels before they appear. |
| A07 | “Keep the dress and bag, but replace the high heels with lower heels” retains the named pieces and changes the shoes. Three feedback rounds preserve current constraints and show explanations and totals. |
| A08 | A conflicting request prompts a focused question. A confirmed session exception is visible and does not silently change the profile. |
| A09 | A budget or preference changes while a look is being prepared. An obsolete check or delayed result cannot publish it. Restored looks and additions to the shopping list also pass current checks. |
| A10 | The customer can compare, undo feedback, save, reopen, and delete looks, and explicitly save product links to a shopping list. A Shop at [retailer] action opens the matching real product page; purchasing happens on that retailer website. No product is automatically purchased or added to a retailer cart. |
| A11 | Denied camera/microphone access, recognition failure, and service timeouts offer usable recovery. Failed preference validation never releases an unchecked look. |
| A12 | The core journey works with touch/text, captions, screen readers, keyboard/switch input, and reduced motion. Notebook status remains understandable without color. |
| A13 | Session clearing and authorized export/deletion cover notes, feedback, wardrobe images, saved preferences, looks, and associated records as applicable. Permanent saving of profiles, wardrobe items, and looks requires explicit consent and a save action; notebook notes and session feedback are not saved with a look. |
| A14 | During a conversation, the customer starts the live camera with permission, shows a garment, and captures and confirms a still by voice or touch. The actual still appears in the notebook and remains after the camera stops. A different item shown later does not replace it without confirmation. Stopping or losing the camera preserves the conversation and reference, with upload or description alternatives available. The stream is not automatically recorded or permanently saved. |
| A15 | Each new item links to its matching real retailer product page. The look shows a source-backed, dated estimate in the confirmed currency, excludes owned items, and identifies unknown shipping or tax. Missing prices never yield a complete or falsely budget-compliant total. A broken link or unavailable item offers a checked replacement; any affiliate relationship is disclosed. |
| A16 | For a US customer, new-item links open the US product pages and prices and budgets are in USD. Recommendations consider the confirmed delivery destination and requested size; unavailable or unverified delivery is not presented as confirmed. Unsupported shopping countries or currencies are explained without inventing availability or conversion. |
| A17 | Affiliate shopping links use the confirmed program attribution and show a clear commission disclosure nearby. Non-affiliate links are not presented as commission-earning, and commission opportunities cannot bypass customer constraints or preference validation. A click alone is not treated as earned commission. |
| A18 | A customer who is not signed in must create an account and sign in, or sign in to an existing account, before starting a consultation or receiving personalized looks. Successful sign-in through email/password, Google or Apple enables the styling flow. Canceled or failed social sign-in offers retry or another approved method without guest access. Failed sign-in offers retry and access recovery; signing out prevents further account access. Camera, microphone, and permanent session-data storage still require their separate permissions or consent. |
| A19 | After account creation and sign-in, a new customer starts the stylist conversation without completing a separate style questionnaire. The stylist collects preferences naturally, updates the notebook progressively, asks focused follow-ups, and accepts voice or touch corrections. Confirmed reusable preferences enter the saved profile only with explicit consent and a save action. A returning customer can use those preferences without repeating the full initial interview. |
| A20 | A signed-in customer explicitly saves an owned-item photo and confirmed details to the digital wardrobe. In a later session, they retrieve and select that item; its actual photo appears in the notebook and the stylist includes it in a look checked against current requirements. The customer can edit or delete the wardrobe item. An item not explicitly saved does not become a permanent wardrobe entry, and another customer cannot access it. |
| A21 | The customer saves a look and reopens it in a later session. Its visual arrangement, component items, shopping links, and dated estimate are available, but related notebook notes, feedback, conversation, and session revision history are not stored with it or restored. Reopening uses current requirements and fresh checks. Saving the look does not automatically create wardrobe entries or update the saved profile. |

These are acceptance requirements, not reports of completed implementation or testing. Voice response speed, avatar synchronization, and response targets for revised looks will be agreed during technical discovery and assessed on representative phones and weak networks.

## Revenue model

Sabine has selected affiliate program commissions as the app's revenue model. Customers discover a look in the app, follow its product links to retailer websites, and buy there. The app earns commission only when the purchase qualifies under an approved affiliate program's attribution and payment terms. A link click alone is not recorded as earned commission.

Program selection, applications and approval, eligible retailers and products, commission rates, attribution windows, and treatment of cancellations or returns remain to be confirmed. No affiliate agreement or revenue is assumed to exist already. Recommendations must continue to satisfy the customer's needs, regardless of the available commission. Customer-facing disclosures explain the commercial relationship. The implementation of attribution and revenue reporting is proposed in tech-spec.md; program-specific decisions and working evidence remain pending.

## Product sourcing dependencies

Before launch, select product sources that permit the intended use of their product information and imagery, provide working links to real product pages, and support US shopping with USD prices. Confirm coverage for customers' delivery locations before recommending a product as available to them. Confirm how source prices, currencies, sizes, and availability will be checked and refreshed. Missing product data must remain explicit and cannot bypass preference or budget validation. Confirm affiliate program approval and usable affiliate shopping links for the intended commission-based launch. These are product and revenue dependencies; the proposed implementation approach is in tech-spec.md and still requires source-specific decisions and evidence.

## Deferred scope

Checkout and payment inside the app, a combined checkout across retailers, and retailer cart automation remain future work. Real product links and source-backed product information are required for the first version. Direct retailer integrations and the choice of product sources still need evaluation and are not assumed to be available. Affiliate program selection and approval are launch revenue dependencies, rather than an undecided revenue model. ASOS and FARFETCH are candidates; no partnership is assumed. The Rakuten inquiry remains pending explicit authorization to send.

The technical specification, architecture proposal, proposed data model/interfaces and phased build tasks now exist in tech-spec.md and docs/progress.md. Security configuration, deployment and application implementation remain future work. Follow this approved product baseline and distinguish approved decisions from proposals and unverified implementation.

## Product review confirmations

- 8 October 2026: Sabine approved the full product specification as the agreed product baseline, v1.0. This approval does not approve the separate design draft or any technical architecture and does not imply that implementation or checks have been completed.

- 8 October 2026: Sabine confirmed the reviewed notebook and preference-check behavior without changes: progressive notes; voice and touch edits; visible missing or uncertain values; recorded likes, dislikes, and requested changes; preference checks before every look appears; and clarification of conflicts without silently changing saved preferences. At that review step, confirmation covered the reviewed product behavior; approval of the full specification followed separately.

- 8 October 2026: Sabine confirmed the reviewed privacy and accessibility behavior without changes: customer-controlled saving, editing and deletion; separate camera and microphone permissions; no default retention of voice recordings or live camera streams; and typing, touch, captions, readable text and screen-reader support. At that review step, the full specification still awaited baseline approval.

## Next planning steps

1. Use the separately approved design.md v1.0 alongside this approved product baseline. Its working-prototype checks remain pending.
2. Review tech-spec.md v0.11 with Sabine and use docs/progress.md for the phased build plan. Supabase is approved for accounts, saved preferences, wardrobe photos and saved looks; other proposed uses and remaining architecture choices still need review.
3. Evaluate product sources and affiliate programs, including their availability and approval dependencies. No retailer partnership or affiliate approval is implied by product approval.
4. Work from the existing docs/progress.md plan one approved task group at a time. Task 1a is complete as planning; Task 1b is authorized and its local simulation is implemented; continue provider/account preflight and actual media verification before calling it complete. docs/mvp.md remains scheduled for Task 1e, using approved scope and actual prototype findings.

## Change record

- 8 October 2026: Created the user-focused draft from PRD/backlog v1.8. Recorded Supabase and deferred the technical specification. No product approval or implementation completion is implied.

- 8 October 2026: Sabine confirmed both women and men for the first version and selected look/looks as the product terminology. The remaining specification is still under review.

- 8 October 2026: Sabine chose one look at a time, followed by a revised look in response to feedback. Updated the customer journey, recommendation requirement, and acceptance scenario A06.

- 8 October 2026: Included live camera showing during the conversation alongside photo upload and capture. Added a customer-confirmed notebook still, start/stop controls, recovery behavior, and acceptance scenario A14.

- 8 October 2026: Sabine selected real product links customers can shop from for the first version. Updated recommendations, saved shopping links, price and availability expectations, sourcing dependencies, and acceptance scenarios. Purchases take place on retailer websites; demonstrations alone no longer satisfy launch scope.

- 8 October 2026: Sabine selected the United States as the initial launch market. Recorded USD prices and budgets, US product-page and delivery expectations, sourcing coverage, and acceptance scenario A16.

- 8 October 2026: Sabine selected affiliate program commissions as the revenue model. Added the business model, affiliate disclosure and attribution expectations, program approval dependencies, and acceptance scenario A17.

- 8 October 2026: Sabine confirmed that customers must create an account before using the stylist. Added the sign-in requirement, returning-customer and recovery behavior, separate permission controls, and acceptance scenario A18.

- 8 October 2026: Sabine chose preference collection by the stylist during the first conversation. Removed any prerequisite profile questionnaire from the journey, added conversational collection and explicit profile saving, and added acceptance scenario A19.

- 8 October 2026: Sabine confirmed a digital wardrobe in the first version, with optional customer-selected saving of clothing photos for future sessions. Clarified the save and reuse journey and added acceptance scenario A20.

- 8 October 2026: Sabine chose to save only the look, without related notebook notes. Clarified saved-look contents, separate profile and wardrobe saving, session-only notebook history, and acceptance scenario A21.

- 8 October 2026: Recorded Sabine's confirmation of the reviewed notebook and background preference-check behavior. The full product draft remains under review.

- 8 October 2026: Recorded Sabine's confirmation of the reviewed privacy and accessibility behavior. Prepared the product draft for final baseline review; no technical specification has been created.

- 8 October 2026: Sabine approved the product specification. Promoted draft v0.13 to the agreed product baseline v1.0, retained all requirements and 21 acceptance scenarios, and recorded separate pending design and technical planning work.

- 9 October 2026: Recorded separate approval of design.md v1.0 and updated planning status. Product requirements and acceptance scenarios are unchanged; the approved product baseline remains v1.0.

- 9 October 2026: Recorded technical-spec.md v0.1 as a separate proposal awaiting review. Product requirements and all 21 acceptance scenarios remain unchanged; the approved product baseline remains v1.0.

- 9 October 2026: Sabine selected a website designed for phones as the first delivery approach. Recorded the decision in technical-spec.md v0.2; framework and hosting choices remain pending. Existing product requirements and acceptance scenarios are retained.

- 9 October 2026: Sabine approved email/password with recovery plus Google and Apple sign-in for first-version account access. Updated PS-01 and A18 while retaining existing account, permission and privacy requirements. Technical implementation remains under review.

- 9 October 2026: Updated the canonical technical pointer to tech-spec.md v0.4 and recorded docs/progress.md as the phased draft plan. Sabine confirmed one simultaneous consultation for initial launch; the prototype budget remains undecided. Existing customer requirements and approved visual decisions are retained; no build/test completion is implied.

- 9 October 2026: Sabine approved Supabase for accounts, saved preferences, wardrobe photos and saved looks. Recorded the decision in tech-spec.md v0.5 and progress.md v0.2. Existing save-consent, privacy and customer requirements are unchanged.

- 9 October 2026: Sabine excluded ElevenLabs from the project. Recorded the provider constraint in PS-02, tech-spec.md v0.6 and progress.md v0.3. The realistic stylist, natural voice, notebook and other existing product requirements remain in scope.

- 9 October 2026: Sabine approved Supabase + Render for the MVP. Updated hosting status and current technical pointer; all existing user requirements and acceptance scenarios are retained. The product baseline remains v1.0.

- 9 October 2026: Updated the current technical pointer to v0.9 after tool approval and acceptance of restart loss for the private prototype only. Customer MVP recovery remains under review; approved user requirements and design baseline v1.0 are unchanged.

- 9 October 2026, project memory review: Corrected the stale technical v0.7 reference and future-planning statements. Reconciled current tools, Task 1a completion, pending Task 1b approval and private-prototype-only restart scope. Retained PS-01 through PS-09 and all A01 through A21; approved product baseline v1.0 is unchanged.

- 9 October 2026: Recorded Task 1b approval and current technical v0.10 pointer. Only local synthetic implementation/checks exist; all customer requirements and acceptance scenarios remain the approved v1.0 baseline.
