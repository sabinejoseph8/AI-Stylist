# Proposed notes-only integration trial

Prepared: 10 October 2026. Draft only, not authorized or ready to start.

## What this trial would answer

One private, notes-only attempt, no avatar or camera. At most two spoken turns within an 85-second owner deadline. Use the complete script in combined-notes-live-trial-plan.md to check partial notes, a budget correction, touch confirmation and local media shutdown. One attempt cannot establish representative latency or launch readiness.

## Candidate and unresolved risk

Use the existing selected transcription and pinned extraction models. The selected-model WebSocket URL is proposed by AI-assisted support, which explicitly says it inferred the address from separate guides and cannot escalate to a human. An unsuccessful startup is a failed attempt, never an automatic retry or fallback. Preserve session.updated readiness before accepting media. Do not substitute GPT-Live protocols.

A clean socket close is transport evidence only. Per-item completed events prove receipt of those transcripts, not final provider usage, remote deletion or zero retention. If remote cleanup cannot be established under the approved owner policy, retain an unresolved allowance hold and block another attempt. The new close-evidence helper cannot release an allowance. Do not relax this rule to make the test finish.

## Proposed reservation, not actual spending

Propose a new USD 2 reservation for exactly one attempt. This would be additional to the exhausted experiment allocation; it is not funded from the zero reserve or any previously closed trial. It grants no hosting upgrade, account funding, further attempt or avatar use.

Public model rates checked 10 October 2026:

- GPT-Live-Transcribe: USD 0.017 per audio minute. [Official model page](https://developers.openai.com/api/docs/models/gpt-live-transcribe).
- GPT-4.1 mini: USD 0.40 per million input tokens and USD 1.60 per million output tokens. [Official model page](https://developers.openai.com/api/docs/models/gpt-4.1-mini).

Conservative estimate using existing prepared limits, not a provider-enforced billing cap:

| Component | Assumption | Estimated USD |
| --- | --- | ---: |
| Audio | Entire 85-second deadline billed as audio | 0.024084 |
| Extraction input | 64 requests, each conservatively treated as 32,768 input tokens from the 32 KiB request bound | 0.838861 |
| Extraction output | 64 requests at 2,048 output tokens | 0.209716 |
| Total | No cache discount; no retries | 1.072661 |

The token estimate deliberately uses a coarse upper allowance rather than expected English text length. It is not actual usage or a guarantee about provider accounting, taxes or uncertain remote processing. The proposed USD 2 reservation includes margin but is not a platform hard spending stop. Stop before starting if a revised estimate exceeds it. Current account entitlement, remaining credit and billing were not checked, honoring Sabine’s request to skip latest spending checks.

## Engineering prerequisites before requesting activation

1. Complete and review a server-only live adapter and private entry point, with exact request authentication/Host/Origin, one owner, bounded startup and cancellation. Current simulation classes and inspection plan are not that adapter.
2. Confirm how unresolved provider cleanup is represented without granting an unverified close permission. If the agreed policy requires evidence unavailable from the provider, stop at that gate rather than treating funding approval as a policy waiver.
3. Prepare the dedicated durable notes-only allowance initialization and verify access controls. Do not apply it remotely without the required authorization; never modify the nine closed legacy reservations.
4. Run the full phase checks and a review of affected code. Existing 1,136 passing tests establish disabled preparation only.
5. Present the complete privacy notice and manual script before any microphone gesture. Use synthetic preferences; no saved profile, media recording or customer launch.
6. Only after these prerequisites are reviewable, request a specific financial/activation decision. A USD 2 approval alone must not authorize a security-policy change or unresolved cleanup assumption.

## Current outcome

No approval requested by this document. No live adapter activated, key loaded, remote record changed, paid call started or deployment made. Tavus recovery remains a separate gate for avatar conversation, not a prerequisite for this notes-only experiment.
