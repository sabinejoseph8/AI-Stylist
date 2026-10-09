# AI Stylist: Design proposal

Status: Proposed direction for Sabine's review, v0.1  
Updated: 8 October 2026  
Related document: [Product specification](product-spec.md)

No reference screenshots were supplied. This document proposes an original visual direction using the requirements already discussed. Colors, fonts, spacing, navigation, and component styling below require Sabine's approval before they become the agreed design.

## Established experience requirements

- A photorealistic female stylist leads a natural conversation.
- The mobile consultation places the stylist above **My Styling Notes**, with outfit suggestions below.
- The notes look like a notebook, update during speech, support touch and voice edits, and collapse without losing context.
- The actual customer-supplied item image appears like a photo placed in the notebook. Its thumbnail stays visible when collapsed.
- Feedback and items to keep remain visible, and every new outfit is checked against preferences before presentation.
- Customers can use the experience with captions, touch/text, keyboard/switch input, and screen readers.

## Design principles

1. **Make understanding visible.** Show what was captured, what is uncertain, and what changed. Keep corrections close to the relevant note or garment.
2. **Keep fashion imagery central.** Use quiet surfaces and ample space so garment color, shape, and detail are easy to assess.
3. **Make the notebook useful.** Ruled lines and paper details support the metaphor; readable printed text, clear labels, and simple controls carry the information.
4. **Keep the customer in control.** Distinguish session edits, temporary exceptions, saved preferences, and permanent wardrobe actions.
5. **Explain waiting and recovery.** Use brief messages such as Listening, Revising your outfit, and Checking your preferences with a clear next action when needed.
6. **Preserve continuity.** Keep the reference item, confirmed requirements, and retained pieces recognizable through every revision.
7. **Design accessibly from the start.** Never rely on voice, decoration, animation, or color alone to complete a task.

## Proposed visual language

The proposed direction is a calm fashion journal: warm ivory pages, dark ink, restrained deep green accents, and clean garment photography. Avoid ornate handwriting and heavy paper textures. The avatar and actual clothing should supply the visual personality.

### Color palette

| Token | Proposed value | Use |
| --- | --- | --- |
| Canvas | `#F7F4EF` | App background. |
| Surface | `#FFFFFF` | Cards, dialogs, inputs, and outfit surfaces. |
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

| Role | Proposal |
| --- | --- |
| Editorial headings | Georgia or an approved comparable serif. Use sparingly for the main page heading and notebook title. |
| Interface and notes | Inter, with system sans-serif fallbacks. Use printed text for all editable values and captions. |
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
| Welcome and permissions | Explain the AI stylist; start a session; ask for microphone/camera access when needed; offer alternatives. |
| Style profile | Editable style preferences, exclusions, sizes, budget/currency, and save controls. |
| Styling consultation | Avatar, captions, session controls, live notebook, item reference, and checked outfit suggestions. |
| Item confirmation | Photo preview, selected garment, uncertain attributes, owned/inspiration choice, replace/remove, and optional save to wardrobe. |
| Wardrobe | Owned-item grid, item details, edit/delete, and multiple-item selection for styling. |
| Saved looks | Saved-outfit cards, open/remove, and a fresh preference check before reuse as current. |
| Demo bag | Demonstration item list, remove actions, subtotal/currency, and clear explanation that purchasing is unavailable. |
| Privacy and account | Permissions, remembered preferences, clear session, export/delete controls, and retention choices. |

Proposed primary navigation: Stylist, Wardrobe, Saved looks, and Profile. Keep the demo bag reachable from outfit actions and the app header. Confirm navigation during design review.

### Consultation on a phone

Use one vertical scroll surface. Keep the avatar first, notebook second, and outfits third. A compact session control bar stays reachable without obscuring content or the keyboard. The notebook collapses to its title, a brief context summary, pending-confirmation indicator, and reference thumbnail.

When the customer opens an edit or types feedback, keep the relevant content in view and return focus to the originating control afterward. Captions remain available while scrolling. Avoid an oversized avatar that makes the notebook difficult to reach.

On larger screens, a proposed two-column layout places the avatar and notebook together beside the outfit area. Preserve the reading order for assistive technology. Exact breakpoints and panel sizes will be checked with real content and text scaling.

## Main UI components

### Stylist stage and session controls

