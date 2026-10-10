# Structured extraction model decision

Status: Sabine approved disabled preparation with simulated responses on 10 October 2026. Live activation and a production model baseline remain unapproved.

## Recommendation for the prototype

Prepare the text-to-notebook adapter using the pinned OpenAI gpt-4.1-mini-2025-04-14 snapshot and the existing strict extraction contract. Use a server-side Responses request, no tools, no stored application transcript logs, explicit cancellation and output limits. Keep live use disabled and test request/response handling with simulated responses first. This choice concerns extraction of text only and does not replace the conversation/avatar models.

Official OpenAI documentation lists structured output support and this snapshot. Its listed standard text rates are $0.40 per million input tokens and $1.60 per million output tokens. Those are token rates, not a test allowance or total consultation cost. [GPT-4.1 Mini](https://developers.openai.com/api/docs/models/gpt-4.1-mini). Retrieved 10 October 2026.

GPT-5.4 Mini is another documented structured-output option with a pinned snapshot. [GPT-5.4 Mini](https://developers.openai.com/api/docs/models/gpt-5.4-mini). No comparison evaluation has been run.

The recommendation is an implementer's proposal for a narrow extraction experiment. It does not assert that the older model outperforms alternatives, meets the two-second target or is available on Sabine's account. If quality or latency fails, discuss the replacement rather than silently changing models.

## Approved preparation

Sabine answered "Approve GPT-4.1 mini preparation." This selects gpt-4.1-mini-2025-04-14 for the disabled extraction experiment only. No automatic model fallback is permitted. The implemented adapter uses the existing strict application decoder; extraction remains tentative until the customer confirms it.

No paid call, budget increase, account setting, deployment or production baseline is included. All nine prior provider trials remain closed with no remaining approved allowance. Live testing needs a separately reviewed allowance and remaining session/transport integration.

## Approved pinned extraction adapter, 10 October 2026

Sabine approved GPT-4.1 mini preparation with simulated responses only. Added a server request builder pinned to gpt-4.1-mini-2025-04-14 and a Responses wire decoder. Requests specify strict JSON schema under text.format, store:false, no tools, no streaming and a 2,048-token output ceiling. store:false requests no Responses application-state storage; it does not promise zero retention or alter provider training policies. The protocol version uses a single-value enum in the provider schema, with the application decoder retaining its exact version check. [Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs), [Responses migration and storage](https://developers.openai.com/api/docs/guides/migrate-to-responses).

The decoder accepts one completed assistant text message from the pinned model. It rejects refusals, failed/incomplete/cancelled results, tool outputs, multiple messages, invalid JSON, wrong turns and unsupported evidence. Notes stay tentative. The simulated transport forwards cancellation, discards late results, redacts errors and performs no retries or model fallback. The existing coordinator owns the 1.5-second extraction deadline. No API client, credentials, live endpoint or activation path was added; simulation must be explicit.

All 396 focused tests across 33 files, type checking and build pass, including 28 new adapter checks. A simulated transcription envelope flows through the session owner and this adapter into tentative notebook notes; ending clears the session. Tests also cover the deadline and ignored late responses. This proves local contract handling only, not provider schema acceptance, account availability, semantic quality, live latency or physical-device behavior. No paid call, additional allowance or Render deployment occurred. All nine prior trials remain closed. Task 1c and Phase 1 remain incomplete.
