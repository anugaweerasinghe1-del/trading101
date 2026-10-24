> Release update: PR #222 merged as `1a1e577a76203a622cfde2929fb37389369ab65f`; exact-main CI/release checks, both native production providers, forty affected live states and thirty guest states/four safe controls PASS. THQ-019–022 are PUBLICLY_VERIFIED. The preparation narrative below is retained as history.

# THQ-019, THQ-020, THQ-021 and THQ-022 — chart and FAQ limitations

Status: fixes prepared, not released. Baseline 793a99d538fb81705c79aeca25ad68b10b945905; fresh native providers confirmed it on 23 October. All four are P2 usability/accuracy findings, not automatically AdSense policy violations.

- THQ-019: Live BTC 1H/4H/1D/1W selections retained identical 51 points over 50 minutes. The source only styled the selected button. Select the display subset from existing timestamps, disclose limited history and separate quote periods. Do not request additional data or modify the quote supplied to orders.
- THQ-020: In an isolated browser candle-outage fixture, SHIB had 51 positive seed points, then a zero after a 3-second fallback update. This is not a claim of an actual provider outage. Remove cents rounding in this component-local point update. The generated series is not exported or supplied to execution/account state.
- THQ-021: Twelve expanded generated FAQ sets misdescribe Markets practice change/demo activity as 24-hour return/volume and imply generated charts model catalysts/correlations. The template also makes an unsupported universal popularity/suitability assertion. Handwritten BTC/BNB sets did not contain this generated defect. Correct the three generated answers; keep no-real-money and free-practice guidance.

- THQ-022: Manually viewed mobile BTC chart screenshot clipped the leading price characters. A fresh DOM measurement put the label left edge 11.67px outside the chart. Extend the existing label-based axis sizing to large prices and check actual SVG bounds at all widths.

Evidence: `evidence/continuation-20261023/trade-btc.json`, `trade-apt.json` and `CHART-AND-MARKETS-REPRODUCTION.json`. Reproduction used anonymous read-only browser inspection, never orders, accounts, contact submissions or production-record writes. Public-duels RPC remains blocked.

Affected runtime surface: MinimalistAreaChart on `/trade` and `/trade/:id`; generated asset FAQ answers where no handwritten FAQ exists. Isolated tests exercise timestamp windows using eight days of fixed candles, five viewport widths, two tiny-price updates, unchanged guest portfolio storage and all five asset-type FAQ groups. Full CI and both actual previews must pass on the candidate SHA, then normal protected squash merge, exact native production success/READY and live regression verification. Until then the production status remains unrepaired for these three.

Implementation risk is low and reversible: only local chart presentation and static wording change. Quote requests/hooks, financial calculation/execution, balances/fees/positions/history, auth, database, progress, privacy, ads, infrastructure and credentials are outside the patch. Rollback is a reviewed source revert with the same release gates; no data rollback is needed.
