# TradeHQ — RESUME

Current continuation checkpoint (25 October 2026): use `docs/audit-2026-10-25/Completion-Ledger.json` and final release evidence in PRs [236](https://github.com/anugaweerasinghe1-del/trading101/pull/236), [237](https://github.com/anugaweerasinghe1-del/trading101/pull/237), [238](https://github.com/anugaweerasinghe1-del/trading101/pull/238). Main `f364bce717420298101ff4d1cad02258f1b6e5ba` passed native Cloudflare production verification; approved seven-field published Daily correction is revision2 and anonymously verified. The records below are historical checkpoints; reconcile them with the current ledger/source. Mentor plain-text formatting remediation is in progress; final outcome belongs in its implementing PR.

Branch: `adsense-fixes-20261005`, created from current main `73d5001e8bbfb18b89e862d7781dced2f89169d1` on 2026-10-04 UTC.

## Step 0: completed status sweep before remediation

Attachment says main `5d87a322...` and branch `0137b081...`; it is older than current code. GitHub confirms PR #8 merged at 426edd5, #9 at da7a40f, #10 at 0a5eb56, #11 at 73d5001. PR #7 remains open/unmerged and must never be merged wholesale.

Every attached C01–C22/H01–H36 item is assigned exactly one status below, plus META-01–07 and M16 from the new request. ALREADY FIXED rows are frozen for this run and will not be edited/re-audited. Scope qualifications are part of the evidence: source verification is not authenticated UI verification. Runtime/backend-only items are skipped as requested. STILL PRESENT means a current source or served-copy defect, not a fabricated new finding.

Source references are at baseline main above. Served HTML was fetched directly from www.thetradehq.com (not search snippets); artifacts returned homepage fallback HTML, not report data. Wrong guessed aliases (/trade/bitcoin, /assets/PEPE, /country/sri-lanka) were excluded from conclusions about valid routes. Relevant URLs with exact copy or source file/line are below. No backend, migration, profile, review or user-data writes performed.

| Item | Status | Current evidence |
|---|---|---|
| C01 | UNVERIFIED-NEEDS-WORK-MODE | src/pages/TradeAsset.tsx:257–261,432 aligns runtime robots to authored content; valid thin-route hydrated behavior still untested. /trade/btc served indexable; invalid /trade/bitcoin returns homepage shell and is not evidence about a valid asset. |
| C02 | ALREADY FIXED | scripts/routes.ts:124–133 parses NICHE_SYMBOLS array; :409–419 registers niche routes noindex; src/pages/NicheAsset.tsx:69 also noindex. |
| C03 | ALREADY FIXED | scripts/verify-seo.mjs:15–22 artifact guard; six historical report/CSV URLs fetched and return homepage HTML, not report contents. Source files absent from public output source. |
| C04 | ALREADY FIXED | Same six served report-path checks as C03; no historical QA report contents exposed. HTTP 200 fallback is not claimed to be a correct 404. |
| C05 | UNVERIFIED-NEEDS-WORK-MODE | Quote fallback provenance depends on provider/cache branches; source changes exist, but no live provider/fallback transition exercised. |
| C06 | UNVERIFIED-NEEDS-WORK-MODE | Candle fallback provenance requires runtime chart/fetch exercise; HTML cannot establish it. |
| C07 | UNVERIFIED-NEEDS-WORK-MODE | PR11 merged; source chart gating exists, but realtime quote plus synthetic candle scenario not run. |
| C08 | ALREADY FIXED | /markets served description: Browse 150+ simulated markets; src/pages/Markets.tsx FAQ and scripts/routes.ts:216–218 describe simulated data. |
| C09 | UNVERIFIED-NEEDS-WORK-MODE | src/components/home/MarketPulse.tsx:129 says Simulator • refresh 30s; runtime provenance itself is not observable in served homepage HTML. |
| C10 | UNVERIFIED-NEEDS-WORK-MODE | src/pages/Daily.tsx:36–38,234 makes direction a reflection; served /daily has generic task copy. Interactive direction-grading flow not exercised. |
| C11 | ALREADY FIXED | src/lib/lessonData.ts:559 ($100k halved=$50k); 572–593 (2%=$2k; /$5=400 shares); 616–617 (.98^10≈81.7%, .98^20≈66.8%); 938 ($60k+$40k); 986 quiz $2k; 1754 profit factor 1.0. Original enumerated arithmetic errors corrected. Other advice remains H11. |
| C12 | ALREADY FIXED | src/lib/coursesData.ts:752,769,814 gives independent-model run probabilities 8.4%,1.7%,0.03%; validated by finite-state recurrence. The separate drawdown quiz is retained under H13. |
| C13 | UNVERIFIED-NEEDS-WORK-MODE | /privacy served text discloses browser, backend, analytics/ads processing; actual consent/network/data-flow compliance requires runtime review. No backend testing authorized. |
| C14 | UNVERIFIED-NEEDS-WORK-MODE | Profile default/RLS/privacy control requires backend and authenticated runtime; skipped. |
| C15 | UNVERIFIED-NEEDS-WORK-MODE | /leaderboard served text says client-synced and not audited; src/lib/portfolio.ts:205–246 computes closed sells. Actual sync integrity/statistics need backend/runtime; no verified-performance claim remains in inspected copy. |
| C16 | UNVERIFIED-NEEDS-WORK-MODE | src/lib/traderSync.ts:43–46 blocks legacy refill marker; migrated account/reset behavior not exercised. |
| C17 | UNVERIFIED-NEEDS-WORK-MODE | Duel mutations, authorization and stored results require backend/runtime; skipped. |
| C18 | ALREADY FIXED | /reviews served: Submissions are moderated and duplicate-limited but are not independently verified; Reviews.tsx:115–147 uses the same qualification. Original verified-review claim removed; endpoint identity/moderation behavior not verified. |
| C19 | UNVERIFIED-NEEDS-WORK-MODE | Deployed unused AI endpoints/JWT boundaries require backend verification; skipped. |
| C20 | UNVERIFIED-NEEDS-WORK-MODE | Newsletter administrative authorization requires deployed-function/runtime validation; skipped. |
| C21 | STILL PRESENT | /daily served: identify a pattern, place a correctly sized practice trade; Daily.tsx:36–38 instead describes a directional reflection. Markets subset corrected, but this alternate copy remains. |
| C22 | UNVERIFIED-NEEDS-WORK-MODE | src/lib/portfolio.ts:171 accepts currentAssets; Portfolio.tsx:171 uses async updatePortfolioOverTime. Price consistency needs running simulator; skipped. |
| H01 | UNVERIFIED-NEEDS-WORK-MODE | PR11 source provenance changes merged; complete provider fields and hybrid update behavior require runtime transitions. |
| H02 | STILL PRESENT | src/components/home/MarketPulse.tsx:18 computes internal score; :153 labels it Fear & Greed. No external index basis. |
| H03 | UNVERIFIED-NEEDS-WORK-MODE | LearnTradingGuide.tsx:54 sentiment labels and marketData.ts generated data require rendered running guide to establish current presentation. |
| H04 | STILL PRESENT | /wiki/short-squeeze served key point: Triggered when short interest exceeds 20-30% of float; body uses universal numeric squeeze thresholds without primary support. |
| H05 | ALREADY FIXED | index.html schema no longer contains Bitcoin Layer 2/RWA/realtime coverage claims; same root schema served on /. Social sameAs tracked separately H06. |
| H06 | STILL PRESENT | index.html:83 and src/pages/Index.tsx:76 sameAs https://x.com/tradehq; ownership unsubstantiated in repo. Remove assertion rather than invent ownership. |
| H07 | STILL PRESENT | src/pages/Index.tsx:65 and PremiumFAQ.tsx:45 say widely considered one of the best free trading simulators; no substantiation. |
| H08 | STILL PRESENT | src/lib/assetContent.ts:297 says Bitcoin enters 2026 ... position BTC for potential new highs; changing forecast-shaped claim without primary evidence. |
| H09 | STILL PRESENT | src/lib/countryGuides.ts:79,109,113,145,149,181,185 contain current legal/tax/broker eligibility claims; :103,136,172 assert user demographics without evidence. Served /learn/country/sri-lanka confirms route exists. |
| H10 | STILL PRESENT | src/lib/learnArticles.ts:260 calls 2% rule one every trader needs; :126 claims volatility accelerates learning and cheap unit price lowers barriers. Body qualifications do not fix summary overclaim. |
| H11 | STILL PRESENT | src/lib/lessonData.ts:611 says 2% rule ensures losing streaks do not wipe you out; :690 says take-profit orders prevent greed/giving back gains; :894 prescribes 5–8 positions; :1788 treats factor>1.5 as strong edge. Prior return-target fixes retained. |
| H12 | ALREADY FIXED | src/lib/coursesData.ts:160,169,178 and :713,730 now explicitly hypothetical; universal institutional/industry-standard risk floor and 3% lockout claims removed. |
| H13 | STILL PRESENT | src/lib/coursesData.ts:836 still grades 10–15% drawdown mathematically expected from 55% WR/1.5:1 without position sizing or dependence assumptions; :516 claims minimal/all-market reactions to Fed decisions. Futures subset corrected. |
| H14 | ALREADY FIXED | src/lib/seoData.ts:460,489,518,547,576,605 replace fixed success rates with qualified measurement language. Original observed-performance claim removed; remaining strategy advice belongs to separate scope. |
| H15 | STILL PRESENT | src/lib/seoData.ts:91 says AAPL is largest buyback program in history and asserts changing comparison facts; no primary dated basis. /compare/bitcoin-vs-ethereum served current copy. |
| H16 | STILL PRESENT | src/lib/smartMentor.ts:387 fallback prescribes ≤1–2% book and calls unexplained entries gambling; :190–191 makes generalized tax/legal claims. Source response exists; actual endpoint availability not asserted. |
| H17 | STILL PRESENT | Courses.tsx:105,188,218 expert-written; PremiumFeatures.tsx:52 expert-curated; scripts/content.ts:166 and staticCopyExtra.ts:286 expert-level; served /llms.txt:22 YMYL-compliant. |
| H18 | STILL PRESENT | ScenarioBuilder.tsx:94 deterministic regex parser but :141 AI Scenario Builder; llms.txt broadly calls mentor AI-powered despite deterministic fallback. PortfolioInsight component itself already neutrally labelled. |
| H19 | STILL PRESENT | PortfolioAnalytics.tsx:22–31 divides cross-sectional open-position returns by dispersion as Sharpe Ratio and labels profitable open positions win rate; :183–186 claims diversification quality from custom score. |
| H20 | STILL PRESENT | TradingStrengthMeter.tsx:22–26 includes strategy text length/stat count in score; :91–95 calls it Trading Strength Meter / 2026 Strategy Score. |
| H21 | STILL PRESENT | scenarioEngine.ts:169–170 maps p5/p95 to worstCase/bestCase; ScenarioBuilder.tsx:203,210 renders those bounds. Percentiles are not worst/best possible outcomes. |
| H22 | ALREADY FIXED | TradingJournal.tsx:127 Journal Summary and getJournalSummary actual counts; no AI Analysis/AI Insights or fake win-rate rendering. Original notes retained. Authenticated UI interaction not tested. |
| H23 | ALREADY FIXED | CompoundCalculator.tsx:76 Illustrative Growth and :82–87 actual rate/deduction assumptions; no Live Projection or Broker Fees label. Formula separately checked in prior continuation; source retained. |
| H24 | STILL PRESENT | Roadmap.tsx:21 says share /trader/me; :25 planned Aug 2026 is stale; served /roadmap summary promises options paper trading/backtesting while runtime list differs. |
| H25 | STILL PRESENT | Served /llms.txt:5 says All prices are simulated for practice; provider-capable code makes this blanket assertion overbroad. |
| H26 | STILL PRESENT | src/lib/nicheData.ts:30,48–49 reads static ASSETS then labels fields Current Price / 24h Change. No runtime feed in this getter. |
| H27 | ALREADY FIXED | PR11 current sector FAQs qualify reference/simulator values; removed live 60-second API promise. Provider freshness itself remains runtime-unverified. |
| H28 | STILL PRESENT | LessonDetail.tsx:88 explicitly index, follow; scripts/routes.ts does not register numeric lessonData routes; /learn/1 serves homepage HTML. Legacy route governance still missing. |
| H29 | STILL PRESENT | HowToTrade.tsx:17 generated title hardcodes 2026; served /learn-trading-guide title Complete Beginner Trading Guide 2026. No demonstrated annual review. |
| H30 | UNVERIFIED-NEEDS-WORK-MODE | MobileOrderDrawer.tsx:32 market default; no visible setter invocation. Actual mobile order execution needs running browser; skipped. |
| H31 | UNVERIFIED-NEEDS-WORK-MODE | TradeAsset resolves symbol aliases or IDs. Symbol-based links alone do not prove broken routing; duplicate/slash-symbol interaction not executed in this sweep. |
| H32 | ALREADY FIXED | /courses served: Practise supported spot instruments ... derivatives contract exercises are conceptual; current coursesData.ts and CourseTrack.tsx retain limitation. |
| H33 | UNVERIFIED-NEEDS-WORK-MODE | TraderProfile source guards private shares and encodes username; authenticated sharing needs runtime verification; skipped. |
| H34 | ALREADY FIXED | Contact.tsx:288–291 distinguishes browser-held positions/history/journal/badges; staticCopyExtra.ts:22 says account does not restore practice record on another device. Original overclaim absent. |
| H35 | UNVERIFIED-NEEDS-WORK-MODE | ai-chat caller system and cost controls need deployed endpoint validation; backend explicitly excluded. |
| H36 | UNVERIFIED-NEEDS-WORK-MODE | Public market proxy throttling needs deployed endpoint/abuse checks; backend explicitly excluded. |
| META-01 | STILL PRESENT | https://www.thetradehq.com/wiki/short-squeeze description AND intro: A short squeeze occurs when a heavily shorted asset. routes.ts:104 stops quoted definition at apostrophe; :520,587–590 can also cut descriptions. |
| META-02 | ALREADY FIXED | Served / homepage description ends No signup. Complete sentence, no mid-sentence cut. Generic description fitting defect is included in META-01, not a second change. |
| META-03 | ALREADY FIXED | index.html has no meta keywords; served homepage inspected without keywords tag. |
| META-04 | STILL PRESENT | routes.ts:578–579 cuts titles by words; served /daily title ends Learn a New Skill Every; country title ends Free Guide for Sri. Acronym fix alone did not make titles complete. |
| META-05 | ALREADY FIXED | Compare.tsx:83–84 has single verdict block; scripts/content.ts:346 heading Which to practise first matches paired verdict. /compare/bitcoin-vs-ethereum no doubled summary found. |
| META-06 | ALREADY FIXED | Current glossary practice generated from per-term fields; served bull-trap and short-squeeze have different specifics. Not claiming every sentence is unique. |
| META-07 | ALREADY FIXED | WikiTerm.tsx no proTip renderer; scripts/content.ts observation exercise; served short-squeeze has no directive pro-tip block. Underlying definition reliability remains H04. |
| M16 | UNVERIFIED-NEEDS-WORK-MODE | ConsentBanner.tsx:6 placeholder, :44 prevents AdSense load without ca-pub ID. Consent/revocation and network blocking require runtime; certified CMP configuration not verified. |

## Work order and checkpoint log

1. META-01: correct all glossary/other description truncation, rebuild, check >=10 wiki entries including short-squeeze; validate group 1 exact commit before normal merge.
2. Trust group: H06, H07, H17, H18, H24 and unsupported country-audience claims; skip frozen fixed/runtime rows. One item per commit.
3. Lesson group: remaining H11/H13 logic claims; retain corrected C11/C12/H12/H14 findings.
4. Governance group: H26/H28 and any confirmed valid-route indexability defect.
5. Remaining STILL PRESENT C/H items in ID order.

After every three implementation items, append the exact commits/checks here and push. Only mark FIXED-IN-PRODUCTION after observing changed served production HTML. Merge each completed group only after exact-SHA npm ci/build/prerender/SEO, GitHub and Vercel Ready checks. Normal merge only; no backend changes or force pushes.

## Needs owner input

- AdSense publisher ID (placeholder remains [CONFIRM_ADSENSE_PUBLISHER_ID]).
- Google-certified consent tool / Privacy & messaging configuration.
- Authentic ads.txt contents. None invented.

## Historical log (not current proof)

# AdSense remediation checkpoint — 2026-10-04

Branch: `adsense-fixes-20261004`

## Log
- C13 — FIXED-IN-PRODUCTION at merge `da7a40f31a452bc435803eca77dfa0611f25f0c0`: privacy/data-flow disclosures rewritten; contradictory no-ad/no-profiling copy removed where previously confirmed.
- M16 — FIXED-ON-BRANCH / production code deployed at `da7a40f31a452bc435803eca77dfa0611f25f0c0`: optional Amplitude/AdSense scripts are consent-gated. AdSense remains disabled until `[CONFIRM_ADSENSE_PUBLISHER_ID]` and a Google-certified CMP are configured.
- META-01 — FIXED-ON-BRANCH at `66b4703382080525a8d448cf285a0773c83dff2f`: glossary definitions/meta no longer cut mid-sentence.

## Production verification note
- Vercel reports production deployment `dpl_ERYsgBA6esWFTyJmMsGoGBn82BUP` READY for merge `da7a40f31a452bc435803eca77dfa0611f25f0c0`, aliased to both apex and www.
- Direct live-page content fetch is UNVERIFIED in this environment: web fetch returned cache-miss/stale results and raw HTTP access returned no connection. Do not claim rendered live content was inspected.

## Previously confirmed still-present findings to handle in priority order
- Sitewide meta keywords in `index.html`.
- Generated title/label defects in route generation.
- Comparison heading/paragraph mismatch and duplicated summary/verdict presentation.
- Directive glossary practical-tip copy.
- H02 internal Fear & Greed naming.
- H05 unsupported root schema/features.
- H17 unsupported expert-curated/expert-level claims.
- H22 deterministic journal analysis labelled AI.
- H24 stale/inconsistent roadmap claims.
- H34 cross-device persistence overstatement.
- H09 unsupported country-guide audience/regulatory/tax claims.

Pending means not proof of defect; re-open source at edit time and mark ALREADY FIXED if the current branch already contains a correction.

## Checkpoint after items 4–6
- META-02 — FIXED-ON-BRANCH at `cef3487bf15e45e55c0d70e01d1305d444edcccf`: description fitting now prefers any complete sentence instead of emitting a dangling ellipsis fragment.
- META-03 — FIXED-ON-BRANCH at `73eb0aac7b71c9c5096879efc14a6af0425b0017`: sitewide meta keywords removed from `index.html`.
- META-04 — FIXED-ON-BRANCH at `1e2fc641052bf97c89f16125baeb56fddd60ae46`: generated comparison/strategy titles use humanized labels and real strategy names (e.g. MACD), avoiding “Vs”, “Macd Strategy” and “strategy strategy”.

## Checkpoint after items 7–9
- META-05 — FIXED-ON-BRANCH at `4843355d35f477d16ecb0c5fd4b64c6f43b41111`: comparison runtime duplicate answer removed; crawler deep-dive headings now match pair-wide paragraphs.
- META-06 — ALREADY FIXED: current `glossaryPractice()` was already entry-specific, using each term's own fields rather than one identical paragraph.
- META-07 — FIXED-ON-BRANCH at `f6ea0390e8ff3d54234722a7f13a230df43c3d86`: public glossary output no longer renders directive pro-tip text; practice copy is observational and term-specific.

## Checkpoint after items 10–12
- C05 — ALREADY FIXED: quote fallback is explicitly `simulated`, stale cache is `delayed`, and only provenance `realtime` maps to `live`.
- C06 — ALREADY FIXED: generated candle fallback is tagged `simulated`; candle provenance alone does not create the live badge.
- C07 — FIXED-ON-BRANCH at `c49df96aa896e8da8d35051c9baea68291c339a8`: chart UI now requires realtime quote + realtime candle provenance before showing `LIVE`; delayed/simulated states are labelled accordingly.

## Checkpoint after items 13–15
- C08 — ALREADY FIXED: Markets runtime FAQ explicitly labels the dashboard values as simulated practice prices/changes/estimated volume.
- C09 — ALREADY FIXED for the live-provenance finding: Market Pulse says `Simulator • refresh 30s` and identifies persisted simulator practice data. H02 still covers the separate Fear & Greed naming issue.
- C21 — FIXED-ON-BRANCH at `f3c6cb2c86278c0ab4d0e03b59d256bf12aea9d4`: crawler-visible Markets copy now matches the runtime simulated-data explanation.

## Checkpoint after items 16–18
- H01 — FIXED-ON-BRANCH at `326f4cb5b004a9b3e4a1649666af94f3d1194bdf`: live status now requires complete realtime quote fields; hybrid micro-simulation no longer mutates live provider prices while retaining a live label.
- H05 — FIXED-ON-BRANCH at `4d0374d6e97ab9ce5e3e1ececae3f30dcd9dd2ec`: root schema no longer claims real-time asset coverage, Bitcoin Layer 2 trading, or tokenized RWA functionality.
- H23 — ALREADY FIXED: compound calculator is labelled `Illustrative Growth`, states it is not live/forecast data, and explains rate/deduction assumptions.

## Group 3 completion
- H27 — FIXED-ON-BRANCH at `0d82a2fdcd97f76273c2ec59edba19599b170ec2`: sector FAQs no longer claim a live 60-second API feed; they describe simulator reference values and direct users to per-asset data-status labels.
- C07 follow-up — `8ebb588437f1a80f5d9cf87e405033987dc5c98e`: non-live chart badges now display the exact computed status (for example DELAYED or SIMULATED), not a generic SIM label.

## META-01 remediation checkpoint

Generator now reads glossary, learn-article and SEO description objects directly, so apostrophes cannot terminate fields. Course summaries and description fitting preserve complete sentences instead of character cuts. No authored financial claims changed in this item.

Validation: npm ci passed. Local npm run build hit environment-only tsx IPC EPERM; identical sitemap/Vite/prerender/SEO pipeline via node --import tsx passed (328 routes, 147 indexable, 181 noindex). All 49 glossary HTML intros equal full authored definitions; all 328 HTML descriptions equal the manifest and have no truncation ellipses. Ten explicit entries: short-squeeze, golden-cross, death-cross, liquidation-cascade, fibonacci-retracement, rsi-divergence, macd-histogram, bollinger-band-squeeze, order-block, fair-value-gap. Homepage retains its complete No signup sentence. GitHub exact-command build and preview pending; not merged or production-verified. Gmail search after 2026-10-03 found no GitHub/Vercel failure alerts. Baseline main Vercel production is READY at 73d5001.

## Deployment gate and H17

META-01 commit a98fe2d29d55c34f647f0fc238a5469fdeb6a72d passed GitHub run 37187236477 (npm ci, npm run build including prerender/SEO) and Vercel preview dpl_DpGteC876phCkhcPm181btmB424e READY. PR #12 normal merge was rejected by GitHub: 405 “Merge commits are not allowed on this repository.” No squash/rebase substituted and no repository setting changed. Production remains baseline 73d5001; META-01 is FIXED-IN-BRANCH, not FIXED-IN-PRODUCTION. Continue code fixes; normal-merge policy is an owner/repository blocker.

H17: removed unsupported expert-written/expert-curated/expert-level and YMYL-compliant claims from course metadata/FAQ, mentor, feature cards, crawler copy and llms.txt. Replaced with descriptive educational/structured/detailed wording without claiming credentials or policy compliance.

## Three-item saved checkpoint

| Item | Action / verification | Commit | Production |
|---|---|---|---|
| META-01 | Generator preserves complete descriptions; all 49 glossary entries and 328 HTML descriptions checked; GitHub success and Vercel READY | a98fe2d29d55c34f647f0fc238a5469fdeb6a72d | Not merged: normal merges disabled |
| H17 | Unsupported expertise/compliance wording removed; full local build/prerender/SEO, GitHub run 37187394808 success, Vercel READY | 8487490090f3d0bf87622d9fbfb97db33a18e9a2 | Not merged |
| H18 | Scenario label reflects rule-based parser; both canned mentor fallback paths visibly labeled; app/route/llms/static explanations disclose fallback. Local build/prerender/SEO passed. Runtime endpoint transitions remain unverified. | This H18 commit | Not merged |

No production changes or backend writes. PR #12 contains the work; PR #7 remains untouched. Continue Group 2 with H06, H07, H24 and residual audience claims.

## Second three-item checkpoint

| Item | Action / verification | Commit | Production |
|---|---|---|---|
| H06 | Removed unsupported x.com/tradehq sameAs from both organization schemas; generated JSON-LD parses; local build/prerender/SEO passed | 50ff2ce05ce25de6c69072474857616bb4d8a239 | Not merged |
| H07 | Removed unsupported best-simulator ranking from visible FAQ and JSON-LD, replaced with actual virtual-practice features; local pipeline passed | f4c1d7d4e3ab87c11c5431e930ecb3393936125a | Not merged |
| H24 | Corrected profile sharing address and account requirements; removed expired proposed-feature targets; aligned crawler roadmap with actual proposed features and backend limitations; local pipeline passed | This H24 commit | Not merged |

H18 commit: 53fb0c8a98c26143451abf39a18fa9be958489ae. Gmail failure search after 2026-10-04 returned no messages. Normal-merge setting still blocks release; no production claim. Country-guide audience/legal assertions remain under H09 and are not silently marked resolved.


## Checkpoint after resumed verify-fix cycle

Workflow changed per owner instruction: verify the next finding against current branch/main and current trustworthy sources, fix only that finding if still present, validate it, then move on. Do not do another bulk audit-before-fixing pass. Every 2–3 implementation changes, check GitHub Actions, Vercel and Gmail failure alerts before continuing.

| Item | Action / verification | Commit | Production |
|---|---|---|---|
| H09 | Removed unsupported country-audience, broker-availability, tax, remittance and minimum-capital claims across Sri Lanka, India, Philippines, Pakistan and Nigeria guides. Real-money regulatory references now defer to current official regulator/provider information. Exact commit GitHub validation succeeded; Vercel preview READY. | bc39893f9665670896b9b9c293ea936336a44f9c | Not merged |
| H11 | Replaced universal 2%/take-profit/5–8-position/profit-factor prescriptions with qualified educational examples and definitions. SEC/Investor.gov order and diversification guidance checked before edit. Exact commit GitHub validation succeeded; Vercel preview READY. | 5a744f56b3d83591eab0a45bd5b1a901be2ea932 | Not merged |
| H13 | Corrected FOMC/PCE facts, removed stale named-Chair copy, removed universal market-reaction and drawdown rules, and rewrote quizzes to test assumptions rather than prescriptions. Federal Reserve current sources checked before edit. Exact commit GitHub validation succeeded; Vercel preview READY. | b559baadd6ed8f330befc65c60b74b41f43ad789 | Not merged |

Mandatory safety checkpoint after H09/H11: GitHub green, Vercel READY, Gmail search found no GitHub/Vercel failure alerts. H13 then passed GitHub and Vercel as well. No backend, migration or user-data changes.


## Governance checkpoint — H26 / H28

| Item | Action / verification | Commit | Production |
|---|---|---|---|
| H26 | Confirmed niche pages read hard-coded seed values from ASSETS while labelling them Current Price / 24h Change. Relabelled those fields as simulator reference data without changing the trading engine or backend. GitHub validation succeeded; Vercel preview READY. | ec4130f1e482ee98ebb800e5080de5627995dc6e | Not merged |
| H28 | Confirmed legacy numeric /learn/:lessonId pages were indexable in the React page but absent from the shared prerender/SEO route manifest. Added them to the shared route quality gate as noindex pages and changed LessonDetail to noindex, follow. Google Search Central noindex guidance checked before edit. GitHub validation succeeded; Vercel preview READY. | de86b1e02964e523a56f8953dbb2aa9cc76ce80e | Not merged |

Mandatory safety checkpoint after H26/H28: GitHub Actions green on H28, Vercel preview READY, Gmail search found no GitHub/Vercel failure alerts. No backend, migration or user-data changes.
