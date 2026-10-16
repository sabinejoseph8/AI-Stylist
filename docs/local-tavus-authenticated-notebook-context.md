# Local authenticated notebook-to-CVI context

Authorized local preparation only, 16 October 2026. No hosted changes, provider calls, real accounts, credentials, uploads, profile writes or new spending.

## One notebook authority

The new server-only composition reuses StylingSession and NotebookProposalStream rather than maintaining a second editable CVI notebook. The CVI flow reads an immutable projection of the authoritative session. Its old direct note() mutator is disabled in this mode. Existing isolated simulations retain their original internal-note mode.

| Existing notebook field | CVI snapshot field | Meaning |
| --- | --- | --- |
| occasion | occasion | Customer's occasion text |
| season | timing | Provided season/date/month text, with no inferred season |
| color | color | Color preferences |
| style | coverage | Complete provided style/coverage text, without discarding it |
| budget | budget | Explicit budget wording and confirmation status |
| lookType | lookType | Requested look type |
| wardrobe | wardrobe | Customer-provided wardrobe text; no photo ownership inference |

Snapshots include the local note revision, session epoch, admitted input revision and last verified native state revision. Drafting and the independent exact-text checker receive the same frozen snapshot. Authentication tokens and session identifiers are not included in that model context. Note values remain volatile; they are not written into the native security history or profile storage.

## Account and ownership boundaries

The context is constructed with an already verified customer identity and auth session, plus a trusted app authorization gate. Every customer operation must match both IDs and remain current. The existing cryptographic identity verifier is exercised with ephemeral test signing keys; forged tokens and another signed customer are denied.

Current-owner checkpoint reads also check the bound account before and after the native read. Draft/check ports recheck that account and the exact context. Detected revocation closes the local context and clears its notes. Actual hosting, CSRF/purpose enforcement, sign-out broadcasts and browser/provider lifecycle hooks are not installed here; the injected authorization gate must come from the approved customer-host boundary.

## Edits and tentative proposals

- Explicit edits and confirmation use the existing field revision, sequence and epoch checks. Duplicate commands cannot repeat a mutation, and old revisions cannot overwrite newer values.
- Budget normalization reuses the UI rule: an amount alone remains tentative, even after a confirm action. A complete supported USD budget can be confirmed.
- Structured proposals use opaque in-memory turn handles and captured field baselines. They remain tentative. A delayed proposal cannot overwrite a newer touch edit; unrelated fields may still be applied.
- Neither raw conversation messages nor a supplied confirmed/status/owner flag can grant confirmation authority. Raw CVI prompts do not invoke notebook commands.
- Client command IDs are hashed into a separate edit namespace, preventing them from colliding with the proposal stream's internal operation IDs.
- Input commands and proposal values are captured before asynchronous authorization waits. Canceled and delayed work cannot restore cleared data or end newer work.

A successfully admitted new input advances the context before proposals arrive, so a pending reply can be superseded without waiting for extracted fields. The shared model receives the approved retention settings. Reads and derived extraction do not count as customer activity. Idle expiry is tested; provider disconnect/reconnect hooks still need integration. Clear invalidates old epochs and handles. End closes the context and removes transient notes. This is not provider deletion or forensic erasure of copies already given to another component.

## Stale-response handling

An edit or newly admitted input invalidates pending/prepared text. The CVI engine reports a known context change only while the authoritative context remains valid and the original request is live. The handler then rechecks its ownership fence and spends the original reserved attempt without sending text. It does not refund or retry that attempt. A fresh turn can use the updated context.

Timeout, canceled transport, ended/expired context, invalid ownership and unknown outcomes do not use this known-stale settlement path. The original private receipt is never reconstructed from stored history. Existing consumed-request and native-owner checks remain mandatory.

## Evidence

26 new tests cover seven-field propagation, timing/style aliases, tentative budgets, explicit confirmation, late proposals, duplicate/stale edits, cross-customer/session access, Clear/End, idle expiry, canceled/late work, input capture, operation namespaces and cryptographic identity checks. Actual signed-service/SQLite/credential/replay compositions exercise all seven fields in protected SSE draft/check context, native revision changes, corrections during draft/check, correction after preparation, revocation after consumption and a new input before proposals arrive. Old attempts produce no text; new attempts see the updated context.

Final regression: 2,181 foundation tests across 165 files, 475 operations tests with ResourceWarning as error, type checking/build, four encryption checks and 16 local Memory checks. Passing synthetic draft/check ports do not establish semantic-model accuracy or real provider compatibility.

## Remaining gates and next action

This module is not mounted in the React sample app, a customer host or a provider callback. The visible sample notebook and hosted preview are unchanged. No real transcript has been accepted, no model extraction is connected, and no media or saved profile data is handled.

Native owner lease duration/renewal is still a local rehearsal contract, not a production consultation-lifetime guarantee. Independently durable revision floors, native transaction markers, universal fencing, protected transport and hosted account/provider/device acceptance remain open. Point checks cannot recall downstream audio or prove remote cleanup/billing finalization.

Exact next local action: review the current documented Tavus custom-LLM and transcript interfaces and map supported request/authentication fields to this context in a disabled adapter. Do not label proposed headers as provider-generated. Include the lease-duration gap in live preflight. Keep non-ElevenLabs voice, privacy, protected hosting and separately approved financial/private activation gates. No phase or launch criterion closes and the allocation remains $51.
