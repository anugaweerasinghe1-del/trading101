# Release verification — 23 November 2026

## Recovery and actual production chain

Recovery baseline was protected main `6309b289b6e139aebeba94951f28238beb3d4634`. Current code release is protected main `522bac0cd2fd956b61e84b92f892dd3edf7e14c6`, normal squash merge of PR540 at01:30:25UTC. `evidence/pr-recovery.json` records fresh status and immutable SHAs for all eight requested historical PRs and subsequent audit corrections. PR521 remains open; its relevant changes were superseded by PR525, as reconciled in the preceding final audit. No stale overlapping PR was merged. Issue430 remains open.

Cloudflare Pages, not a presumed Vercel alias, is independently evidenced as the production serving chain. The native verifier checks authenticated project metadata: project identity, production branch `main`, deployment environment `production`, successful active deployment stage, commit hash and the custom-domain binding. It checks protected GitHub main before and after public probes, rejecting a stale SHA. Provider secrets are never emitted.

## PR540 protected validation

Exact head: `deebdec03473fc073a84d0fb79b25005575917c7`.

All three required contexts passed before normal merge: TradeHQ Phase3 tests; TradeHQ Cloudflare compatibility / Cloudflare build and SEO; TradeHQ Required validation. Disposable PostgreSQL controls, dependency inventory and Cloudflare preview also succeeded. Run45093766036 contains the mandatory head checks. The preview was not substituted for production evidence.

