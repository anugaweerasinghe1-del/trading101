# P09 portfolio metric findings

Both findings use explicit browser-local guest portfolios. The captures cover 390px and 1440px. No practice order reached a production service.

- **STRICT-TRADE-006** is a confirmed metric-label mismatch. After two virtual $510.50 AAPL orders and $1.021 of fees, the closed fixture shows $99,998.98 total value and +$0.00 open-position P&L. The original “Total P&L” title implies a broader measurement than the source calculates. The corrected title is “Open P&L.” [Before-edit reproduction](https://github.com/anugaweerasinghe1-del/trading101/issues/430#issuecomment-6967230941)
- **STRICT-TRADE-007** is a confirmed error in the embedded educational mentor. The published definition compares each sale with its latest earlier buy. The fixture has buys at $100 and $110 followed by a sale at $105. The previous list-order selection compared the sale with $100 and reported 100%. The corrected timestamp selection compares the sale with $110 and reports 0% in the card and built-in history reply. The measure excludes fees and lot matching. [Before-edit reproduction](https://github.com/anugaweerasinghe1-del/trading101/issues/430#issuecomment-6967286229)

The TypeScript app check and complete Cloudflare build passed. Chromium checked both corrections on the compiled /trade and /trade/btc routes at both widths. This evidence records local verification of the candidate. The exact GitHub checks, native production deployment and fresh custom-domain reread remain due.
