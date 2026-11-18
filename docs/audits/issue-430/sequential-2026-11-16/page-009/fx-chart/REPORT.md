# P09 history-chart currency label

[STRICT-TRADE-003](https://github.com/anugaweerasinghe1-del/trading101/issues/430#issuecomment-6966526359) is a confirmed content defect. Production guest selections at 390px and 1440px show the history chart title `EUR/USD/USD` while the selected asset remains EUR/USD and the other chart shows USD per EUR. The source appends a second quote currency to the authored symbol.

The candidate keeps the existing full pair symbol for assets with type forex. Other asset classes still display the existing `symbol/USD` title. This changes a visible label, with no impact on provider requests, units, prices, calculation, execution or stored state.

Full Cloudflare build/postbuild and TypeScript pass. Local compiled Chromium selected EUR/USD, EUR/GBP and USD/JPY at both widths and checked the separate line-chart units independently. The public before captures also record selected states and caveats for all four time windows of the separate line chart. The P09 audit remains partial.

The chart correction is isolated from #466. Reconcile current main and the #466 release evidence before opening the protected merge for this correction.