Main run [45094941731](https://github.com/anugaweerasinghe1-del/trading101/actions/runs/45094941731) passed required validation, Cloudflare compatibility and Phase3 tests; disposable PostgreSQL run45094941915 passed. Filtered exact-main checks are in `evidence/code-main-checks.json`. Local build and Daily regression logs preserve focused and broader checks; 357 served route fixtures passed. The final Cboe reference-label correction passed focused editorial verification and exact-head CI.

## Native production receipt

[Workflow45094941728/job137432573829](https://github.com/anugaweerasinghe1-del/trading101/actions/runs/45094941728/job/137432573829) produced the authenticated Cloudflare receipt at01:31:34.7160264UTC:

- Source: `authenticated_cloudflare_pages_api`.
- Project: `tradehq-preview` (the project name is not an environment assumption).
- Protected-main SHA: `522bac0cd2fd956b61e84b92f892dd3edf7e14c6`.
- Active production deployment: `73e7d780-e185-43bb-b05f-8c87914dc464`.
- `customDomainBound:true`, `domainsReported:true`, `verifiedMain:true`.
- Status: `CLOUDFLARE_PRODUCTION_VERIFIED`; limitations array empty.

`evidence/production-verification.json` preserves the receipt. A second native main-workflow receipt job137435507360 passed. This is separate from, and does not waive, the stricter Vercel/recovery gate.

## Independent public observations

`production-live-crawl.json` records 366 discovered routes, 163 indexable publisher pages, 7,294 internal links, zero crawl problems/warnings. The main sitemap has151entries, the published course sitemap12. `current-http.json` refreshes the complete481known-URL cohort:480HTTP200, one expected missing-page404. Seventy-eight public profiles were status-only; no bodies or genuine private moderation records were retained. Metadata captures preserve their actual timestamps.

`production-html-delta.json` compares the fresh initial HTML with the preceding baseline. Twelve publisher pages changed; every changed passage was directly reread. The151unchanged publisher bodies explicitly reuse prior direct reading by current text identity. Current source enumeration contains6098records/163pages and includes the latest Cboe label. `EXTENDED-READING-EVENTS.jsonl#production-initial-html-alignment` records the human/model assessment, rather than claiming hashing is reading.

`production-route-browser.json` contains the complete403nonprofile route cohort at1280px and360px. The two `/admin/reviews` entries fail the generic `main`-landmark wait because that restricted shell has a password form; the separate focused production control test verifies its H1, password requirement and disabled Unlock without attempting access. These are documented harness-scope exceptions, not fabricated browser passes. No real orders, writes, emails or user credentials were used. UGC text is redacted from persisted observations.

`production-control-regressions.json`:14bounded tests, including four initially interrupted asset routes at both widths with settled headings, the locked moderation shell, all three trade-history pressed-state filters and analytics rejection/keyboard samples. The previous local interrupted-build route tests had captured loading headings; the production recheck explicitly waits for real content and supersedes that limited observation.

`production-final-local-checks.json`: six production-focused checks despite the historical filename: corrected course contrast at both widths, settled7tracks/29lessons catalog, and absence of the old primary-driver label in the generated asset readout.

`production-daily-browser.json`: all50cases/500questions through the actual released UI, alternating desktop/mobile across cases. Each case grades10/10; options and original saved exercise/answer keys are preserved; no overflow/runtime/ad attempts. Synthetic local storage only; all external and non-read requests blocked. This is not a signed-in production-learning-progress test.

`production-accessibility-after.json`:72scopes (18templates×2widths×2themes), axe4.14.1, WCAG2A/AA and2.1A/AA tags; zero violations in those scopes. Axe incomplete/manual-review items remain explicit. No complete accessibility certification is claimed. Four stabilized theme screenshots and computed theme state are in `production-final-*-home-*.png` and `stable-screenshot-state.json`; these supersede earlier transitional screenshots. Desktop/mobile light/dark images were visually inspected.

`production-performance.json` records twelve bounded unthrottled lab observations over the first three seconds, including TTFB, DOMContentLoaded, LCP observation and layout shifts. Tracker/ad requests were blocked. These are not real-user Core Web Vitals percentiles or a performance certification. Source/hydrated availability and overflow/image checks are separate from HTTP success.

`domain-robots-ads.json` preserves apex HTTP/HTTPS redirects to canonical HTTPS www, robots, both sitemap declarations and ads.txt. Publisher ID matches `pub-4160578126993254`. Disabled-ad source/CI checks and guest matrices show no attempted ad serving. No ad impressions, clicks or account/CMP changes were made. Publisher metadata and ads.txt do not establish account eligibility or approval.

## Six release controls

| Control | Result | Evidence |
|---|---|---|
| Protected main and immutable PR merge identity | PASS | PR540/API; exact SHAs above |
| Mandatory exact-head validation | PASS | head run45093766036; main run45094941731 |
| Native provider production environment/branch/commit | PASS | authenticated native receipt |
| Public custom-domain binding/current availability | PASS | receipt plus fresh crawl/HTTP |
| Changed content and bounded rendered/control regression | PASS | live deltas, focused/Daily/axe/route evidence |
| Strict Vercel/recovery commit-status reconciliation | BLOCKED | main release-signals workflow; preceding strict gate failed “Vercel commit status must be unambiguous0 !==1” |

Do not call the strict gate a harmless false positive or weaken it without provider/maintainer evidence. Successful Cloudflare production verification resolves host identity and release presence, not the stricter recovery signal. Documentation-only merges after this audit receive their own exact native receipt; the final documentation PR description is the append-only terminal receipt to avoid an infinite series of receipt-only commits. The audited code SHA remains the immutable code release above.


## Native Vercel reconciliation

The authenticated Vercel connector was used read-only, without retrieving environment-variable values. `evidence/vercel-native-reconciliation.json` identifies project `trading101` and the latest five production records. The newest is READY deployment `dpl_3rWXxNqjh4eyF8dD3g224zQJo2PK`,21November16:10:34UTC, main commit `81db1e42a8b4b484593983a1442ef36099821f52`. An exact query for the audited522bac0release returns no Vercel production deployment. Vercel still lists the domain as verified configuration; that does not override the authenticated current Cloudflare production receipt or prove Vercel serves the public domain. This explains the divergent records without silently waiving the strict recovery gate. No DNS, provider, account or environment settings changed.


## Final startup-layout correction — PR541

A bounded performance check exposed a real additional defect: the shared asset template initially omitted known route content, then inserted the introduction and controls after its600ms quote-hydration timer. Repeated Bitcoin observations showed cumulative movement0.9104desktop/0.7697mobile, dominated by a single large shift. Chart placeholder bars also changed randomly on rerenders. Finding COMP23-A05 was recorded before editing.

PR541 initializes the known static asset/list on first render and makes decorative skeleton bars deterministic. Quote hydration, cached-price processing and order behavior remain intact. Exact head `dce1a8b193fa2642ba0be865ee8dee32034dfed3` passed all mandatory checks in run45097289500 before normal merge. TypeScript/Vite and existing mobile/BTC checks passed locally. The startup browser regression fails on the prior production release and passes on the candidate; an initially mistaken `/trade/jpy` fixture was corrected to the actual `/trade/usdjpy` catalog ID, with the fixture error documented separately.

**Final audited code: protected main `d9edc4d95181101d280f0da5c1858c8621f189fe`.** Native workflow45098219945/job137442734999 confirms active Cloudflare production deployment `30fd4e74-b9c6-4663-99e6-3bf0d19607d2`, main branch, exact SHA and public-domain binding. See `layout-production-verification.json` and `layout-head-checks.json`.

The released code passes six BTC/NVDA/USDJPY startup regressions at both widths. The isolated harness stretches only the hydration timer to observe both states. An additional unmodified timing observation yields0.00246desktop/0.02217mobile cumulative movement, versus0.9104/0.7697before. These are lab comparisons, not Google approval thresholds or real-user percentiles. `production-asset-route-browser.json` covers all170affected routes×2widths (340views): zero errors/overflow/broken images/missing alt attributes/ad attempts. Other233nonprofile routes retain their dated522bac0broad observation; this two-file layout correction does not change those templates.

All20distinct numeric quiz questions, expected choices, keys and explanations also pass through the released UI at both widths (12quiz scopes/40question observations). The normal analytics Reject choice is made first; an earlier automation attempt left the dismissible banner open and its click interception is not claimed as a website failure or bypassed with forced clicks. No production account writes/orders/mail occurred.

Fresh source enumeration confirms all6098publisher block IDs/content hashes identical through PR541 (`layout-editorial-identity.json`); earlier direct reading is explicitly reused, not rerun or inflated. The15new findings in this completion pass have append-only production-closure events; the reconciled ledger has19fixed findings including earlier corrections,3false positives and7unresolved owner/provider/optional items. The original strict Vercel signal failure at522bac0 is preserved in `code-release-signal-exception.json`; native Vercel metadata independently corroborates its older deployment record.


## Final public-text gap closure

An anonymous public-only query selected exactly the `content` and `owner_reply` fields for currently visible reviews, matching the UI100-rowlimit. All four visible reviews and four public replies were directly read, without retrieving names, IDs, rating/contact or private moderation fields. No prohibited material or claimed real profits were established; learning/confidence statements remain subjective, unverified testimonials. The owner's statement attributing historical-data limits to licensing needs corroboration under existingG03/G04; no genuine record was changed. A separate anonymous `bio`-only query over public profiles returned78rows, all empty. The deidentified assessment preserves per-block hashes and judgments, with no raw text or personal identifiers in the repository. This adds eight current bounded assessment records (16,533total) without changing the29-finding ledger or14blocked authenticated cases.
