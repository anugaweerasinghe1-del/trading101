# TradeHQ — final Part 1 production closeout

21 October 2026. Site: https://www.thetradehq.com. Baseline: PR #209, `93609c0571b8962e4ff9ac6fd40dc825d15acd83`.

**Site-side decision:** the current full inventory has been checked and the substantiated remaining corrections are implemented. Part 1 closes when the implementing pull request's exact release passes CI, deploys successfully and passes its changed-page production checks. The final release evidence belongs in that PR's final description; this committed record does not predict a future merge SHA or deployment outcome. After that release, proceed to Part 2 before requesting AdSense review.

## Fresh production evidence

[Final-Production-Evidence.json](Final-Production-Evidence.json) contains one record per URL, actual initial-document observations, both browser viewport observations, content hashes, internal destinations, findings and recheck history.

- 357 current production routes fetched: 155 indexable and 202 intentionally noindex. The main sitemap has 147 URLs and the published-course sitemap adds eight.
- All 357 fetched documents returned HTTP 200. Indexed pages had a self-canonical and one H1. No sitemap URL was noindex. Indexed titles were unique.
- 6,815 internal-link occurrences were followed/reconciled; their 139 distinct internal destinations were all present and returned 200.
- 714 actual production Chromium viewport observations: every route at 360px and 1280px. These are live production documents, not local compiled fixtures. Each URL was navigated once and inspected at both widths.
- Zero uncaught application JavaScript exceptions in those observations. Public guest/account guards were inspected without signing into private accounts or submitting anything.
- 38 additional settled-render observations resolved initial portfolio/asset-page flags without source changes. A 400ms asset initialization and rendering transitions must not be confused with a missing settled page.
- Twelve post-PR-210 production observations confirmed the navigation fix on all six legacy lessons at both widths, after fonts settled.
- All 27 named external-report URLs were separately adjudicated using current published content and route behavior. The two referral URLs canonicalize to the homepage. The chart-guide alias redirects to `/learn/article/how-to-read-stock-charts`.

Five of the external report's claimed 32 URLs were never named. No findings were invented for those missing strings. The entire discoverable current site was nevertheless included in the 357-route review; the absent report strings do not constitute five discovered site defects.

## Corrections

**PR #210 — deployed and publicly verified:** all six legacy lesson navigation rows overflowed at 360px after fonts loaded. On `/learn/1`, the document was 381px wide and Continue extended to x=380.90px. Responsive padding and wrapping repair the controls. The browser gate now waits for fonts and checks control bounds.

Release: `8aecea67ac3f2b96f811cde1bf53fb671bd9848b`; Cloudflare Pages deployment `74bf9625-b0e8-427a-9514-40c1c6089d4f` succeeded; Vercel production `dpl_7fdyg44TK95a24QQfzv1DDCxtGG2` was READY for that SHA. All exact-head required candidate checks passed before merge.

**This correction batch:** `/niche/gold`, `/niche/silver`, `/niche/oil`, `/niche/nat-gas` and `/niche/copper` returned valid initial shells but hydrated to an ungoverned Asset Not Found screen. Commodity slugs are catalogue IDs, not their displayed symbols. The resolver now handles both forms, the page retains its route canonical and noindex status, and practice links use actual catalogue IDs. Unknown instruments use the governed NotFound component. All 50 guide routes now have compiled mobile rendering/canonical/noindex/practice-link regression coverage.

The same template's initial metadata now accurately describes reference facts and general price-driver notes rather than claiming a chart or deep research. The roadmap no longer promises real-money starting-capital guidance that the country guides deliberately avoid; it describes regulatory sources, access checks and local practice worksheets.

Local validation: full `build:cloudflare` passed, including publisher/editorial/ad-inventory/course/canonical checks. The expanded real Chromium phase 6 passed all six lessons and all 50 guides. Exact-head CI, Cloudflare/Vercel release evidence and changed-page production checks are required in the implementing PR before calling this final batch deployed.

## Readiness boundary

The current substantive review reproduced no additional major content-quality finding on the 27 supplied external leads. Country guides have distinct local worksheets and regulator context; instrument guides distinguish token/share exposure and use hypothetical fee-aware examples; glossary/strategy pairs serve different reference and worksheet roles; the mentor explains local topic matching and its limitations. This does not certify every financial claim or establish originality merely from word count, links or automated tests.

A complete live structural sweep, substantive review of named leads, prior individual editorial remediation and current build/browser regressions support the Part 2 handoff once the final correction release is verified. No numerical approval odds or guarantee is justified. Google decides whether to approve the site.

The earlier aggregate dependency-audit notices were not advisory-level evidence of an exploitable production vulnerability or an AdSense defect. Security maintenance remains a separate task; this closeout does not certify an entire dependency security audit.

## Part 2 before applying

1. Read the actual AdSense Sites state and any exact rejection reason.
2. Confirm the eligible adult account holder, site ownership and publisher identity (`ca-pub-4160578126993254`; matching `ads.txt`).
3. Inspect Auto Ads and exclusions for utility, account, administration, loading, error and other ineligible screens. Script/iframe setup alone does not prove a visible ad or reveal account configuration.
4. Verify regional advertising consent/CMP settings and behavior.
5. Inspect current Search Console indexing/canonical evidence and decide whether to request review.

No application was submitted, advertising enabled, account setting changed, private account accessed, trade placed or message sent. Existing financial calculations, balances, authentication and database behavior are unchanged.

Primary policy references: [AdSense eligibility](https://support.google.com/adsense/answer/9724?hl=en), [AdSense program policies](https://support.google.com/adsense/answer/48182?hl=en), [publisher-content inventory](https://support.google.com/publisherpolicies/answer/11112688?hl=en), [people-first Search guidance](https://developers.google.com/search/docs/fundamentals/creating-helpful-content). Search guidance informs editorial judgment and is not a separate mandatory AdSense policy clause.
