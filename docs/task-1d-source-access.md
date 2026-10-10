# Product source access and privacy discovery

Reviewed: 10 October 2026
Status: Desk research recorded; retailer permission and customer launch privacy remain blocked.

## Current decision

Keep the catalog adapter independent of any retailer. No live feed, retailer imagery license, affiliate program membership or commercial terms have been verified for AI Stylist. ASOS and FARFETCH remain comparison candidates, not selected or approved integrations. No scraping, partner application, message, contract or credential access was performed in this research.

## Evidence and implications

| Path | Official evidence | Implication for AI Stylist |
| --- | --- | --- |
| Rakuten Product Catalog | Its publisher implementation guide describes technical setup plus approval from each participating advertiser, and delivery through SFTP. [Official guide](https://pubhelp.rakutenadvertising.com/hc/article_attachments/22365119792013) | Network access alone does not establish an approved retailer feed. Verify current account-specific setup and advertiser permissions before implementing a live adapter. |
| Rakuten advertiser discovery | Advertiser metadata distinguishes partnership eligibility and product-feed capability. [Reference](https://developers.rakutenadvertising.com/guides/advertisers/reference) | A feed capability flag does not demonstrate this project's membership, permission or current usable inventory. |
| Awin publisher feeds | Official publisher API documentation describes enhanced-feed downloads. [Publisher API](https://help.awin.com/apidocs/for-publishers) | A possible future adapter format, with no claim of account access or an approved retailer relationship. |
| Awin imagery | The help article distinguishes platform-supplied promotional images after program acceptance from images taken directly from an advertiser website. [Image-use guidance](https://success.awin.com/s/article/Can-I-use-any-images-from-the-advertiser-s-website?language=en_US) | Use only approved assets within applicable program terms; obtain explicit permission for other imagery. Do not copy retailer photographs into development fixtures. |
| Tavus privacy | Its policy describes research/improvement use, including anonymized data for model training. [Privacy policy](https://www.tavus.io/privacy-policy) | Sabine's prior support reply remains the account-specific evidence. No self-serve no-training or DPA commitment is established. Private test consent does not close customer launch risk. |

The sources above establish possible mechanisms and restrictions, not retailer selection or legal approval. Current public pages were checked; the Rakuten implementation PDF itself is dated December 2023 and must be confirmed against any actual onboarding instructions.

## Required evidence before real product recommendations

- Named retailer/program and written authorization for AI Stylist's intended website and AI-assisted recommendation use.
- Feed/API credentials stored only on the server, approved access mechanism, rate limits and update/deletion obligations.
- Explicit imagery/display rights, attribution requirements and permitted storage/cache duration.
- Stable product and variant IDs, product URL, USD price and retrieval/source timestamps.
- Variant size/stock evidence and destination-specific US delivery evidence where required. Unknown facts remain unknown.
- Approved affiliate tracking URLs and nearby commission disclosure. No commission is earned merely by a click.
- Source-specific freshness policy based on the actual feed contract. The prototype's one-day maximum is a conservative fixture guard, not a retailer guarantee.
- Broken-link/unavailable-product handling and current preference validation before replacement or reuse.

## Actions and blockers

1. Catalog contract and rights-safe fixtures can proceed without accounts or charges.
2. Retailer selection, commercial permissions and affiliate applications need business input and authorization. The earlier Rakuten inquiry remains unsent; no new outreach is authorized by routine implementation autonomy.
3. Tavus audio recovery clarification still awaits Sabine's supplied support reply. Do not resend or infer an answer from privacy terms.
4. A no-training commitment, DPA, retention/deletion guarantees and any Enterprise purchase remain separate customer-launch decisions.
5. Phase 1d remains incomplete until the required real-source and privacy evidence has an accepted resolution plan. Research alone cannot close it.
