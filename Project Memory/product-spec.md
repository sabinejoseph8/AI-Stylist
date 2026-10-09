# AI Stylist: Product specification

Status: Draft for Sabine's review, v0.1  
Updated: 8 October 2026  
Basis: AI Personal Stylist retailer-independent PRD and prioritized backlog v1.8, plus Sabine's subsequent instructions.  
Related document: [Design proposal](design.md)

## Purpose and audience

Help a customer choose an outfit by talking naturally with a highly realistic AI personal stylist. The customer can explain an occasion, show clothing they already own, see what the stylist has understood, and refine suggestions until they find a look they like.

The existing scope covers women's and men's fashion. The first audience segment, launch geography, and monetization approach remain decisions for Sabine. The experience should work primarily on a phone, with touch and text alternatives to voice.

## Decisions already established

- One consistent, photorealistic female AI stylist is central to the experience. Realism, natural conversation, interruptions, and speech synchronization require a prototype before implementation is finalized.
- The notebook is a core MVP feature. Its visible title is **My Styling Notes**.
- An uploaded item photo must appear in the notebook and remain visible while styling around that item.
- Customers can repeatedly give likes and dislikes and receive modified outfits.
- A background validation agent checks every outfit against current saved preferences and confirmed session requirements before it is shown.
- Development is independent of any retailer. Use licensed sample or synthetic catalog content, clearly labeled as demonstrations.
- Sabine has selected **Supabase** for hosting. The architecture, deployment responsibilities, and technical requirements will be proposed after the product spec is agreed.

This document specifies customer needs and observable behavior. Product and design approval are pending. The technical specification is deferred until product alignment.

## Customer journeys

1. Create an account and set or edit a style profile, sizes, preferences, exclusions, and budget. Choose permissions and what may be remembered.
2. Start a styling conversation. Describe the occasion, timing, colors, desired style, budget, and outfit type in ordinary language.
3. Watch the notebook update while speaking. Correct it by touching a field or saying a correction.
4. Optionally upload, photograph, or show an item through the camera. Confirm the item and whether it is owned clothing or inspiration.
5. Receive three coordinated looks using confirmed requirements and any selected owned items. Every look passes the preference check before presentation.
6. Say what to keep or change, or use touch controls. Review another outfit, repeat feedback, compare earlier looks, or undo the latest feedback.
7. Save a chosen outfit, manage owned clothing in a wardrobe, and optionally collect demonstration products in a demo bag.
8. Revisit saved outfits and preferences, correct them, export personal data, or delete it.

## MVP requirements

### PS-01: Profile and customer control

Customers can save, retrieve, edit, and remove their style preferences, sizes, budgets, and wardrobe information across sessions. Distinguish an explicit requirement or exclusion from a preference used to rank suitable options. A session instruction does not silently change the saved profile.

Ask separately for microphone access, camera access, and permanent wardrobe storage. Explain the purpose at the moment each is needed. Customers can revoke access and continue through available alternatives.

### PS-02: Realistic stylist and natural conversation

The customer sees one consistent photorealistic female stylist and can speak naturally, interrupt, ask questions, and correct information without restarting the consultation. The stylist asks concise follow-ups when important information is missing or ambiguous.

Show captions and provide a touch/text path. If video fails, offer an audio-only session; if voice is unavailable or permission is denied, offer touch/text styling. Make listening, speaking, reconnecting, and error states understandable. Clearly identify the stylist as AI.

OpenAI Realtime and Tavus are the intended conversation and avatar candidates from the existing plan. Their suitability and connection are pending discovery; this is not a finalized technical architecture.

### PS-03: Live Styling Notes

The notebook captures structured information progressively during the customer's speech, including a continuous turn that has not yet ended. Customers can see what the stylist understood without interrupting it.

| Styling detail | Required behavior |
| --- | --- |
| Occasion | Capture the event or use case, such as an outdoor wedding. |
| Season and date | Preserve season, month, exact date, or approximate date as supplied. Confirm ambiguity; do not infer season from a month alone. |
| Color | Capture preferred colors and explicit color exclusions with their intended scope. |
| Style | Capture descriptions such as elegant or casual using the customer's meaning. |
| Budget | Show amount, currency, and whether it is a maximum, target, or range. |
| Outfit type | Capture a dress, pantsuit, separates, or another requested type; ask when it matters. |
| Owned wardrobe | Show the customer's selected items and their confirmed details. |

