# Structured extraction model decision

Status: proposed, awaiting Sabine. 10 October 2026.

## Recommendation for the prototype

Prepare the text-to-notebook adapter using the pinned OpenAI gpt-4.1-mini-2025-04-14 snapshot and the existing strict extraction contract. Use a server-side Responses request, no tools, no stored application transcript logs, explicit cancellation and output limits. Keep live use disabled and test request/response handling with simulated responses first. This choice concerns extraction of text only and does not replace the conversation/avatar models.

Official OpenAI documentation lists structured output support and this snapshot. Its listed standard text rates are $0.40 per million input tokens and $1.60 per million output tokens. Those are token rates, not a test allowance or total consultation cost. [GPT-4.1 Mini](https://developers.openai.com/api/docs/models/gpt-4.1-mini). Retrieved 10 October 2026.

GPT-5.4 Mini is another documented structured-output option with a pinned snapshot. [GPT-5.4 Mini](https://developers.openai.com/api/docs/models/gpt-5.4-mini). No comparison evaluation has been run.

The recommendation is an implementer's proposal for a narrow extraction experiment. It does not assert that the older model outperforms alternatives, meets the two-second target or is available on Sabine's account. If quality or latency fails, discuss the replacement rather than silently changing models.

## Decision required

Approve preparing this pinned-model adapter, disabled and tested with simulated responses, or review alternatives first. The repository AGENTS.md leaves model/version choices under review and requires Sabine's decision for an open technical choice. The general contract is already implemented and reviewable.

No paid call, budget increase, account setting, deployment or production baseline is included. All nine prior provider trials remain closed with no remaining approved allowance. Live testing needs a separately reviewed allowance and remaining session/transport integration.
