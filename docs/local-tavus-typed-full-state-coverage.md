# Local typed full-state PostgreSQL coverage

On 16 October 2026, continued the authorized full-state reconciliation preparation under the active development goal. No spending, credentials, provider calls or hosted changes are included.

Follow-up: [continuous state and restore rehearsal](local-tavus-continuous-state-rehearsal.md) now tests one five-step history, a competing connection and full native control-table restores. Fresh-process read-only inspection is also implemented; independently protected restore floors remain open.

## Coverage added

The full-state fixture can now prepare domain commit, receipt claim, fencing and release targets. Each scenario's prerequisites are produced through the actual existing SQLite validator, authenticated authority and mandatory adapter. The selected target is exported by rollback-only planning, admitted through the signed database bridge, atomically persisted in disposable PostgreSQL and reconciled from a separate committed observer.

| Scenario | Full-state effect checked |
| --- | --- |
| Domain commit | Domain payload/head, projection consumption and pending receipt persist together |
| Receipt claim | Receipt becomes claimed without changing the visible domain head or generation |
| Fencing | Current grant becomes retired and gate becomes fenced |
| Release | Permanent release tombstone and original record digest persist while the gate remains fenced |

Four additional foundation cases verify original signed aggregate equivalence and completed reconciliation for those targets. The isolated SQL runner now exercises all five target scenarios, including the existing activation case. The release scenario persists and reconciles the release record; it does not invoke cryptography on an original application signing handoff or release audio.

## Same-head claim constraint

The older reduced-state admission contract continues to reject a same-head apply. The full-only path permits it only when the full-state schema exists and the runtime writer no longer has execution permission on the reduced-state function. Full admission also refuses an unchanged full snapshot. An unprivileged caller cannot use the reduced route as a fallback. The verifier still pins the exact validator-produced full target; PostgreSQL does not independently run the TypeScript domain validator.

A baseline SQL check explicitly tests same-head refusal before enabling the full-state supplement. The claim integration then demonstrates why full state matters: a changed receipt state must commit even when the small projection is identical.

## Evidence

- Full regression: 2,000 foundation tests across 157 files; 475 operations tests with ResourceWarning as error; type checking, production build, four encryption tests and 16 local Memory checks.
- Isolated PostgreSQL run: 412 checks, including earlier permission tests, failure cases, same-head restrictions and full-state activation/domain/claim/fence/release scenarios.
- Keys, identities and data remain disposable fixtures. No phase checkbox or launch acceptance was changed.

## Workspace continuity

The goal's original /private/tmp/ai-stylist-phone-publish checkout remains at an older commit and has extensive local modifications/missing tracked files. The current verified worktree is /private/tmp/ai-stylist-recovered-20261014. Preserve both; do not reset or overwrite the older working tree. Save a source-only Git archive and CURRENT_WORKSPACE.md pointer in the original directory after the checkpoint commit. The archive excludes ignored credentials, dependency folders and private attempt/backup records. It is a local recovery copy, not publication or a restored runnable checkout.

## Remaining work

This document records separately prepared scenarios. Subsequent local work covers a continuous sequence, a competing connection, one-sided restore refusal and fresh-process read-only inspection. A coordinated restore of both stores can still pass an old consistent diagnostic, so independent restore protection and original-owner recovery remain unproven. Native SQL domain enforcement, real all-writer fencing, independently administered authority/proof services, transport and production deadlines remain open. Existing earlier negative coordinated-restore limitations still apply.

Original next action, subsequently completed locally: compose the continuous PostgreSQL sequence and test competing writes, uncertain outcomes and restores while preserving one-use claims. Current follow-up is documented provider-interface compatibility and production lease-lifetime mapping. Keep hosted publication, provider activation, privacy and financial gates unchanged. The $51 allocation and permanent backup runtime/scheduler remain untouched. The full development goal remains active and incomplete.
