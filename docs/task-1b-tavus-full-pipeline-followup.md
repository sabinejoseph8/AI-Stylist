# Tavus full-pipeline validation follow-up

Status: Sabine reports sending the prepared follow-up to Tavus on 14 October 2026. Submission is reported by Sabine, not independently verified in the support conversation. Awaiting reply. No provider configuration, paid call or architecture change.

## Documentation findings

[Tool calling](https://docs.tavus.io/sections/conversational-video-interface/pal/llm-tool) documents silent tool execution and verbatim result speech, but response_in_result falls back to generated speech on errors/timeouts. This is not proof of an enforced pre-speech validator. [Delivery](https://docs.tavus.io/sections/conversational-video-interface/pal/llm-tool-delivery) describes result correlation, deadlines and some retries; stale-result suppression remains to be established. [Custom LLMs](https://docs.tavus.io/sections/conversational-video-interface/pal/llm) supports an SSE chat-completions endpoint. App-controlled validation there is an alternative to investigate, not an approved or verified integration.

## Reply reported sent

Hi Tavus team,

Thanks. We are evaluating the full pipeline while keeping our app's independent checks before any outfit recommendation is shown or spoken.

Your tool docs describe on_call: silent and on_resolve: response_in_result, including generated-response fallback on failure. Could you clarify:

1. Can every recommendation be required to pass our backend tool before any recommendation speech, rather than relying only on prompt instructions?
2. Can failures/timeouts produce only a fixed neutral message, with no invented or unchecked recommendation?
3. When customers change preferences or interrupt, how can we invalidate pending tool results and prevent an old approved recommendation from being spoken?
4. If a tool cannot enforce this, would an app-controlled custom LLM endpoint be the supported approach? Which live transcript events can feed our notebook, and which full-pipeline voice configuration avoids ElevenLabs entirely?

A supported configuration or example would help us choose the architecture before another paid experiment.

Thank you,
Sabine

## Acceptance boundary

PS-07 still requires independent checks against current confirmed requirements before recommendation release. No generic filler, prompt instruction, background objective or result ID alone establishes this. Normal conversation can be evaluated separately. No code or tests change in this documentation-only investigation. Existing $51 allocation, held reservations and provider/hosting privacy requirements remain. Sabine reports sending this message herself. No duplicate submission or further outreach is authorized.
