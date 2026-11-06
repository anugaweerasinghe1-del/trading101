# Phase 5 implementation and release acceptance

Target: 21 November 2026. Reconstructed on 6 November from fresh protected main
`69cc403c6ffd06dd357afa37a68d2947bc37930f`, open PRs and issue discussions.
This is the resumption entry point; retain the existing detailed
[admin workflow inventory](../phase5-admin-workflow-reliability.md).

## Status rules

Implemented = code exists. Tested = relevant executable checks pass. Deployed =
active production version matches merged code. Accepted = intended real workflow
passes its criteria. A fixture or CI pass does not establish live acceptance.
Issues remain open until their real acceptance gaps are resolved.

## Workstreams and acceptance

| Priority / issue | Acceptance criteria | Verified evidence / status | Dependencies / risks / next action |
| --- | --- | --- | --- |
| A / #332 dashboard | Each feed has independent loading/error, authoritative counts and timestamps; reconnect/refresh and lock fence late responses. | Implemented and fixture-tested in #333/#337/#362; genuine owner acceptance pending. | Registered owner session; exercise read-only dashboard and outages without user data exposure. |
| A / #321 courses | Private draft edits clear review; exact saved revision has independent factual review; authenticated registered owner explicitly approves publication; stale revisions fail closed; confirmed writes recover. | #345/#346/#362/#364 implemented; isolated CI passes. Historical deployment evidence: admin-courses v17. | Recheck live source/version; genuine owner readiness and provider acceptance missing. Never publish content as a test. |
| A–B / #332/#335 Daily | Schedule, attempts, saved-revision editing/review, effective-date delivery, failure recovery and approved free-tier generation work. Preserve published 50-case/500-question bank. | #362 UI fixture-tested. Prior evidence v16 source parity; historical HTTP400, 3/3 attempts, next bank 9 Dec. | Do not reset exhausted cycle or call AI without authorization. Metadata connectivity cannot prove generation. |
| A / #332 newsletter | Confirmation/unsubscribe, private drafts, preview, approval, authorized recipients, receipts and recovery. | #362 editor fixtures; #365/#366 legacy endpoint restoration/CORS and registered-owner gate tested/merged; prior v7 source parity. | Actual subscriber delivery excluded from tests. Genuine owner no-send acceptance and disposable opt-in lifecycle remain open. |
| A / #332 chatbot | Owner/provider configuration, free-tier quota, inert valid replies, auth/error handling, request fencing and lock. | #362 real Chromium fixture cases cover quota/401/403/paused/empty/forged/late replies. | Actual registered owner + permitted provider request required for genuine reply acceptance. |
| A / #332 reviews | Moderation edit/reply/delete/restore persist; failed reads do not erase confirmed writes; privacy, duplicate prevention, keyboard/mobile/theme controls pass. | Existing executable handler and Chromium fixtures; confirmed-write/read-outage recovery defect selected this session. | Implement recovery and exercise disposable fixture, then PR/CI/merge/deployment. |
| A / #332 code controls | Queue/diagnostics/approval/stop and GitHub/deployment evidence accurate; private state fenced on sign-out. | Existing isolated queue/control tests, prior worker diagnostics; live privileged controls unaccepted. | Do not retry real owner jobs or stop production for testing. Inspect durable state with authorization. |
| A / #332 mobile/accessibility/utilities | Real existing controls work at narrow widths, light/dark, keyboard, loading/repeats; tools accurately describe scope. | #362 320px course/Daily/newsletter and utility-route fixtures. | Extend moderation recovery coverage; remaining actual owner workflow acceptance pending. |
| C / #335 markets/portfolio | Persist/recover portfolios/trades; accurate provenance/freshness and leaderboard; one failed refresh cannot erase other successes. | #363 isolation fix tested/merged; prior v16 parity and scheduled HTTP200. Prior evidence: 15/15 held crypto fresh; 0/17 traditional fresh. | Provider entitlement/budget evidence missing. Do not fabricate observations or label old prices live. |
| D / #335 beginner/arena/leaderboard | Guest/account learn→trade→reflect→resume journey and consent-based aggregate funnel, private defaults, eligibility/rank distinctions and recovery. | Earlier journey/privacy/funnel code and fixtures exist (#334/#336/#361 etc.); whole real journey not accepted. | Exercise disposable fixtures; genuine account confirmation requires legitimate session. No invented conversion metrics. |
| E / #353 trophy cabinet | Agreed approximately 20 educational trophies, premium tiers/animation/placement; server authority, default private, separate opt-in/revocation and anti-abuse. | Existing private cabinet and first server-recorded trade milestone; major redesign specification pending user discussion. | Owner prefers distinct sculpted trophies/richer animation; implementation deferred. No public awards from editable browser progress; no profit-chasing incentives. |
| F / #321/#332/#335/#353 release | Security/RLS/privacy/rate limits, integrity/content trust, admin/browser/mobile/accessibility/SEO/performance and recovery evidence; all mandatory gates green; production matches reviewed main. | Main application, database and Cloudflare workflow runs completed success at checkpoint SHA; full release acceptance remains OPEN. | Resolve genuine owner/provider gates; track each PR SHA, active provider deployment and scope of smoke tests. No AdSense actions or paid dependencies. |

