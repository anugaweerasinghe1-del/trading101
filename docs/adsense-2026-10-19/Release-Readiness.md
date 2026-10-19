# TradeHQ — AdSense editorial remediation closeout
**Date:** 19 October 2026  
**Code baseline:** `05bb2749a8bc5a210d69064d1d8c6f43168ffa73` (merged #189)  
**Decision: HOLD ON REAPPLICATION until account-side eligibility, consent/ad-placement settings, and current site review evidence can be checked.** This is not a claim that Google has found a policy violation, or that its prior rejection reason is known.

## What was actually completed

The 18 October sitewide remediation shipped in #178–#187 and is documented in [the original 357-row ledger](../adsense-2026-10-18/TradeHQ-URL-Remediation-Ledger.json) and [production release evidence](../adsense-2026-10-18/TradeHQ-Readiness-Report.md). This continuation added:

- **[#188](https://github.com/anugaweerasinghe1-del/trading101/pull/188)**, merged as `52c93e04401f9654ee1d801438d3e080d6cd7f0b`. Corrected 29 shared asset-class comparisons/checklists, all five real-versus-simulated asset-class summaries, 11 hub statements, 12 learning-article statements, and seven glossary fields. Added exact-copy and arithmetic regressions. The PR-head Phase 3, Cloudflare build/SEO/browser, required-validation, preview and disposable PostgreSQL controls all passed. Vercel subsequently reported the merged SHA in READY production state.
- **[#189](https://github.com/anugaweerasinghe1-del/trading101/pull/189)**, merged as `05bb2749a8bc5a210d69064d1d8c6f43168ffa73`. Corrected remaining `/learn`, `/trade`, `/about`, `/reviews`, `/challenge` and `/roadmap` support-copy claims, particularly the incorrect instruction to *take options or futures* when the product only teaches their concepts. Removed universal editorial/source-coverage and trade-result assurances, and aligned beginner-guide links. Scoped regression checks passed on its exact PR head.

Both changes are editorial/front-end corrections. No authentication, balances, order execution, database schema, user data, consent defaults, Auto Ads settings, brokerage integration, ad submission or paid API was changed. Virtual challenges continue to have no wagers, fees or prizes.

## Inventory and validation scope

| Scope | Evidence | Limit |
| --- | --- | --- |
| Supplied sitemap | 147 indexable URLs in the original 18 October snapshot | The production 147/147 HTTP 200 and canonical checks belonged to release #183, not the later releases. |
| Additional published courses | 8 URLs (two native tracks and six lessons) | The historical 8/8 production browser inspection belongs to #183. |
| Route manifest | 349 generated routes: 147 indexable and 202 intentionally noindex | Compiled route checks do not prove Google has recrawled or indexed a page. |
| Complete ledger | 357 rows: 349 generated routes plus eight native published-course URLs | All 155 indexable rows remain **partially fixed** for independent source-fit/editorial judgement; this is not a count of 155 proven individual defects. |
| Browser CI | 155 editorial URLs × mobile/desktop × JS disabled/enabled = 620 compiled-fixture visits | Not 620 live production visits, a certified accessibility audit, or Google quality approval. |
| Reference and quantitative checks | 49 different glossary worksheets; 713 internal publisher links and nine independent example calculations in the original compiled audit | Having a link is not proof that its source supports every assertion. |
| Lint | Earlier report identified global lint debt of 96 errors/26 warnings | No clean whole-project lint result is claimed for this continuation. |

**Verification rule:** Recheck GitHub required checks and both active deployment SHAs after every subsequent merge. Prior release checks do not automatically certify a later SHA. The code may be working while Google indexing is stale.

## What remains outside the repository

1. **Eligible applicant.** Google says the AdSense applicant must be at least 18. If the site creator is younger, a parent or guardian can apply with **their own Google account** and is responsible for the AdSense account and payments. Do not use an ineligible account or attempt to bypass age rules. Official policy: https://support.google.com/adsense/answer/9724 .
2. **Current Google Search Console evidence.** Recheck Coverage/Page indexing and Google-selected canonicals on the repaired important pages after Google recrawls them. The 18 October exported classifications are historical, not a current audit. The proposed prioritisation is in [Recrawl Actions](../adsense-2026-10-18/TradeHQ-Recrawl-Actions.md). A discovered-but-not-indexed page is not automatically a Publisher Policy violation. No arbitrary waiting period or indexing request guarantees approval.
3. **AdSense and privacy operations.** The eligible adult account holder must verify account status/review messages, publisher-ID and site ownership, applicable regional consent-message/CMP operation, and whether any account-level Auto Ads placement could show ads on utility, loading, error, trading-order or thin/noindex screens. Source-level manual-ad guards do **not** govern every Auto Ads placement. Do not activate ads merely for a review. Policy: https://support.google.com/publisherpolicies/answer/11112688 .
4. **Qualitative source-fit and originality.** The verified source corrections reduce false confidence, but no professional review of every financial statement, legal/tax rule or current external reference was performed. Google may independently judge usefulness, originality or eligibility differently from our checklist. Do not substitute page count, word count, reference count or tests for that judgement.

## Practical conclusion

**Technical/editorial remediation implemented and substantially checked; AdSense reapplication is not yet certified.** The remaining gates are current Google/account-side information, a final live-serving inspection on the latest deployment and the adult applicant's consent/ad-inventory review. If those checks are satisfactory, the eligible applicant can decide when to request another Google review. Google alone determines the outcome. The rejection reason has not been confirmed by a primary Google review message.

No AdSense application was submitted, no real-money trading functionality was enabled, and no account settings were changed by this work.
