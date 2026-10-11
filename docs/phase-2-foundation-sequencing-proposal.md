# Proposed foundation work while Phase 1 remains open

Prepared: 11 October 2026. Sabine approved the Task 2a sequencing exception on 11 October 2026. Foundation implemented locally; her visual review remains pending.

## Decision for Sabine

Allow Task 2a foundation scaffolding to proceed while remaining Phase 1 provider, privacy and source-access checks stay open. The existing plan puts Phase 2 after Phase 1, so this sequencing change requires Sabine's decision. It does not approve Phase 1, change hosting, authorize spending or launch the app.

## Concrete scope

- Create the already approved React/TypeScript website and Node/TypeScript service module boundaries.
- Share the current notebook schemas and approved design tokens through typed modules.
- Add configuration validation and development/test separation without loading private credentials.
- Add focused automated build/configuration checks and a simple local verification page.
- Preserve the existing private prototype, its budgets and all nine closed attempts.

No provider activation, production database migration, authentication-provider permission, retailer integration, account creation, paid service or public deployment is included. Accounts and other Phase 2 tasks remain separate work and keep their own dependencies.

## Why it is independent

Foundation setup can use local fixtures while live voice, retention and retailer questions are unresolved. Provider-specific modules stay behind interfaces, preserving the approved Supabase + Render architecture. Rework remains possible if feasibility findings change an interface. Do not describe a working scaffold as proof that the stylist is ready.

## Acceptance and checks if approved

1. Website and service build from their documented commands.
2. Missing or invalid production configuration fails safely; tests use explicit fixture configuration.
3. The local page uses the approved design tokens and contains no live shopping or provider controls.
4. Automated checks exercise configuration boundaries, module startup and basic HTTP health without external services.
5. Manual review confirms the local scaffold opens and clearly identifies fixture mode. Leave Task 2a unchecked until its applicable review is complete.

## Exact next action

Complete Sabine’s local visual review of Task 2a. Keep Tasks 2b/2c and Phase 1 acceptance gates open. No broader phase-order exception, production migration or provider activation is implied.
