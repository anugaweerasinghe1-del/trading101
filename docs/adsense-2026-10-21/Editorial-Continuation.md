# Editorial continuation — 21 October 2026

Baseline: 9b8247f9f39600e792f7b5323575896c8d425d9f (PR #203).

This record is an implementation checkpoint, not an AdSense approval certificate.

## First correction batch

- /strategy/scalping: live hydrated and publisher notes both use seoData.ts. Replace the gross-only example and unrelated low-cost expectancy illustration with one coherent one-BTC calculation. Entry 95,120; exits 95,210 / 95,080; 0.1% simulator fees give net losses 100.33 / 230.20. Approximate fee-only break-even exit 95,310.43.
- /learn/article/risk-management-in-trading: distinguish 1,000 gross price loss from 1,039 fee-inclusive loss on 200 shares. The same assumed budget supports 192 whole shares at the stated prices and fees (997.44 loss). Gaps and different fills can exceed the assumption; no automated stop is claimed.
- /wiki/dollar-cost-averaging: remove the bullet equating scheduled equal contributions with discretionary averaging down.
- /wiki/whale-manipulation: distinguish large participation from evidenced manipulative conduct in the opening definition, consistent with the existing detailed explanation.

Validation: independently recomputed buy and sell fee arithmetic added to the existing build gate. Full exact-head CI, preview providers, guarded merge and production Cloudflare verification remain required.

## Remaining review queue

The user requested a new exhaustive live review including internal links. Previous 147/147 technical observations are historical baseline, not current-turn review coverage. Do not count unvisited pages as reviewed.

- Verify Gold/PAXG quote and chart labelling against the actual current UI.
- Investigate duplicated learning notes below the footer. Repetition alone is not proof of a Publisher Policy violation; remedy any reproduced usability problem without removing unique reference content.
- Visit each live sitemap URL and recursively discovered internal destination; record HTTP/link observations separately from human editorial review and account-only limitations.
- Preserve the release gate: do not begin the next correction batch until this batch is merged and Cloudflare production deployment is successful.

## Primary review criteria

- https://support.google.com/adsense/answer/9724?hl=en
- https://support.google.com/adsense/answer/48182?hl=en
- https://support.google.com/publisherpolicies/answer/10502938?hl=en
- https://developers.google.com/search/docs/fundamentals/creating-helpful-content

Google Search guidance is an editorial aid, not an additional claim about AdSense eligibility. Automated metadata, link or arithmetic checks cannot certify originality or guarantee acceptance.

## Release 204 confirmed

PR #204 merged as 2a82a527dfc7436973b7eb4efd349da85cbf4b94. Exact candidate head CI, Cloudflare preview and Vercel READY passed. Production Cloudflare reported successful deployment 0cf626dc and Vercel production READY on that merged SHA. All four corrected public pages were visited after release and their corrected text was present.

## Second correction batch

- /trade/gold: reproduced PAXG-derived volume and market capitalization under generic Gold labels. The existing provider mapping is gold -> pax-gold. Clarify the proxy in page/header/authored content and label token statistics; link the issuer's token description. No prices, provider mapping, trades or balances change.
- Individual glossary, strategy and Learn articles: live browser showed the full primary article plus a repeated publisher-notes article below the footer. These three page components now provide the same substantive content once inside main. No-JavaScript initial content and navigation payloads are retained. The browser gate continues all existing checks and now independently requires every substantive publisher paragraph/list item in the primary main, one content marker, and placement before the footer.
- Glossary worksheet CTA: correct 'below' to 'above', matching the actual exercise position.
- Whale references: replace unrelated generic order-type source with SEC manipulation and CFTC spoofing references.
- Learn article template: repair missing space in publisher/source metadata and remove the inaccurate claim of a remote AI-provider fallback from its FAQ.

Remaining coverage is still pending. A release check is not a page-by-page editorial approval.

## Reproduced CI runner failure

The post-merge PR204 build succeeded on both hosts, but its browser job twice timed out on Page.navigate after the phase-3 page visits, preventing required post-merge validation. PR205 reproduced that timeout independently. The workflow now runs the unchanged interaction assertions in a fifth fresh Chromium process, after the four unchanged 155-route matrices. Per-route progress is logged to locate any remaining navigation failure. No check is skipped, suppressed or retried into success; job permissions and checkout binding remain unchanged. PR205 must pass the complete candidate and post-merge suites.
