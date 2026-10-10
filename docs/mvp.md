# AI Stylist MVP scope and discovery findings

Updated: 10 October 2026
Status: Working memory from approved requirements and actual findings. Phase 1 feasibility and launch are not approved by this file.

## Purpose and audience

A phone website for women and men shopping in the United States, combining owned clothing and real products into one personalized look at a time. Customers create an account, then describe their preferences naturally to a consistent photorealistic female AI stylist. Affiliate commissions are the intended revenue source. Retailer checkout remains external.

## Source authority

The v1.8 PRD and prioritized backlog are the original artifact baseline. Later explicit Sabine decisions and approved Project Memory/product-spec.md and design.md refine that baseline: say look, show one current look, provide real shopping links for launch, use USA/USD and require accounts. Project Memory/tech-spec.md records architecture decisions and proposals; docs/progress.md records dependencies and acceptance gates. docs/development-backlog.md preserves each original task and tracks working status. If this file differs from those agreed decisions, update this file. Do not silently replace business scope.

## Required MVP behavior

- Email/password with recovery, Google and Apple sign-in before styling; no compulsory preference questionnaire.
- Preferences collected during the first conversation, with explicit choices for saving reusable preferences.
- Natural interruptible conversation, captions and touch/text alternatives, consistent female avatar and understandable connection states.
- Progressive notebook with occasion, season/date, color, style, budget meaning/currency, look type and owned clothing. Missing and uncertain details stay explicit; corrections take precedence over old events.
- Actual item images visible in the notebook, local permission controls, customer-confirmed stills, owned versus inspiration distinction and an explicitly saved digital wardrobe.
- One complete look at a time, real permitted product imagery/links, honest USD item totals, owned items excluded, and size/delivery uncertainty explained.
- Independent validation before display and recommendation speech, including swaps, restored looks and shopping-list additions. Saved requirements are not silently weakened.
- Likes, dislikes, requested changes and kept items, at least three refinement rounds, comparison and undo with fresh validation.
- Saved looks contain only the look, not notebook, feedback, transcripts or session history. Shopping-list and deletion/export controls are separate.
- Customer isolation, separate media/storage consent, accessible controls and failure recovery.

## Current prototype boundary

The open notebook is a local simulation. It supports paper-style notes, edits, uncertainty, stable image references, fixture recommendation gating and a separate connected-session rehearsal. The new internal catalog uses four original drawings and sample prices. It has no checkout and is not real inventory. The accepted voice/avatar experiment is separate from this notebook. No full signed-in customer app or real retailer integration is claimed.

## Actual findings

- Task 1a planning accepted; Supabase + Render, React/TypeScript and Node/TypeScript approved.
- Supabase handles accounts, saved preferences, photos and saved looks. Its additional durable private-test ledger role was separately approved and verified.
- Desktop and physical iPhone generated speech/avatar mouth movement and interrupt-and-end accepted. Continuing conversation after interruption remains unproven pending Tavus technical clarification.
- Sabine accepted the original 18-step notebook review and seven-step local connection rehearsal. Neither establishes real partial-speech extraction timing.
- D02 catalog contract and two synthetic format adapters pass shared checks. D03 original illustrated fixtures support search. Agent browser checks confirm item display, search, loaded image and empty state.
- Public source review does not establish any retailer/feed/image permission. The reviewed historical ASOS network program is closed. FARFETCH advertises an affiliate feed, with project-specific eligibility and terms unverified.

## Success criteria and evidence required

Use product acceptance A01 through A21 and the phased tests in docs/progress.md. In particular, demonstrate progressive notes before turn end with representative two-second p95 evidence, customer corrections without stale overwrite, no unvalidated look card or recommendation speech, stable confirmed photos, three feedback rounds and account isolation. Mock checks establish logic only. Real provider quality, permissions, physical devices, live catalog facts and customer-facing privacy need separate evidence.

## Risks and open decisions

| Risk | Current consequence | Next evidence/action |
| --- | --- | --- |
| Avatar interruption/resume | Cannot claim continuous conversation | Sabine supplies Tavus recovery reply; implement the supported contract and test within a separately authorized allowance. |
| Exhausted experiment allowance | No additional paid test may start | All nine attempts remain closed; reserve zero. New spending requires explicit financial authorization. |
| Real product access and rights | No shoppable launch | Select and approve a permitted program/feed and imagery terms; no scraping or assumed approval. |
| Provider privacy | Private test consent does not authorize customer launch terms | Resolve no-training/DPA/retention requirements before customer media launch. |
| Customer restart recovery | Prototype notes may be lost | Sabine accepted volatility only for private prototype; resolve customer recovery behavior before launch. |
| Customer security | Account/isolation implementation not yet built | Complete Phase 1 exit, then owner-scoped migrations/auth and independent-user tests. |
| Capacity and operating cost | One simultaneous launch consultation only | Measure provider unit cost/load and approve any expanded hosting or capacity separately. |

## Assumptions and engineering decisions

Routine technical decisions may be made autonomously under Sabine's 10 October instruction, with important assumptions recorded. Existing agreed business scope, provider exclusion, consent boundaries and spending caps remain binding. A one-day maximum evidence window is a fixture policy only; a real source needs a contract-specific freshness rule. Demo artwork provenance is recorded locally; it implies no retailer endorsement. No later phase exit is marked complete from isolated discovery code.

## Remaining gates

Phase 1 remains open. Its live media/notes/gating/timing findings, required rights/privacy resolution plan and final review must be complete before the full foundation build is treated as unlocked. No production deployment or public launch is authorized by autonomous development mode.
