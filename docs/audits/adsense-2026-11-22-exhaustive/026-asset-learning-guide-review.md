# Asset-learning guide family — first detailed review, 22 November 2026

Source baseline 5ebd32f826f75f6c9612841c031bfc8024a72f84. Previous 117/163 first-pass from #514. Seven additional unique publisher routes, 124/163 cumulative first-pass, 39 remaining. No strict page closure or Google approval claim.

| Route | Extracted characters | Authored fields matched |
| --- | ---: | ---: |
| /how-to-trade | 3671 | 6/6 guide summaries |
| /how-to-trade/btc | 4592 | 17/17 |
| /how-to-trade/eth | 4890 | 17/17 |
| /how-to-trade/tsla | 4587 | 17/17 |
| /how-to-trade/nvda | 4563 | 17/17 |
| /how-to-trade/spy | 4534 | 17/17 |
| /how-to-trade/sol | 5349 | 17/17 |

Fresh public extraction requested (ttl=0, upstream cache controls may apply). 108/108 normalized authored fields matched across all seven pages. Seven self-canonicals, seven index/follow directives. Full authored data and both initial HTML content-generator/metadata and React template read, including FAQ, links, publisher disclosures and structured HowTo schema. Text parity is not browser acceptance or proof of originality.

## Individual review decisions

- Index: distinguishes instruments, costs and quote limitations. Remove unnecessary claim of an informed first trade and arbitrary next-day review interval. Explicitly optional worksheets.
- BTC: review asset vs account change, fee and denominator arithmetic, protocol vs price distinctions. Qualify absolute claim that review prevents errors.
- ETH: network/asset distinction, virtual vs real fees, funding/staking limitations and arithmetic reviewed. Use specific current official gas-documentation URL; make the worksheet explicitly fictional and independent of actual order placement.
- TSLA: reporting metrics and price movements distinct; gap assumptions not a guaranteed exit. No instrument-specific correction needed.
- NVDA: direct/indirect exposure, dated assumed fund weights and operating figures separate from price; worksheet arithmetic reviewed. No instrument-specific correction needed.
- SPY: fund vs index and fee-aware hypothetical example, concentration, distributions not modelled; SEC ETF definitions corroborated. No instrument-specific correction needed.
- SOL: token-price exposure does not establish a proprietary claim or entitlement; remove unnecessary transaction prompt and clarify no order requirement. Fee examples and alternative hypothetical scenarios checked against stated assumptions, protocol-fee reference is distinct from simulator fee.

Shared template had real-trading phrasing, vague free account/instant wording, unsupported 15-minute structured duration, and a FAQ general real-money starting suggestion. Align initial and hydrated headings/metadata, remove unsupported duration, neutralize real-money advice and frame content as optional fictional worksheets. Existing URLs and features preserved. No private data, transaction, ad/account or database changes.

Official reference retrieval in this pass: Ethereum gas definition https://ethereum.org/developers/docs/gas/ ; SEC ETF overview https://www.investor.gov/introduction-investing/investing-basics/investment-products/mutual-funds-and-exchange-traded-2 ; Solana fee terminology https://solana.com/docs/core/fees and https://solana.com/docs/references/terminology ; Bitcoin issuance context https://bitcoin.org/en/halving . These support relevant introductory concepts, not current asset valuations or guaranteed performance. Other outbound links are recorded but not fully independently validated.

Compared with Google Publisher Policies https://support.google.com/publisherpolicies/answer/10502938 and misleading representation https://support.google.com/publisherpolicies/answer/11185754 and site-readiness guidance https://support.google.com/adsense/answer/7299563. No new confirmed Google violation. 32 exact source replacements validated, additional source/manifest regression assertions added; full CI, protected merge, exact production deployment, browser/second-pass/originality and media checks pending. Shared files overlap prior PRs; reconcile changes normally, do not force merge.
