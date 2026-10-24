# TradeHQ audit — current continuation status

This is an unfinished individual audit, not a Google approval or completed Part 1 certification. The latest verified production commit is `1a1e577a76203a622cfde2929fb37389369ab65f` (PR #222). There are **23 confirmed site findings: 13 P2 and 10 P3; 22 are repaired and publicly verified.** THQ-023 is prepared in PR #223 and remains unreleased. These counts describe educational quality/usability findings, not 23 asserted Google Publisher Policy violations.

## Current release evidence

PR [#222](https://github.com/anugaweerasinghe1-del/trading101/pull/222) repaired chart controls that changed only their highlight, a subsequent tiny-price fallback update that rounded to zero, misleading generated FAQ descriptions of practice data, and clipped large-price axis labels. Candidate `ec1183eb63caf82305ef15160756365b07037737` passed exact-head required CI/PostgreSQL, trusted Cloudflare preview and native Vercel READY checks. The actual Cloudflare preview passed 40 route/viewport states. Existing Vercel preview login protection prevents anonymous rendered checks; it was not changed or bypassed.

The normal protected squash merge produced `1a1e577a76203a622cfde2929fb37389369ab65f`. Its [main workflow](https://github.com/anugaweerasinghe1-del/trading101/actions/runs/39983402745) passed all required checks and both read-only release monitors. Native provider observations and a fresh 24 October read confirm Cloudflare production deployment `1921e1b9-77d3-40a7-8c0b-56c17b31871b` SUCCESS and Vercel production `dpl_9ev1xC9CRow1zpH1Nh5wRZRWR2bN` READY at that exact commit. Forty affected live route/viewport states, thirty guest smoke states and four safe controls pass, with no captured runtime exceptions. Selected affected-component screenshots were manually viewed; geometric collection does not establish exhaustive human visual coverage.

See [native proof](evidence/PR222-PRODUCTION-PROVIDERS.json), [fresh provider observation](evidence/PR222-PRODUCTION-FRESH-BASELINE.json), [main CI](evidence/PR222-MAIN-CI.json), [affected live checks](evidence/PR222-PRODUCTION-BROWSER.json), [guest checks](evidence/POST-PR222-GUEST-SMOKE.json), [source safety](evidence/PR222-SOURCE-SAFETY-AND-LOCAL-CHECKS.json) and the [release ledger](RELEASE-LEDGER.json). Historical PRs #212–221 and all eighteen preceding repairs remain recorded there. Do not remerge them.

## Remaining confirmed finding

[THQ-023](findings/FUND-FAQ-EXPOSURE.md): GLD's actual expanded FAQ assumed underlying index composition. The issuer instead specifies gold-bullion exposure less expenses. [PR #223](https://github.com/anugaweerasinghe1-del/trading101/pull/223) changes one fallback description to holdings or tracked exposure, fees, structure and underlying market conditions. It affects fourteen source-derived generic fund FAQs; that does not mean every previous description was factually false. Authored drivers retain precedence. No pricing, charged fees, orders, portfolio data, auth/DB, progress, privacy/ad or infrastructure behavior changes. Required CI and actual previews are in progress. It must complete the same serial production/live release gate before being marked repaired.

## Precisely unfinished coverage

- 449 candidate routes: 441 public/guest routes and eight excluded admin guards. The dated 22 October HTTP collection returned 200 for all 441 public routes; its 2,205 viewport captures are not 2,205 completed human reviews.
- **336 of 441 rendered main bodies/state texts read; 105 remain unread.** Many recent notes read the dated 22 October capture rather than claiming a fresh observation. Per-route dates and source limitations are retained.
- **257 of 1,042 expanded FAQ answers read; 785 remain unread.** Another 150 native-visible guide answers are tracked separately, not double-counted as expanded answers.
- Twenty-four legacy topics/twenty question explanations and twenty-six structured quizzes/104 question-option-explanation sets have text review. Quiz images, full primary-source corroboration and conditional/mobile/desktop visuals remain partial.
- Sixty-three independent fixed-input Decimal receipts are historical evidence for those examples, not a full engine/private-account certification.

The exact remaining main URLs are in [UNREAD-MAIN-ROUTES.txt](UNREAD-MAIN-ROUTES.txt). [UNFINISHED-SCOPE.json](UNFINISHED-SCOPE.json), [PAGE-AUDIT.json](PAGE-AUDIT.json), [RENDERED-CONTENT-NOTES.json](RENDERED-CONTENT-NOTES.json) and [FAQ-REVIEW-NOTES.json](FAQ-REVIEW-NOTES.json) separate reading, controls, source corroboration, geometric collection and human visual stages. No route is promoted to whole-page completion solely from a capture, shared fix or CI pass.

## Safety and remaining investigations

The chart series is component-local; order quotes and portfolio accounting were preserved. No real accounts, orders or contact submissions were created. The public-duels RPC remains prevented because it can settle expired duels. That feature's results are not verified by this read-only audit.

INV-FX01 remains an unresolved practice-account/unit-model question, not a confirmed financial-engine defect. Currency conversion, fees, settlement, positions, balances and history must not be revalued without a specified model and explicit owner authorization. Continue independent safe work. Historical token/network taxonomy (including FTM and MATIC/POL), dated issuer/superlative claims, full duplication/source checks, ad delivery/account eligibility and regional consent observations remain separate follow-ups. A 23 October unclassified promise rejection and environment-proxy failures are preserved as historical limitations, not silently converted to site defects or erased by later passing checks.

Fresh native GitHub Actions provider verification works. Workspace binding readiness is unknown in runtime status; the last direct Cloudflare binding test on 23 October was 401, whereas the GitHub-secret native provider path succeeds. Secret values were never printed or retrieved from GitHub Secrets.

A final independent AdSense readiness verdict has not been issued because the required individual review is incomplete. Passing CI and repairing known findings cannot establish Google's eventual approval. [NEXT-REVIEW.md](NEXT-REVIEW.md) records the remaining work. Large raw browser collections remain in the workspace; [EVIDENCE-MANIFEST.json](EVIDENCE-MANIFEST.json) lists the selected sanitized artifacts published with this report. Earlier `FINAL-*` files describe their dated eighteen-fix baseline and are superseded by this continuation for current counts/status.
