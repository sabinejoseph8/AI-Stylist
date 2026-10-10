# AI-Stylist

## Private voice and avatar prototype

The Task 1b prototype is in [prototypes/voice-avatar](prototypes/voice-avatar/README.md). It is a private experiment, not the complete customer app. Phone deployment and remaining manual acceptance are pending.

See [the phased plan](docs/progress.md) for actual evidence and open checks. The prepared Render configuration keeps secrets in server environment settings and uses the existing Supabase test-limit ledger. Never commit private configuration or experiment records.

### Partial speech groundwork

The provider-independent partial-note coordinator and bounded timing metadata pass 282 tests with the rest of Phase 1, plus type checking and build. They are not yet wired into the notebook UI or a provider. Live speech extraction, actual render timing and recommendation speech gating remain open. See docs/task-1c-notebook-prototype.md.
