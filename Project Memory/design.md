# AI Stylist: Design specification

Status: Approved design baseline, v1.0  
Approved by Sabine: 9 October 2026  
Updated: 9 October 2026  
Related document: [Product specification](product-spec.md)

This document is the agreed design baseline approved by Sabine on 9 October 2026, aligned with product-spec.md v1.0. It uses an original fashion journal direction because no reference screenshots were supplied. Generated concept comparisons supported the notebook and typography choices. Approval records the intended design; implementation, usability, and accessibility checks remain future work. The approved product specification governs customer behavior; this design does not change it.

## Established experience requirements

- A photorealistic female stylist leads a natural conversation.
- The mobile consultation places the stylist above **My Styling Notes**, with one current look below. Show that look primarily as a coordinated collage, with individual item details and shopping links beneath it. Revised looks appear one at a time; earlier looks remain available for comparison.
- The notes look like a notebook, update during speech, support touch and voice edits, and collapse without losing context.
- The actual customer-supplied item image appears like a photo placed in the notebook. Its thumbnail stays visible when collapsed.
- Feedback and items to keep remain visible, and every new look is checked against preferences before presentation.
- Customers can use the experience with captions, touch/text, keyboard/switch input, and screen readers.
- Account creation and sign-in come before the first consultation. The stylist collects preferences during that conversation, without a prerequisite profile questionnaire.
- Customers can show clothing through a live camera and confirm a still image for the notebook. They choose which item photos to save to the digital wardrobe.
- Real US product links open retailer websites for shopping, with USD price estimates and clear affiliate commission disclosures.
- Saving a look saves the look only, without its notebook notes, feedback, or conversation history.

## Design principles

1. **Make understanding visible.** Show what was captured, what is uncertain, and what changed. Keep corrections close to the relevant note or garment.
2. **Keep fashion imagery central.** Use quiet surfaces and ample space so garment color, shape, and detail are easy to assess.
3. **Make the notebook useful.** Ruled lines and paper details support the metaphor; readable printed text, clear labels, and simple controls carry the information.
4. **Keep the customer in control.** Distinguish session edits, temporary exceptions, saved preferences, and permanent wardrobe actions.
5. **Explain waiting and recovery.** Use brief messages such as Listening, Revising your look, and Checking your preferences with a clear next action when needed.
6. **Preserve continuity.** Keep the reference item, confirmed requirements, and retained pieces recognizable through every revision.
7. **Design accessibly from the start.** Never rely on voice, decoration, animation, or color alone to complete a task.

## Approved visual language

The approved direction is a calm fashion journal: warm ivory pages, dark ink, restrained deep green accents, and clean garment photography. Avoid ornate handwriting and heavy paper textures. The avatar and actual clothing should supply the visual personality.

### Color palette

| Token | Baseline value | Use |
| --- | --- | --- |
| Canvas | `#F7F4EF` | App background. |
| Surface | `#FFFFFF` | Cards, dialogs, inputs, and look surfaces. |
| Notebook paper | `#FFFCF7` | Notebook page. |
| Ink | `#242321` | Body copy and headings. |
| Secondary ink | `#66625B` | Supporting text and labels. |
| Brand | `#146356` | Primary actions, links, and active selection. |
| Brand strong | `#0E4C42` | Hover/pressed primary actions. |
| Rule/decorative border | `#DED7CA` | Notebook rules and decorative separators. |
| Notebook margin | `#B96556` | Optional decorative margin line. |
| Success | `#2E6A49` | Confirmed status with a check and text label. |
| Attention | `#875500` | To confirm status with a question icon and text. |
| Error | `#A52E39` | Errors with explanatory text. |
| Focus | `#146356` | Clearly visible focus outline on light surfaces. |

Use white text on the brand color for primary actions. Use ink or secondary ink on light surfaces. Decorative border colors are not sufficient for identifying an interactive input; use a stronger visible edge or another clear shape. Check final text contrast, focus visibility, selected states, and component boundaries in implementation.

