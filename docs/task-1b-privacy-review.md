# Task 1b: Usage and privacy review

Checked: 9 October 2026. Scope: read-only account dashboards, the two recorded scripted test rooms, prototype configuration and official provider documentation. The initial inspection made no new call, purchase, settings change, deletion or external message. Sabine subsequently authorized sending the prepared support question; submission evidence is recorded below.

## Usage and spending controls

| Item | Observed result | Limit or qualification |
| --- | --- | --- |
| Tavus account | Free; 1.9 of 20 CVI minutes used, leaving 18.1 displayed | Dashboard snapshot, not a finalized invoice. No upgrade was selected. |
| OpenAI prototype project | $0.02 displayed spend, two requests for the selected project in the last seven days | Rounded dashboard amount. Model response usage was 39/171 and 39/172 input/output tokens. The dashboard overview counts 78 input tokens and is not a complete audio-token breakdown. |
| OpenAI project cap | $0.02 / $8.00; Limit enforced; 100% alert | Monthly project cap, not lifetime experiment accounting; enforcement may lag. |
| OpenAI credit | $4.98 prepaid balance; auto-reload OFF | No funding, payment or subscription change. |
| Local experiment ledger | Two reservations, both closed; $4 and ten avatar minutes reserved | Conservative lifetime safeguards, not $4 billed or ten minutes consumed. Reservations are retained even though observed usage is lower. Do not reset them. |
| Connections | Both recorded Tavus rooms report ended; dashboard lists two completed conversations | No new room created. OpenAI generation sockets close before avatar room creation in this probe. |

The approved $25 initial allocation and $8 OpenAI stopping threshold remain unchanged. No hosting charge was introduced.

## OpenAI privacy

The authenticated Sharing page showed all three optional sharing categories disabled: model feedback, evaluation/fine-tuning data, and API inputs/outputs. The Data retention page showed API call logging set to Enabled per call. The Projects page classified AI Stylist Prototype as Global and Standard Retention. Dashboard log visibility is limited to organization owners; usage visibility is everyone within the organization, not public access. No settings were changed.

