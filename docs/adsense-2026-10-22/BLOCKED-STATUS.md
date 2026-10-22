# TradeHQ audit — blocked release status, 22 October 2026

Seven site defects have been reproduced: three P2 and four P3. One is repaired and verified live; six have tested fixes in four draft PRs. All four drafts pass the three required trusted CI checks and disposable PostgreSQL controls. Explicit application-project TypeScript checks also pass for the current copy and badge candidates ([receipt](evidence/APPLICATION-PROJECT-TYPES.json)). **Release is held because the configured Cloudflare credential was rejected with HTTP401. Vercel authentication works.**

This is an incomplete audit handoff, not a completed AdSense review. The detailed ledger contains441 public/guest routes, but only197 settled main bodies and79 expanded FAQ answers have been read and assessed. Capturing a page does not mean its content, screenshots, sources and controls have all been reviewed.

## Coverage and production

| Measure | Observed result |
|---|---|
| Current GitHub main / last jointly verified production SHA | `aa216a24c68c30c9251f96a050da098b33364686` |
| Discovered candidates |449:441 public/guest plus8 excluded admin guest guards |
| Fresh individual public HTTP GETs |441/441 returned200, normal TLS; redirects and initial metadata recorded separately |
| Actual production browser collection |441 routes ×5 sizes =2205 observations |
| Mobile / tablet / desktop observations |882 /441 /882 respectively |
| Settled main bodies actually read |197/441; page-specific notes saved |
| Human screenshot review |89 distinct routes, partial coverage; all62 trader views inspected at360 and1280 first folds |
| Expanded FAQ collection / actual reading |1042 answers collected;79 read.50 additional native visible FAQ sections separately collected |
| Actual course quiz interaction |All26 interfaces exercised in a fresh disposable guest browser; feedback reading/image review remains incomplete |
| Independent arithmetic receipts |50 fixed-input Decimal calculations passed across three evidence files |
| Site issues |7 reproduced:3 P2 and4 P3;1 repaired live,6 prepared and tested |
| Operational issue |1 separate credential/verification blocker |
| New fix PRs |5 created:212 merged,213–216 draft |
| Additional ongoing expenditure / paid dependencies |$0 / none introduced |

The five capture sizes were360×800,390×844,768×1024,1280×800 and1920×1080. No claim of human visual inspection of all2205 captures or complete below-fold coverage is made. Initial browser collection recorded no uncaught app exceptions, document overflow or resource HTTP≥400 responses; blocked third-party ad/RUM requests were transport limitations, not proof of valid or invalid ad placement.

[Inventory](URL-INVENTORY.json), [individual page ledger](PAGE-AUDIT.json), [content assessments](RENDERED-CONTENT-NOTES.json), [visual stages](VISUAL-REVIEW-NOTES.json), [FAQ assessments](FAQ-REVIEW-NOTES.json), [fresh HTTP observations](evidence/CURRENT-PUBLIC-HTTP.json).

## Findings and releases

