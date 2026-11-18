# Fractional position and Sell availability

Native production commit 08054db9181da3dd88728e0d0270c100e8fbd199. Four disposable guest browser contexts use the published /trade guided query at 390px and 1440px. Requests are restricted to same-origin GET, and simulated buys affect only the new browser session. No sell is submitted. [Browser evidence](production-before.json)

- **STRICT-TRADE-024 · Confirmed product defect.** After a 2.00006 AAPL practice buy, 100% Sell enters 2.0001 and disables Sell on both widths. After a 0.00003 AAPL practice buy, 100% enters 0.0000 and also disables Sell. The 390px holdings slider reproduces both outputs. Entering the actual stored quantity manually enables Sell in all four contexts. The 25% shortcut also produces zero for the 0.00003 position. The desktop Max and preview display round the holding or order quantity to four decimal places. The public inputs and guest execution support the observed fractional quantities.
- **STRICT-TRADE-025 · Confirmed product defect.** In the 390px Sell drawer, the amount context calls the cash balance “Available” while the slider measures holdings and sale submission is capped by the asset quantity. The two otherwise identical Sell panels display $99,488.97 and $99,999.99 as availability for 2.00006 and 0.00003 AAPL holdings. Entering exactly the holding enables the sale. The Buy context appropriately shows cash.

Both findings concern simulator behavior. Neither establishes a Google policy violation.
