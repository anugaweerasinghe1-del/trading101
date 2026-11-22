# First detailed review: options course family — 22 November 2026

Pinned baseline: 5ebd32f826f75f6c9612841c031bfc8024a72f84. Previous first-pass count 93/163 (PR #513); six additional pages, now 99/163 first detailed source and public-text review, 64 remaining. This is not a strict closure of #430.

| Route suffix (under /courses/options-trading-fundamentals) | Extracted characters | Long source strings matched | Quiz fields matched |
| --- | ---: | ---: | ---: |
| overview | 4441 | 12/12 | n/a |
| /what-is-an-option | 6077 | 11/11 | 24/24 |
| /the-greeks-delta-gamma-theta-vega | 5549 | 13/13 | 24/24 |
| /defined-risk-spreads | 6462 | 15/15 | 24/24 |
| /implied-volatility-and-earnings | 5742 | 11/11 | 24/24 |
| /options-risk-management | 5888 | 12/12 | 24/24 |

Fresh extraction requested with ttl=0 (cache controls can still apply). Six self-canonicals, six index/follow directives, no extraction error. 74/74 strings of >30 characters from overview or lesson body/takeaway sections, normalized typography/whitespace. 120/120 quiz fields (question, four choices, explanation) across 20 questions match extracted text. All answer indices in bounds. Shared disclaimer constant, short headings, summary, navigation and copy-generation logic separately considered; this string count is not all block-level evidence. No live real-money action or account interaction. Actual browser accessibility, image ownership, external originality, and all reference targets remain open.

## Per-page editorial assessment

- Overview: read intended outcomes, prerequisite, progression, limitations, badge and lesson summaries. Completion-only badge consistent with source mechanism. Removed arbitrary minimum practice time and unnecessary prerequisite to place virtual order.
- Contract basics: reviewed standard-contract and adjusted-contract distinctions, premium definition, illustrative expiry outcomes, exercise risk, four quiz questions. Corrected missed break-even boundary and misleading conflation of premium with direct measurement of personal expectations; distinguish total premium from time value.
- Sensitivities: reviewed model assumptions, price/time/volatility sensitivity and quiz wording. Removed an ambiguous event-timing question whose original answers could both describe real uncertainty events. Existing answer index retained.
- Spread theory: reviewed fictional comparison, arithmetic, cost and assignment caveats, four quiz questions; no new content teaching execution added. Prior explanations explicitly limit simulator to spot-style practice and do not imply derivatives execution. No new policy conflict confirmed.
- Implied volatility: reviewed definitions, provider methodology caveat, historical sample limits and all four quizzes. Clarified that a constant high-low range makes ordinary IV rank undefined and narrowed vague language about relative range; retained answer index.
- Risk management: reviewed hypothetical examples, scope limitations and quizzes. Remove unnecessary position-entry wording and correct takeaway implying simulator can perform options backtests. Rolling heading now neutral.

## Policy and reference checks

Official Google Publisher Policies https://support.google.com/publisherpolicies/answer/10502938 ; misleading representation https://support.google.com/publisherpolicies/answer/11185754 ; site readiness https://support.google.com/adsense/answer/7299563 ; site not ready guidance https://support.google.com/adsense/answer/12176698 . Distinguish misleading wording/quality risk from proven Google policy violation. No new confirmed violation.
Reference checks include OCC disclosure landing page, OIC option basics, pricing, Greeks and theta pages, and June 2026 IV statistics article. Not a comprehensive validation of every outbound destination or an independent professional review. Technical source checked: coursesData.ts, CourseTrack.tsx, CourseLesson.tsx relevant shared content and quiz mechanism, scripts/content.ts course generator. Existing risk disclaimers retained, no expansion of simulated or real-money functionality.

15 exact scoped replacements with unique source matches; all course quiz answer indices preserved. Added assertions to existing editorial inventory gate. Full build/CI, protected merge, independent exact Cloudflare production receipt, postrelease reread, image/source provenance and second-pass review pending. Preserve concurrent #509–#513 changes; no user records, ads, financial account access or database writes.
