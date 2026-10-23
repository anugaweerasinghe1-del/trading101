# TradeHQ — verified fixes and remaining audit scope

**All 18 reproduced site findings are now fixed and publicly verified: eight P2 and ten P3. No confirmed fix remains in draft. The exhaustive AdSense review is still incomplete.** Nine PRs were merged in this continuation, following the earlier PR212/About release. Every batch completed its native production and live-verification cycle before the next merge.

## Final verified production

- Main: `793a99d538fb81705c79aeca25ad68b10b945905` ([PR221](https://github.com/anugaweerasinghe1-del/trading101/pull/221)).
- Cloudflare Pages production: `597fc80b-767e-4235-ab99-d092e05c3df3`, **SUCCESS**, exact main SHA.
- Vercel production: `dpl_6iJr8woRy26kKAAjoVsJo3maAY3a`, **READY**, same SHA and active production alias.
- [Full main workflow](https://github.com/anugaweerasinghe1-del/trading101/actions/runs/39976638122): all three required checks, disposable PostgreSQL, release signals and strict release/recovery readiness pass.
- Final live check: 20 affected summary states, 30 guest route states and four safe controls pass. Earlier batches have their own affected-page receipts; this is not a fresh recrawl of all 441 pages.

[Authenticated provider receipt](evidence/PR221-PRODUCTION-PROVIDERS.json) · [main CI](evidence/PR221-MAIN-CI.json) · [affected pages](evidence/PR221-PRODUCTION-BROWSER.json) · [guest regression](evidence/POST-PR221-GUEST-SMOKE.json) · [machine closeout](evidence/FINAL-KNOWN-FIXES-CLOSEOUT.json).

## Repaired findings

| PR | Findings repaired | Verified merge SHA |
|---|---|---|
|[212](https://github.com/anugaweerasinghe1-del/trading101/pull/212)|About navigation overlap|`aa216a24c68c`|
|[214](https://github.com/anugaweerasinghe1-del/trading101/pull/214)|Stale catalog count on Contact; Concatenated public-profile timestamp; Doubled guide quick-answer punctuation; Generated asset FAQs imply browser-only storage for all portfolios; Generated FAQ irregular category plurals are misspelled|`40ba79c2b65d`|
|[213](https://github.com/anugaweerasinghe1-del/trading101/pull/213)|Mobile course heading clipping|`1517169657ea`|
|[216](https://github.com/anugaweerasinghe1-del/trading101/pull/216)|Published and earlier course badges hidden on local profile|`cd05556292fb`|
|[218](https://github.com/anugaweerasinghe1-del/trading101/pull/218)|Final legacy quiz correction and explanation hidden; Ambiguous rebalancing multiple-choice question|`9365eaf7e57a`|
|[220](https://github.com/anugaweerasinghe1-del/trading101/pull/220)|Positive tiny guide/chart price values displayed as zero; Bitcoin guide cites correlation with itself as a price driver; Mobile chart quote and refresh control clipped outside header; Mobile portfolio summary hides cash and Details control|`24a9e4fe486e`|
|[215](https://github.com/anugaweerasinghe1-del/trading101/pull/215)|Course catalog light-theme contrast|`48b5c2d5a63e`|
|[217](https://github.com/anugaweerasinghe1-del/trading101/pull/217)|Published courses missing from Learn hub|`f56422990c8d`|
|[219](https://github.com/anugaweerasinghe1-del/trading101/pull/219)|Sector breadcrumbs obscured by fixed navigation|`0e72e8ccc10b`|
|[221](https://github.com/anugaweerasinghe1-del/trading101/pull/221)|Separate summary/chart quote snapshots are unexplained|`793a99d538fb`|

The new eighteenth finding is a minor source-context problem: Amazon's summary retained −1.2% while its independently refreshed chart showed +3.10%, then −0.09%. The new paragraph explains the separate snapshots. It does not synchronize or change either value. These 18 quality findings are not asserted to be 18 Google Publisher Policy violations.

[Finding ledger](FINDINGS.json) · [serial release ledger](RELEASE-LEDGER.json) · [Amazon reproduction](evidence/AMZN-QUOTE-CHANNEL-FOLLOWUP.json).

## Safety and verification limits

Financial execution, fees, balances, positions/history, authentication, database/schema/RLS, progress storage, privacy/consent, ad behavior, production credentials and DNS were not changed by these fixes. No new paid service or dependency was introduced. The [final source comparison](evidence/FINAL-RELEASE-SOURCE-SAFETY.json) checks the complete changed-path allowlist, unchanged portfolio/chart-generation calculation prefixes, unchanged profile financial statements, and unchanged quiz answer indices/explanations. This does not certify every financial-engine behavior or private account flow.

Public regression uses a disposable anonymous browser. No production order, account creation or contact submission was performed. Display fixtures use only that browser's own local progress, which is preserved/restored. The public-duels RPC is deliberately prevented because its SQL can settle expired duels; duel functionality is not certified.

GitHub Actions now has working Cloudflare/Vercel verification credentials. The separate workspace Cloudflare binding still returned 401 at the final check; it was not substituted for the successful authenticated native Actions proof. [Access receipt](evidence/FINAL-WORKSPACE-ACCESS-20261023.json). No secret values were printed or retrieved from GitHub Secrets.

One initial Learn probe recorded an unclassified promise rejection. Its origin remains unproven; the later complete five-width Learn run and guest regression passed with no captured runtime exceptions. Additional follow-up was interrupted by a readiness deadline. Separate failed loads returned an environment proxy 503 page (`envoy://cloudflare_https_tunnel/`), not TradeHQ HTML. Those errors and the corrected audit-selector/readiness assumptions are retained in [validation notes](evidence/RESUMED-VALIDATION-NOTES.json), [initial runtime capture](evidence/PR217-PRODUCTION-INITIAL-RUNTIME.json) and [proxy capture](evidence/PR219-PREVIEW-PROXY-FAILURE.json). No required product assertion, repository protection or TLS/proxy control was weakened. A first PR214 main browser-transport failure was resolved by a complete coherent rerun; native workflow attempt history remains available.

## Coverage still unfinished

| Stage | Actual recorded scope |
|---|---|
|Inventory|449 candidates: 441 public/guest routes and 8 excluded admin guard shells |
|Initial HTTP/browser collection|22 October:441 HTTP200 responses and 2,205 Chromium captures at five widths; capture is not human visual completion |
|Main-body/state reading|282 route notes; 159 terminal bodies remain unread |
|Expanded FAQ reading|134/1,042 answers read; 908 remain unread |
|Separate native guide answers|150 answers across 50 guides; not added to the expanded-answer count |
|Legacy learning|24 topics and 20 questions/explanations read; restored final feedback is now released and its live flow checked |
|Structured course quizzes|26 interfaces and 104 question/option/explanation sets read; complete primary-source and image review remain partial |
|Independent arithmetic|63 fixed-input Decimal receipts; no production-account recalculation or engine certification |
|Human visuals, sources, controls, duplication|Incomplete individual stages; no 441-page completion claim |

The exact remaining routes and stages are in [UNFINISHED-SCOPE.json](UNFINISHED-SCOPE.json), [UNREAD-MAIN-ROUTES.txt](UNREAD-MAIN-ROUTES.txt) and [PAGE-AUDIT.json](PAGE-AUDIT.json). Large raw browser collections remain in the workspace; the selected hashed backup is not a claim that every raw capture was uploaded.

## Interim readiness assessment

| Area | Verdict within the reviewed scope |
|---|---|
|Known reproduced defects and release integrity|PASS: all 18 findings repaired; exact production providers and scoped live checks pass |
|Originality and substantive value|CONCERN: utility exists, but shared terminal prose and unread pages still need individual assessment |
|Educational usefulness and factual accuracy|CONCERN: known wording/quiz issues repaired; material current claims and primary sources remain partially checked |
|Financial accuracy|NOT VERIFIED beyond bounded arithmetic/source checks; forex unit interpretation remains open |
|Mobile layout and accessibility|CONCERN: reproduced clipping/contrast repaired, but full human visual, keyboard and conditional-state coverage is incomplete |
|Public navigation/functionality|CONCERN: known badge/quiz/catalog defects repaired; broader controls and protected/private flows remain unverified |
|Publisher trust and consistency|CONCERN: known inaccurate/stale copy repaired; broader editorial/source verification remains incomplete |
|Technical presentation|CONCERN: required CI and release proof pass, but dated structural coverage is not a full current content review |
|Ad serving, consent and account eligibility|NOT VERIFIED beyond bounded observations; protected implementation unchanged |

**Provisional C — not ready to declare Part 1 complete.** Confirmed remediation is closed; the exhaustive review is not. This is not a newly invented Google policy blocker or an approval prediction. Part 2 account eligibility and Google's eventual decision remain separate.

Continue the precise unfinished page/answer/visual/source work in [NEXT-REVIEW.md](NEXT-REVIEW.md). The open [forex-unit investigation](findings/FOREX-UNIT-REVIEW.md), source-currentness questions, comparison-volume claims, timeframe controls and fallback chart behavior must be investigated without silently changing protected calculations or records. Real FX conversion/settlement, fees, positions or historical revaluation require an approved specification and explicit owner authorization.
