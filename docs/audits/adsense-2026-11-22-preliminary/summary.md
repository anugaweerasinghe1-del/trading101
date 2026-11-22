# TradeHQ preliminary and non-indexed static audit continuation — 2026-11-22

**Requested first-pass scope completed; exhaustive editorial and authenticated/interactive acceptance not certified.**

## Immutable baseline and release

- Protected main inspected and confirmed unchanged at `81db1e42a8b4b484593983a1442ef36099821f52`.
- The authenticated Cloudflare Pages API receipt in [production verification run 44923108008](https://github.com/anugaweerasinghe1-del/trading101/actions/runs/44923108008) confirms this exact SHA, deployment `30acef59-9c49-4221-8acf-5e99cfc53eb7`, custom domain bound, five production smoke routes verified.
- [Phase 3 run 44923107856](https://github.com/anugaweerasinghe1-del/trading101/actions/runs/44923107856) completed core tests, Cloudflare compatibility and required validation successfully. Its separate release-signals job failed; do not confuse the independently successful Cloudflare receipt with all-provider release readiness.
- The Cloudflare build log records 358 prerendered routes (151 indexable + 207 noindex), 357 flat served-route fixtures plus homepage output, and successful default-deny ad-inventory verification. Its isolated Chromium matrix covers 159 editorial/fixture URLs at desktop/mobile with JS on/off plus additional interaction checks; it is not independent live-browser certification of every URL.

## Reconciled coverage

| Tier | Previously screened | New successful checks | Remaining at this tier |
| --- | ---: | ---: | ---: |
| Public sitemap preliminary content screen | 30 | 133 | 0 of 163 |
| Explicit non-indexed static routes: live direct-entry extraction and metadata | 0 credited in this continuation | 207 | 0 of 207 |
| Additional runtime catalogue routes, previously not in static count | 0 | 21 | 0 of 21 |

Total new unique URLs checked: **361**. Combined known URL matrix: **391**, comprising 163 sitemap URLs (151 static editorial + 12 current published dynamic courses), 207 non-indexed static paths and 21 non-indexed runtime catalogue paths. This is not the entire dynamic, authenticated, token-bearing, alias or error-state universe.

Both live sitemaps were re-read: 151 + 12, exactly the same set of 163 as the previous inventory. All 207 static and all 21 additional runtime noindex routes were absent from both sitemaps.

## Public preliminary content

- All 133 remaining URLs were retrieved and screened using extracted text, titles, headings, canonical URLs, index directives and contextual signals for deceptive promises, fabricated endorsement, real-money/wagering promotion, unsupported performance claims and placeholders. All 133 contained education/simulation language and matching canonical, indexable metadata.
- 61 pages triggered at least one keyword signal. Context excerpts were reviewed: negated guarantees, illustrative calculations, quiz distractors, explicit exclusions and qualified descriptions; none established a new policy conflict within this bounded scan.
- Five dynamic-course pages lacked the narrow initial risk-word marker. They were re-read and contained contextual safeguards such as simulated/virtual funds, no forecast/guaranteed execution, no real-world performance demonstration, or hypothetical assumptions. Missing a word in a heuristic is not a policy violation.
- This is automated full-extract topic screening plus assistant review of headings/flagged contexts and targeted full-page re-reads, **not** independent sentence-by-sentence source, originality, factual-claim or media validation. No Google minimum word count is asserted.
- Public text extraction method can return prerendered content rather than fully hydrated UI. It does not establish every link, form, script, asset or account state works.

## Non-indexed direct-entry checks

| Family | Paths | Matching direct extraction / canonical / noindex |
| --- | ---: | ---: |
| Sector hubs | 7 | 7 |
| Newsletter actions | 2 | 2 |
| Legacy learning routes plus trade review | 7 | 7 |
| Admin public shells | 8 | 8 |
| Achievements | 1 | 1 |
| Certificate verification shell | 1 | 1 |
| Static asset practice routes | 131 | 131 |
| Niche reference routes | 50 | 50 |
| **Total** | **207** | **207** |

Each listed clean URL yielded page-specific extracted text, unchanged final URL, expected self-canonical and a noindex directive, without a detected placeholder/error phrase. Forty provider-throttled entries were logged in the original batch and successfully retried. A fetch-provider rate limit is not an origin failure. The extractor does not expose independent raw HTTP status/cache headers for every result, nor prove interactive rendering on all 207. No admin actions, newsletter token submissions or account sessions were attempted.

The 21 additionally imported catalogue assets are not emitted by the existing static generator, but the explicit client-fallback allowlist includes the actual runtime ASSETS IDs. Live extractions confirmed 21/21 correct page-specific rendered views with matching canonical and noindex metadata. They are working runtime routes, not 21 broken links, extra static artifacts, or policy violations. No generator modification was justified by this observation. See additional-catalogue-before.json.

## Findings and disposition

| ID | Classification | Evidence and disposition |
| --- | --- | --- |
| THQ-IND-20261121-001 / #505 | Prior route defect; verification follow-up | Clean trade-review URL and query variant now both successfully extract matching canonical and noindex, consistent with the earlier live browser success and build tests. Raw response headers from separate clients and an independent hydrated-head check remain outstanding; issue stays open. No duplicate finding or new patch. |
| OBS-20261122-01 | Catalogue inventory reconciliation, not a defect | 149 explicitly generated asset paths plus 21 functional runtime catalogue paths; live metadata correct. No fix necessary. |
| OBS-20261122-02 | Fetch tooling throttle, resolved | 40 initially throttled nonindex checks retried and passed. No provider upgrade. |
| OBS-20261122-03 | Preliminary risk-word diagnostic, resolved | Five dynamic course marker misses re-read with contextual caveats. No confirmed violation. |

**New confirmed Google publisher policy violations: 0. New confirmed functional defects: 0. New user-facing code fixes: 0.** The prior route fix remains merged and Cloudflare production is verified for its exact SHA. Only audit evidence was written to a separate branch; no production code changes, new merge, or unnecessary redeployment was undertaken. No account edits, AdSense submissions, ad enabling, real user data handling, or paid upgrades.

## Remaining limits

- 163/163 public URLs still require exhaustive paragraph-level audit; preliminary screens must not be reported as full content certification.
- 207/207 explicit static routes passed the bounded direct-entry extraction and metadata gate, not exhaustive live interactive desktop/mobile acceptance. Private/authenticated workflows and dynamic/exceptions outside this inventory are separate.
- Actual AdSense applicant eligibility/status remains unverified; platform approval is not guaranteed.
- Prior #505 and the separate provider release-witness gap remain explicitly tracked.

## Evidence files

- public-batch-01/02/03.jsonl (133 per-URL screen records, including original flags)
- noindex-inventory.jsonl (207 paths reproducibly derived from exact source)
- noindex-batch-01/02/03/04.jsonl (original attempts and retries; last successful observation prevails)
- additional-catalogue-before.json (21 runtime routes)
- final-coverage.jsonl (391 distinct known URLs; completed tier and exhaustive limits)

This is the final record for the requested first-pass and static direct-entry scope; no claim of whole-site AdSense clearance.