## Current blockers and authorization boundaries

- No legitimate registered-owner browser session has been supplied. Admin master
  key/service role cannot substitute for owner JWT or fabricated production auth.
- Owner authorized read-only operational credential use on 6 Nov. Endpoint calls
  from this runtime nevertheless return HTTP401 with configured credentials, both
  without and with standard Supabase routing headers; stopped retrying. MCP SQL
  access works. This is an access-path blocker, not proof of owner authentication.
- Daily historical exhausted cycle cannot be reset or forced. No real model call,
  newsletter send, publication, user mutation or paid service is authorized as a test.
- Owner explicitly deferred trophies for a later discussion; prefers approximately
  20 distinct sculpted learning trophies with richer animation. No redesign work.
- Concurrent automation may act: fetch main and open PRs before each cycle; review
  incoming changes. Initial open PRs #1/#3/#7/#23/#72/#95/#97/#104 are older proposals,
  none newly owns this moderation recovery scope. No other PR was merged or edited.

## Progress log / resume

### 6 Nov 2026 — loop start

- Fresh fetch confirmed main checkpoint above (not a reset). Working tree clean;
  isolated branch `phase5/admin-workflows-20261106` created from fresh origin/main.
- Main workflow runs [42214701352](https://github.com/anugaweerasinghe1-del/trading101/actions/runs/42214701352)
  and [42214701253](https://github.com/anugaweerasinghe1-del/trading101/actions/runs/42214701253)
  completed success. This establishes tested state, not whole-system acceptance.
- Read latest #321/#332/#335/#353 evidence and existing admin workflow inventory.
- Selected concrete Reviews recovery defect: confirmed update/reply clears local
  submitted text before list reload; list outage then restores older display.
  Expected: retain submitted text, clearly distinguish confirmed write from failed
  refresh, disable repeat row actions until authoritative reload, retain unrelated
  drafts, fence earlier list responses. Tests: compiled Chromium loopback fixture
  with successful writes + HTTP503 read outage + recovery, existing review handler
  and browser suites, TypeScript and Cloudflare/build gates. Rollback: revert PR;
  no schema, content or authorization changes.
- Next action: reproduce fixture failure, implement recovery, run tests, review,
  PR, required exact-head checks, merge and verify native production SHA; append
  evidence and choose next unblocked task. Keep acceptance issues open.

### 6 Nov — moderation recovery implemented and locally tested

- Original compiled Chromium regression failed on unchanged main with `Timed out
  waiting for Saved reply persisted in UI` after successful reply + list HTTP503.
- Implemented confirmed-write retention, repeat-action blocking per row, separate
  saved/refresh status, authoritative reload reconciliation, pre-write list fencing
  and lock cleanup. Unrelated unsaved fields retain their existing protection.
- Expanded real Chromium loopback suite PASSED update/reply/delete/restore with
  list HTTP503, recovery without repeat writes, 320px layout and existing admin,
  account/guest/learning journeys. No production mutations or provider calls.
- Review handler, admin editorial/error regressions, TypeScript, changed-file
  ESLint and full `npm run build:cloudflare` PASSED (354 served route fixtures,
  SEO/privacy/editorial/journey/build checks). Generated sitemap changes excluded.
- Baseline main native release job [127886228670](https://github.com/anugaweerasinghe1-del/trading101/actions/runs/42214701352/job/127886228670)
  independently reports Vercel active production `dpl_E292iNc7Q8ueARLyyswbPtKQ8bvn`
  and Cloudflare active production `0abff5fc-e814-4ae2-8d51-fa99d0e33da8` for
  `69cc403c6ffd06dd357afa37a68d2947bc37930f`. Five public routes passed. This is
  baseline deployment evidence, not deployment proof for the pending recovery fix.
- Branch-protection REST endpoint returns integration HTTP403. Existing CI checks
  live branch protection independently. Do not bypass normal PR merge protections.
- Next: publish PR, wait required exact-head CI; merge only when permitted; verify
  postmerge native deployment proof. Then inspect code-control activity reporting
  for truncated GitHub issue/PR lists and continue independent acceptance work.


### 6 Nov — PR #367 merged; next GitHub history repair

- [PR #367](https://github.com/anugaweerasinghe1-del/trading101/pull/367) merged as
  `8fa5632da717114e7122f63814e9d52ec99917de` after every required exact-head check
  passed, including full browser/SEO (10m17s), application and disposable PostgreSQL.
  [PR validation](https://github.com/anugaweerasinghe1-del/trading101/actions/runs/42220404152).
  Postmerge production evidence is pending; do not mark deployed yet.
- Owner answered authorization/product questions above. Fresh read-only source
  checks confirmed admin-courses v17 10/10 files, Daily v16 8/8, refresh v16 6/6,
  newsletter legacy audience v7 5/5, Reviews v12 4/4 match reviewed main.
- Daily still 3 attempts, 0 prepared cases, historical HTTP400, next bank 9 Dec;
  approved effective bank remains 50 cases/500 questions. Generation RPC grants
  exclude anon/authenticated. Latest scheduled quote result remains 53 requested,
  50 updated, 3 unavailable. No writes or provider generation were triggered.
- [Security advisor](https://supabase.com/docs/guides/database/database-linter)
  reports no-policy INFO notices on server-only tables, intentional callable
  SECURITY DEFINER APIs already covered by privacy/owner tests, and disabled
  [leaked-password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).
  No newly confirmed exposure is claimed; no grants/auth settings changed. Free-tier
  availability and an explicit security-setting decision remain open for password
  protection; do not purchase an upgrade.
- Next selected defect: only newest 100 mixed issues/PRs were fetched; real page one
  has no owner code requests although public paginated history contains #94/#92/#91/#71.
  Shared fixed-origin public reader now bounds issues to four 100-row pages and
  PRs to two; partial reads warn rather than claiming zero. Dashboard keeps feed
  failures independent. AI request/idea empty states distinguish unavailable data.
- Unit tests pass older records, caps, failures (401/403/429/500/503), malformed
  pages, fixed-origin pagination, no credentials and Lock cancellation. Compiled
  Chromium passes actual AI desk older requests/ideas, dashboard older findings,
  partial-history unknown queue counts and failed refresh cleanup. Public helper
  check returned all 367 current records and four owner requests, with no admin key.
  Full Cloudflare build, TypeScript and admin/AI regression suites pass locally;
  ESLint has no errors (two pre-existing dashboard hook-dependency warnings).
- Next: submit history PR from freshly reconciled main; wait exact-head required
  checks and verify #367 production. Then fix unsaved editorial navigation: course,
  Daily and newsletter header links currently bypass beforeunload/Lock confirmations
  during client-side navigation. Reproduce in compiled browser before editing.
