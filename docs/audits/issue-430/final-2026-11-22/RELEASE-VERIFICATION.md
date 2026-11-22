# Independent release verification — 22 November 2026

Technical timestamps in retained receipts use UTC. This document distinguishes protected validation, active production identity, public behavior and the stricter cross-provider readiness contract.

## Recovered baseline

Protected main was `0e5db6f9c4ab22e0f8ed38663c484c92afa4f48b`, the merge of #532. All eight requested PRs were queried afresh. #518, #520, #525, #528, #529, #531 and #532 were merged; #521 remained open and its relevant edits had been superseded by #525. The snapshots in `evidence/github-baseline.json` preserve exact candidate and merge SHAs. Open overlapping historical PRs were not merged or rewritten by this run. #533 was open at recovery and its work was not substituted for this run's independently executed capture.

Baseline native Cloudflare workflow [45009871234](https://github.com/anugaweerasinghe1-del/trading101/actions/runs/45009871234), job `137169601560`, succeeded. At `2026-11-22T09:56:58Z` it reported authenticated Pages API evidence for project `tradehq-preview`, production deployment `be9d33ed-63a7-46c0-9ef5-0de26f25a53d`, exact SHA `0e5db6f9c4ab22e0f8ed38663c484c92afa4f48b`, protected main verified, custom domain bound and five public routes checked. The verifier requires production environment, main branch, successful stage and exact commit identity. Full log is retained.

The baseline Phase 3 workflow [45009871224](https://github.com/anugaweerasinghe1-del/trading101/actions/runs/45009871224) had successful Phase 3, Cloudflare compatibility and Required validation jobs, but failed the separate release-signals job `137172608845`: `Vercel commit status must be unambiguous 0 !== 1`. This is a provider-evidence/readiness failure, not a failed application regression and not proof that visitors receive old Vercel code. The native Cloudflare receipt resolves the recorded origin/deployment identity gap within that evidence boundary. No DNS, alias, provider or readiness-rule change was made.

## Correction batch #534

[PR #534](https://github.com/anugaweerasinghe1-del/trading101/pull/534) corrects an exact-text patch index and three related execution descriptions. Validated head: `f9b5de54c0f0cfbd96bf9bebb6384b19ebfb63c2`. Normal protected squash merge: **`d932fd9a7e9af3ef17372eb20a6087ca50789b36`**.

All three required exact-head checks succeeded: TradeHQ Phase 3 tests, TradeHQ Cloudflare compatibility / Cloudflare build and SEO, and TradeHQ Required validation. Disposable PostgreSQL controls also passed. CI run [45013863396](https://github.com/anugaweerasinghe1-del/trading101/actions/runs/45013863396); separate disposable validation run [45013863400](https://github.com/anugaweerasinghe1-del/trading101/actions/runs/45013863400). Native Cloudflare preview `c3844122-3ea3-4cc5-8e57-42fc2f6fe243` succeeded. Independently fetched both corrected preview routes; preview success was not used as production proof.

Local validation: current approved-public-snapshot regression fails before correction and passes after; source immutability, idempotence, later-owner-edit preservation, native HTML/bootstrap equality and quiz-key/option preservation pass. Full Cloudflare build and its existing regressions pass. TypeScript application check exits successfully. Evidence is retained as `regression-before.log`, `regression-after.log`, `corrected-build.log`, `typecheck.log` and `repair-preview.json`.

## Exact correction production receipt and reread

Native workflow [45014816112](https://github.com/anugaweerasinghe1-del/trading101/actions/runs/45014816112), job `137184763208`, succeeded. At `2026-11-22T10:57:19Z`, authenticated Cloudflare Pages API verification reported:

- Project: `tradehq-preview`.
- Active production deployment: **`d7f02d46-8029-4adf-9af3-adf545fd4024`**.
- Exact protected-main SHA: **`d932fd9a7e9af3ef17372eb20a6087ca50789b36`**.
- Successful production/main identity, custom-domain binding, five public route checks and no reported limitations.

Independent public reread after that receipt: two changed URLs returned HTTP 200 and the corrected native content. Four hydrated views (two URLs × desktop/mobile) show the expected text. Compared all 24 quiz answer keys and option sets in those two course bootstraps with the **previous corrected display baseline**, rather than with older raw stored text that already had unrelated display corrections. All 24 are unchanged. The corrected quiz explanation is intentionally changed; no answer key or option is changed by this batch.

`repair-production-reread.json`, `repair-production-browser.json` and `repair-cloudflare-production.log` contain the observations. No practice order, account operation, source publication, email, advertising impression or ad click was used.

The entire 481-record known URL cohort was additionally fetched on the corrected release, recording HTTP redirect chains and current initial-HTML metadata where privacy permits. Result: 480 HTTP 200 and the intentional audit-probe HTTP 404. Public profiles remain GET-status-only and pseudonymized. The earlier 326-view browser matrix is dated baseline evidence; its changed course routes were reread after correction. It is not mislabelled as a new 326-view matrix on the merge SHA.

## Six release acceptance controls

| Control | Result | Evidence |
|---|---|---|
| Exact protected main identified | PASS | GitHub branch/merge snapshots and native verifier boundary checks |
| All mandatory exact candidate checks pass; normal protected merge | PASS | #534 validated head and successful protected merge |
| Native serving provider production/environment/branch/commit | PASS | Authenticated Cloudflare receipt for d932fd9a… |
| Public domain bound and available | PASS | Native customDomainBound and independent public HTTP checks |
| Changed native/hydrated content reread | PASS | Two HTML routes, four browser views, 24 preserved quiz key/option sets |
| Strict combined Vercel/recovery readiness evidence | BLOCKED | Baseline gate demonstrably failed; no passing exact-current combined readiness receipt is claimed |

Five bounded controls pass; one remains blocked. Cloudflare release identity and the corrected public behavior are verified. The separate strict cross-provider gate remains an explicit limitation and was not weakened or bypassed. A documentation-only evidence PR, if created later, is not a new claim that every site-side or account-side readiness requirement passes.