### Typography

| Role | Baseline |
| --- | --- |
| Editorial headings | Confirmed direction: elegant book-style serif headings, as in the selected concept. Baseline family: Georgia, with any comparable replacement requiring approval. Use for the main page, notebook, and look headings. |
| Interface and notes | Confirmed direction: simple printed sans-serif text for notes, labels, captions, prices, buttons, and other controls. Baseline family: Inter, with system sans-serif fallbacks. |
| Main heading | 32 px on mobile, up to 40 px on larger screens; line height about 1.2. |
| Section heading | 22 to 24 px; line height about 1.3. |
| Body and field values | 16 px; line height 1.5. |
| Supporting labels | 14 px; line height about 1.4. Keep critical information at body size. |
| Buttons | 16 px, medium or semibold. |

Allow system text scaling and long labels. Avoid all-capital paragraphs, decorative handwriting for information, and fixed-height text containers that clip larger text.

### Spacing, shape, and motion

- Use a 4 px spacing scale: 4, 8, 12, 16, 24, 32, and 48 px.
- Begin with 16 px horizontal page padding on phones and 24 px between major sections.
- Use approximately 12 px corner radii for controls/cards and 8 px for the notebook page. Reserve rounded pills for compact status labels.
- Use subtle shadows to separate a floating sheet or photo from its background. Keep the notebook mostly flat and avoid unnecessary page-turn effects.
- Keep primary touch targets at least 44 by 44 CSS pixels, with space between adjacent actions.
- Use short, restrained transitions for expanding notes and updating a field. Respect reduced motion; show a clear text change without requiring animation.

## Main screens and layout

| Screen | Main content and actions |
| --- | --- |
| Welcome and account access | Explain the AI stylist; offer email/password, Continue with Google and Continue with Apple. Create an account or sign in, recover password access when needed, then start a consultation. A canceled or failed provider sign-in offers retry or another method. Request microphone/camera permission when needed and offer alternatives. |
| Style profile | Review and edit preferences collected during conversation, exclusions, sizes, USD budget, and explicit save controls. No required questionnaire before the first consultation. |
| Styling consultation | Avatar, captions, session controls, live notebook, live camera controls, confirmed item reference, and one checked look at a time. |
| Item confirmation | Photo preview, selected garment, uncertain attributes, owned/inspiration choice, replace/remove, and optional save to wardrobe. |
| Wardrobe | Owned-item grid, item details, edit/delete, and multiple-item selection for styling. |
| Saved looks | Saved look cards, open/remove, and a fresh preference check before reuse as current. Do not restore prior notebook notes or conversation history. |
| Shopping list | Explicitly saved product links, retailer names, images, USD estimates with last-checked times, unavailable-item states, removal, affiliate disclosure, and Shop at [retailer] actions. Purchasing happens on retailer websites. |
| Privacy and account | Permissions, remembered preferences, clear session, export/delete controls, and retention choices. |

Confirmed primary navigation: Stylist, Wardrobe, Saved looks, and Profile as the four bottom-menu destinations on mobile. Keep product shopping links inside each look and the shopping list reachable from look actions and the app header.

### Consultation on a phone

Use one vertical scroll surface. Keep the avatar first, notebook second, and one current look third. A compact session control bar stays reachable without obscuring content or the keyboard. Start the notebook collapsed when a consultation begins. Its compact view shows the title, a progressively updated context summary, a pending-confirmation indicator, and the active item thumbnail when one has been supplied. Before an item is supplied, show no invented thumbnail. Customers can expand it at any time to see and edit all notes. Preserve their expanded or collapsed choice during the current conversation; new notes do not force a layout change or move focus.

When the customer opens an edit or types feedback, keep the relevant content in view and return focus to the originating control afterward. Captions remain available while scrolling. Avoid an oversized avatar that makes the notebook difficult to reach.

