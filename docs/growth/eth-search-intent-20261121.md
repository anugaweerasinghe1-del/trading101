# TradeHQ Ethereum existing-page SEO — evidence ledger (21 Nov 2026)

## First-party Search Console baseline
Property: `https://www.thetradehq.com/`. Final 28-day report `2026-10-22` through `2026-11-18`, retrieved via the connected OpenSEO Search Console integration.

- Page `/how-to-trade/eth`: 684 impressions, 6 clicks, 0.88% CTR, average position 17.4 (all queries).
- Search query `how to trade ethereum` for that page: 312 impressions, 2 clicks, 0.64% CTR, average position 13.8.
- Search query `eth trading` for that page: 33 impressions, 0 clicks, average position 17.9.

These are Search Console aggregates, not guarantees of a fixed rank or individual user intent. Recent dates can lag; queries grouped by Google can be incomplete or private.

## Diagnosis and counterhypotheses
The Ethereum guide already distinguishes network mechanics, simulator fees and market prices. Its first step, however, opened with bookkeeping rather than answering what an ETH quote/trade means. The high-traffic `/trade/eth` simulation had no direct visible ETH guide link outside general navigation; a contextual link helps actual learners and supports crawl discovery.

Counterhypothesis: people searching "how to trade Ethereum" may want real-money exchange instructions. TradeHQ does not broker or custody ETH, so optimizing toward real execution or suggesting platform access would misrepresent the product. This change keeps education-only positioning explicit.

Alternative hypothesis: position 13.8 alone explains the low CTR, with no on-page defect. We cannot prove improved search demand, ranking or conversion from a wording/link change.

## Bounded changes
- Clarify the first and last ETH-specific steps in existing published guide: ETH/USD source, timestamp and non-guaranteed fills; simulated portfolio review vs real gas/staking.
- Add one crawlable contextual anchor to that existing guide from `/trade/eth`.
- Preserve all canonicals, titles, metadata, other assets, five-step ordering, simulator behavior and source citations.
- Add blocking source regression to postbuild.

## Measurement
After an independently verified Cloudflare production release, compare the same Search Console property and specific page-query row across complete subsequent 28-day windows. Monitor clicks, impressions, average position and CTR; do not infer causation from a short-window movement. Check learning activation separately, subject to analytics consent.

## Unrelated audit flag not blindly edited
A limited OpenSEO crawl (50 pages; 281 URLs uncrawled) flagged five asset routes as missing H1. The current TradeAsset React source already contains a conditional H1, and `scripts/prerender.ts` writes an H1 to HTML. Treat this as a crawler/hydration discrepancy requiring a reproducible browser/HTML comparison, not a reason to inject duplicate H1s.
