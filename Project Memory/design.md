## Session reference and Wardrobe status wording, 15 October 2026

Keep session confirmation and explicit Wardrobe saving separate. Confirmation status should describe the action rather than claim a continuing unsaved state, which becomes false after Save. The Wardrobe status reports actual save results independently. The local browser walkthrough verified this after save and navigation. No palette, layout or component behavior changed.

## Local accessibility and text scaling, 14 October 2026

Keep the approved palette/type/spacing direction. Text sizes now use rem and the root defaults to 100%, respecting user font preferences. Requested page changes update the title and move focus to the page heading; ordinary note updates do not move focus. Keep the skip link/main heading association. Measure the bottom navigation and reserve its actual height in page/scroll clearance. Use a scalable navigation grid that can become two columns for enlarged text without splitting labels. Preserve visible focus, native controls, 44-by-44 active targets, labelled choice hit areas, narrow wrapping and reduced-motion suppression. Local normal/200%-root-text audits pass across four destinations at 320px, including populated sample controls and editor focus. Actual screen-reader, switch, user-agent zoom and physical-device acceptance remain open; the fixture is not customer deployment or certification.

## Local sample comparison and Undo, 13 October 2026

Compare and revisit samples appears under the feedback rehearsal. Labelled selectors choose an earlier sample and an explicitly simulated restore outcome. A bordered comparison lists current/earlier illustrative subtotals, unchanged pieces and replacements; unknown prices stay incomplete and shipping/tax unknown. The earlier collage opens in a separate disclosure labelled not a recommendation. Undo wording explains that only the latest feedback action changes, without restoring pieces or modifying saved preferences. Restore reports checking, uncertainty, conflict, timeout, no match or sample-only restoration, with a visible three-check counter and disabled exhausted action. Existing tokens, form controls and responsive collage are reused. Navigation/session cleanup removes history and Undo state. A 390px automated browser check has no horizontal overflow; human/physical-phone acceptance is not claimed.

## Local feedback rehearsal, 13 October 2026

Stylist includes a separate Try feedback on a sample look panel with fixed sample color blocks and an explicitly labelled owned bag placeholder. Reuse the existing collage, surfaces, type, spacing, borders and focus tokens. Labelled controls select Likes/Dislikes/Requested changes/Items to keep, look versus exact item/attribute scope and short sample text. Ambiguous simulated speech stays To confirm until the customer chooses a target. Lists retain original item names after replacement, display earlier-item status and show kept pieces plus the revision count. Replacing a selected item resets target selection instead of guessing another garment. Clear returns focus to Open; navigation/session cleanup removes the rehearsal. Real recommendation/audio/save/shop remain unavailable. A 390px automated browser check passes without horizontal overflow; no human/physical-phone acceptance is claimed.

## Inactive illustrated draft rehearsal, 13 October 2026

Stylist has Preview an illustrated draft below the sample-look controls. It shows one fixed draft at a time with original dress/shoes SVGs and an optional explicitly selected owned-item placeholder. Contain sizing preserves garment proportions. The desktop grid puts the main piece beside supporting pieces; below 500px it stacks in one column. Existing typography, spacing, surfaces, borders and brand/focus tokens are reused. Price labels distinguish known illustrative subtotal from missing prices and unknown full cost. Recommendation, Save and Shop remain disabled with plain explanations. Clear returns focus to Build; navigation and session cleanup discard the transient draft. Technical source/variant IDs stay out of the visible flow. A 390px browser check passes; human/physical-phone acceptance is not claimed.

## Local sample privacy controls, 13 October 2026

Profile contains Manage sample data below the simulated account controls. Five unchecked category choices make the scope explicit. Prepare shows only included category names; Download is separate and single-use. Cancel discards pending/ready work. Clear opens a named category list with Keep sample data and Confirm sample clearing; focus returns to the clear control after either action. Navigation resets selections and cancels prepared exports. Short explanations distinguish current notes, separately saved preferences, Wardrobe, looks and shopping. Normalized WebP photo copies may be included in local JSON; downloaded files cannot be removed by these controls. There is no real account/provider deletion button or secure-erasure promise. Local Task 7c only. Sabine delegated functional review to automation; browser checks and synthetic photo integration pass. Human readability and physical-device acceptance are not claimed.

# AI Stylist: Design specification

Status: Approved design baseline, v1.0  
Approved by Sabine: 9 October 2026  
Updated: 10 October 2026\
Related document: [Product specification](product-spec.md)

This document is the agreed design baseline approved by Sabine on 9 October 2026, aligned with product-spec.md v1.0. It uses an original fashion journal direction because no reference screenshots were supplied. Generated concept comparisons supported the notebook and typography choices. Approval records the intended design; a local notebook prototype review has passed, while integrated usability, physical-phone notebook and complete accessibility checks remain pending. The approved product specification governs customer behavior; this design does not change it.

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
| Welcome and account access | Explain the AI stylist; offer email/password and password recovery. Both Google and Apple are outside the MVP, per Sabine’s 14 October decisions. Create an account or sign in, recover password access when needed, then start a consultation. A failed sign-in offers retry or recovery. Request microphone/camera permission when needed and offer alternatives. |
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
- [x] Verify notebook readability and editing in the local simulated prototype: Sabine accepted the 18-step review on 10 October 2026. Integrated live/mobile acceptance remains separate.
- [ ] Verify that the stylist, notes, photo reference, live camera controls, and one current look fit the mobile consultation flow.
- [ ] Verify uploaded item details in expanded and collapsed states.
- [ ] Verify feedback, repeated revisions, confirmation, and preference-conflict states.
- [ ] Verify all screens, account access, conversational preference collection, navigation, real shopping links, affiliate disclosures, and recovery states against the approved product spec.
- [ ] Check text contrast, focus, touch targets, captions, screen readers, and text scaling in the working prototype.