On larger screens, a two-column layout places the avatar and notebook together beside the current look area. Preserve the reading order for assistive technology. Exact breakpoints and panel sizes will be checked with real content and text scaling.

## Main UI components

### Stylist stage and session controls

An aspect-ratio-preserving avatar frame, AI label, captions area, and labeled controls for mute, captions, text input, item upload, taking a photo, starting/stopping the live camera, capturing a still, and ending the session. Show an active camera indicator and preview only when the customer has enabled the camera. Confirm a captured still before using it as the notebook reference. Stopping the camera preserves the conversation and confirmed item. Indicate Listening, Speaking, Reconnecting, and unavailable-video states. Avoid showing microphone activity when the microphone is off.

### Notebook shell and note row

The shell includes **My Styling Notes**, expand/collapse, a pending-confirmation count, and customer controls for clearing session notes. The default is collapsed. As preferences are captured or corrected, update the visible summary and confirmation count progressively so the customer still sees what is understood; the expanded view exposes the complete structured fields, feedback, and item photo. Keep the active item thumbnail visible in the collapsed state. Use subtle ruled lines and an optional margin line. Lines must not cross or obscure text.

Each note row contains a field label, readable value, status icon plus text, and edit action. Use a shared anatomy for occasion, season/date, color, style, budget, look type, and wardrobe. A saved edit can briefly show Updated; preserve the current value without flicker. The edit sheet provides a labeled field, Save, and Cancel.

Show the relevant saved preferences in a clearly labeled section. An explicit session exception shows its affected preference and **This session only**. Saving a profile change uses a distinct action.

### Photo placed in the notebook

Use the actual uploaded image on a quiet photo surface with a slim border and restrained shadow. A small tape-like decorative accent may be explored, provided it never covers the garment. Preserve image proportions and important details; use fit-inside presentation where cropping would remove information.

Under **Style around this item**, show the image, item label, selected-item indicator, analysis/confirmation state, and owned/inspiration status. Provide Enlarge, Replace, Remove, and reference-selection controls. Multiple images use an accessible thumbnail strip. The active thumbnail remains in the collapsed notebook. Image descriptions are editable when recognition is uncertain.

### Feedback section

**Feedback on this look** contains Likes, Dislikes, Requested changes, and Items to keep. Tie entries to a visible look/item label. Show uncertainty and allow correction. Use short lists or wrapping tags, with complete readable text available. Kept-item marks include both an icon and the word Keep.

### Look card and item tile

Display one current look card with a coordinated collage as its main visual, showing the complete set of selected garments and accessories together. Use the actual item images available for the selected owned and retail products, preserving garment colors, proportions, and details. Place individual item details below the collage, including owned/shoppable/inspiration labels, available USD prices, retailer names and shopping links. Include a look label, why it fits, an estimated new-item total in USD with a last-checked time, and actions for feedback, comparison, saving, and adding product links to the shopping list. Unknown prices, shipping, or tax remain explicit; do not show a complete or confirmed budget-compliant total when required costs are unknown. Revisions replace the current recommendation while keeping earlier looks available through comparison controls.

Each item tile supports Keep and Change, a meaningful image description, and access to details. An owned item says **Owned**, without a purchase price. A shoppable product shows its name, retailer, available USD price, and **Shop at [retailer]** link to its real product page. Place a readable affiliate commission disclosure close to affiliate links. Inspiration alternatives say so explicitly. Updated looks identify changed and retained pieces. Broken links, unavailable sizes, or unverified delivery have clear recovery states and a checked replacement option.

Cards containing unvalidated candidates never appear as customer recommendations. A waiting area can say **Checking your preferences** without revealing rejected items. Previously visible looks needing revalidation are labeled clearly and have current-look actions disabled until the check succeeds.

### Comparison and revision controls

Use a revision label and concise change summary. On a phone, compare two looks through labeled tabs or stacked cards rather than squeezing images into unreadable columns. Provide Undo latest feedback, Continue refining, and Save look. Saving retains the look only; do not attach notebook notes, feedback, or conversation history. Profile and wardrobe saving remain separate actions. Recheck any earlier look before restoring it as current.

