# Phase 5 implementation and release acceptance

Target: 21 November 2026. Reconstructed on 6 November from fresh protected main
`69cc403c6ffd06dd357afa37a68d2947bc37930f`, open PRs and issue discussions.
For postmerge rollout evidence, also read the newest release checkpoint in [#332](https://github.com/anugaweerasinghe1-del/trading101/issues/332). This is the resumption entry point; retain the existing detailed
[admin workflow inventory](../phase5-admin-workflow-reliability.md).

## Status rules

Implemented = code exists. Tested = relevant executable checks pass. Deployed =
active production version matches merged code. Accepted = intended real workflow
passes its criteria. A fixture or CI pass does not establish live acceptance.
Issues remain open until their real acceptance gaps are resolved.

## Workstreams and acceptance

| Priority / issue | Acceptance criteria | Verified evidence / status | Dependencies / risks / next action |
| --- | --- | --- | --- |
| A / #332 dashboard | Each feed has independent loading/error, authoritative counts and timestamps; reconnect/refresh and lock fence late responses. | Implemented and fixture-tested in #333/#337/#362/#377. The owner unlocked production and the normal dashboard refresh passed on the #377 release. | Outage and recovery passed in isolated Chromium. Verify any remaining desk-specific owner access separately. |
| A / #321 courses | Private draft edits clear review; exact saved revision has independent factual review; authenticated registered owner explicitly approves publication; stale revisions fail closed; confirmed writes recover. | #345/#346/#362/#364 implemented; isolated CI passes. Historical deployment evidence: admin-courses v17. | Recheck live source/version; owner-reported registered access passed; exact-revision provider/editorial acceptance remains open. Never publish content as a test. |
| A–B / #332/#335 Daily | Schedule, attempts, saved-revision editing/review, effective-date delivery, failure recovery and approved free-tier generation work. Preserve published 50-case/500-question bank. | #362 UI fixture-tested. Prior evidence v16 source parity; historical HTTP400, 3/3 attempts, next bank 9 Dec. | Do not reset exhausted cycle or call AI without authorization. Metadata connectivity cannot prove generation. |
| A / #332 newsletter | Confirmation/unsubscribe, private drafts, preview, approval, authorized recipients, receipts and recovery. | #362 editor fixtures; #365/#366 legacy endpoint restoration/CORS and registered-owner gate tested/merged; prior v7 source parity. | Actual subscriber delivery excluded from tests. Production registered-owner no-email check passed. Disposable opt-in mailbox and delivery acceptance remain open. |
| A / #332 chatbot | Owner/provider configuration, free-tier quota, inert valid replies, auth/error handling, request fencing and lock. | #362 real Chromium fixture cases cover quota/401/403/paused/empty/forged/late replies. | Actual registered owner + permitted provider request required for genuine reply acceptance. |
| A / #332 reviews | Moderation edit/reply/delete/restore persist; failed reads do not erase confirmed writes; privacy, duplicate prevention, keyboard/mobile/theme controls pass. | #367 deployed with confirmed-write/read-outage recovery; executable handler and Chromium fixtures pass, genuine owner acceptance pending. | Recovery deployed in #367; genuine owner moderation acceptance remains pending. |
| A / #332 code controls | Queue/diagnostics/approval/stop and GitHub/deployment evidence accurate; private state fenced on sign-out. | Existing isolated queue/control tests, prior worker diagnostics; live privileged controls unaccepted. | Do not retry real owner jobs or stop production for testing. Inspect durable state with authorization. |
| A / #332 mobile/accessibility/utilities | Real existing controls work at narrow widths, light/dark, keyboard, loading/repeats; tools accurately describe scope. | #362 320px course/Daily/newsletter and utility-route fixtures. | Moderation and cross-desk navigation browser coverage now pass; actual owner acceptance pending. |
| C / #335 markets/portfolio | Persist/recover portfolios/trades; accurate provenance/freshness and leaderboard; one failed refresh cannot erase other successes. | #363 isolation fix tested/merged; prior v16 parity and scheduled HTTP200. Prior evidence: 15/15 held crypto fresh; 0/17 traditional fresh. | Provider entitlement/budget evidence missing. Do not fabricate observations or label old prices live. |
| D / #335 beginner/arena/leaderboard | Guest/account learn→trade→reflect→resume journey and consent-based aggregate funnel, private defaults, eligibility/rank distinctions and recovery. | Earlier journey/privacy/funnel code and fixtures exist (#334/#336/#361 etc.); #377 live read confirmed 75 opted-in entries including 53 zero-trade profiles. Full real journey not accepted. | Exercise disposable fixtures; genuine account confirmation requires legitimate session. No invented conversion metrics. |
| E / #353 trophy cabinet | Exactly 20 distinct educational trophies with original sculpted silhouettes, accessible locked/earned/loading/unavailable states, criteria and progress, restrained reduced-motion celebration, optional profile flair/pins/share cards. Preserve personal progress. Verified evidence must be server-authoritative, private by default, idempotent, isolated by account and revocable from public display. | #378 merged and the live cabinet route responds successfully. All 20 approved designs render in the browser fixture, eleven with trusted evidence sources and nine marked unavailable. | Finish the nine evidence sources, durable award records and opt-in trophy sharing. Verify the signed-in live experience. |
| E / #353 completion certificate | Versioned The Trade HQ Foundations Learning Programme with server-side eligibility and idempotent private issuance, stable ID/date/evidence, name preview, correction history, deterministic PDF matching the approved white-and-teal designs, repeat downloads and optional minimal revocable verification. | #378 merged after required checks. The approved 40-question bank, private schema and both certificate functions are hosted. Isolated SQL, handler and browser checks passed. The live verifier rendered its invalid-link state, and unsigned progress and anonymous assessment-bank reads were rejected. | Verify authenticated eligibility, issuance, repeat downloads, correction and opt-in verification through an authorized production account workflow. |
| F / #321/#332/#335/#353 release | Security/RLS/privacy/rate limits, integrity/content trust, admin/browser/mobile/accessibility/SEO/performance and recovery evidence; all mandatory gates green; production matches reviewed main. | Main application, database and Cloudflare workflow runs completed success at checkpoint SHA; full release acceptance remains OPEN. | Resolve genuine owner/provider gates; track each PR SHA, active provider deployment and scope of smoke tests. No AdSense actions or paid dependencies. |

## Current blockers and authorization boundaries

- The owner unlocked the production dashboard securely. A registered-owner account
  session is required separately for protected Newsletter, Course and provider actions.
- Owner authorized read-only operational credential use on 6 Nov. Endpoint calls
  from this runtime nevertheless return HTTP401 with configured credentials, both
  without and with standard Supabase routing headers; stopped retrying. MCP SQL
  access works. This is an access-path blocker, not proof of owner authentication.
- Daily historical exhausted cycle cannot be reset or forced. No real model call,
  newsletter send, publication, user mutation or paid service is authorized as a test.
- The current scope includes exactly 20 distinct trophies and the completion
  certificate. Product review gates only dependent reward decisions and issuance;
  independent admin and application acceptance continues.
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


### 6 Nov — verified moderation release, merged history repair, navigation fix

- **#367 is deployed and postmerge verified:** main SHA
  `8fa5632da717114e7122f63814e9d52ec99917de`, all main checks passed in
  [42221772662](https://github.com/anugaweerasinghe1-del/trading101/actions/runs/42221772662).
  Native release job confirms Vercel `dpl_5o2i9UvKAZvRkRVq5GauSXzhCmQC` READY on
  the active production alias and Cloudflare production `8cddfe28-c69c-49c0-99cd-1d8ed2e4c2d2`
  success for that SHA. Local Cloudflare token returned HTTP401; repository CI's
  separate native token supplied the successful proof. No credential was changed.
- [#368](https://github.com/anugaweerasinghe1-del/trading101/pull/368) merged as
  `1c69cc8e8777403babd265ccece6ee04daab8441` after exact-head application,
  PostgreSQL, full browser/SEO (8m46s), required validation and provider previews
  passed. Postmerge production verification pending at this checkpoint.
- **Actual production checks**, saved in
  [release evidence](evidence/2026-11-06-release-checks.json): fresh mobile Chromium
  hydrated all six locked admin desks and Daily; live Courses/Reviews/legacy audience
  CORS preflight passed; guest BTC buy/sell, fee arithmetic, cash reconciliation,
  portfolio reload persistence and 390px layout passed. All server write requests
  were blocked in the guest test; zero were attempted. Only disposable guest local
  storage changed. These results do not establish account or owner acceptance.
- Third selected defect reproduced against unchanged code: declining navigation
  still changed Daily's path to `/admin`, losing the private draft. Existing
  beforeunload does not handle SPA links or browser Back/Forward. Added shared
  `useAdminDraftNavigation` to Courses, Daily, Newsletter and Reviews. Uses React
  Router's supported blocker; data-router setup retains existing route definitions
  and application providers. Discard denial retains draft state; approved discard
  navigates; clean editors and new tabs remain ordinary navigation. Native unload
  and explicit Lock safeguards remain.
- Compiled Chromium passes canceled Course/Daily links, Newsletter keyboard Enter,
  browser Back/Forward denial preserving Course draft, approved Back, clean history
  and saved Newsletter navigation. Existing auth/guest/learning/admin regressions
  pass with the data router and history repair. Reviews history denial also preserves the unsaved moderation text. TypeScript, admin/request checks, changed-file ESLint
  (no errors; pre-existing warnings) and full Cloudflare build pass.
- Combined regression sequencing repaired without removing assertions: keyboard
  focus may trigger refresh, so reconnect waits the real 1s coalescing interval;
  moderation refresh waits its busy button to become enabled after the deliberate
  HTTP503 read. Existing application behavior remains authoritative in these tests.
- Reconciled #368, retaining both adjacent browser insertions. Broad routing change
  requires all exact-head browser/SEO and account/guest regressions before merge.
- Supabase docs confirm leaked-password protection is Pro-plan-only; existing free
  tier/no-purchase constraint blocks enabling it. No plan/auth setting changes.
- Migration reconstruction: 48 repository files versus 43 recorded migrations,
  37 names match; many historical timestamps differ, with schema-recreation/auth
  recovery entries only in hosted history and old baseline names only in repo.
  Do not infer missing live objects or replay migrations from filename differences.
  Critical current source/RPC grants/public bank were checked directly; complete
  historical schema reconciliation remains a separate release-assurance item.
- Next: finish combined browser check, submit navigation PR, pass exact-head CI,
  merge and verify production; update this log and #332 with final SHA/evidence.

- Final combined compiled Chromium run PASSED, including Reviews Back denial,
  all new history/link/keyboard cases and every existing auth/guest/admin journey.
  The first header-only implementation was replaced before PR submission by the
  supported router blocker so browser history is covered by the reviewed change.


### 6 Nov — navigation shipped; privacy regression alignment

- [#369](https://github.com/anugaweerasinghe1-del/trading101/pull/369) merged as
  `47dcf541cc8572c1a33f01509b41d7a27d06e4fb` after all exact-head required checks,
  including 10m42s browser/SEO, application, database and hosting previews passed.
  Main validation [42226392903](https://github.com/anugaweerasinghe1-del/trading101/actions/runs/42226392903)
  is running; do not infer final native production proof until its release job passes.
- Public production mobile browser checks after the merge passed all six locked
  admin routes and Daily again. The loaded first-party Daily admin module contains
  the new draft-guard text. Actual fresh guest buy/sell, fee/cash reconciliation,
  portfolio reload and 390px width passed again; zero browser server-write requests.
  Evidence appended to the existing credential-free JSON artifact. This supports
  deployed public code; genuine owner-authenticated draft acceptance stays open.
- Core database comparison checked 38 functions against the disposable fixture:
  every one exists in production; 36 definitions match exactly. `hit_rate_limit`
  differs only in whitespace. Production `handle_new_user` correctly forces private
  signup; the old test fixture used the earlier public-by-default trigger. This is
  not a confirmed production privacy failure and does not justify replaying migrations.
- Found and repaired a real release-assurance defect: `verify-backend.mjs` omitted
  the existing private-profile/review-default migration, and its portfolio fixture
  explicitly demanded public signup. Adding the live migration alone reproduced
  `Valid server ledger not ranked`, exposing implicit-public test assumptions.
- The local runner now applies the existing reviews foundation and privacy migration.
  New rolled-back SQL exercises absent/true/false/malformed signup visibility
  metadata, private anonymous/directory reads, authenticated own opt-in, denied
  cross-account update, zero-trade unranked membership, revocation and moderation
  defaults. Earlier public/private profile choices remain unchanged. Existing public
  ranking/duel scenarios now opt their synthetic members in explicitly.
- All local backend suites PASS, including private signup, trades, duels, automatic
  valuation, security grants, Phase 4A and public trade consent; TypeScript and
  privacy-default guards pass. No app, production schema, subscriber, user visibility
  or review state was changed. Rollback is a PR revert; no database rollback needed.
- Next: PR/required exact-head checks for the privacy-fixture repair, verify #369
  native rollout, merge the assurance repair only when permitted, then record final
  main SHA/production proof in #332. Outstanding genuine owner/provider gates remain
  as recorded above; trophies explicitly deferred, no quota resets or paid upgrades.


### 6 Nov — postmerge browser failure diagnosed; assurance PR extended

- #369 main run 42226392903 failed in the isolated browser step; its release jobs
  were skipped. Do not claim that run passed or that it supplied native production
  proof. Broad editorial route matrix and application checks passed; public code
  and guest checks above remain observations of their stated scope.
- Retrieved the complete run archive after the individual reusable-job log request
  returned HTTP403. The failure was a null link click immediately after seeding
  Course/Daily history. The fixture accepted a changed URL plus a generic password
  form still belonging to the preceding desk, then clicked a Course-only link.
- Assurance PR #371 now waits for the real Course unlock control and Daily-specific
  header before acting after transitions. No sleep-based route workaround or test
  assertion removal; all Back/Forward/draft-retention assertions remain. The fix
  is test setup only; the supported application blocker is unchanged.
- Rechecked runtime setup: enforced unrestricted policy and ready credential
  bindings on the same configuration revision. Readiness is not successful API
  authorization; earlier runtime admin HTTP401 remains an actual access blocker.
- Concurrent #370 changes trophy catalog validation in disjoint files. Recorded
  owner trophy deferral in #332 and have neither edited nor merged that PR.

### 6 Nov — control-readiness waits and faster unchanged CI gates

- Exact-head #371 run 42228424570 exposed a second immediate `Admin button missing`
  in the newsletter fixture sequence; application/database/hosting previews passed,
  and the PR remained unmerged. The browser helper had attempted actions before
  busy controls became usable, despite a preceding receipt/message being visible.
- `adminClick` now waits for the named button to be enabled (including disabled
  parent fieldsets), reports any wait and names the control on bounded timeout,
  then clicks exactly once. All mutation-count and disabled-state assertions remain.
  The complete local compiled browser suite passes with this helper.
- Moved that targeted browser check immediately after the Cloudflare build and
  before the broad seven-phase editorial route matrix. All checks, identities,
  permissions and trusted production gates remain mandatory. CI contract and
  release/recovery offline regressions pass; this changes order, not requirements.
- The full historical worker archive was recovered via the normal run-archive API:
  only `Owner proposal review: idle` then generic safe stop is recorded. There is no
  worker or request row for that run. Original cause remains unproven; no replay.
- Next: required CI on the new head, merge only after success, then final current-main
  validation/native production evidence. Earlier failed heads are not passing evidence.

### 6 Nov — assurance repair merged; private quote-provider diagnostics

- #371 merged as `2eb6067567ad51d5992a76f44d884577cdcc593b` after every required
  exact-head check passed: focused authenticated browser, broad route/SEO matrix
  (9m18s), application, PostgreSQL and provider previews. Main run
  [42231764485](https://github.com/anugaweerasinghe1-del/trading101/actions/runs/42231764485)
  is in progress; its final native production proof remains separate.
- Read-only production catalog confirms `profiles.is_public` and `reviews.is_visible`
  defaults are false. 38 checked core functions all exist; the two earlier
  differences were formatting and the stronger live private-signup trigger. No
  production migration replay or schema/visibility mutation was needed.
- Owner is arranging a secure admin-key binding refresh; do not infer success from
  that intention. Genuine endpoint authentication must pass before live acceptance.
  Registered owner JWT is still a separate requirement for protected actions.
- Next selected C work: refresh results cannot distinguish missing provider config
  from upstream entitlement/availability. Add only private `providerConfiguration`
  flags after scheduler token/lease admission, preserving all quote counts. Missing
  keys/Alpha Vantage demo are false; unreadable environment metadata is null and
  cannot invalidate successful quote writes. No secret values, extra provider
  requests, cadence changes, paid fallbacks, user positions or fabricated prices.
- Public `live-market-data` v18 ACTIVE was fetched independently: all eight returned
  source files match current reviewed main. Keep the new diagnostics helper in a
  separate module so this unrelated live bundle needs no replacement.
- Provider parsing/refresh regressions and actual transpiled scheduler handler
  fixtures PASS: unauthenticated/denied/error claims cannot read configuration;
  admitted results retain counts and persist boolean flags; unknown metadata does
  not fail updates; finish failure is generic; extra fetch/secret disclosure fail
  the test. TypeScript passes. Source review preserves existing admission and RPCs.
- Done requires PR/required exact-head checks, merged main and native deployment
  proof; deploy only reviewed refresh-worker files, re-fetch to compare source,
  then read the next ordinary scheduled result. Do not manually invoke refresh or
  infer provider key validity/free-tier entitlement from a true presence flag.
- Rollback: restore the preceding verified refresh-worker bundle; no schema/data
  rollback. Next safe action: submit this PR and finish #371 postmerge proof.


### 6 Nov — provider diagnostics released; daily FX references authorized

- #372 merged as `d6d0dd3bda8c385b45e5171b6cb5cdb4ca5204e9`; full main run
  [42234815755](https://github.com/anugaweerasinghe1-del/trading101/actions/runs/42234815755)
  passed. Native Cloudflare production `f5c00c11-8812-4f21-ab68-1f801d6ece13`
  and Vercel `dpl_2EvDqk7rY8FNXxRFPspXpTeWmdPb` both proved that main SHA.
- Refresh worker v17 ACTIVE returned all seven reviewed source files unchanged.
  Ordinary scheduled 14:35 UTC result: HTTP200, 53 requested / 50 updated /
  3 unavailable; private configuration flags both false. No forced refresh,
  extra upstream requests or production position changes. Public live-market-data
  v18 still matches all eight reviewed files. Native proof and remaining gates:
  [#332 checkpoint](https://github.com/anugaweerasinghe1-del/trading101/issues/332#issuecomment-6687716549).
- Owner requests a free-tier provider and explicitly approved **daily reference
  information only**. [Frankfurter documentation](https://frankfurter.dev/) permits
  free commercial blended daily references without a key; bounded cached requests
  are appropriate. A fixed-date public read returned all 12 USD quotes needed to
  derive the 15 existing pairs. An unfiltered latest response included dates later
  than the current date, so latest is unsuitable: request only the previous
  completed weekday in Asia/Colombo and reject future, invalid, old or inconsistent
  cross-rate dates. Show the actual per-pair source date, not a live timestamp.
- Implement a same-origin GET-only reference API for both hosting platforms, shared
  pure validation, bounded 32KB/8s upstream read, fixed provider URL/headers,
  coalescing, daily edge/in-memory cache and short failure cooldown. No visitor
  cookies, IP headers, credentials or user-selected upstream URLs are forwarded.
- Forex-only UI names Frankfurter and labels the rate for learning/comparison.
  Reference data never enters price history, execution, valuation or holdings.
  Invalid/unavailable responses produce an explicit unavailable state. No schema,
  Supabase function, secrets, scheduler cadence, paid service or provider key change.
- Ordinary Alpha Vantage free quota is 25/day versus up to 576 traditional asset
  attempts/day at current cadence, and public-display rights need confirmation;
  Twelve Basic is internal non-display. Do not activate traditional execution
  providers based on a free-account label. Research is recorded in
  [#335](https://github.com/anugaweerasinghe1-del/trading101/issues/335#issuecomment-6687717254).
- Acceptance: all 15 conversions and invalid/partial/future/duplicate-date fixtures;
  both real hosting adapters; upstream header/privacy/cache/error bounds; actual
  compiled browser source/date/outage/320px themes and an independent-price guest
  trade; full required PR/main checks and native deployment/live endpoint proof.
  Tests use loopback fixtures and make no real provider calls.
- Rollback: revert this isolated reference panel/API commit; execution and stored
  portfolios need no data rollback. Trophy work remains deferred. Real owner auth,
  exhausted Daily cycle and public-display stock-provider rights remain open gates.

- Real Pages preview initially returned HTTP503 despite passing Node fixtures and
  a successful bundle. A workerd reproduction identified unsupported
  `redirect: error`; use `manual` and reject non-2xx, including redirect responses.
  Cache plain body/status/header values rather than sharing request-bound Response
  streams. Added a required actual-workerd regression using the real handler,
  independent request contexts and a stub upstream (no external provider calls).
  New exact-head checks and a successful real preview read are required before merge.


### 6 Nov — genuine owner-guided checks and bounded private Daily test

- Owner reports the actual Course `Verify owner access` response: registered owner
  verified, no publication/generation. This is owner-reported live evidence, not an
  independently controlled browser session. The environment's separate binding
  still returned HTTP401 on its last settings-only read. Never request a key in chat.
- Owner's Daily screenshot shows successful Gemini key/model metadata preflight,
  saved Gemini 3.5 Flash Lite, 0/50 exercises, 0/5 parts, 3/3 consumed attempts,
  preparation 2 Dec / effective bank 9 Dec. Historical HTTP400 remains historical;
  metadata success does not prove structured generation or authorize a reset.
- Current owner-supplied AI Studio screenshots show project Free tier and model
  limits 15 RPM / 250K TPM / 500 RPD. The 28-day displayed peaks 2 RPM, 31.54K TPM,
  6 RPD do not establish today's remaining allowance. Do not enable billing.
- Implement a separate owner-only `daily-practice-test` function and explicit Daily
  test UI. Reuse saved free Gemini 3.5 Flash Lite credentials, registered-owner Auth
  verification and the existing atomic limiter. No production claim/finish/request
  RPC, cycle reset, draft write, publication, schema migration or schedule.
- One global test admission per UTC day, including failed/unconfirmed tests. Calls
  require master key AND legitimate registered-owner bearer, free-tier confirmation
  AND a deliberate browser confirmation. No automatic request/retry/fallback. Eight
  fixed public references and at most ONE Gemini generation call; serialized request
  max 120,000 bytes, output max 32,768 tokens; source/provider time/body bounds remain
  those of the real production generator. Shared project usage can still cause 429.
- Use the actual first-part generator with no user/private draft inputs; validate
  ten exercises/100 questions, discard all generated text, return only bounded
  validation/failure/usage metadata. This tests structured generation, not complete
  five-part bank persistence or factual/editorial acceptance. Preserve the published
  50-case/500-question bank and exhausted production attempt history.
- Backend regressions exercise the real generator against fixture sources/model:
  wrong key/non-owner/body/config denial before quota/config reads; racing admission;
  one provider request, no response-text/key leakage; oversized request blocks the
  provider; 400/429/invalid output/network errors consume admission without retry.
  Browser acceptance covers explicit consent/cancel, real fixture owner JWT,
  disabled repeat, pass/failure/used-limit messages, unchanged bank/cycle fixtures,
  lock fencing and 320px themes. No test invokes a real provider.
- Done requires required exact-head PR/main checks, native CF/Vercel deployment
  proof, dedicated function deployment with reviewed-source parity and safe auth
  denial. Real Gemini acceptance remains pending the owner's deliberate live test.
  Rollback: remove this isolated UI/endpoint; no bank/data rollback or quota reset.

### 7 Nov — completion review and Daily private-test admission race

- Fresh main is `55916bd5af73f040d68424604d07c18efb267c46`; #374 is the
  outstanding bounded Daily private-test workstream. Trophy #370 remains deferred.
- Independent compiled Chromium reproduction: two clicks in one event turn sent
  two test requests before React applied the disabled button. The server's atomic
  one-test allowance still prevents a second admitted model call, but competing
  UI outcomes were possible. Added an immediate in-memory submission guard;
  request completion and sign-out release the guard under existing scope fencing.
- Extended browser acceptance covers that exact two-click reproduction, forged
  success metadata, and a held success response across Lock/unlock. Old replies
  cannot populate the new desk or retain the old confirmation. No model request
  or production editorial mutation is made by these fixtures.
- Fresh read-only runtime source parity: admin-courses v17 10/10 files,
  generate-daily-practice v16 8/8, admin-agent-chat v9 4/4 equal current main.
  Approved public bank remains 50 exercises / 500 questions; three course drafts
  are published, two Daily banks published, two newsletter editions approved.
- Daily remains enabled, attempts 3, completed 0, nextDue 2026-12-09, historical
  error present. The new endpoint is not deployed at this checkpoint; do not reset
  the real cycle, fabricate owner auth or infer semantic quality from fixtures.
- One operational settings read with the configured runtime master key still
  returned HTTP401. The owner offered to sign in to shared Chrome for genuine
  acceptance. Shared desktop is enabled but control tools are absent/cold in this
  session; the owner was given the Desktop/sign-in instructions. A real browser
  session and explicit owner initiation remain necessary for the real test.
- Next: exact-head CI, fresh-main check and merge #374, dedicated Edge deployment
  with source parity, native hosting proof and non-generating production smoke.
  Only then can the owner deliberately run the quota-confirmed private test.
- The full browser run also exposed an existing FX test setup race: the test
  interpreted an absent account menu before hydration as a guest session. It now
  waits for the intentionally retained owner fixture, explicitly signs out and
  waits for the portfolio owner marker to clear before the independent FX order.
  The complete compiled suite then passed, retaining all guest-order/source-price,
  Daily admission, malformed-result, late-reply and earlier admin assertions.

### 7 Nov — owner acceptance reached Gemini; validation diagnostics needed

- Owner again reports registered-owner Course readiness. This is genuine
  owner-guided UI evidence, not an agent-controlled browser or a fabricated JWT.
- #374 merged as `406a5a3fc2be75ab0eb16562e1f2b811c6a8e5c7` after exact-head
  CI. All final-main/native hosting checks passed; private test v1 ACTIVE matched
  all 11 reviewed files. Production browser rendered six routes and loaded the
  new Daily bundle. Course/Daily/chat and other admin deployed sources matched main.
- Owner explicitly initiated one quota-confirmed live private test. It reached
  Gemini and returned `OUTPUT_VALIDATION_FAILED`; source content was discarded as
  promised. Read-only admission count is 1, production attempts remain 3 and cases
  0, next bank 9 Dec. See the credential-free owner-test evidence JSON. This is a
  FAILED live generation check; do not mark the generator accepted or infer its
  exact failed constraint. Version 1 collapsed several errors and retained no
  detailed stage, so the discarded response cannot be retrospectively diagnosed.
- Add private-test-only bounded diagnostics: response/envelope/schema/source/
  category/repetition stage, fixed rule codes and numeric positions, provider
  finish reason/usage and field-length/count summaries. Read the same bounded
  provider response once, pass identical text to the unchanged real generator,
  discard prose, and log only whitelisted metadata. No extra fetch, model request,
  retries, paid fallback, bank/draft writes or changes to production validation.
- Keep the same global `daily-practice-test-one-per-utc-day-v1` budget. A redeploy
  cannot reset it. Earliest next test for this 7 Nov attempt is 8 Nov at 05:30
  Sri Lanka time (00:00 UTC); the owner must deliberately reconfirm quota then.
- Local actual-generator fixtures cover every stage and malformed/truncated output,
  privacy-safe bounded logs, unchanged allowance and logger failure. Compiled
  Chromium covers safe metadata display, forged diagnostics rejection, lock fencing
  and 320px themes. Neither test calls a real model. Real provider acceptance
  remains open until a permitted live request actually passes.

### 7 Nov — dashboard partial outage follow-up

- A Course settings outage blocked unrelated editorial and moderation reads after
  unlock. Keep the initial privileged settings check, then settle each read
  independently on refresh and clear unavailable Course generation data. Clear
  chat readiness on Lock as part of the existing private state cleanup.
- Compiled browser fixture now exercises a failed Course settings read while
  Daily and Newsletter change, recovery on a later refresh, and the existing
  late-response Lock case. Record the PR and deployment outcomes before marking
  this fix deployed or any genuine owner workflow accepted.
- Rewards now explicitly include the 20-trophy redesign and the versioned
  completion certificate in this same acceptance checklist.

- With the user's in-browser unlock, the real production dashboard showed
  live Course, Newsletter, Daily, Reviews and Chat readiness feeds. A read-only
  Refresh advanced editorial freshness from 10:55:05 to 10:55:34 and GitHub
  freshness to 10:55:31 (Asia/Colombo). This accepts the normal dashboard read
  and manual refresh on the deployed baseline; outage, recovery, separate desk
  authorization, and editorial actions still need their own evidence.
- A complete editorial outage also retains the last successful refresh time.
  The isolated browser fixture checks the timestamp and subsequent recovery.


### 7 Nov — resumed from verified production and rewards draft

- Fresh protected main and production baseline: #377
  `ff168c04d9e358b1586beae1e3013a285c440f8e`.
  [Main CI](https://github.com/anugaweerasinghe1-del/trading101/actions/runs/42343914264)
  passed. [Native release evidence](https://github.com/anugaweerasinghe1-del/trading101/actions/runs/42343914264/job/128319776352)
  identifies Cloudflare deployment `4a76e847-2768-4af0-8b95-282575171ff2` and
  Vercel `dpl_53Gnd2C2JbyJw5eCVZzC9XEdqtzj` READY at that SHA.
- In the live browser, the owner unlocked the dashboard. Manual Refresh advanced
  editorial freshness from 12:16:58 to 12:17:21 and GitHub freshness from
  12:17:02 to 12:17:19 (Asia/Colombo). No editorial action or model request.
  This accepts the deployed dashboard's normal read and manual refresh.
- AI Desk refresh can reveal a new proposal head before its checks resolve. The
  change binds each displayed check result to the exact head and shows validation
  as unchecked until that head is read. Isolated release provenance and AI/admin
  handler suites passed locally. Exact-head compiled browser CI remains required.
- The #378 rewards draft at `bd8db36e38fad90107ed52a25dcf089ede41f08e` has a
  successful Cloudflare preview and Vercel preview. Production acceptance
  remains open. First Course requires one Foundations course, Core Studies
  requires three, and Foundations Completion requires all four plus the final case.
- #370 is a separate malformed-catalog fix and is behind/conflicting with main.
  It still needs reconciliation and exact-head checks.
- Keep #321, #332, #335 and #353 open. The earlier Daily private test failed
  validation. Keep the allowance and approved 50-case/500-question bank intact.
  Next Daily test requires a fresh deliberate owner free-tier/quota confirmation
  and can occur no earlier than 8 Nov at 05:30 Asia/Colombo.

- The shared browser signed in to the existing TradeHQ account via Google OAuth.
  The production Newsletter Desk returned **Registered owner verified. No
  newsletter was sent.** This accepts registered-owner readiness. New signup,
  mailbox delivery and consent-based leaderboard conversion remain distinct.
- #379 exact-head CI passed and the commit merged as
  `5d47f3db2e960e52d1e2dfc2de41008015347612`. Native rollout verification
  is recorded separately on the PR.

### 7 Nov — rewards draft and protected releases

- #379 merged as `5d47f3db2e960e52d1e2dfc2de41008015347612`.
  [Native production evidence](https://github.com/anugaweerasinghe1-del/trading101/actions/runs/42349522498/job/128336647563)
  confirms that exact SHA on Cloudflare `06d04b03-d1d5-452d-8fff-8cda2009acac`
  and Vercel `dpl_CAcntijiceazf8peWqTNaHSF68Ch`. The live AI Desk
  hydrated with its admin gate. The held-response regression passed in isolation.
- #370 merged as `82a3f56269eecc84682be8dea20fe588b90c9475` after required
  checks. [Native production proof](https://github.com/anugaweerasinghe1-del/trading101/actions/runs/42350506756/job/128339839085)
  confirmed the exact SHA on Cloudflare and Vercel. The live Trophy Cabinet
  hydrated its private progress, protected trade activity and course badges. #380 tracks the TypeScript ES2020 compatibility follow-up for its
  own-key check. The local application TypeScript and catalog checks passed.
- #378 renders all 20 approved trophy illustrations. Ten have connected
  evidence (nine Foundations criteria and First Practice Trade); the other
  ten show unavailable and require authoritative evidence producers. Durable
  trophies and opt-in flair, pins, sharing and withdrawal are still open.
- #378 implements a private, account-scoped assessment bank and grading,
  service-only score and issuance records, name confirmation, and three
  PDFs using the approved artwork. Isolated coverage includes account scope,
  forged input, outage/retry, duplicate issuance, a 200-account SQL fixture,
  and Chromium PDF downloads on desktop and a 320px viewport. Hosted schema,
  assessment content and certificate issuance remain unreleased. Editorial
  review and seeding remain open.

- The rewards draft now preserves the original certificate while appending private
  name revisions. New downloads use the latest name and keep the ID and date.
  Disposable SQL and handler fixtures cover account isolation, stale revisions
  and retry without duplicate changes.

- The rewards draft now implements optional verification. The learner explicitly
  creates or withdraws a link. The service stores only its hash and verification
  returns the certificate type, programme version and date. Correction and link
  rotation invalidate prior links. The public route skips account and analytics
  providers and its built document excludes the ad tag. Hosted acceptance still
  depends on the reviewed curriculum and reward rollout.
- #380 passed required pull-request checks and merged as
  `cf5af3722d14e99fc0ac8cfc53850338fb77d277`. Native rollout is tracked on
  that pull request.

- Steady Learner now reads service-only records of passing Foundations scores on
  seven distinct Sri Lanka calendar days. Duplicate same-day scores count once,
  failed scores do not qualify and the count remains account scoped. This adds
  an eleventh trophy with a trusted evidence source in the draft. Nine sources
  and the durable trophy award and sharing records remain open.

### 7 Nov — approved assessment bank and rewards rollout

- The owner approved the Foundations v1 bank. The hosted seed contains six
  checkpoints and one final case with 40 questions in total. Browser roles
  have no direct assessment-bank read grant. The seed can be retried with the
  identical bank and rejects changed content for the same version.
- Hosted migration `20261107142912` and both certificate functions were applied
  before the web merge. The function source retrieved from hosting matched the
  reviewed source. Anonymous progress and bank reads returned HTTP 401, and
  an unknown proof returned HTTP 404. The public verification page rendered
  the expected invalid-link state and served no ad tag or referrer.
- Rewards [PR #378](https://github.com/anugaweerasinghe1-del/trading101/pull/378)
  merged as `5401b015aeec90077a227d9affb741d0dae96d78` after required PR checks.
  The Trophy Cabinet and verification page returned HTTP 200. Live signed-in
  issuance remains an acceptance item. The admin, market freshness and beginner
  journey workstreams retain their own gates above.
- A read-only Supabase comparison matched all 58 deployed files across nine
  admin functions to the merged commit. This covers Course administration,
  Daily production generation and private test, Newsletter audience/editor/
  dispatch, Chat, Reviews and the code queue. This verifies code deployment.
  Signed-in workflows and provider outcomes retain their separate acceptance
  criteria above.


### 7 Nov — checkpoint-ID integrity regression and deferred post-release announcement request

- Phase 5 certificate/trophy hardening: eligibility now counts only the six recognized Foundations v1 checkpoint IDs when reading service-recorded grades, and never inflates checkpoint-based trophy counts with unknown, retired or malformed IDs. Adds executable regression assertions. Verify on the exact PR head; this entry is NOT test, merge or deployment proof until actual CI and release evidence are recorded.
- **Explicitly deferred until every Phase 5 acceptance gate has been genuinely completed:** add a permanent, automatic **What’s New** experience discoverable from the site navigation, linking to a cumulative release-history page. It should announce newly *published* courses, newly released features (including the Trophy Cabinet), improvements and future site updates, not merely the current launch. Design it to support every future release, avoid duplicate/false announcements, and exclude drafts/unreleased changes. This is a future post-Phase-5 product requirement, **not** permission to start its implementation before Phase 5 is complete. Keep it outside the Phase 5 completion percentage.
- Sinhala/Tamil status clarity: the approved certificates have script/font support for recipient names; no repository evidence establishes full Sinhala/Tamil translations of TradeHQ pages or an installed language selector. Do not represent certificate font support as multilingual website support. Clarify translation release scope separately before claiming full multilingual acceptance.

### 8 Nov — verified #383 production and bounded dashboard counts

- Fresh protected main was `852f6a1143dd18b5e5c1837733aaed4c54af0c16`.
  Its source tree matched GitHub's tree SHA `f0be5ca2b464c1af515d5a9f7c5c8f63b7231434`.
  The newest automation report predates the rewards merge. No open PR overlaps
  the editorial review count change.
- [Main CI](https://github.com/anugaweerasinghe1-del/trading101/actions/runs/42390479626)
  and [disposable PostgreSQL](https://github.com/anugaweerasinghe1-del/trading101/actions/runs/42390479554)
  passed. [Native release job](https://github.com/anugaweerasinghe1-del/trading101/actions/runs/42390479626/job/128459280676)
  confirmed the exact SHA on Cloudflare Pages production
  `5bc0a490-c9d3-4b15-bb4d-c32d5fdbfd16` and Vercel's active production alias
  `dpl_4xGsa54ECL7WC5oZfpUZiGggxWXw`. Active Foundations certificate v2
  matched all seven source files. The live admin access gate hydrated in Chrome.
- Daily private-test admission read at 02:24 UTC showed zero attempts recorded
  in the current UTC window. The previous test failed `OUTPUT_VALIDATION_FAILED`.
  The count only describes TradeHQ's local allowance. A new model request
  requires the owner to confirm remaining free Gemini quota and deliberately
  initiate the test through the real signed-in desk.
- Dashboard review feeds use bounded recent lists (200 Course drafts, 24 Daily
  banks, 16 Newsletter editions). A full page previously made Course and Daily
  counts look complete. The dashboard now labels the sample and reports possible
  older drafts even when the sampled pending count is zero. The loopback
  Chromium regression reproduced the bug on #383 and passed with the repair,
  including recovery below the caps. The change is web-only. Revert the PR to
  roll back. Full historical totals would require a separate authorized count
  path, since the existing lists remain bounded.
- Next: complete required PR CI and exact-production verification for the dashboard
  fix. Then verify or repair the authoritative dashboard aggregates. In parallel
  with owner-gated acceptance, identify which remaining trophies have eligible
  server-side evidence. Keep unsupported awards unavailable.

#### Strict completion snapshot at verified #383

Each row is one equally weighted workstream. Credit implementation only when
the planned application path exists. Accept a row only when all its production
criteria are verified. This snapshot scores 8/13 implemented (62%) and 0/13 fully
accepted. Partial live and fixture outcomes are credited as evidence below.

| Workstream | Implementation and test evidence | Production evidence and remaining acceptance |
| --- | --- | --- |
| Dashboard | Partial. Feed isolation and refresh tested; bounded historical counts remain. | Normal owner read/refresh accepted on #377. Verify authoritative totals and recovery after release. |
| Courses | Implemented. Exact revision, owner and failure gates tested. | Hosted v17 previously matched main. Owner access verified; live independent review and publication acceptance pending. |
| Daily generation and delivery | Partial. Schedule, quotas, drafts and private diagnostics exist; live structured generation failed. | v16 generator and v2 private test hosted. Owner quota confirmation and successful private validation first; approved bank and schedule preserved. |
| Newsletter | Implemented. Subscription, approval, no-email lifecycle and recovery tested. | Registered-owner readiness passed. Controlled delivery and resulting receipts pending. |
| Admin chatbot | Implemented. Quota, rejection and response fencing tested. | Hosted v9 previously matched main. Authorized provider reply and limit acceptance pending. |
| Reviews | Implemented. Moderation and confirmed-write recovery tested. | Released. Genuine owner moderation and recovery acceptance pending. |
| Code controls | Implemented. Queue, cancellation and exact proposal evidence tested. | Released. Privileged queue, approvals and safe stop need authorized acceptance. |
| Admin mobile, keyboard and isolation | Implemented. Real Chromium fixture coverage exists. | Locked admin gate observed live. Full signed-in cross-desk acceptance pending. |
| Market data and portfolio | Partial. Protected execution, persistence and recovery tested; traditional quote freshness and entitlement unresolved. | Historical guest trade smoke passed. Verify fresh coverage and registered trade/leaderboard lifecycle. |
| Beginner journey, Arena and leaderboard | Implemented. Journey, persistence, ranking and consent controls tested. | Historical public read included opted-in zero-trade profiles. Complete real registration and return journey. |
| Trophy Cabinet | Partial. All 20 designs; 11 evidence sources. | Nine evidence producers, durable awards, public opt-in and withdrawal remain. |
| Certificates | Implemented. Issuance, correction, repeat PDF, verification and withdrawal tested in isolation. | Web native release and certificate v2 parity confirmed. Complete authenticated production lifecycle. Sinhala/Tamil certificate names are supported; full site translations and a language selector are outside the currently agreed scope. |
| Final release assurance | Partial. CI and native production match #383. | Remaining acceptance and final integrated security, privacy, usability and policy review are open. |
