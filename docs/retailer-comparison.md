# ASOS and FARFETCH source comparison

Reviewed: 10 October 2026
Backlog: X01
Status: Public research complete; partner selection and permission remain business decisions.

## Decision record

No retailer is selected. Build against the normalized catalog contract and synthetic fixtures. Do not presume that an affiliate listing permits product-feed access, imagery caching, AI-assisted styling or US commission attribution. Do not invent commission rates or forecast revenue from public listings.

| Requirement | ASOS | FARFETCH |
| --- | --- | --- |
| Public affiliate route | The network-operated ASOS listing explicitly says this program has closed. Its historical feed and commission claims are not current access evidence. Other US routes are unverified. [Program page](https://www.paidonresults.com/merchants/asos.html) | FARFETCH publishes an affiliate-program contact, website review and daily multicurrency feeds. The reviewed page is geographically localized; current US and AI-use terms require confirmation. [Official page](https://www.farfetch.com/am/pag1987.aspx/) |
| Product feed/API for AI Stylist | No approved credentials or current feed contract evidenced. The prepared Rakuten inquiry is still unsent. | No approved credentials or current feed contract evidenced. |
| Product imagery/display/storage rights | No written project-specific permission evidenced. | No written project-specific permission evidenced. |
| US prices and variant availability | Requires permitted source fields and per-product/variant evidence. | Requires permitted source fields and per-product/variant evidence. |
| US delivery | ASOS publishes a US delivery help area; it does not prove eligibility for a particular product, size or destination. [US delivery help](https://www.asos.com/us/customer-care/delivery/) | Public shipping guidance discusses destinations and delivery estimates; confirm the customer's location and item-specific terms. [Shipping guidance](https://www.farfetch.com/kw/orders-and-shipping/) |
| Commission, attribution, reversals | Project-specific terms unknown. | Project-specific terms unknown. |
| Embedded checkout/cart APIs | Not authorized or assumed. | Not authorized or assumed. |
| Ready for live integration | No. | No. |

## Readiness recommendation

Neither candidate currently has enough evidence to implement an approved live adapter. The immediate implementation path is identical for both: retain trusted source policies, exact product/variant IDs, dated prices, explicit uncertainty and separate affiliate tracking. Keep destination/product-page URLs separate from program tracking requirements when a real program is selected. The present schema supports plain product URLs; an approved affiliate-link contract will be a later extension, not an invented URL transformation.

Before choosing, request written answers covering intended AI recommendation use, website eligibility, US/USD coverage, product feed/API and update limits, image display/cache rights, variant size/stock fields, destination delivery evidence, commission exclusions/reversals and approved link parameters. Sending inquiries or submitting applications requires explicit authorization; no outreach occurred in this task.
