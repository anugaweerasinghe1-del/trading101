# Course publication diagnostic repair — PR439

The user's publication attempt failed at the independent-review stage. The old desk displayed a generic stale-revision/review message, even when refreshing could not resolve the cause. No successful course publication has yet been independently verified.

## Confirmed fixes

- STRICT-PRE-001: recognize explicit written-number quantities and units together with calculation language. Preserve missing-example, paragraph, source and owner checks. This is an internal checker correction, not a Google policy violation.
- STRICT-PRE-002: distinguish revision conflicts, server content validation, review rejection, unavailable review, quota, configuration, unavailable sources and unknown writes. Safely categorize unexpected review transport/stream failures. Return/log bounded failure codes and display fixed instructions without private provider text.

The deployed handler still requires the registered owner session and admin key, exact saved revision, content checks and the independent review gate. No direct SQL publication or fabricated review evidence was used.

## Release evidence

Protected PR: https://github.com/anugaweerasinghe1-del/trading101/pull/439

Validated head: `64653d22c812b4a788f05fbc8b318ef3e589a50e`.

Merged main: `cee844f7cc5093896b63ce01f4dcb8f14808f43d`.

All five required checks succeeded on the full validated head. Supabase `admin-courses` version19 is ACTIVE; all10 deployed source files were read back and compared exactly against merged source. Existing JWT configuration is preserved; authentication remains enforced inside the handler. The backend rejects a missing-key publication request with401. GET405 and OPTIONS200 also passed without credentials.

Cloudflare reported deployment `e02ddc5e-2a68-482f-8c70-efa81943b19b` successful for the merged SHA. A production guest browser loaded the corrected error module; its SHA256 matches preview. All eight synthetic failure cases passed against that actual served module. These are fixture tests, not evidence that the owner's original failure was any particular provider HTTP status.

Native Cloudflare account verification PASSED at2026-11-15T08:49:49.264Z: active production deployment `e02ddc5e-2a68-482f-8c70-efa81943b19b`, environment production, branch main, success, exact merged SHA. The hosted collector verified an active native account token and canonical deployment; see `native-production-receipt.json` and its exact GitHub source job. Main validation and release/readiness checks also succeeded.

## Actual blocker and audit boundary

Read-only server logs show the two owner attempts reaching review configuration after revision and content checks, but no final publication RPC. The configured free model is present; availability/quota and the precise original review/source/provider failure are not established. The old handler did not retain a diagnostic category. One owner retry with the corrected deployed diagnostics has been requested and is still pending. The connected browser provider cannot start because of insufficient credits, so this positive authenticated flow requires the owner's own signed-in browser. No new credits were purchased and no identity gate was bypassed.

The source prerequisite remains incomplete until stored published documents match the corrected drafts and the12 live course/lesson routes are verified. The final independent database read after release still shows drafts8/5/5 and published6/3/3; see `final-publication-state.json`. Do not mark the prior19 proposals fully completed from a reported click alone.

The new strict audit still has0 newly completed editorial pages. All480 queued URLs, including163 current sitemap URLs, remain unread. Policy-source reading, builds, route tests and completeness-check fixtures do not count as paragraph-level page review. Reviewer is Codex, a prior contributor; no independent human or Google acceptance is claimed.

## Evidence index

- `pr439-checks.json`: exact-head required CI results.
- `backend-deployment-receipt.json`, `function-source-binding.json`: deployed identity and source hashes.
- `backend-runtime-verification.json`: unauthenticated runtime denials/method handling.
- `publication-phase-diagnosis.json`: sanitized phase correlation and its limits.
- `production439-admin-release.json`, `preview439-compiled-admin-release.json`: actual served module hashes and explicitly synthetic adapter checks.
- `review-checks.log`, `admin-editorial.log`, `course-workflow.log`, `daily-practice.log`: meaningful local regression results.
- `validate-page-record.py`, `page-completeness-negative-controls.json`: preparatory record gate. It checks completeness/integrity, not whether a reviewer judged correctly. No actual page record has been accepted by this gate yet.