Official OpenAI documentation says API content is not used for model training unless explicitly shared. Realtime has no application-state retention in its endpoint table, but standard abuse-monitoring retention can include content for up to 30 days, subject to stated exceptions. The account is not verified for Zero Data Retention. Disabling sharing does not remove this remaining retention. The prototype does not request Realtime tracing. [Official OpenAI data controls](https://developers.openai.com/api/docs/guides/your-data)

## Tavus privacy and unresolved gate

The prototype sends recording and automatic-recording flags as false and uses private authenticated rooms. The read-only room responses confirmed ended and returned neither recording URLs nor a transcript field. They did not return the recording flags. Absence of those fields does not prove that Tavus has no internal logs, transcripts, retained audio or backups.

The inspected pipecat0 PAL uses Echo mode, microphone disabled and no TTS/LLM/STT layer. No PAL was edited. Browser microphone/camera are also disabled. The synthetic clip and generated avatar use Daily transport; no human voice or camera was captured by these probes.

No retention/training opt-out appeared in the inspected Tavus account menu. Its public privacy policy excludes processing on behalf of business customers, so its general consumer retention wording cannot settle this API account's behavior. [Tavus privacy policy](https://www.tavus.io/privacy-policy)

Tavus's published terms include a customer-content license for delivering and improving its services, and direct account-wide deletion requests to support. This does not establish the exact model-training practice or a no-training commitment for Free Audio Echo. Applicable account terms or a separate agreement must be confirmed. [Tavus terms, sections 6.5 and 11.4](https://www.tavus.io/terms-of-service)

The Trust Center lists daily backups, activity logs and customer-data deletion after 60 days of contract termination. This is a general published control, not a per-call retention guarantee or proof of Free-plan coverage. Its Data Management Policy and CVI Model Card require access approval; neither was obtained. The public subprocessor page could not be retrieved by the web reader. The full applicable processor list, data locations and retention schedule remain unverified. [Tavus Trust Center controls](https://tavus.securitypal.com/controls), [document access status](https://tavus.securitypal.com/documents)

Tavus documents a separate conversation deletion operation, including irrevocable hard deletion. Ending a room is routine connection cleanup, not data erasure. No conversation or account data was deleted. Deletion coverage for logs/backups still needs provider clarification. [Tavus deletion contract](https://docs.tavus.io/api-reference/conversations/delete-conversation)

## Daily transport

Daily states that it does not store call audio/video except through its recording APIs and does not log/store sendAppMessage payloads. It still retains service metadata such as IP address and developer-supplied participant names/identifiers; the public page gives no fixed numeric log-retention duration. This is Daily's published behavior, not proof that Tavus does not retain the audio it receives. The probe uses a generic participant name. Actual Tavus-owned room/token recording permissions and the applicable subprocessor arrangement remain to confirm. [Daily data protection](https://www.daily.co/security/data-protection/)

## Initial result before subsequent instructions and support reply

Usage and available settings have been inspected. The full real-person privacy preflight has not passed. Under AGENTS.md and the agreed Task 1b preflight, human microphone/camera remain disabled until applicable Tavus retention, training/improvement use, deletion and processor handling are clarified and explained to Sabine before consent. This does not close R07 or finish Task 1b.

The next external dependency is written clarification from Tavus for this Free Audio Echo path. A reviewable draft is saved in task-1b-tavus-privacy-question.md. Sabine explicitly authorized sending it after reviewing the findings; the support form submission is recorded below. Synthetic/offline work can continue within approved scope and remaining reservations. No automated tests were rerun for this documentation-only review; the latest implementation evidence remains 68 passing focused tests, type checking and build.

## Authorized support follow-up

Sabine answered Yes to sending the prepared questions. Submitted the saved subject and message through the authenticated Tavus Contact support form. The form showed Sending, then closed and returned to Conversations without a displayed error. No ticket number or explicit delivery receipt appeared; delivery to support and a response are not independently verified. The form says replies go by email to the existing account address. No secret, token, room identifier or customer media was included. No duplicate message was sent. Retention/training/deletion clarification remains pending, and human media remains disabled.

## Sabine's subsequent instruction

Sabine explicitly approved private microphone/camera testing while Tavus clarification is pending, then approved a local-only preview and microphone check. The previous wait instruction is therefore superseded for her private test. This does not settle provider retention/training/deletion/processor questions or authorize customer launch. The implemented devices.html check sends no human media to providers and is waiting for browser permission; no human provider transmission occurred. See task-1b-voice-avatar.md for implementation and verification evidence.

## Support reply supplied by Sabine, 9 October 2026

Source: Sabine pasted a reply attributed to Tavus support into this chat. No inbox access, sender authentication or Enterprise contract verification was performed. This summary omits private conversation identifiers. Support's account-specific statements are attributed to that reply, not presented as independent API observations.

| Topic | Support's stated answer | Project implication |
| --- | --- | --- |
| Coverage | Developer API/PAL Maker, Free and paid self-serve; Enterprise controls differ | Paid self-serve is not a no-training or zero-retention upgrade. |
| Recording | Both scripted tests had recording off and no recording was created; Echo audio is rendered live rather than retained as a recording | Recording-off is supported by the account-specific reply. It does not mean every record/log is absent. |
| Other retention | Account conversation records, metadata and any transcript/event content remain until deleted; no self-serve per-artifact schedule or backup purge deadline provided | End-of-call cleanup must not be described as erasure. Keep precise deletion limitations in the customer notice and cleanup design. |
| Training | Self-serve permits anonymized data for model training/improvement, with no self-serve opt-out; contractual no-training commitment requires Enterprise | Do not promise no training on the current account. This is a customer-launch decision, not evidence that every test artifact was used to train a model. |
| Ending/deletion | End closes the call only. Delete removes account/API visibility. Hard deletion permanently removes conversation and associated assets; irreversible. Account-wide deletion uses support | No deletion was requested or performed. Backup/log scope and purge timing remain unspecified; hard deletion cannot be represented as undoing model training. |
| Enterprise | No-training commitment, Zero Data Retention and DPA require an Enterprise agreement; ZDR still retains system metadata and can deliver full transcript webhooks | No Enterprise purchase, sales contact, DPA execution or ZDR activation is approved or claimed. ZDR does not remove app webhook retention responsibilities. |
| Processors/locations | Support says Daily is the WebRTC processor and all listed processors/conversation processing and storage are in the US | Account-specific assertion from support. Full current subprocessor page could not be independently retrieved. |
| Documents | Data Management Policy/SOC 2 available through Trust Center; DPA unavailable on Free | Reports/policy have not been obtained. |

### Public-source cross-check

The public Privacy Policy permits research/training and anonymized-data uses, describes a biometric retention limit ending at purpose completion or one year after last interaction, whichever occurs first, and acknowledges backup archives. It also explicitly excludes information processed on behalf of business customers and says other customer agreements may govern. Support nevertheless states that this policy governs self-serve developer use. Preserve this scope discrepancy for the customer-launch review; the support reply is not a substitute for the applicable agreement. The one-year biometric limit is not a universal retention period for all conversation data. [Tavus Privacy Policy](https://www.tavus.io/privacy-policy)

The official deletion API confirms hard=true removes the conversation and associated assets irrevocably. It does not establish a separate log/backup purge schedule. [Delete Conversation](https://docs.tavus.io/api-reference/conversations/delete-conversation)

### Current outcome

The requested support answer is received via Sabine; "awaiting support reply" is no longer the current status. No-training and zero-retention are unavailable on the existing self-serve plan according to that reply. R07 remains open for customer launch, including training disclosure/decision, applicable terms, deletion coverage and retention expectations. Sabine's previously authorized private experiment can continue within its budget and scope; do not re-request that same authorization or claim customer-launch approval. The accepted local camera/microphone check did not transmit human media. The natural-conversation bridge is still unimplemented. No provider setting, account plan, media connection or external message changed during this documentation update. Latest automated evidence remains 76 passing tests, type checking and build; no tests rerun for documentation-only work.

### Usage reconciliation after the attempt limit

Read-only dashboards now show Tavus Free 2.9/20 CVI minutes and OpenAI AI Stylist Prototype $0.03, three requests, for Last 7 days. Rounded dashboard figures can lag. The local ledger has four closed reservations, none unclosed, $8/twenty minutes reserved. Reservations and provider request counts need not match because failed preparation retains a reservation; the precise fourth-attempt outcome is not inferred. No new provider call, deletion, funding, plan upgrade or allowance change was performed. The spoken page is visibly held at the four-attempt guard. A proposed amendment is one additional spoken attempt capped at $2/five minutes from the existing experiment allocation, retaining all old records and requiring Sabine's approval before enabling it. This proposal is not approved.

## Approved additional spoken attempt

Sabine answered Yes to one additional spoken test capped at $2 and five minutes from the existing allowance. Applied one durable spoken-only extension; all four previous reservations remain byte-for-byte identical as serialized records. The fifth reservation is permitted only in spoken mode, a sixth is refused, and scripted mode retains its original four-attempt cap. No funding, plan upgrade or account spend-limit change was made. Failed attempts still retain their reservation and unresolved cleanup blocks use. Automated evidence: 119/119 focused tests, type checking and build pass. Actual spoken exchange acceptance remains pending.
