# Local durable startup admission

Authorized local preparation only, 16 October 2026. No spending, real credentials, provider calls, listener, hosted changes or live activation.

## Implemented path

The disabled startup coordinator can now call an admission implementation backed by the existing authenticated monotonic authority and mandatory SQLite transaction adapter. Admission requires an exact pinned checkpoint/baseline, credential/replay namespaces, previous generation and new boot/binding digests. The complete request, including its fresh nonce and time bounds, is hashed into the new owner digest. The trusted planner chooses a separate random fixture lease token once, retaining it through preview and COMMIT.

A fresh signed authority read must match the pinned completed baseline before planning. The planned activation must match the exact request, role, baseline and next generation. The mandatory adapter then obtains signed advance approval, permanently claims execution, commits the validated transition under the database lock and reconciles authority state. Admission validates the returned lease and requires another fresh signed read of the exact completed target before acknowledging it.

The acknowledgment names the committed operation and new authority revision. Startup's final inspector reads actual complete SQLite state and checks it against the corresponding pinned registry entry and signed authority evidence before credential checks. No original conversation, notebook or signing handoff is reconstructed.

## Local test evidence

19 focused cases cover:

- An actual signed-service/SQLite admission followed by credential rotation, full-state inspection and synthetic checked output.
- Complete-request binding in durable owner history and refusal of second use or new-object replay.
- Lost admission reply, cancellation after commit and a forged final signed read, all with no rollback/refund of the committed transition.
- Crashes before/after COMMIT, retaining the spent authority execution claim and refusing replacement attempts.
- Wrong namespace, changed baseline, altered owner/token/boot/actor/baseline plans, replayed signed reads, substituted leases and missing mandatory execution.
- Credential-store failure after admission, including an explicit negative test of the older credential-only helper.

Final regression: 2,085 foundation tests across 161 files, 475 operations tests with ResourceWarning as error, type checking/build, four encryption checks and 16 local Memory checks. Review added the final signed-proof/lease expiry check and a committed-but-held regression case. Python helpers obtain actual full state through an owner-only disposable database, not a hardcoded target snapshot. Each test cleans its own temporary stores. Production credentials and backup ledgers are never read.

## Known limits

The signed services and keys remain colocated in the test process. Roles are fixture policy, not hosted database privileges. The observer's original-operation and transaction labels are fixture markers; native durable SQL commit markers are not established by this SQLite composition. The separate PostgreSQL full-state rehearsal remains separate evidence.

Admission and endpoint credentials still commit to different stores. If admission commits but credential activation fails, the coordinator exposes no new endpoint, but the disconnected older credential-only helper can still return synthetic output because it does not consult the full-state owner. This is a deliberately passing negative test, not acceptable production behavior or proof of all-writer fencing. No live route uses either helper. Independent restore floors, production clocks/transport, native markers and hosted restart acceptance remain open.

No phase or launch criterion closes through this work, and the allocation stays $51. No public push or hosted Memory update is included.

## Exact next action

Wire the full-state checkpoint/owner check into every request fence in the disabled composed endpoint. Test that a previously constructed owner refuses output immediately after a committed admission, including when subsequent credential rotation fails. Check again after asynchronous credential work to catch an intervening transition. Keep legacy bypasses disconnected and preserve the existing real security, privacy, financial and activation gates.