An aspect-ratio-preserving avatar frame, AI label, captions area, and labeled controls for mute, captions, text input, item upload/camera, and ending the session. Indicate Listening, Speaking, Reconnecting, and unavailable-video states. Avoid showing microphone activity when the microphone is off.

### Notebook shell and note row

The shell includes **My Styling Notes**, expand/collapse, a pending-confirmation count, and customer controls for clearing session notes. Use subtle ruled lines and an optional margin line. Lines must not cross or obscure text.

Each note row contains a field label, readable value, status icon plus text, and edit action. Use a shared anatomy for occasion, season/date, color, style, budget, outfit type, and wardrobe. A saved edit can briefly show Updated; preserve the current value without flicker. The edit sheet provides a labeled field, Save, and Cancel.

Show the relevant saved preferences in a clearly labeled section. An explicit session exception shows its affected preference and **This session only**. Saving a profile change uses a distinct action.

### Photo placed in the notebook

Use the actual uploaded image on a quiet photo surface with a slim border and restrained shadow. A small tape-like decorative accent may be explored, provided it never covers the garment. Preserve image proportions and important details; use fit-inside presentation where cropping would remove information.

Under **Style around this item**, show the image, item label, selected-item indicator, analysis/confirmation state, and owned/inspiration status. Provide Enlarge, Replace, Remove, and reference-selection controls. Multiple images use an accessible thumbnail strip. The active thumbnail remains in the collapsed notebook. Image descriptions are editable when recognition is uncertain.

### Feedback section

**Feedback on this outfit** contains Likes, Dislikes, Requested changes, and Items to keep. Tie entries to a visible outfit/item label. Show uncertainty and allow correction. Use short lists or wrapping tags, with complete readable text available. Kept-item marks include both an icon and the word Keep.

### Outfit card and item tile

An outfit card includes a look label, coordinated item imagery, why it fits, component items, owned/demo/inspiration labels, purchase subtotal and currency, and actions for feedback, comparison, saving, and demo bag collection.

Each item tile supports Keep and Change, a meaningful image description, and access to details. An owned item says **Owned**, without a purchase price. A demonstration product says **Demo item**. Inspiration alternatives say so explicitly. Updated outfits identify changed and retained pieces.

Cards containing unvalidated candidates never appear as customer recommendations. A waiting area can say **Checking your preferences** without revealing rejected items. Previously visible looks needing revalidation are labeled clearly and have current-look actions disabled until the check succeeds.

### Comparison and revision controls

Use a revision label and concise change summary. On a phone, compare two looks through labeled tabs or stacked cards rather than squeezing images into unreadable columns. Provide Undo latest feedback, Continue refining, and Save look. Recheck any earlier look before restoring it as current.

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
| Empty wardrobe/saved looks/bag | Explain what belongs here and provide a relevant next action. |
| Offline or service interruption | Preserve useful visible context and offer recovery without implying a completed save. |

## Accessibility and content rules

Keep captions and a complete touch/text path available. Maintain semantic headings and labeled controls; announce important note and outfit changes politely without moving focus. Support keyboard/switch use, visible focus, text zoom, narrow screens, and reduced motion. Status always includes words and, where useful, an icon. Do not announce every tentative transcript token.

Use concise customer language, such as **What would you like to change?**, **Saved to wardrobe**, and **Checking your preferences**. Distinguish a completed save from a pending one. Keep service/vendor names and internal validation details out of ordinary styling flows. Never claim a product is available to buy when using demonstration content.

## Design review checklist

- [ ] Sabine approves or revises the proposed palette and typography.
- [ ] The notebook looks like a notebook while remaining easy to read and edit.
- [ ] The stylist, notes, photo reference, and outfits fit the mobile consultation flow.
- [ ] Uploaded item details remain visible in expanded and collapsed states.
- [ ] Feedback, repeated revisions, confirmation, and preference-conflict states are understandable.
- [ ] Main screens, navigation, and required recovery states cover the product spec.
- [ ] Text contrast, focus, touch targets, captions, screen readers, and text scaling are checked in a later interface prototype.

No screenshot fidelity or completed interface testing is claimed. Visual mockups can be created after Sabine reviews this proposal. The technical specification remains deferred until product alignment.

## Change record

- 8 October 2026: Created an original design proposal because no screenshots exist. Preserved the established notebook, reference-photo, feedback, and preference-validation requirements.
