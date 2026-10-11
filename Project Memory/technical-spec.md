# Technical specification moved

The canonical technical decisions, system patterns and architecture document is now [tech-spec.md](tech-spec.md), draft v0.11. Its earlier proposal content is retained there.

The phased plan and progress tracker is [docs/progress.md](../docs/progress.md).

Phone website delivery, email/password plus Google and Apple sign-in, and one simultaneous consultation for first launch are approved. Supabase is approved for accounts, saved preferences, wardrobe photos and saved looks. Supabase + Render is approved for MVP hosting on 9 October 2026: Render hosts the website and conversation service. React + TypeScript for the website and Node.js + TypeScript for the service are approved on 9 October 2026. Volatile notes with restart loss are accepted for the private prototype only; customer MVP recovery and remaining configuration are under review. See D12/D13.

ElevenLabs is excluded from the project by Sabine's decision on 9 October 2026; see D09 in tech-spec.md.

Task 1b is approved and in progress. The protected Render Free preview is deployed; Sabine confirmed avatar audio, mouth movement, spoken interrupt-and-end and device cleanup on iPhone. Conversational resume and precise timing remain unverified. See the current checkpoint in tech-spec.md and docs/progress.md; earlier D14 entries retain historical evidence.
