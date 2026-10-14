# Local Task 8b accessibility preparation

Approved sequencing exception, 14 October 2026. Full Task 8b remains unchecked.

## Changes

- Text uses rem and the root defaults to 100%, preserving the approved baseline appearance and user font preferences.
- Main is labelled by its single page heading. Requested page changes focus that heading and update the title. Initial load and ordinary note/status updates do not move focus through this effect.
- Measured navigation height reserves content/scroll clearance, including enlarged text; ResizeObserver/resize listeners clean up on unmount. Invalid measurements use a CSS fallback.
- Adaptive navigation columns preserve complete words at enlarged sizes. Forms/content can shrink and wrap without horizontal page scrolling; active buttons retain minimum 44-by-44 target dimensions.
- Existing native controls, explicit labels, choice-label hit areas, focus outlines, status wording and skip link remain. The palette is unchanged; token contrast is checked.
- Reduced-motion CSS suppresses transitions, repeated animation and smooth scrolling. Real operating-system/media preference behavior remains to verify.

## Repeatable local evidence

Run npm run test:phase-2, npm run typecheck and npm run build in apps/foundation, plus node --check scripts/audit-accessibility-dom.js. The full suite passes 1,212 tests across 122 files, including 21 new accessibility checks. The read-only DOM audit can be evaluated through CUA in the authorized local preview; it measures visible active targets (using associated clickable labels for radios/checkboxes), labels, alt attributes, headings, overflow, focus and navigation clearance. This is a heuristic, not certification.

The Vite-only tests/accessibility-zoom.html fixture loads the normal app with a 200% root font. It is excluded from production build inputs and changes no provider/account configuration. Agent browser checks pass all four destinations at 320px for both normal and enlarged root text, with no horizontal overflow, audited small active targets or unlabeled visible controls. Also checked expanded notebook, feedback/comparison, populated Saved looks/shopping, skip-link Enter, summary Space, requested-page heading focus, budget editor/Cancel return and tested keyboard controls above the navigation. At 390px enlarged text, navigation labels stay whole. Screenshots are outside Git; viewport reset and synthetic tabs closed.

## Limits and next action

These are local sample/browser checks. Native browser zoom, real VoiceOver/TalkBack, switch devices, OS reduced-motion settings, physical phones, photo/dialog paths with actual device input and the complete integrated customer journey remain acceptance work. No microphone/camera capture, user photo, real sign-in, provider call, spending or customer deployment was used. Full Phase 8 dependencies and launch approval remain intact. Five of 41 full tasks remain complete; allocation stays $51 and held records are unchanged. Review concrete OpenAI/Render/account/retailer prerequisites when supplied; no broader phase exception is inferred.
