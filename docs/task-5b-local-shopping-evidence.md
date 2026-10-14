# Local Task 5b preparation

Authorized by Sabine's Continue following the specific local 5b proposal, 13 October 2026. Local module/fixture tests only; full Task 5b remains open.

## Behavior

- Exact source/product/variant lookup from trusted normalized snapshots, with shared catalog validation. Unknown IDs and malformed or conflicting registry records are held.
- Confirmed owned references are excluded from purchase cost; ownership is an explicit caller-supplied local assertion, not identity verification.
- Integer USD item subtotals; missing/stale prices are incomplete and stale prices excluded. Item-price completeness does not establish stock, size, delivery or budget compliance.
- Shipping, tax and full purchase total stay unknown. Budget verification and navigation remain disabled.
- Source-only URL previews preserve the exact supplied string and query parameters. No URL synthesis, redirect following, affiliate rewriting or link checking.
- Stock, size, delivery, freshness, rights, source policy and price uncertainty hold link previews. Synthetic rows never produce a usable link.
- Broken-link observations bind an exact composite ID and checked time. Same/older evidence stays held; newer source evidence allows deterministic reassessment only, with no claim of a successful network check.

The helpers are pure, hold no persistent state and must be recomputed at each future use. They are not grants for navigation/recommendation release or authenticated ownership. Technical bounds are 12 selections, 24 confirmed owned IDs, eight source snapshots with 200 products each and 200 broken observations. These are local test limits, not customer quotas or retention policy.

## Verification

990 foundation tests across 115 files, type checking and build pass, including 37 new link/estimate cases. Tests use synthetic products and hypothetical non-synthetic normalized example.test fixtures to exercise future source-policy branches. No retailer access, inventory or imagery permission is implied by those fixtures. Tests cover exact URLs/parameters, owned exclusion, cents arithmetic, duplicate/unknown IDs, missing/zero/stale prices, unsupported market, uncertainty, malformed evidence, source rights, immutable results and broken-link reassessment.

No visible UI changed and no new human checklist is needed. Existing sample shopping-list ownership and saved looks are untouched. No actual retailer request, affiliate activity, checkout, paid call or customer deployment occurred.

## Remaining

Permitted real source access, actual source-specific policies and evidence, account/current-requirement integration, fresh use-time checks, real link failure/recovery, allowed retailer navigation and customer/device acceptance. Affiliate attribution belongs to 5c and is not activated or approved here. Allocation stays $51 and held records are unchanged.