Each field shows **Not specified**, **To confirm**, or **Confirmed**. Mark customer edits clearly. “Not specified” is the display label for a value not yet provided. Uncertain extraction never becomes a hard requirement without confirmation.

Touching a field opens an edit with Save and Cancel. Voice corrections such as “Actually, make my budget $350” replace the earlier value promptly and refresh affected suggestions. Late transcription or analysis cannot undo a newer customer correction. Missing information prompts only the next useful question.

Customers can collapse and reopen the notebook without losing its contents. Confirmed notes and saved requirements govern recommendations together; contradictions prompt clarification.

### PS-04: Item images and wardrobe

Display the actual supplied photo in **Style around this item** inside the notebook. Show a preview before recognition finishes, preserve the garment's proportions, and allow accessible enlargement. Keep the thumbnail and label visible when the notebook is collapsed.

If a photo contains several items, ask which one to style around. If several images are supplied, show their thumbnails and identify the active reference. Customers can select, replace, remove, and correct the reference by voice or touch. Recognition errors retain the image and offer retry or an editable description.

Confirm whether the item is owned or is inspiration. An owned anchor stays in subsequent outfits until the customer changes that instruction and is excluded from purchase totals. Inspiration alternatives are labeled clearly; a photo alone must not imply an exact retail product, price, or availability.

Customers can optionally save owned items to their permanent wardrobe, retrieve them later, select multiple items, and edit or delete them. A session photo is not automatically saved permanently. Replacing or removing an active reference refreshes affected suggestions; delayed recognition cannot restore the previous reference.

### PS-05: Visual outfit suggestions

Show three coordinated looks containing owned items and suitable demonstration catalog items. Each look shows its component items, source labels, a total with currency, and a concise explanation of why it fits the request.

Exclude owned items from purchase totals and label every demo product. Provide clear loading, empty, and failure states. If no outfit meets the confirmed requirements, explain the unmet requirement and ask what the customer would like to change.

### PS-06: Feedback and refinement

Customers can give positive, negative, or mixed feedback about a look, an item, or an attribute. Support voice, Keep, Change, and free-text input. Clarify ambiguous references such as “I like that but not this.”

Record **Likes**, **Dislikes**, **Requested changes**, and **Items to keep** under **Feedback on this outfit** in the notebook. Identify the relevant look and item. Keep tentative feedback visible as To confirm and allow corrections.

Keep explicitly liked or kept pieces, change rejected pieces, and coordinate replacements with the retained outfit. Honor the scope of feedback: rejecting this pair of shoes does not automatically mean rejecting every high heel or saving a permanent preference.

Support at least three consecutive feedback rounds in one session, comparison with earlier looks, and undo of the latest feedback. Explain what changed, what stayed, and the updated total. Use the latest budget, occasion, preferences, and owned anchor for every revision. Ask before changing a conflicting requirement or a kept item.

While revising, retain the previous look with an appropriate status. If changed requirements make it obsolete, label it as needing a new check and disable actions that treat it as current. Late results cannot replace newer choices. A failure preserves useful feedback and offers retry or touch editing.

### PS-07: Background preference validation

Before presenting an outfit, a separate background agent checks the complete look against the customer's latest saved requirements, confirmed notebook values, scoped feedback, kept items, and owned reference. Apply this check to initial suggestions, revisions, swaps, restored or reopened looks, and bag transfers.

Conflicting candidates stay out of the recommendation view while the stylist modifies and checks them again. Unknown information required to check a constraint prompts clarification or a different candidate. Subjective style compatibility must not be presented as certain when it remains ambiguous.

Show **Checking your preferences** while the check runs. Failure, timeout, or disconnection holds the new suggestion and offers recovery. Repeated attempts must eventually explain an unmet requirement rather than continue indefinitely or relax it silently.

If a new request contradicts a saved preference, ask the customer. An explicit session exception must be confirmed, visible in the notebook, and expire with the session. Updating a saved preference requires a separate save action. A change to the profile, notebook, feedback, or item image invalidates affected checks immediately; an old approval cannot release an obsolete look.

### PS-08: Saved looks and demo bag