| ID | Severity | Reproduced defect | Fix / release state |
|---|---|---|---|
|THQ001|P3|About introduction overlapped fixed navigation|[PR212](https://github.com/anugaweerasinghe1-del/trading101/pull/212) merged; native production and affected live page verified at5 widths |
|THQ002|P2|Course covers clip titles/badges on mobile; all6 titles affected at360|[PR213](https://github.com/anugaweerasinghe1-del/trading101/pull/213), normal-flow cover text; old-app regression fails, candidate suite passes; preview6 tracks ×5 widths has zero clipping |
|THQ003|P3|Contact described4 tracks although settled catalog has6|[PR214](https://github.com/anugaweerasinghe1-del/trading101/pull/214), remove fixed count; updated preview verified |
|THQ004|P3|Public-profile explanation rendered `prices.Fetched`|PR214, explicit text space; timestamp and price calculations unchanged |
|THQ005|P2|Course catalog light-theme heading/accent had1.07–1.79:1 contrast|[PR215](https://github.com/anugaweerasinghe1-del/trading101/pull/215), scoped darker light-theme colors; candidate minimum5.12:1 light /10.30:1 dark at5 widths |
|THQ006|P2|Own profile hid earned published-course badges|[PR216](https://github.com/anugaweerasinghe1-del/trading101/pull/216), display retained earned records with current catalog names and unavailable-course fallback; progress/financial tiles unchanged |
|THQ007|P3|All6 trading-guide quick answers had doubled full stops|PR214, remove one redundant punctuation literal; actual preview8 affected pages ×5 widths passes |

These are usability, accessibility, consistency and secondary-functionality findings. They are not presented as seven confirmed Google Publisher Policy violations. No P0/P1 site defect has been established in the work completed so far; the unfinished scope prevents a whole-site absence claim.

| Draft | Exact tested SHA | Required CI / Postgres | Candidate provider and actual preview evidence |
|---|---|---|---|
|213|`f5e001cb12a0b8f1b86c38700abab3c0a19d6f7f`|PASS /PASS|[Native provider receipts](evidence/PR213-PREVIEW-PROVIDERS.json), [30 actual cover checks](evidence/COURSE-HERO-PREVIEW.json) |
|214|`1139acbed2a58fca4864d2841405bd5a721bbe5a`|PASS /PASS|[Provider signals](evidence/PR214-UPDATED-PREVIEW-SIGNALS.json), [40 actual page/width checks](evidence/PR214-UPDATED-PREVIEW-BROWSER.json) |
|215|`4baff25b9ded86bebbcfe9f21b51e61cc96f692f`|PASS /PASS|[Provider signals](evidence/PR215-PREVIEW-SIGNALS.json), [actual contrast checks](evidence/PREPARED-PREVIEWS-BROWSER.json) |
|216|`c7972692f14f498f242e03aff8f01faba1539f86`|PASS /PASS|[Provider signals](evidence/PR216-PREVIEW-SIGNALS.json), [actual badge display](evidence/PUBLISHED-BADGES-PREVIEW.json) |

PR214's earlier5ddf0d4 evidence is historical. Its updated receipts above establish the new head after adding the punctuation correction. No draft has been merged or deployed to production. Each must be updated against fresh main and reverified if its head changes.

The required checks are `TradeHQ Phase 3 tests`, `TradeHQ Cloudflare compatibility / Cloudflare build and SEO`, and `TradeHQ Required validation`, from trusted GitHub Actions app15368. Successful disposable Postgres controls are additional evidence. Optional production release jobs are intentionally skipped for these PR contexts; a skipped job is not production release verification.

## Credential blocker and exact production proof

At12:47UTC, both native providers confirmed the PR212 merge SHA above:

- Cloudflare production/main deployment `a48650b5-b13e-436f-a097-a3a04111dbba`, deploy stageSUCCESS.
- Vercel production deployment `dpl_64tgq5fomNQwHZifS9iQVd7UEM4x`, READY, same SHA and production aliases.
- About actual live checks passed all5 widths;8/8 guest smoke checks passed. [Native receipt](evidence/PR212-PRODUCTION-PROVIDERS.json), [live checks](evidence/POST-PR212-GUEST-SMOKE.json).

After the environment credential refresh, the Cloudflare project read returned401 at14:45UTC; Vercel returned200 and READY for the same production SHA. The unchanged environment remains running at revision8. Later Vercel native reads also verified each candidate. Cloudflare preview signals come from the trusted native GitHub provider app85455 and actual preview pages; they do **not** substitute for authenticated proof of the active production deployment. [Binding observation](evidence/CURRENT-PRODUCTION-BINDINGS.json).

The user's quoted `Missing trusted successful CI check` was from an older rerun. Partial reruns recreated sibling check identities asynchronously. A fresh complete workflow [39789844231](https://github.com/anugaweerasinghe1-del/trading101/actions/runs/39789844231) passed the required checks, then [release job119865057821](https://github.com/anugaweerasinghe1-del/trading101/actions/runs/39789844231/job/119865057821) failed with:

> Cloudflare account token verification unavailable (HTTP401; code1000).

No trust assertion was weakened, no protections changed, and no unchanged failing rerun loop continues. [Sanitized chronology](evidence/PR212-MONITOR-DIAGNOSIS.json), [release ledger](RELEASE-LEDGER.json).

The owner needs to securely repair `CLOUDFLARE_API_TOKEN` in **both cloud environment settings and GitHub Actions** using an active API token for the intended account/project and required read access. Do not paste its value into chat. No further Vercel key is needed for the currently working read verification. The mission's protected area includes “Changing production secrets, API credentials”; none were changed by the audit. The finding records risk and rollback in [FINDINGS.json](FINDINGS.json).

After repair, validate the native Cloudflare account/project read and run the complete workflow. Release one candidate at a time, with fresh-head required CI and preview checks, ordinary protected merge, exact-merge production proof on both providers, affected-page live checks and guest smoke checks before the next release. Proposed priority:213,216,215,214. Preserve all browser regressions when resolving adjacent test insertions.

## Unfinished review and provisional readiness

The244 unread main bodies are precisely listed in [UNREAD-MAIN-ROUTES.txt](UNREAD-MAIN-ROUTES.txt):171 trading terminal/instrument views,50 niche guides,15 Learn views,7 sector pages and1 trading-guide hub. All441 routes still have some follow-up work; [UNFINISHED-SCOPE.json](UNFINISHED-SCOPE.json) identifies body-reading stage, viewed widths and remaining tasks per URL. The963 unread expanded answers,26 quiz feedback/result assessments, deeper conditional controls, below-fold visual inspection, cross-page duplication comparison and outstanding material source corroboration are not marked complete.

All49 glossary entries,6 trading-guide bodies and6 strategy bodies were read with their respective hubs, alongside previously noted articles, courses, trust pages and public profiles. Main-body reading is a partial stage. Some glossary/strategy explanations share navigation and risk caveats but offer different defined calculations or worksheets; a complete originality comparison across the unread inventory remains pending.

Primary text actually checked includes Investor.gov DCA/order mechanics, the SEBI study's scoped statistic, CME margin/term-structure explanations, the Fed FOMC schedule, NYSE marketwide circuit breakers, the separate LULD plan and W3C contrast thresholds. A successful reference GET is not source corroboration. Dynamic CME contract specifications and other material claims remain staged. [Source assessments](evidence/PRIMARY-SOURCE-ASSESSMENTS.json), arithmetic receipts [initial](evidence/INDEPENDENT-ARITHMETIC.json), [courses](evidence/INDEPENDENT-COURSE-ARITHMETIC.json), [glossary/guides](evidence/INDEPENDENT-WIKI-GUIDE-ARITHMETIC.json).

| Review category | Current scoped status and reason |
|---|---|
|Originality and independent value|NOT VERIFIED across the whole inventory;197 main-body notes,244 unread |
|Educational usefulness|NOT VERIFIED globally; read glossary/course/guide worksheets offer specific mechanisms and limitations |
|Financial accuracy and responsible claims|NOT VERIFIED globally;50 arithmetic receipts pass, primary-source work remains incomplete |
|Navigation and accessibility|CONCERN: production still contains clipped mobile covers and low light-theme contrast; tested fixes pending release |
|Desktop and mobile usability|CONCERN:7 reproduced presentation/functionality defects,6 unreleased; image review incomplete |
|Functional reliability|CONCERN: hidden published badges remain live; course controls tested in disposable browser, other conditional journeys pending |
|Publisher transparency and trust|PASS within the read About/Contact/legal scope for visible publisher and simulation disclosures; no professional credentials inferred |
|Published content consistency|CONCERN: Contact count and punctuation/spacing fixes await deployment |
|Discoverability and technical presentation|NOT VERIFIED fully;441 fresh HTTP200s and5-size browser collection, but current native Cloudflare production authentication fails |
|Public AdSense policy concerns|NOT VERIFIED for a final whole-site verdict; no specific policy breach inferred solely from ordinary UI findings |
|External/account-side uncertainties|NOT VERIFIED: Google account eligibility, private review procedures, actual ad/region consent states and final approval are outside completed evidence |

**Provisional handoff decision: C — NOT READY to declare Part1 complete or proceed on a completed site-side review.** Specific P2 usability/functionality defects remain on production and required release verification is blocked; substantial editorial/control review is unfinished. This is not a conclusion that Google has rejected the site or that each remaining quality issue is an AdSense policy blocker. A final independent verdict must follow actual completion, rather than be manufactured from passing CI.

No production application regression was established after PR212. CDP timeouts, a helper's wrong expected copy string and an isolated metadata-readiness race were retained as test/helper limitations, then corrected and rerun; they are not counted as site defects. No actual user account, order, portfolio, database row, privacy/consent implementation or ad implementation was altered. Quiz and preview completion records belonged only to disposable browser storage.

Raw browser screenshots and full captured main/FAQ text remain in the workspace under `evidence/live-*`; not every raw capture is committed on the evidence branch. Selected reproduction/candidate images and sanitized receipts are preserved with this report and the source PRs. Changed files are reviewable in [PR212 files](https://github.com/anugaweerasinghe1-del/trading101/pull/212/files), [PR213 files](https://github.com/anugaweerasinghe1-del/trading101/pull/213/files), [PR214 files](https://github.com/anugaweerasinghe1-del/trading101/pull/214/files), [PR215 files](https://github.com/anugaweerasinghe1-del/trading101/pull/215/files) and [PR216 files](https://github.com/anugaweerasinghe1-del/trading101/pull/216/files).

Part2 account-side work should wait for the release blocker, verified production fixes and remaining site review. Do not infer account eligibility or promise Google approval from this handoff. Completed evidence is preserved; unfinished work remains explicit.
