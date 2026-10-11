# Saved-preference contract discovery

Updated: 10 October 2026
Status: Synthetic server-side preparation for D39. R1 implementation and its dependencies remain open.

## Authority and boundaries

The contract represents a separately supplied saved-profile snapshot. It does not establish account ownership or permission to save anything. The conversation, proposed look and browser cannot choose or overwrite its rules. Current integration accepts either the existing simulated color-exclusion adapter or a separately constructed SimulatedContractPreferenceSource. Both are injected server-only fixtures, not connected customer data.

No profile persistence, authentication, session exception, save endpoint, live model or new spending is enabled. A successful reconciliation means ready for the independent validator, never permission to display or describe a look. Existing candidate, notebook, profile revision and speech-frame gates remain required.

## Version 1 shape

| Property | Meaning and bound |
| --- | --- |
| version | Exactly 1. Unknown versions are held. |
| revision | Positive safe integer, scoped to the trusted source. Not a user identity or authorization token. |
| rules | At most 32 rules. Empty means an empty synthetic fixture, not proof that a real profile has no requirements. |
| rule.id | Unique identifier, 1 to 80 ASCII letters, digits, underscores or hyphens. |
| rule.field | occasion, season, color, style, budget, lookType or wardrobe. |
| rule.kind | required, excluded or preferred. Only preferred is optional ranking. |
| rule.status | confirmed or uncertain. Extracted/inferred text cannot invent confirmation. |
| rule.value | Trimmed nonempty text up to 160 characters, or null for an uncertain value. A confirmed null value is invalid. |

Exact keys are required. Duplicate IDs, extra authority/exception/save fields, unknown fields, excessive lists and malformed data are held without an empty-profile fallback. Preparation copies and freezes the contract and rules.

## Reconciliation with the current notebook

| Situation | Result |
| --- | --- |
| Confirmed saved requirement, missing session note | Preserve the saved rule for the validator. Do not erase it or infer a new note. |
| Uncertain saved hard rule | Needs clarification. Retain its identity and field. |
| Tentative session value for a field with a hard rule | Needs clarification. Do not promote the note into a confirmed requirement. |
| Confirmed session text differs from saved required text | Needs clarification. Preserve both sources. Difference is not proof of semantic incompatibility. |
| Confirmed session text exactly matches an excluded value | Needs clarification. No automatic exception or save. |
| Multiple required values differ, or a required value is also excluded | Needs clarification. Do not pick a winner or silently discard a rule. |
| Confirmed optional preference | Keep separately for ranking. It cannot override confirmed requirements, exclusions or notebook values. |
| Uncertain optional preference | Keep separately as uncertainty; do not enforce or rank it as confirmed. |
| Confirmed notebook value | Include as a session constraint with the notebook's session and revision. |
| Tentative notebook value | List its field as tentative; do not include it among confirmed constraints. |

Comparison only trims, collapses whitespace and ignores case. It does not equate navy with blue, parse a budget, infer an event dress code, verify seasonal suitability or recognize an owned garment. The independent validator must still resolve currency, item totals, shipping/tax scope, complete-look compatibility, product facts, kept items, feedback and the reference image. This module cannot return a look pass, permit or session exception.

Any future saved-profile change must invalidate old look approvals immediately. Confirmed session exceptions must be visible and expire with that session; implementing them remains separate. Updating a reusable profile always requires the customer's separate explicit save action.

## Verification

Twenty-eight focused contract cases cover strict shape and bounds, immutable copies, optional ranking, unknowns, tentative notes, conflicting requests, lexical comparison, contradictory saved rules and exact revision binding. An additional source-adapter case checks current color rules, independent old snapshots and malformed-source holds. Existing server and local SQL scenarios now exercise the contract preflight before the narrow synthetic candidate checker. No customer-profile database or hosted integration is tested by these fixtures.

Automated checks: run npm run test:phase-1, npm run typecheck and npm run build in prototypes/voice-avatar. The isolated database composition remains scripts/check-notebook-allowance-db.py --local-docker.

Before customer acceptance, verify actual authenticated profile ownership, confirmed save consent, complete supported-rule semantics, visible clarification, session exception expiry and revalidation of every affected look. These cannot be marked complete from this discovery contract.


## Generalized source and owner boundary

The separate contract source copies and freezes its initial contract. A server fixture update supplies an expected revision and new rules; the source assigns the next revision itself. Stale updates do nothing. Malformed current updates and revision overflow permanently hold that source, stop active sessions and refuse new reservations. All observers are notified even if a different observer throws. Cleanup removes subscriptions.

The synthetic owner now supports direct lexical required/excluded checks for color, style, occasion and lookType, followed by its existing notebook/candidate checker. Optional preferred rules do not become hard filters or implement a ranking algorithm. Uncertain hard rules and unsupported hard season, budget or wardrobe rules produce a held result. They cannot be discarded because a session note is missing. This is deliberately narrower than the future full validator. No rule creates a session exception or changes a saved profile automatically.

Held current checks receive a generic explanation instead of staying in Checking state. Raw profile rules, values and authority are excluded from the browser protocol. A profile change immediately revokes old visual and speech permissions. Twenty-one added checks cover source lifecycle, stale/invalid updates, observer isolation, requirements, ranking separation, unknowns, unsupported fields and browser privacy. A new SQL-backed owner scenario covers requirement changes, optional rules, uncertainty, an unsupported owned-item rule and malformed data closing once. The suite is 970 prototype checks across 67 files, plus 50 local SQL checks, thirteen owner scenarios and eighteen browser scenarios; type checking and build pass. Real account ownership, persisted customer profiles and launch acceptance remain open.
