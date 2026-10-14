# Local Task 5a preparation

Approved sequencing exception: local module and synthetic fixture preparation only, 13 October 2026. Full Task 5a remains open.

## Implemented

- Reuse the shared catalog validation/assessment contract in the foundation app.
- Normalize two explicit synthetic illustrated fixtures; return copies with stable source/product/variant IDs and captured evidence times.
- Pin synthetic source policy; reject real adapters and external checkout.
- Validate bounded search and exact lookup requests, product identity, category, currency/country, image provenance, duplicate/conflicting records and stale evidence.
- Preserve valid unknown facts with explicit reasons; synthetic products never become eligible.
- Recheck freshness on reads, reject clock rollback, redact errors and retire late results after timeout, cancellation, Clear or supersession.

The fixed one-day fixture age and two-second local adapter deadline are technical sample settings. No actual retailer policy is approved by them. The original dress/shoes SVGs and RIGHTS.md are development fixtures only. There is no external image loading or retailer navigation implementation.

## Verification

953 foundation tests across 114 files, type checking and build pass. The 47 new catalog cases cover valid sample normalization, exact identity/filtering, malformed requests, field/rights/source conflicts, uncertain facts, duplicate/variant disagreements, freshness boundaries, invalid clocks, policy changes, immutable copies and requests, late/canceled/superseded results, deadlines and fixed error output. No real API, paid call, customer data or network adapter was used.

No visible UI change or human checklist is required for this technical preparation. Existing sample Saved looks and shopping controls remain independently owned; these catalog modules do not automatically recommend, save or add products. No real-source/visual/device acceptance is claimed.

## Remaining gates

Permitted retailer/feed access, actual format adapters and images/rights, source-specific freshness and health configuration, stock/size/delivery evidence, authentication and real-source acceptance. Local 5b/5c preparation, affiliate links and later-phase activation are not authorized by this exception. Budget allocation remains $51; held reservations are unchanged.
