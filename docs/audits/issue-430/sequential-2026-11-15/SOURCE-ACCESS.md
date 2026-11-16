# Diversification publication prerequisite

Status: code/draft repair, protected merge, backend readback and native Cloudflare deployment verified; owner publication remains pending. Original remediation remains 18/19. No new exhaustive page review is complete.

## Confirmed source access failure (STRICT-PRE-006)

The saved Diversification revision 5 cites two Investor.gov articles in each of its three lessons. Its normal owner publication attempt failed before model review because neither source could be retrieved. Public GET diagnostics from Supabase on 2026-11-16 returned HTTP 403 Access Denied for both articles and robots.txt (requests 11420–11422). An honest TradeHQSourceReview user agent did not resolve access. Do not bypass those restrictions, mark the articles verified, reuse a historical verdict, or relax the two-source gate.

Two alternate primary references were retrieved and read in full afresh: ASIC Moneysmart, Investment diversification and Choose your investments. Supabase public GETs 11425/11426 returned HTTP 200 HTML; request 11424 returned robots.txt allowing these paths and disallowing /ms-private. These requests contain no private course text and invoke no model. The sources support diversification, concentration, changing weights, rebalancing, investment risks, fees and cash; the course's arithmetic is an original hypothetical worksheet. Australian tax/superannuation details are not imported into TradeHQ instructions.

Repair: add only their exact canonical HTTPS URLs to the publication allowlist and cite them alongside the original Investor.gov links. Continue fetching current references on each publication; no cached PASS, substituted uncited references, proxy, snapshot fallback or paid service. Generation's existing source pool stays unchanged. Preserve URL/revision/owner review protections.

## Confirmed copy inconsistencies (STRICT-PRE-007)

A fresh read of the complete saved revision 5 document found three remaining statements inconsistent with its own qualified pricing explanation: lesson 1 body item 4 says prices fluctuate continuously in the simulator; lesson 1 quiz 4 explanation describes all executions as periodic snapshots despite fixed simulator inputs; lesson 2 body item 4 predicts a crypto bull market will necessarily create a heavily crypto-weighted portfolio without specifying relative returns. Correct those exact statements, retaining their teaching purpose and quiz key. Review every remaining paragraph, option and explanation and independently recompute the worksheet arithmetic before saving a new draft. A fresh reference review and source-document read are prerequisites, not completed live-page AdSense reviews.

Completed source-document read: all 24 body paragraphs, 12 headings, 12 questions, 48 options, 12 explanations, and course metadata. Three exact copy corrections and two added citations per lesson were saved as revision 6 through the existing save procedure, with an exact revision-5/full-document guard. The returned record is draft 6/published 3 and matches the intended revision 6. All lesson URLs and quiz answer indices are preserved. The source ledger records hashes for 165 string fields; unpublished draft text and service credentials are excluded from this repository. The reviewer is Codex, a prior contributor, not an independent human or a Google examiner.

Independently recomputed examples include $24,993.751562 purchase notional for a post-fee 25% target, $10,008/$9,992 sale/purchase for exact 40/40/20 after $20 fees, and $10,006.003602 sale notional for the exact 60/40 worksheet. Structural validation, quality validation and renderer identity pass. These internal checks are not AdSense requirements or approval. See [field ledger](source-access/source-document-review.json) and [source-access receipt](source-access/source-retrieval-receipt.json).

## Publication checkpoint

Bitcoin revision 9 and Price Feeds revision 5 match their saved source documents and all four live routes each (HTTP 200, complete native bootstrap parity, every lesson body paragraph rendered, all 12 quiz objects per course preserved). Diversification remains draft 6/published 3. Revision 6 must use the normal authenticated owner publishing flow after protected merge, backend readback and native Cloudflare production verification. Only then verify the final four routes and reassess the original 19-proposal count.

2026-11-16 release checkpoint: [PR 443 report](release-443/REPORT.md) records all required exact-head checks, protected merge, backend 22 readback, native production identity and affected-passage live rechecks. The remaining source publication is Diversification revision 6 through the owner workflow.
