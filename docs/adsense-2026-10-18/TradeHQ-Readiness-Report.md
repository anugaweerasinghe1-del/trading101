# TradeHQ AdSense remediation — 18 October 2026

**NOT READY TO REAPPLY.** Reviewable changes are in [PR #183](https://github.com/anugaweerasinghe1-del/trading101/pull/183). Production has not been changed by this session. An approved release and production verification, current account/consent checks, and the limits described below remain part of the application gate. Google’s exact rejection reason is unknown.

The main implementation baseline was `3d3531957a46235ffed8e8544f066ef7b7c7074e`, which already includes #178–182. The website implementation candidate is `41392b795c81471bdf7211efadc1da3642ec61cc`, tree `9b5d53ec8fab9521fc51a4e973309fc527e5d358`. The uploaded GitHub tree exactly matches the local implementation tree. Later commits record evidence and improve browser-fixture cleanup without changing the website implementation. Consult the PR for current CI results; this report does not treat pending CI as passed.

## Inventory and evidence

| Inventory | Accounted for |
|---|---:|
| URLs in the supplied sitemap | 147 of 147 |
| Bundled manifest routes | 349 of 349 |
| Intentionally excluded manifest routes | 202, preserved |
| Additional URLs discovered in the live course sitemap | 8 of 8 |
| Total rows in the remediation ledger | 357 |
| Glossary entries | 49 |
| Bundled courses and lessons | 4 tracks / 20 lessons |
| Additional published courses and lessons | 2 tracks / 6 lessons |

Every supplied URL was fetched individually: all 147 returned HTTP 200 after redirects. For 92, the final trailing-slash URL differed from the no-slash canonical. This is a technical signal conflict, not proof of an AdSense policy violation. The raw live SOL page still contained the old timeout/debugging text during inspection even though #182 had already repaired the source. A successful commit or host build is insufficient evidence that a particular public response has received that revision.

The six supplied GSC exports reconcile to 208 indexed, 58 noindex, 32 alternative canonical, 20 discovered but not indexed, two redirects and one crawled but not indexed. These are historical export classifications, not a new Search Console inspection. The seven priority URLs all returned 200 in this crawl. The `1970-01-01` export value is a placeholder, not a real crawl date.

The additional course URLs returned 403 to the programmatic client. The browser rendered the published courses successfully, and a read-only query of the public published-course view supplied both documents for inspection and isolated fixtures. No database record, permission, account or publication state was changed. Do not describe the programmatic 403 as a public outage.

## Implemented changes

| Before | Candidate behavior |
|---|---|
| Old critical SOL/DCA/psychology audit findings already fixed in #182 | Preserved those corrections and verified the repaired SOL guide in a Cloudflare preview. |
| Glossary practice blocks repeated their own key points | All 49 entries have distinct worksheets, scoped references and explicit simulation limits. |
| Unsupported professional, neurological, predictive and historical claims remained | Rewrote 31 extended glossary explanations; corrected additional definitions, takeaways and student-facing language. |
| Portfolio notes asserted a thirty-trade threshold | Sample quality and uncertainty replace the arbitrary rule. |
| Journal quiz asserted proof of a “real edge”; gamma/NY Fed takeaways overstated their lessons | Qualified the quiz and takeaways to match the lesson’s scope. |
| Four strategy pages repeated whole paragraphs | Each scope section now supplies separate limitations. The DCA arithmetic is labelled as a hypothetical cash-flow worksheet. |
| Forex comparison linked to an unpublished article path | Links to the published `/learn/article/market-orders-vs-limit-orders` route. |
| Prerendered course sources were plain text | All 20 bundled lessons expose their source URLs as clickable anchors, shared by initial HTML and SPA payloads. |
| Most learning articles linked only internally | Added scoped background/primary references to all nine articles, shared between the page and publisher notes. |
| Glossary hub linked only 24 entries in its initial HTML | Links all 49. Metadata counts derive from the actual array. |
| Static course notes appeared to describe the complete live inventory | Explicitly distinguish bundled inventory from additional approved live courses. |
| Two native courses retained fee-free “perfect” rebalancing and misleading quiz language | 41 expected-text display corrections, shared by server HTML, bootstrap data and client query results. They preserve later owner edits and leave source records untouched. |
| Native course canonical survived alongside Helmet’s hydrated canonical | Native head metadata uses the existing static-head retirement mechanism. Initial and hydrated canonicals are tested. |
| Cloudflare folder indexes forced slash URLs while the site advertised no-slash canonicals | Cloudflare preparation emits flat route HTML; Functions normalize slash aliases and preserve query strings. Vercel explicitly retains the no-slash convention. No universal Functions catch-all was added. |
| A minimum-word-count gate encouraged length as a proxy for usefulness | Structural, reference, duplicate-content and worksheet checks replace that minimum. This does not establish that every page is sufficiently useful. |

The native-course corrections are intentionally narrow. They change a field only if its current value matches the inspected old text, are idempotent, and do not overwrite a later author edit. The authoritative stored documents can subsequently be updated through the existing owner-reviewed publication process. The display mechanism is not a new publication permission or an autonomous content generator.

For example, a $10,000 sale with a 0.1% fee raises $9,990, not $10,000. A portfolio with $70,000 equities and $30,000 cash becomes $60,000 equities and $39,990 cash after that sale: approximately 60.006%/39.994%, not exactly 60/40. A $10,000 sale followed by a $10,000 purchase incurs $20 of combined fees. These are teaching calculations; order accounting was not modified.

## Validation and its limits

| Check | Evidence and scope |
|---|---|
| Full compiled build | `npm run build:cloudflare` passes the SEO, publisher-parity, editorial, ad-inventory and new sitewide gates. |
| Routes and links | 349 metadata/robots fixtures, exact 147-URL static sitemap, 713 internal publisher links, 49 unique exercises, duplicate-paragraph checks and independent numerical examples. |
| Cloudflare serving | 348 non-root static-route fixtures, slash redirects with query preservation, preview noindex and missing-route 404 fixtures. Existing course-root/header checks remain available. |
| Published courses | Both recorded documents pass the existing publication validator after correction; six lesson render/bootstrap pairs, unchanged-input checks, idempotence and preservation of later edits pass. |
| Native Node packaging | The isolated ESM test includes the new editorial helper. The first CI attempt exposed its missing fixture-module entry; that entry has been repaired and must pass on the final head. |
| TypeScript | Application type-check passes. |
| Lint | Whole-repository lint fails: 96 errors and 26 warnings, compared with 97 errors and 26 warnings on untouched main. This is existing debt, not a passed global lint result. Scoped lint for the new browser/reference changes passes. |
| Browser preview | On the initial candidate preview, SOL rendered the rewritten guide, one hydrated canonical and one H1 with no horizontal overflow in the inspected desktop viewport. The native rebalancing lesson rendered corrected fees and quiz wording. Inspection then exposed a duplicated hydrated canonical on native courses; the final candidate repairs it. On preview 949098c8, browser inspection confirmed a single hydrated native-course canonical, the corrected fee text, and the new FOMO worksheet with its source scope and no horizontal overflow in the inspected desktop viewport. |
| Complete browser regression | Added a real-Chromium CI check for 155 editorial URLs × 360px/1280px × JavaScript off/on: 620 visits. It verifies initial/hydrated content, one H1, one canonical and horizontal overflow. HTTPS services are fulfilled with isolated fixtures, not production accounts. The first run completed all 620 assertions successfully, then its temporary-profile cleanup failed with ENOTEMPTY. Cleanup now waits for Chromium to exit and uses bounded deletion retries; the final required CI job must still be green. |
| Local browser limit | No local Chromium binary was available and its download did not produce a valid archive. The cloud browser cannot reach the local loopback server. These attempts are not passing browser tests. |

Structural checks do not validate every financial claim, establish originality to Google’s satisfaction, certify accessibility, measure field Core Web Vitals or prove a strategy profitable. The ledger separates measured facts from editorial judgement. General/background references are labelled as such; they are not presented as proof of a pattern’s predictive efficacy. No fabricated professional reviewer, qualification or source-check date was introduced.

No production sign-in, portfolio transaction, admin approval, AdSense action or consent-setting change was performed. Existing CI also exercises isolated authentication and service fixtures; those are regression evidence rather than live account tests. No paid dependency or API was added.

## Official-requirement checklist

| Requirement or guidance | Current assessment |
|---|---|
| [AdSense eligibility and original content](https://support.google.com/adsense/answer/9724) | Editorial improvements implemented. Google’s site-level value judgement remains unverified; account holder eligibility is an owner-level check. |
| [Publisher content and behavioral policies](https://support.google.com/publisherpolicies/answer/10502938) | No confirmed violation is inferred from a quality risk alone. No new ad slots were enabled. |
| [People-first and trustworthy content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content) | Distinct exercises, qualified claims and transparent publisher information improve the candidate. Complete source-fit judgement cannot be replaced with reference-count tests. |
| [Privacy disclosures](https://support.google.com/publisherpolicies/answer/10437794) | Existing shared privacy disclosures and Google partner links are retained. This session did not certify the owner’s actual advertising configuration. |
| [Regional certified CMP requirements](https://support.google.com/adsense/answer/13554116) | A script or privacy-choice link does not prove a published regional message works. Adult account holder must confirm applicable operation and records before serving relevant ads. |
| [Canonical consistency](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls) | Code and fixtures repaired; exact preview and approved-production behavior must be verified. Google-selected canonical requires current Search Console evidence. |
| Account eligibility | Do not infer account-holder age from the site creator. Google requires an eligible adult account holder; no bypass is proposed. |
| Ad placement | Existing manual-inventory default-denial checks remain. Account-level Auto Ads exclusions and actual ad-filled desktop/mobile screens are unverified. A utility-route `noindex` tag alone does not govern ad placement. |

## Reapplication gate

1. Review PR #183 and obtain green required checks for its exact final head, including the new browser run. No merge is authorized by this report.
2. After explicit owner approval, deploy and verify the repaired production pages, source links, native course metadata, aliases, 404s and existing user flows. The live crawl’s obsolete SOL response must no longer be served.
3. Check the applicable CMP message and account-level ad placement/exclusions with the eligible account holder. Do not enable ads merely to make the application look complete.
4. Inspect refreshed GSC information and canonical selection. Follow [TradeHQ-Recrawl-Actions.md](TradeHQ-Recrawl-Actions.md); preserve intentional exclusions. No fixed waiting period or indexing request guarantees approval.
5. Use the [full URL ledger](TradeHQ-URL-Remediation-Ledger.json) and [compact URL index](TradeHQ-URL-Index.md) to finish any unresolved source-fit, functional or accessibility findings. No row is silently omitted or represented as a completed manual financial review.

The defensible verdict remains **NOT READY TO REAPPLY** until these gates are satisfied. This is an implementation handoff, not an approval prediction.