### Shared controls and feedback

Use consistent buttons, labeled inputs, currency/amount controls, confirmation dialogs, sheets, inline errors, loading placeholders, and status messages. Destructive actions identify the affected item or data. Critical errors stay visible until resolved; avoid relying on short-lived notifications.

## Required interface states

| State | Customer sees and can do |
| --- | --- |
| Empty notebook | Clear labels and Not specified values; continue speaking or edit a field. |
| Tentative note | To confirm plus the captured value and an easy confirmation/edit path. |
| Photo loading or analysis | Actual preview when available and an honest progress label. |
| Recognition failure | Retained photo, manual description, and retry/replace. |
| No suitable look | Relevant unmet preference and a focused question about what to change. |
| Revising | Previous look and feedback retained; obsolete looks clearly marked. |
| Preference conflict | Plain-language explanation, clarification, and explicit session-exception confirmation if requested. |
| Validation failure | New suggestion held; retry or clarification offered. |
| Camera/microphone denied | A clear touch/text or upload alternative. |
| Empty wardrobe/saved looks/shopping list | Explain what belongs here and provide a relevant next action. |
| Offline or service interruption | Preserve useful visible context and offer recovery without implying a completed save. |

## Accessibility and content rules

Keep captions and a complete touch/text path available. Maintain semantic headings and labeled controls; announce important note and look changes politely without moving focus. Support keyboard/switch use, visible focus, text zoom, narrow screens, and reduced motion. Status always includes words and, where useful, an icon. Do not announce every tentative transcript token.

Use concise customer language, such as **What would you like to change?**, **Saved to wardrobe**, and **Checking your preferences**. Distinguish a completed save from a pending one. Keep service/vendor names and internal validation details out of ordinary styling flows. Use clear retailer names, USD prices, dated estimates, and affiliate disclosures for real shopping links. State that purchases happen on the retailer website. Sample development content is explicitly marked and does not satisfy the launch requirement for real shoppable products.

## Confirmed design direction

- 9 October 2026: Sabine approved the full design specification as baseline v1.0, including the visual language, collapsed notebook default, coordinated collage, book-style headings, and four-destination navigation. This does not imply implemented or tested screens.

- 9 October 2026: Sabine chose the calm fashion journal direction: warm ivory backgrounds, dark readable text, deep green buttons and accents, subtle ruled notebook pages with customer photos placed on them, and simple printed note text. At that review step, this confirmed the overall direction; the complete design was approved separately afterward.

- 9 October 2026: Sabine selected the collapsed notebook as the initial consultation state after comparing open and collapsed concept examples. Retain the live summary, pending-confirmation count, and supplied item thumbnail; allow expansion at any time.

- 9 October 2026: Sabine selected a coordinated collage as the main look display. Keep individual item details, prices, and shopping links below the collage.

- 9 October 2026: Sabine selected book-style serif headings with simple printed sans-serif notes and controls after comparing the typography concepts. This confirms the font style direction; final rendering and accessibility checks remain future work.

- 9 October 2026: Sabine confirmed the four-destination bottom menu: Stylist, Wardrobe, Saved looks, and Profile. Product links remain within each look; the shopping list is available from the header and look actions.

## Design approval and prototype checks

- [x] Sabine approved the design specification as the agreed baseline v1.0 on 9 October 2026.
- [ ] Verify notebook readability and editing in a working prototype.
- [ ] Verify that the stylist, notes, photo reference, live camera controls, and one current look fit the mobile consultation flow.
- [ ] Verify uploaded item details in expanded and collapsed states.
- [ ] Verify feedback, repeated revisions, confirmation, and preference-conflict states.
- [ ] Verify all screens, account access, conversational preference collection, navigation, real shopping links, affiliate disclosures, and recovery states against the approved product spec.
- [ ] Check text contrast, focus, touch targets, captions, screen readers, and text scaling in the working prototype.