The product and design specifications remain approved v1.0 baselines. Desktop and physical iPhone generated avatar speech/mouth movement and bounded interrupt-and-end are accepted. Sabine also accepted the local notebook review and connection rehearsal. These checks do not establish a complete mobile styling journey, live notebook timing, precise lip synchronization, conversational resume or a full accessibility audit. The protected phone prototype exists on Render; the notebook provider preparation remains disabled and separate. Customer MVP restart recovery remains open.

## Current design memory review, 10 October 2026

Reviewed principles, every visual token, component anatomy, screen, required state and accessibility rule. Retained the fashion journal appearance, collapsed notebook with progressive summary and actual photo thumbnail, Georgia-style headings, printed notes, coordinated collage and four navigation destinations. No visual redesign or new customer flow was approved. Simulated server look checks do not mean a live validated look screen or speech path has passed.

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

- 10 October 2026, project memory review: Reconciled completed local notebook and phone experiment evidence with the remaining integrated/device/accessibility checks. Approved design v1.0 is unchanged.

## Approved notes-expiry messaging, 13 October 2026

Explain the approved 30-minute customer-idle and five-minute disconnect notes limits in the local preview. Show a restrained one-minute idle warning without moving focus; expiry clears session notes and drafts with a clear ended-state message. Explicitly saved preferences remain separate. This does not change visual tokens or authorize customer deployment. Exact timing is covered by controlled-clock tests; physical elapsed-time acceptance remains open.

## Local main-app clothing-reference preparation, 13 October 2026

Inside the notebook, Style around this item shows an actual selected image before any recognition. The customer describes the intended garment and explicitly chooses Owned or Inspiration. A separate confirmed reference remains stable until replacement is confirmed; its actual thumbnail is visible while collapsed. Preview and confirmation are distinct, with clear session-only wording. Native dialog enlargement preserves image proportions. Camera-only controls show Start, Capture and Stop; capture does not confirm or save. This is approved local preparation with manual review pending, not a change to the visual tokens or hosted Wardrobe activation.

## Local photo/camera usability accepted, 13 October 2026

Sabine confirmed all ten main-app photo/camera review steps worked and were readable, including confirmation, enlargement, collapsed thumbnail, replacement, multiple photos, stable captured stills, device shutdown on navigation and Clear/End removal. Record this as local-computer usability acceptance, not hosted media, AI recognition, physical-phone or comprehensive accessibility acceptance. No visual-token change was requested.

## Visible-camera ownership, 13 October 2026

Collapsing either the notebook or its camera disclosure stops the local camera while keeping confirmed photos. Reopening reveals stopped controls and never automatically restarts the device. This closes a hidden-preview privacy gap without changing layout tokens or the accepted ten-step photo workflow. Sabine accepted the focused four-step local-computer device-indicator check on 13 October 2026; tests cover the owner lifecycle.

## Local sample Wardrobe, 13 October 2026

Save to sample wardrobe is an explicit action on a confirmed Owned photo, disabled for Inspiration. Wardrobe cards show the actual normalized photo, garment description, selection checkbox, enlarge, description Save/Cancel and a removal confirmation. Up to four selected items appear together inside the sample notebook. Save, session selection and deletion are distinct actions. Explain that explicit sample copies outlive End/Clear but disappear on refresh, and that no permanent wardrobe or look copy exists. This approved local rehearsal does not change production storage policy. Sabine accepted all eight local-computer flow steps as working and readable on 13 October 2026.

### Wardrobe keyboard focus

Return focus to the originating button after description Save/Cancel or Keep item. After removal, focus a neighboring item's selection or the Wardrobe heading if empty. Never focus controls in a hidden panel. Give each card and selection a garment-specific accessible name. Native enlargement retains its Escape/return-focus behavior. Verified with synthetic browser items; comprehensive accessibility acceptance remains pending.

## Local sample Saved looks, 13 October 2026

Show one explicitly labelled illustrated sample at a time in a separate Stylist rehearsal. Color blocks and garment labels show arrangement without implying real products or photo matches. State illustrative USD price/date, exclude owned pieces, and show missing required prices as incomplete. Save only on an explicit button. Saved looks have distinct Reopen/Remove actions and a removal confirmation; returning from review/removal preserves sensible keyboard focus. Reopened samples remain unverified and cannot become current recommendations without fresh checks. Browser-memory copies outlive End/Clear but disappear on refresh. No notes, profile/Wardrobe data or actual product links are saved. Sabine accepted all eight local steps as working and readable on 13 October 2026; production tokens and product requirements are unchanged.

## Local sample shopping list, 13 October 2026

Keep the four main destinations. Place Sample shopping list below Saved looks; show explicit per-piece Add controls on fixed sample looks and reopened samples. Explain Owned exclusion and missing prices beside disabled controls. Saving a look must not add pieces automatically. Show dated illustrative USD price, no live-validation claim and no retailer destination. Mark unavailable/recheck states, incomplete subtotal and explicit sample restore/recheck controls. Use Keep/Confirm for removal and restore focus to the origin or list heading. Sample list memory survives End/Clear notes but clears on refresh. Production product checks, checkout and account storage remain gated. Sabine accepted all eight local steps as working and readable on 13 October 2026.

- 14 October 2026: Remove the Apple choice from sample and connected account screens. Google, email/password and recovery remain; other approved design tokens and behavior are unchanged.

- 14 October 2026: Remove Google from sample and connected account screens. Email/password, account creation and recovery remain. No social sign-in button or provider configuration is part of the MVP.
