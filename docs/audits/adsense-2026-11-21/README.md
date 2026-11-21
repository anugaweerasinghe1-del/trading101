# TradeHQ — strict AdSense audit (21 November 2026)

**Status: read-only website/code investigation; findings are NOT a Google decision.** This audit is deliberately isolated on branch `audit/adsense-strict-2026-11-21`. It does not enable advertising, deploy, change site copy, or submit an application. Production source baseline: `bca65c8bb2c982b66e354c8874f3f3a3dc8f7918` (main snapshot 2026-11-21 07:40 UTC).

## Mandate and reviewer stance

Assume every sampled page could conceal a rejection risk, but reject allegations that lack policy wording plus reproducible evidence. Owner reports four generic AdSense rejection notices; **Google did not provide an actionable site-specific reason**. Do not ask the owner again or invent one. Previous 14 November audit reports and the already-repaired ad bootstrap (`THQ-ADS-001`, PR #428) remain historical evidence and must not be reopened without current reproduction.

## Scope and denominator

Live `https://www.thetradehq.com/sitemap.xml` yielded **151** listed URLs; live `https://www.thetradehq.com/course-sitemap.xml` yielded **12** published course/lesson URLs; union **163** at observation. Main repo's checked-in `public/sitemap.xml` has 147, but `scripts/generate-sitemap.ts` rewrites it at build from `scripts/routes.ts`, which contains the four additional `/start`, `/practice`, `/newsletter`, `/whats-new` routes. Therefore do **not** call the checked-in build-artifact difference a defect. `robots.txt` lists both sitemaps. `ads.txt` and owner-verification meta were retrieved and match source. The whole exposed app has more than 163 routes; previous dated 14 November research counted 480 public/utility/account/profile/alias/error observations. This audit's denominator of 163 refers strictly to **the current two-sitemap publisher corpus**, not all possible app states.

## Methods and limits

1. Compile current official Google policy taxonomy and links in `POLICY-INVENTORY.md`. It is a concise policy map, not a copyrighted full reproduction.
2. Extract 70 deliberately stratified live URLs from the 163 publisher URLs using the live HTML/content extractor, with visible text, canonical and robots metadata. Word-pattern, paragraph-repeat, and canonical tests are mechanical triage only.
3. Review representative high-risk paragraphs and corresponding repository source families (`scripts/routes.ts`, `src/lib/tradingGlossary.ts`, `src/lib/glossaryWorksheets.ts`, `src/lib/assetContent.ts`, `src/lib/seoData.ts`, `src/lib/learnArticles.ts`, `src/lib/countryGuides.ts`, `src/lib/coursesData.ts`, `src/lib/privacyCopy.ts`, and selected page components). Dynamically published lessons originate from backend records, so source control is not a complete content record.
4. Maintain `URL-LEDGER.csv` covering all 163, `PARAGRAPH-SCREEN.csv` for the 70 extracted URLs, and `FINDINGS.md` for adjudicated claims, counterevidence, and decisions.
5. Declare untested pages, authenticated app states, original-rights/plagiarism checks, external account/traffic and all browser-interaction limits separately. A live extraction is not equivalent to full visual/mobile/JavaScript/financial-fact verification. The separate browser-interaction provider was unavailable due to exhausted balance; never claim such tests passed.

## Review assumptions we actively challenged

- Four rejections do **not** prove a hidden single hard violation; site-wide perceived quality may be cumulative.
- A prior clean severe-policy audit does **not** guarantee approval.
- 163 sitemap URLs do **not** equal 163 thoroughly inspected documents; strict coverage labels apply.
- A repeated publisher disclaimer is not the same as duplicated substantive journalism.
- Brief glossary pages are not automatically policy-violating; inspect actual individual utility, exercises and references before deciding.
- AI-assisted writing is not automatically prohibited, but republished/automatically generated low-value content without meaningful human review or added value can be a problem.
- Google Ads advertiser certification policies on speculative financial products are not automatically AdSense publisher restrictions.
- A privacy-policy description does not prove regional CMP implementation; nor is a CMP universally required simply to request site review.
- `ads.txt`/meta verification does not prove AdSense approval. Age, payments, previous rejection classification and traffic are separate account-level evidence outside the present site audit.

All quantitative percentages, text-screen flags and copy originality in these files are **internal audit heuristics only**, never Google's algorithm or a predictor of acceptance.
