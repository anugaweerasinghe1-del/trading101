# TradeHQ audit continuation — bounded source review (31 October 2026, Asia/Colombo)

This is a **limited editorial/source-and-arithmetic review**, not a claim of exhaustive AdSense clearance, full-page browser inspection, full source validation, or production repair.

## GitHub baseline reconfirmed
- Repository: https://github.com/anugaweerasinghe1-del/trading101
- Protected `main` commit: `1da8d75941f7db17695440acafaef112c3a7ca6e`, unchanged from the previous handoff.
- Evidence branch `audit/20261022-progress-evidence` at start: `caca2caf235801968da88ced8c45cc2c289ef947`.
- PR268 was merged into the exact main commit above.
- GitHub's exact-SHA check-runs response reports six successful push-time contexts (TradeHQ Release & Recovery Readiness, Release signals, Required validation, Cloudflare compatibility, Phase 3 tests, Disposable PostgreSQL controls) plus Cloudflare Pages success on 30 October. A fresh authenticated provider API read was **not** performed in this session. Prior saved `evidence/PR268-PRODUCTION-PROVIDERS.json` reports matching Cloudflare and Vercel production deployments as of 30 October.
- The active open PR search returned older draft/unmerged proposals. No fresh merge was undertaken.

## Bounded main-source and external-source checks

### `/strategy/dca-dollar-cost-averaging`
Main file `src/lib/seoData.ts` at SHA `1da8d75` contains the fee-free three-date worksheet. Independently checked: `100/10 + 100/8 + 100/12 = 30.833333...` units; `30.833333... * 12 = 370`; gain against $300 cost is $70; alternate immediate $300 purchase at $10 buys 30 units and ends worth $360. `300/30.833333... = 9.729729...` weighted acquisition price. All figures agree within disclosed rounding.
- Actually read SEC Investor.gov's current *Dollar Cost Averaging* glossary: https://www.investor.gov/introduction-investing/investing-basics/glossary/dollar-cost-averaging . It supports regular equal-amount contributions and purchasing more units at lower prices, less at higher prices.
- Also actually read Vanguard UK's January 2026 *The truth about cost averaging*: https://www.vanguard.co.uk/professional/vanguard-365/financial-planning/financial-well-being/cost-averaging . It supports distinguishing an already-available lump sum from recurring investment out of later income and warns of the opportunity cost of delayed deployment; reported empirical outperformance is historical, not a promise.
- The site labels the example hypothetical and does not extrapolate these numbers into a generally superior strategy. **No new confirmed correction from this bounded check.** This does not verify the absence of all misleading claims on the page.

### `/strategy/rsi-strategy`
Main file `src/lib/seoData.ts`. Independently checked both illustrative expectancy formulas: `0.57*1.2 - 0.43 = 0.254 R`; `0.32*1.2 - 0.68 = -0.296 R`. Page identifies these as chosen hypothetical realized outcomes rather than an observed win rate. Its 0–100 RSI, usual 30/70 threshold framing, and caveat that extreme readings may persist agree with Fidelity's *Relative Strength Index*: https://www.fidelity.com/learning-center/trading-investing/technical-analysis/technical-indicator-guide/RSI . **No new confirmed correction from this bounded check.**

### `/strategy/macd-strategy`
Main file `src/lib/seoData.ts`. Independently checked `0.43*2.5 - 0.57 = 0.505 R` before costs. Main's conventional 12-period versus 26-period EMA, 9-period MACD signal, and caution about repeated crossings agree with Fidelity's *MACD*: https://www.fidelity.com/learning-center/trading-investing/technical-analysis/technical-indicator-guide/macd . The sample does not claim an observed profitability rate or successful live trades. **No new confirmed correction from this bounded check.**

## Stale crawler-content observation — NOT a verified new site defect
A web text snapshot of `/learn/article/what-is-paper-trading` identified as crawled about three weeks earlier still says the user can `set stop-loss orders` and obtain `personalized strategy recommendations`. Current `src/lib/learnArticles.ts` at `main` instead explicitly identifies market-only simulated orders and rule-based non-personalized mentor prompts. Likewise, a web snapshot of `/ai-mentor` identified as crawled about two weeks earlier includes an old introductory AI-service claim that conflicts with the source's later rule-based explanation. These may be old indexed/extracted snapshots. The current application source is corrected; without a fresh direct live HTTP/browser read, **do not add a finding or assert that production is showing the obsolete text**. Fresh deployed-content revalidation remains pending.

## Google policy scope
Read current official guidance:
- https://support.google.com/adsense/answer/7299563 (original content and easy navigation)
- https://support.google.com/adsense/answer/48182 (program policies and restricted non-content/ad placements)
- https://support.google.com/adsense/answer/12176698 (site readiness)
The bounded editorial checks above do not establish Google approval, any specific rejection cause, account/age compliance, ad-placement eligibility, regional consent, or originality of the site as a whole.

## Execution limitations and ledger continuity
- The current execution environment did not have the prior cloud workspace or authenticated native Cloudflare/Vercel API credentials. A direct read via a default container HTTP client failed at DNS resolution. External web text results can be older crawls and are **not** evidence of a fresh full rendered browser test.
- No complete responsive screenshots were newly generated or personally reviewed; no interactive, conditional, authenticated, accessibility, regional ad, or database tests were executed. No trade/test transaction was made.
- **No application/source/release branch files, settings, data or deployment changed.** This note is published on the audit-only evidence branch, never on `main`.
- Existing ledger counts remain `454` public, `8` restricted, `85` previously confirmed and publicly verified, `0` unresolved previously confirmed fixes, `100` full-light visual routes, `354` remaining. No whole-audit completion percentage, new verified repair, new visual-coverage increment or new finding is justified by these checks.
- Priority for a capable live-browser environment: fresh deployed HTML check of the two older crawler snapshots; then individual remaining full-light/conditional/keyboard/source-review scopes, with release gates if a real repair is reproduced.
