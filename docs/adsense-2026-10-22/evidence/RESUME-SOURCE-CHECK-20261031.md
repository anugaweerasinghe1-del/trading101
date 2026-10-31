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


## Additional bounded article-reference checks (same 31 October continuation)

The following are **claim-level source/logic comparisons**, not full individual article approval, rendered-page visual testing, or an increase to the documented full-light route count. Source of article text: current `src/lib/learnArticles.ts` at `main`. Linked source selection: current `src/lib/articleReferences.ts`.

1. **`/learn/article/market-orders-vs-limit-orders`** — SEC Investor.gov [Types of Orders](https://www.investor.gov/introduction-investing/investing-basics/how-stock-markets-work/types-orders) was actually read. The article's buy-limit maximum price, sell-limit minimum price, lack of fill guarantee, and market-order price uncertainty agree with the official definitions. TradeHQ's market-only simulator limitation is explicitly stated in main. Review bounded to order mechanics and supported feature disclosure; this is **not** proof of all execution or crypto exchange details.
2. **`/learn/article/how-to-build-a-portfolio`** — Independently recomputed the 25% × $100,000 × 30% illustrative sector decline as a **$7,500** loss before costs, assuming all other holdings unchanged. SEC Investor.gov's [What Is Risk?](https://www.investor.gov/introduction-investing/investing-basics/what-risk) was actually read and supports the distinctions between business, volatility and liquidity risk. The page cautions that diversification does not eliminate synchronized losses. Portfolio suitability, actual covariance and deployed simulator records were not tested.
3. **`/learn/article/stock-market-index-etfs`** — Checked each index-methodology summary against actual primary publisher pages: [S&P U.S. Indices Methodology](https://www.spglobal.com/spdji/en/methodology/article/sp-us-indices-methodology/) (float-adjusted market-cap S&P 500), [Dow Jones Industrial Average](https://www.spglobal.com/spdji/en/indices/equity/dow-jones-industrial-average/) (30 price-weighted shares), and [Nasdaq Composite](https://www.nasdaq.com/products/global-indexes/nasdaq-composite) (Nasdaq-listed constituents and market-cap weighting). Also loaded the linked [SPY issuer product page](https://www.ssga.com/us/en/individual/etfs/spdr-sp-500-etf-trust-spy): it redirects to a new issuer URL but remains accessible and includes ETF fees, tracking and NAV-risk disclosures. No confirmed factual correction in the three bounded comparisons; individual holdings, composition changes and fund factsheet effective dates were **not** audited.
4. **`/learn/article/trading-strategies-for-beginners`** — Independently read [Berkshire Hathaway's original 1988 letter](https://www.berkshirehathaway.com/letters/1988.html), the primary source for Buffett's stated long-holding preference **conditional on outstanding businesses and management**. The article names the section “Buy and Hold (The Warren Buffett Approach)” and discusses business assessment and permanent-loss risk. This is broadly aligned as an informal heading, but the heading must not be construed as a full characterization of Buffett's methodology. Historical attribution reviewed to this bounded extent; no confirmed correction.
5. **`/learn/article/crypto-vs-stocks`** — Current main cautions that crypto venue hours can be interrupted, individual asset volatility is sample-dependent and both shares and tokens can lose value. SEC Investor.gov's risk page supports ownership/business and loss-risk concepts; it does **not** itself substantiate market-hour, blockchain or every crypto-specific claim. No claim of complete source clearance. Nasdaq stock exchange hours, provider restrictions and specific asset histories remain separate work.

**Reference availability checks:** The article references for Investor.gov `Types of Orders` and `What Is Risk?`, Fidelity `technical-indicator-guide/overview`, and issuer SPY product page were reached successfully through external text retrieval. The SPY URL redirects but is not broken. The Bitcoin white-paper PDF was **not reviewed** in this stage.

**Aggregate of this session:** eight routes received selected primary-source/arithmetic comparisons (three strategy guides and five articles). No new site defect or production release is substantiated by these bounded checks. This is additional source-stage evidence only; do **not** alter the public route/visual/confirmed-fix totals or mark any page wholly cleared.