Customers can save, reopen, and remove outfits. Reopening or restoring a look checks current requirements before treating it as a current recommendation.

Customers can explicitly add eligible demonstration products to a demo bag and remove them. Owned items are excluded. Accepting an outfit does not automatically save preferences, add products, or buy anything. The demo bag cannot trigger payment or imply live stock availability.

### PS-09: Privacy and accessibility

Keep notes, feedback, and revision history within the session by default. Obtain consent and an explicit action before saving personal information beyond the session. Provide correction, session clearing, export, deletion, and understandable retention choices.

Protect each customer's profile and images from other customers. Do not infer sensitive attributes from style preferences. Do not retain raw audio, full transcripts, or live camera streams by default. Validation records contain only necessary decision reasons and references, without raw photos, transcripts, or audio.

Provide readable text, sufficient contrast, visible focus, screen-reader support, keyboard and switch access, captions, reduced motion, and touch targets of at least 44 by 44 CSS pixels. Changes must not unexpectedly move focus or repeatedly interrupt speech. Notebook decoration and color are never the only way to understand a value or status.

## Acceptance scenarios for product review

| ID | Scenario and expected result |
| --- | --- |
| A01 | Customer describes an outdoor wedding in November, elegant style, emerald green, and $500. The notebook captures supplied details progressively. Currency, season, and budget meaning are confirmed when ambiguous; outfit type and wardrobe stay Not specified until provided. |
| A02 | Stable notes appear within 2 seconds at the 95th percentile and before a continuous multi-sentence turn ends. |
| A03 | A saved touch correction reaches the active styling context within 1 second. A voice correction reaches it within 2 seconds after understanding. A correction from $500 to $350 refreshes affected results. |
| A04 | A jacket photo appears before analysis completes, remains as a collapsed thumbnail, can be enlarged, and stays the owned anchor through three feedback rounds. Its cost is excluded from totals. |
| A05 | Multi-item photos, uncertain recognition, and ownership ambiguity prompt confirmation. Replacing or removing the reference works by voice or touch, without late events restoring it. |
| A06 | The customer receives three coordinated looks with clear owned/demo labels. A saved no-high-heels exclusion blocks high heels before they appear. |
| A07 | “Keep the dress and bag, but replace the high heels with lower heels” retains the named pieces and changes the shoes. Three feedback rounds preserve current constraints and show explanations and totals. |
| A08 | A conflicting request prompts a focused question. A confirmed session exception is visible and does not silently change the profile. |
| A09 | A budget or preference changes while an outfit is being prepared. An obsolete check or delayed result cannot publish it. Restored looks and bag transfers also pass current checks. |
| A10 | The customer can compare, undo feedback, save, reopen, and delete looks. Demonstration products can enter a demo bag but cannot be purchased. |
| A11 | Denied camera/microphone access, recognition failure, and service timeouts offer usable recovery. Failed preference validation never releases an unchecked outfit. |
| A12 | The core journey works with touch/text, captions, screen readers, keyboard/switch input, and reduced motion. Notebook status remains understandable without color. |
| A13 | Session clearing, authorized export/deletion, and explicit save consent work for notes, feedback, wardrobe images, saved preferences, and associated records. |

These are acceptance requirements, not reports of completed implementation or testing. Voice response speed, avatar synchronization, and revised-outfit response targets will be agreed during technical discovery and assessed on representative phones and weak networks.

## Deferred scope

Live retailer integration, licensed retail feeds, affiliate agreements, current stock and prices, real checkout, and embedded purchasing remain future work. ASOS and FARFETCH are candidates; no partnership is assumed. The Rakuten inquiry remains pending explicit authorization to send.

The technical specification, architecture proposal, data model, interfaces, security implementation, deployment plan, and build tasks will be created after product alignment.

## Decisions for Sabine's review

1. Confirm the user journeys and MVP scope above, including live camera showing and the demo bag.
2. Choose the first customer segment and launch geography.
3. Review the proposed visual direction in design.md.
4. Decide when the draft becomes the agreed product baseline. Supabase is the recorded platform choice; its detailed responsibilities belong to the later technical proposal.

## Change record

- 8 October 2026: Created the user-focused draft from PRD/backlog v1.8. Recorded Supabase and deferred the technical specification. No product approval or implementation completion is implied.
