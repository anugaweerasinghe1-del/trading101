# Follow-up to owner's 29 October TradeHQ deep-research findings

**Date:** 31 October 2026 (Asia/Colombo)
**Source document:** `TradeHQ_Executive_Audit.md` and `TradeHQ_Page_Appendix.html` (29 October, 396 pages). Also see `OWNER-SUPPLIED-AUDIT-TRIAGE-20261030.json`.

The prior evidence-led audit has 85 confirmed findings publicly verified via completed production releases. The owner's separate F01–F09 deep-research issues must not be mistaken for nine equally verified independent policy violations, or for nine completely resolved thematic concerns.

## Previously completed bounded corrections, confirmed by the earlier production release ledger

- F01 non-USD FX quote labels: THQ072 / PR264, disclosed rate quote-currency and separate simplified USD trading model; **engine accounting not changed or certified**.
- F02 low-value generic terminals: THQ070 / PR263, corrected overpromising links; **the editorial requirement for distinct sourced content on the 128 identified pages remains open**.
- F03 chart vs virtual execution inputs: THQ073 / PR264 labelled separate values and available timestamps; no engine/data-source changes.
- F04 unsupported terminal worksheet CTAs: THQ074 / PR265, proper worksheet-first copy and RSI example; broader originality remains a separate stage.
- F05 broad references: THQ075 / PR265, added selected topic references; not a whole-site source check.
- F06 overstated crypto lesson outcome: THQ071 / PR263, corrected the displayed course claim.
- F07 Beta vs roadmap: THQ076 / PR265, clarified current Beta and linked tool.
- F08 first-visit consent-banner obstruction: **not corrected previously**; cosmetic observation without a demonstrated Google ad-placement violation.
- F09 repeated definitions: THQ077 / PR265, specific FVG passage shortened; wider glossary duplication remains an editorial observation.

## Safe draft proposals opened on 31 October (NOT PRODUCTION DEPLOYMENTS)

- [PR269](https://github.com/anugaweerasinghe1-del/trading101/pull/269), head `bc3a5570af15d385d1a9d04bc1c50c3c55a7cbec`: compact CSS-only first-visit analytics banner and clearance for mobile 64px nav. **F08 proposal, not accepted browser proof.** No choice/storage/script changes.
- [PR270](https://github.com/anugaweerasinghe1-del/trading101/pull/270), initial head `832ee0d1b937e38f456f19204d4f123935326bf6`: place short glossary definition at page heading and remove redundant large repeated card; all long explanation, source/worksheet and navigation retained. **F09 proposal, not whole-site repetition clearance.** Initial Phase3 passed; first Cloudflare build/browser workflow hit `Inspected target navigated or closed` during Chromium publisher smoke. That failure is preserved; unchanged failed-job rerun requested rather than suppressing checks.
- [PR271](https://github.com/anugaweerasinghe1-del/trading101/pull/271), head `c9e639995dea2075418334d4f935aef999f94896`: **one researched F02 example**, Broadcom `/trade/avgo`. Adds historical FY2025 10-K two-segment context, 2024/2025 segment-revenue worksheet and issuer filing link, plus a conditional on-page source display. Source: https://investors.broadcom.com/sec-filings/sec-filing/10-k/0001730168-25-000121. The source reports fiscal2025 $36,858m semiconductor + $27,029m software = $63,887m; 2024 $30,096m + $21,478m = $51,574m. **Do not extrapolate this to all 128 unsourced pages.** No order, quote, portfolio, account, privacy or ad changes.

All three proposals were opened as **drafts** against immutable existing production baseline `1da8d75941f7db17695440acafaef112c3a7ca6e` with full CI/native previews and real five-width/browser/guest/keyboard gate required. The connected chat has GitHub file-edit capability, but lacks the former cloud browser runtime, credentials for direct native provider verification, and a local repository clone with dependencies. **Do not merge or close findings on the strength of a preview build alone.**

## Open work by category

- **F02's other 127 pages:** source-by-source instrument identity, official/issuer references, dated claim verification, concise unique practice exercise, editorial review and accurate noindex/ad value decisions. Do not invent per-symbol forecasts, copy boilerplate to fill a word count, or assert a source validates prices.
- **F08:** independent actual first-visit 360/390/768/1280/1920 preview with both themes, responsive chat/order/navigation focus and 200% zoom; ensure banner above fixed mobile nav, choices accessible and no material important content hidden. Test separately with analytics accepted/rejected in a disposable environment, not real user accounts.
- **F09:** verify 49 glossary pages and other repeated definitions individually; PR270 removes one template-level redundant panel, not repetitions inside long content or static publisher notes.
- **AdSense verification gaps:** account ownership and eligibility, actual rejection reason, traffic provenance/invalid activity, region-specific Google CMP, filled ad creatives/layout, authored content value on all monetized screens, authenticated states and Google crawler/site console statuses. These are **unverified tests**, not automatically failed content or code defects. Do not mutate ad/consent/account settings without specific authorization.
- **Protected financial/account scope:** real FX conversion/P&L, stateful fills, database, progress/account sessions cannot be modified or claimed tested by these patches.

## Release discipline / bookkeeping
Keep PR269, PR270 and PR271 draft until their *own* exact-head gates pass and a browser-capable executor personally verifies previews. If merging any, release sequentially (not multiple pending merges), checking the six trusted exact-main checks, both authenticated native production deployments and affected live/safe-guest browser cases after each release. Keep this evidence note on the audit branch; never merge the evidence branch itself.
