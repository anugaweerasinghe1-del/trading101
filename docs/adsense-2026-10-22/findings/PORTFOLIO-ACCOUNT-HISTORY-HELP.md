# THQ-025 — Portfolio restoration help

P2 trust/content finding, publicly verified in PR [225](https://github.com/anugaweerasinghe1-del/trading101/pull/225).

The expanded “How do I reset my virtual portfolio?” answer described trade history as browser-only. `applyServerSnapshot` in `src/lib/cloudPortfolio.ts` restores server-recorded account trades. Existing Privacy/About/Leaderboard explanations already distinguish these from earlier guest history. The help answer could lead an account holder to misunderstand what clearing browser data removes.

Reproduction: visit `/portfolio`, expand that named FAQ and read the answer. No reset, browser clearing, account or financial action is necessary. Before evidence: `evidence/PORTFOLIO-HISTORY-WORDING-BEFORE.json` and its mobile screenshot.

The one-string correction explains account cash, positions and server-recorded trade restoration, retains the warning that browser clearing does not reset/delete the account copy, and distinguishes earlier guest history, journals and course progress. No privacy policy, collection/consent, storage, reset, sync, financial, auth or database behavior changed. A reviewed wording revert is the rollback; no data operation is required.

Candidate `c6494ce6c0747f0b4febcf41c07d35f84194c0e9` passed local build/types, required exact-head CI and native previews. Actual Cloudflare preview and live checks expand the FAQ at all five widths, require exact visible/schema parity and unchanged guest holdings. Mobile and desktop component screenshots were personally viewed. Merge `d6fb73b84cb35ad57e642f9b99afa856b0c0630b` passed all six main/release checks; native Cloudflare production SUCCESS and Vercel production READY/active alias match that exact commit. Thirty guest route/width states and four safe controls pass without captured runtime exceptions.

Receipts: `evidence/PR225-SOURCE-SAFETY-AND-LOCAL-CHECKS.json`, `PR225-UPDATED-PREMERGE-CHECKS.json`, `PR225-PRODUCTION-PROVIDERS.json`, `PR225-MAIN-CI.json`, `PR225-PRODUCTION-BROWSER.json` and `POST-PR225-GUEST-SMOKE.json` in the same evidence directory. This is component verification, not certification of private account restoration or the entire page/audit. No specific Google policy violation is asserted.
