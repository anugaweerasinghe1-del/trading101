# TradeHQ Bitcoin Search & Learning Quality — Release Evidence (2026-11-21)

## Purpose
Improve the **existing** indexable Bitcoin simulator and its voluntary educational continuation. No new public indexable URL, no messaging campaign, no order-engine change, and no implied guarantee of rankings or return-rate uplift.

## Observed first-party baseline
Source: Google Search Console linked to the TradeHQ OpenSEO project, complete web-search reporting.
- Sep 24–Oct 21: 529 Google Search clicks, 13,549 impressions.
- Oct 22–Nov 18: 880 clicks, 18,080 impressions. Growth is not a randomized test.
- Exact query `bitcoin simulator`, Oct 22–Nov 18: 56 clicks, 532 impressions, 10.53% CTR, global average position 4.8.
- Same query, US: 19 clicks, 121 impressions, average position 3.1.
- Previous 28 days for same query: 9 clicks, 178 impressions, average position 5.1. Much more growth came from impressions and CTR than rank change.
- Live indexed `/trade/btc`, current Google-selected canonical matches declared canonical.
- OpenSEO 50-page crawl found a missing-H1 warning on BTC, but both static prerender and hydrated React already contained an H1. Do not label the warning a proven missing-H1 defect.

Source: Supabase read-only aggregates as of this audit: 125 registered accounts, 47 with recorded virtual trades, 18 with recorded educational activity, 34 recorded traders without recorded learning. These do NOT measure guest learning or D7 returning cohorts.

## This release, and its competing hypotheses
1. A concise query-matching Bitcoin title and matching no-JS/browser metadata might improve title relevance, but Google's titles are automatic; CTR can deteriorate. Change only Bitcoin. Do not rewrite other successful pages without evidence.
2. A compact how-to block on the Bitcoin practice page may give beginner organic visitors the needed next action; it could instead distract from the simulator. Keep one small block with honest data/fill limits.
3. Four different spaced questions, corrective explanations and prompt rotation may improve educational return visits. They are not validated trading competence, nor proof of a 3x retention gain.
4. Consent-gated milestone events provide a directionally useful same-browser view of voluntary returns. They are not exact D7 user retention and must not overtake server-side first-party data.

## Release gates
- Build and prerender shared metadata, validate indexable BTC route, canonical and H1; keep all other route identities.
- Test question rotation, correct choices, wrong-answer spacing, consent withdrawal and no unconsented event emission.
- Full repository application, privacy, database controls, Cloudflare Pages preview and browser compatibility tests must pass.
- Squash merge into protected main, then verify Cloudflare production deployment status for the merge SHA.

## Post-release measurement, no automatic rollout claims
For matched 28-day Search Console windows, compare `bitcoin simulator` by query+page, US/desktop/mobile, impressions, CTR, clicks and average position. Look for movement compared to other unchanged asset pages, allowing for volatility and Google lag. A 7/14/28-day return test needs exposure timestamps, unique consenting visitors and, separately, signed-in server cohorts with privacy-safe definitions. Do not confuse Amplitude opt-in same-browser later-day events with all registered users.

Do not add new pages, mass-generate backlinks, inflate FAQ schema or promise position one. Roll back the title test if the available query-level evidence consistently worsens search outcomes after allowing indexing time.
