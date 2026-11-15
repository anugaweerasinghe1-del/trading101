# PR440 — course rejection evidence and Bitcoin corrections

The owner’s attempt returned COURSE_REVIEW_BLOCKED at2026-11-15T08:59:23.219Z. The preceding implementation discarded the reviewer findings and classified several malformed verdicts as rejection. Its exact original verdict/reasons cannot be recovered from the available TradeHQ records; provider-side history was not inspected. Neither the concerns used in regression fixtures nor the assistant’s independently found textual issues are substitutes for that lost response.

## Findings and fixes

STRICT-PRE-003: preserve bounded, credential-redacted concerns in private function logs with document digest and revision, return only designated concerns through the existing protected handler, and display them as plain-text, unverified automated feedback. Malformed/contradictory verdicts remain fail-closed and are classified as unavailable. Old feedback is labelled when the document changes; it clears on lock/sign-out. No automatic retry, approval attestation or paid fallback was added.

STRICT-PRE-004: publication selects the course’s actual citations from an exact URL allowlist, rather than substituting the general generation pool. The previously omitted Morningstar citation is attempted; availability and unsupported citation count are logged. Arbitrary draft URLs are never fetched. Generation’s pool remains unchanged. Allowlisting a URL does not prove that it is reachable or supports a claim.

R07 extension: a fresh review of the complete Bitcoin source found two overstatements. Lesson2 body11 described emotional stakes as entirely artificial and instructed learners to master mechanics; Lesson3 body1 said recalculation ensures accurate/current metrics. The replacement copy acknowledges real feelings alongside fictional monetary exposure and states a no-cash-flow, same-account, timestamped return worksheet. A delayed quote does not become current through recalculation. The guarded public corrections preserve later owner edits. The saved draft is revision9, independently compared exactly to the prepared candidate, with schema/quality/renderer checks passing and all3 lesson URLs/12 quiz keys unchanged.

The fresh source record covers88 authored field/list blocks, including24 body paragraphs,12 headings and12 complete question objects. It records the actual reasoning and source limitations. This is prerequisite source-text review, not closure of any new-audit URL. Media licensing/appearance is outside that source-text record.

## Release verification

PR: https://github.com/anugaweerasinghe1-del/trading101/pull/440

Exact validated head: `62f1edf2f2779302d69a2e4e93aa2d580ee66d60`.

Protected main merge: `7845da3df1ded6324dfff31bc70300e19e9ef404`.

All five required checks passed on the exact head. Backend admin-courses version20 is ACTIVE, and all11 deployed files were read back and matched to merged source. Existing authentication settings and owner gates are preserved. Credential-free method/auth checks passed405/200/401; no authenticated publication or real model call was made by the assistant.

Cloudflare reported successful deployment `e6d2862f-4a0e-4871-9426-c01c3d96f745`. Preview and production each passed four passage checks: two lessons on desktop/mobile, native visible HTML, bootstrap copy and hydrated text. All12 quiz objects match the corrected candidate. The production error adapter preserves structured concern fields and passes eight explicitly synthetic failure cases. The actual compiled isolated owner UI renders concerns as escaped text, makes no retry, labels older reports and clears feedback on lock.

Native account verification PASSED at2026-11-15T09:45:21.112Z: active production `e6d2862f-4a0e-4871-9426-c01c3d96f745`, production/main/success, exact merged SHA. The hosted source job and filtered receipt are preserved in `native-production-receipt.json`. Main required validation and native release signals passed.

## Remaining gates and blocked checks

The final independent database read at2026-11-15T09:46:10.480Z shows Bitcoin draft9/published6, Price Feeds draft5/published3 and Diversification draft5/published3. All remain drafts. See `final-publication-state.json`.

The registered owner’s positive browser flow remains required. The connected browser provider could not start because of insufficient credits; no credits were purchased, session credentials extracted or identity checks bypassed. One revision9 attempt was requested after native release verification; its result is pending. If it is rejected, the exact concerns can now be recovered from private function logs and independently checked before editing. The original19-proposal remediation remains18/19 until all three prepared sources are actually published and live parity is verified. No new strict-audit page is completed; the480-row queue remains unread.

Fresh source verification: CoinGecko methodology/API and Investor.gov allocation returned200 and relevant sections were freshly read. FINRA returned403. Morningstar browser navigation failed and a separate HEAD returned403 through CloudFront. An alternative Investopedia request returned402 and was not adopted. Those inaccessible source contents are not certified, and these responses do not establish what the Supabase worker can access. They remain separate from confirmed content errors and from successful arithmetic checks.

## Evidence limits

All model/handler/browser test concerns are explicitly synthetic fixtures. No real reviewer verdict has been obtained for revision9 by the assistant. Source-text notes are Codex’s own critical review, with prior-contributor identity disclosed; they are not independent human or Google acceptance. Native/raw captures, paragraph/module hashes, exact-head checks, deployed source binding and blocked-source metadata are retained alongside this report. Private provider envelopes, credentials, account billing data and the user’s screenshots are excluded.