The product specification and this design specification are approved. The concept images are illustrative, and no completed interface testing is claimed. The technical proposal is now tech-spec.md v0.11 and is under separate review; docs/progress.md contains the draft phased build plan. Phone website delivery, the sign-in methods, core Supabase roles, Supabase + Render MVP hosting, React + TypeScript website and Node.js + TypeScript service are approved. Task 1a planning is complete; Task 1b is approved and in progress. A local simulation applies the existing visual tokens; a desktop smoke check passed. A scripted desktop avatar/voice probe was observed; natural conversation, precise lip-sync, phone and full accessibility checks remain pending. Restart loss of unsaved notes is accepted only for the private prototype; customer MVP recovery still needs review. The existing interruption states remain the design baseline, and no new recovery behavior is approved by this memory review.

## Change record

- 8 October 2026: Created an original design proposal because no screenshots exist. Preserved the established notebook, reference-photo, feedback, and preference-validation requirements.

- 9 October 2026: Aligned the design draft with the approved product baseline: look terminology, one current look, account access, conversational preferences, live camera, digital wardrobe, saving looks without notes, real US shopping links, USD, and affiliate commission disclosures. The proposed visual styling is still awaiting review.

- 9 October 2026: Recorded Sabine's approval of the overall fashion journal direction. The remaining design decisions and full design approval are pending.

- 9 October 2026: Confirmed the collapsed notebook default. Clarified progressive updates in the compact summary and preserved customer control over expansion during a conversation.

- 9 October 2026: Confirmed the coordinated collage as the primary look visual, with source item imagery and individual item details and shopping links below.

- 9 October 2026: Confirmed book-style headings with printed notes and controls. Recorded the selected typography direction without claiming prototype checks are complete.

- 9 October 2026: Confirmed primary navigation and prepared the design draft for full baseline review. The full design is not yet approved, and prototype checks remain pending.

- 9 October 2026: Sabine approved the full design. Promoted draft v0.7 to approved design baseline v1.0. Recorded approval separately from pending working-prototype checks and technical planning.

- 9 October 2026: Sabine approved email/password with recovery plus Google and Apple sign-in. Added the account-screen choices and provider cancellation/retry behavior. Existing approved visual language, notebook, collage and navigation remain unchanged. Updated technical planning status.

- 9 October 2026: Updated the canonical technical pointer to tech-spec.md v0.4 and recorded docs/progress.md as the phased draft plan. Sabine confirmed one simultaneous consultation for initial launch; the prototype budget remains undecided. Existing customer requirements and approved visual decisions are retained; no build/test completion is implied.

- 9 October 2026: Updated the current technical pointer to v0.8 and noted Supabase + Render MVP hosting approval. No visual design decision changed; the approved design baseline remains v1.0.

- 9 October 2026: Updated the current technical pointer to v0.9 after tool approval and acceptance of restart loss for the private prototype only. Customer MVP recovery remains under review; approved user requirements and design baseline v1.0 are unchanged.

- 9 October 2026, project memory review: Reviewed all visual tokens, components, screens and pending prototype checks. Updated planning/approval status; kept the notebook, collage, typography, navigation, accessibility and approved design baseline v1.0 unchanged.

- 9 October 2026: Recorded Task 1b local simulation and current technical v0.10 pointer. The notebook-style experiment panel is not the customer notebook implementation. No approved visual token, screen or component requirement changed.

## Local notebook review, 10 October 2026

Sabine completed the 18-step notebook prototype guide and reported that all steps worked. Record the local simulated notebook manual review as passed, including the review of editable/missing/uncertain notes, collapsed summary and photo reference, fixture-check feedback, clearing and keyboard/readability controls. This does not change the approved v1.0 design baseline or establish a full accessibility audit, physical iPhone acceptance, real speech updates or production readiness. No design change was requested in this review.
