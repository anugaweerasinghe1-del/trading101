# INV-FX01: forex quote units and practice-account model — investigation open

This is an unresolved semantic review, not counted as a newly confirmed financial-engine defect or an AdSense violation.

Actual23October sector screenshot displays USD/JPY as `$148.5200` and USD/CHF as `$0.8745`. The22October full USD/JPY terminal body also used dollar prices while describing the real currency pair. A23October terminal heading was observed, but a deeper capture suffered a CDP timeout; do not count that helper failure as an app defect or fresh full-page proof.

Primary CME quote-convention text was fetched with normal TLS and read: the first currency is base, the second is terms/quote; its EUR/USD example exchanges oneEUR for1.1250USD. Thus a real USD/JPY exchange-rate number hasJPY terms, notUSD. Source: https://www.cmegroup.com/education/courses/introduction-to-fx/understanding-fx-quote-conventions.html

Read-only source inspection: SectorPillar prefixes every asset price/change with a dollar sign. portfolio.ts executes generic price×quantity accounting, with no base/quote currency conversion in that local path. This may be an intentionally abstract USD-valued practice instrument rather than a real FX settlement model. Existing simulation notices do not clearly explain that distinction. No orders, records or calculations were changed or tested against a real account.

Next safe step: determine and explicitly disclose the current abstract practice-unit model near forex prices and order entry, distinguishing it from actual FX conversion, settlement and P&L. A display-only clarification can retain existing accounting and records. Verify all15forex instruments, directories and relevant learning claims before claiming resolution.

A real two-currency or FX-contract accounting implementation is a protected change under the mission's prohibition on changing financial calculations, fees, positions and existing records without explicit owner approval. It needs an approved product/unit specification, isolated fixtures, forward-compatible versioning, preservation of legacy positions/history and a rollback plan. Do not simply relabel JPY numerals as dollars, divide existing holdings by a current rate or revalue production accounts. No full-model implementation is proposed for automatic release.

Risk/rollback for the safe disclosure option: minimal text/interface change, no data movement, ordinary reviewed revert. Risk for a future accounting-model change: high because amounts and real users' virtual histories could change; preserve legacy model/records and route only explicitly opted-in new practice activity to any approved model. Continue independent safe audit work while this remains under review.


[Fresh sector screenshot](../evidence/sector-header-before-1280.png) and [local accounting source](https://github.com/anugaweerasinghe1-del/trading101/blob/aa216a24c68c30c9251f96a050da098b33364686/src/lib/portfolio.ts#L73) support this scoped investigation. They do not establish a correct real-FX product specification.
