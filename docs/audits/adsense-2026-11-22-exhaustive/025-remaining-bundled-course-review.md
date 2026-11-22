# Detailed first-pass review — remaining bundled course families — 22 November 2026

Baseline main 5ebd32f826f75f6c9612841c031bfc8024a72f84. Prior checkpoint 105/163, documented in 024-macro-course-review.md. Twelve additional canonical publisher routes reviewed, 117/163 cumulative first-pass (46 remaining), not strict completion. No source or live user records, account/financial actions or database writes.

| Route (under /courses/) | Extracted text characters | Normalized source strings matched | Quiz fields |
| --- | ---: | ---: | ---: |
| trading-psychology-mastery | 3487 | 12/12 | – |
| trading-psychology-mastery/cognitive-biases-in-trading | 6188 | 13/13 | 24/24 |
| trading-psychology-mastery/revenge-trading-and-tilt | 5333 | 10/10 | 24/24 |
| trading-psychology-mastery/the-trading-journal | 5647 | 14/14 | 24/24 |
| trading-psychology-mastery/discipline-and-daily-rituals | 5171 | 13/13 | 24/24 |
| trading-psychology-mastery/handling-drawdowns | 5183 | 15/15 | 24/24 |
| futures-and-derivatives | 3863 | 12/12 | – |
| futures-and-derivatives/what-is-a-futures-contract | 5633 | 10/10 | 24/24 |
| futures-and-derivatives/margin-and-leverage-in-futures | 4819 | 10/10 | 24/24 |
| futures-and-derivatives/contango-and-backwardation | 5198 | 10/10 | 24/24 |
| futures-and-derivatives/hedging-with-futures | 4540 | 8/8 | 24/24 |
| futures-and-derivatives/micro-futures-for-beginners | 4796 | 10/10 | 24/24 |

12 self-canonicals, 12 index/follow directives. 137/137 source strings (>30 characters, selected body/takeaway or overview sections), 240/240 quiz fields including questions, individual choices and explanations; 40 questions with in-bounds indices. Extracted with ttl=0 (upstream cache rules may still apply). These counts are not complete block-level ledgers. Source contents read in both families, alongside shared template and generator evidence from #514. No actual browser interaction or image provenance check.

## Individual decisions
- Behaviour overview: revise overclaim that course identifies individual's own most likely biases; no real activity required.
- Biases: literature supports variation in estimates; 2024 meta-analysis does not justify universal diagnosis. Use stable DOI link.
- Tilt: previous summary equated emotional state with specific transaction sequence; distinguish observed pattern from inference. Source directly inspected in desktop/mobile order panels and RevengeTradingBlocker.tsx; duration and condition described in existing lesson supported in code. Shared warning copy now neutral; actual app controls unchanged. Source name formerly implied portfolio itself is the blocker, changed to practice review tools.
- Journal: distinguishes record from proof of causation; improve quiz wording, observation count. Fee example checked as arithmetic, not return claim.
- Checklists: dated source-check scope, no mandatory routine, no automatic stops asserted; no new change.
- Drawdowns: recovery arithmetic and exposure caveats checked; no medical inference; no new change.
- Futures overview: remove trader-toolkit framing and claim of ability to compute actual margin from educational content; preserve conceptual scope.
- Contract definition: distinguish cash-settled reference contracts, clarify clearing applies to cleared transactions, remove duplicate reference.
- Margin: clarify quiz wording about collateral shortfalls, retain existing risk warning and conceptual-only functionality.
- Term structure: qualify compared maturities, distinguish FRED spot reference from futures curve; add official glossary.
- Hedging: remove unconditional directional takeaways, clarify hypothetical arithmetic is not actual sizing recommendation and separate costs/exposure, replace duplicate reference with distinct regulator glossary.
- Micro contracts: CME now lists additional Micro E-mini index contracts; four examples are not an exhaustive catalogue. Remove suitability implication for beginners.

References independently retrieved: Google Publisher Policies https://support.google.com/publisherpolicies/answer/10502938 and misleading representation https://support.google.com/publisherpolicies/answer/11185754 ; site readiness https://support.google.com/adsense/answer/7299563 ; Walasek et al. DOI https://doi.org/10.1016/j.joep.2024.102740 ; SEC past-performance context https://www.investor.gov/introduction-investing/investing-basics/glossary/mutual-funds-past-performance ; CFTC glossary https://www.cftc.gov/LearnAndProtect/AdvisoriesAndArticles/CFTCGlossary/index.htm ; CME margin FAQ https://www.cmegroup.com/solutions/risk-management/performance-bonds-margins/faq-performance-bonds-margins.html and Micro E-mini FAQ https://www.cmegroup.com/articles/faqs/micro-e-mini-equity-index-futures-frequently-asked-questions.html . No claim all references or legal assertions verified.

24 scoped replacements in course text, one warning copy correction, unchanged quiz keys, added regression assertions. No new confirmed Google enforcement violation. Maintain advertising disabled and existing protected merge gates. Full CI/production release and browser, originality, media licensing and second-pass block evidence pending. Existing open PRs preserved.
