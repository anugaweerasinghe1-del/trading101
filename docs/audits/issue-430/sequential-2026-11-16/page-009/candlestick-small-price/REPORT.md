# P09 small-price candlestick chart

**STRICT-TRADE-013** is a confirmed chart numerical defect. The public PEPE picker shows the practice value $0.00000388. In the 5Y simulation, both viewports only draw 0.00 as price labels. The checked-in generator clamps all first OHLC components to $0.0001. [Before-edit evidence](https://github.com/anugaweerasinghe1-del/trading101/issues/430#issuecomment-6968052464)

The candidate preserves the generated positive values and selects price precision for sub-dollar scale. The full Cloudflare build, TypeScript and compiled Chromium passed. An isolated source replay verifies the smaller PEPE, SHIB and VET inputs and a regular BTC-scale input. The browser test listens to Canvas-rendered text so the recorded result describes the actual axis. Immutable preview and exact production verification remain required after the preceding releases.
