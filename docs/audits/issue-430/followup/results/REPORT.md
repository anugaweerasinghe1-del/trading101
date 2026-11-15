# TradeHQ #430 — remaining editorial fixes

Date: 15 November 2026 (Asia/Colombo). [PR #437](https://github.com/anugaweerasinghe1-del/trading101/pull/437) and [PR #438](https://github.com/anugaweerasinghe1-del/trading101/pull/438).

**The public-facing remedies for 18 of the 19 proposal items are merged and live-verified. The remaining item is synchronization of three approved source documents: corrected revisions are prepared, but no database save or publication took effect. One additional confirmed mobile defect was found, fixed and production-rechecked.** Ads remain disabled. Account access is unchanged.

The user authorized “fix everything” and then explicitly chose to keep existing account access while clarifying the 18+ optional-analytics rule. AdSense publisher eligibility does not mean every signed-in visitor must be 18+. No guardian-consent system or new age restriction was introduced.

## What changed

| Group | Implemented result |
|---|---|
| R01 | About describes actual examples and simulation limits instead of unsupported population claims; practical exercises complement reading. |
| R02 (2 items) | Chart/volume observations are separated from claims about participant motives or future reversals. |
| R03 (5 items) | Gamma, risk budgets, contango, backwardation and CPI are explained more precisely. Changed questions, options and explanations were reviewed together; answer indices remain valid. |
| R04 | Country FAQ and both privacy-page versions distinguish the optional adult analytics choice from lessons, guest practice and sign-in. |
| R05 (4 items) | Three Bitcoin passages and the concentration passage now avoid competence/rebalancing overclaims and references to earlier wording. Exact-text guards preserve subsequent owner edits; native HTML and interactive bootstrap agree. |
| R06 | Context beside visitor reviews explains that confidence is not evidence of real-money readiness. Visitor testimony was preserved. |
| R07 | Three schema-valid corrected source documents are prepared in `course-revision-plan.json`. **Source save/publication remains incomplete**, separately from the repaired public display. |
| R08 | Inflation feedback no longer prescribes commodities/TIPS. |
| R09 | Legacy summaries describe observable tasks; completion copy avoids mastery claims at both perfect and partial scores. The hub and detail pages now share descriptions. |
| R10 | Unsupported rankings, volatility comparisons and promotional asset/sector wording were removed or qualified. |
| R11 | Portfolio insight shows invested-only and cash-inclusive account weights plus an explicitly hypothetical 10% sensitivity. It no longer calls a small holding oversized or recommends variety from position count alone. |

The final metadata read also extended existing finding **THQ-430-004**: corporate abbreviations and sector word slicing could still leave incomplete snippets. Complete asset facts and sector descriptions now survive. AVAX/LTC/INTC/VOO/USDJPY introductions were also qualified within existing risk group R10. This is not counted as another unique defect.

Additional confirmed defect **THQ-430-017**: an active chart tooltip widened a populated 360px mobile portfolio to 455px. Its bounded position/wrapping now passes the same guest flow. Before-fix DOM measurements and screenshot are retained. This brings the original audit's 16 confirmed fixes to 17 across six protected repair loops; the 18 quality proposals are not relabelled as 18 confirmed Google violations.

## Verification

- Full local Cloudflare build with mandatory checks, app TypeScript and diff checks passed. Added regression cases check independent account denominators/shock arithmetic, approved-course validity, native HTML/bootstrap agreement, idempotence, immutability and preservation of later edits.
- All five required checks passed on exact head `412697a747c4f84314bea952661cc04db210f1c0`. Normal protected squash merge: `bac6d8e8304355ad45ee3dec4040c023d41786e3`. No administrative override.
- Native Cloudflare production `0cfe5f4c-0c31-40b7-b7b4-f2e87acf27d1` reports production/main/success at that exact merge SHA. The authenticated hosted read-only receipt is separate from a GitHub deployment badge.
- Fresh independent custom-domain checks: **34 affected content/metadata URLs at 1280px and 360px (68 views), 34 JavaScript-disabled native views, and 11 interactive checks**. Assertions passed, including zero measured overflow/ad loaders in the runtime checks.
- These content/native/interactive records are the post-PR437 rechecks. The subsequent metadata repair independently rechecked all 177 instrument/sector descriptions and their social metadata, including the five supplemented teaching paragraphs and five additional 360px intro views. The existing full-body captures are not mislabelled as recaptured after the second repair. Both exact-head/native production identities are recorded in `release-evidence.json`.

The interactive checks cover the populated guest account, all three revised course quizzes, all six legacy completions (including 4/5), and the actual inflation-feedback branch. Only isolated local guest orders/answers were entered. No real money, account write, mail, model call or publication was exercised.

This is an affected-content repair review following the earlier [163-page/480-URL fresh audit](https://github.com/anugaweerasinghe1-del/trading101/blob/issue-430-editorial-evidence/docs/audits/issue-430/review/REPORT.md). It does not pretend to be another independent manual rereading of 480 pages. The same assistant performed the skeptical follow-up. Shared templates and dynamic states remain explicitly scoped. Noncanonical native asset/sector pages have limited simulator fallbacks; these were checked as fallbacks, not misrepresented as full interactive terminal text. See `TEST-NOTES.md` for corrected test setup and view-scope assumptions.

## Database warning and remaining gates

**No course data was deleted. No course draft or publication changed.** The two attempted operations were guarded saves of corrected drafts for three existing courses; they contained no DELETE/DROP/TRUNCATE or publication statement. Both confirmations expired. A subsequent read found all three courses still published and draft/published revision pairs unchanged at 6/6,3/3,3/3. Further database writes stopped after the user queried the warning. This is documented in `database-no-change-verification.json`.

Your authorization to fix the content is recorded. The remaining source synchronization is an actual tool/application gate, not a request to reapprove the wording: save confirmations did not complete, and the normal publication flow requires an authenticated designated owner plus the master key. The prepared documents must go through that workflow; privileged publication was not used to bypass it.

`blocked-checks.csv` separately records private admin 401s, source synchronization/publication, actual AdSense/CMP account checks, production learner/mailbox flows, Morningstar 403 and limited SEC Philippines root access. The original 19 wording proposals are no longer all waiting for owner editorial review: 18 are implemented; R07 remains prepared and blocked. Issue #430 stays open for these real gates. This is not Google policy certification or an approval prediction.

## Evidence

Use `proposal-dispositions.json`, `release-evidence.json`, exact-head check records, native receipt, live content/native/interactive records, the database no-change receipt, prepared source revisions and `captures.zip`. `SHA256SUMS` covers the published files. Run `python validate.py` from this folder to check the release, record counts and package hashes. Mechanical validation supports completeness and integrity; it does not replace editorial judgment.
