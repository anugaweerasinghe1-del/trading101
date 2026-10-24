# TradeHQ independent operations audit — 11 October 2026

Read-only baseline: main `0a31f949bfcbe6f03becc27d63ee4f688c082ed7`, fetched directly and re-fetched before preparing this document. Evidence collection began around 04:26 UTC (09:56 Asia/Colombo). This draft records evidence and proposed controls; it grants no permission to merge, release, alter provider settings or modify production data. PR #95 is unchanged.

## Verified checkpoint and evidence limits

- [PR #96](https://github.com/anugaweerasinghe1-del/trading101/pull/96) is merged at the baseline SHA; head was `a78457bc0f3c5e39fc3d297eb1c636de728daa82`. [PR #93](https://github.com/anugaweerasinghe1-del/trading101/pull/93) is merged at `b027427e9df707b202e702b71e35d8dfaa35bbd8`.
- [Post-merge Phase 3 validation](https://github.com/anugaweerasinghe1-del/trading101/actions/runs/38111263133) succeeded. #96 head runs `38110393550` and `38110393572` also succeeded.
- Cloudflare's trusted **Cloudflare Pages** check succeeded for the baseline SHA, deployment `08b81cc2-79ec-4a39-8052-fa34498b32a1`. Its [deployment URL](https://08b81cc2.tradehq-preview.pages.dev/) serves HTTP 200 with an HTTP noindex header.
- Separate **Workers Builds: thetradehq** failed for that SHA, build `049db287-6eda-4003-a4b3-c5c314714a7f`. This is a different service from Pages.
- Vercel connector reports production `dpl_9ky3Ts5ms5ZShDWtXYggKeKeDMeL` READY for the exact baseline SHA. Previous production `dpl_ED94iDS2cFPPcFkPmYgofGNEjUfU` is READY for the previous main SHA, but it is not marked a rollback candidate. A production query with `rollbackCandidate=true` returned no deployments. READY alone does not prove rollback eligibility.
- [PR #95](https://github.com/anugaweerasinghe1-del/trading101/pull/95) remains open/draft at `0eac3e02ac2bb486106ebf5a59c037b5730e8253`. [Agent run](https://github.com/anugaweerasinghe1-del/trading101/actions/runs/38108465551) has successful propose, verify and confirm-pr-created jobs. Its normal PR runs `38108482504` and `38108482596` are **action_required**, not successful. Independent verify checks out a mutable branch name, and run metadata uses the triggering base SHA.
- Other open PRs are #72 (draft), #23 (non-draft), #7 (draft), #3 (draft), #1 (draft). Older overlapping branches require reconciliation before any release; none was modified.
- GitHub's main branch response reports `protected:false`, protection disabled, required-status enforcement off. Ruleset list is empty. Detailed protection endpoint returns integration 403; the conclusion comes from the readable branch/ruleset responses.
- Cloudflare dashboard redirects to sign-in. AdSense account chooser is signed out. Vercel team-plan lookup returns scope 403 and no Vercel CLI is installed. Account usage, Cloudflare bindings and the current AdSense decision are therefore unverified.

## Live hosting and public checks

HTTP checks passed for /, /trade, /markets, /courses, /daily, /leaderboard, /reviews, /auth, /contact, /admin, /admin/ai and /learn. ads.txt, robots.txt and sitemap.xml return 200; an invented route returns 404 with noindex and no canonical. Auth's HTTP shell is noindex; sampled authored public pages retain www canonicals. The ads.txt publisher record matches the loaded advertising script. This does not prove AdSense approval or regional CMP behavior.

The home screen, trading terminal, Daily scenario/case-study screen, courses, login form and locked AI Development Desk rendered in the browser. No sign-in, form submission, trade, practice answer or admin unlock was performed. This is public rendering evidence, not authenticated end-to-end verification.

**Topology correction:** https://thetradehq.com/?audit=20261011 returns a Vercel 308 preserving the query string, then reaches the Cloudflare-served www site. Vercel remains necessary for the observed apex redirect until an explicitly approved routing change. Do not disconnect it based on the Pages migration alone.

The public main JavaScript bundle is `/assets/index-Cqo-dRwy.js`; it matches the local baseline build and references production Supabase `cbdktpjgczhthflspqjb`. This is consistency evidence, not proof of every deployed server revision. Cloudflare dashboard evidence must still bind the custom domain to the exact production deployment.

## Capability inventory

| Capability | Evidence-backed state | Limit |
| --- | --- | --- |
| Public monitoring | Implemented/deployed; latest [run 38067464608](https://github.com/anugaweerasinghe1-del/trading101/actions/runs/38067464608) completed scan/browser/triage; [#75](https://github.com/anugaweerasinghe1-del/trading101/issues/75) reports 352 URLs/0 failures; [#74](https://github.com/anugaweerasinghe1-del/trading101/issues/74) reports 12 browser routes/0 failures | Reports are dated 10 October. Daily 03:17 UTC schedule exists; inspected runs do not demonstrate a new 11 October scheduled scan. Scheduled start times are not guarantees |
| Recurrence triage | Actual successful job; issue-only writes, no code/model/release path | Older failure issues and bounded lists need stronger provenance/completeness checks; symptom recurrence is not diagnosis |
| Portfolio refresh | Production cron active every five minutes; function version 5 active; latest state finished 04:30:04 UTC with 52 requested, 51 updated, 1 unavailable | Successful scheduler enqueue is not successful quote retrieval; results and observation age must be checked separately |
| Course drafting | Active daily 03:30 UTC scheduler; deployed version 7; two October slots are draft_ready with 1 and 3 attempts; two published CMS courses exist | Latest completed generation is 9 October. Future monthly cycle unproven. Stored model is gemini-3.5-flash, outside the current configuration writer's gemini-3.8-flash / gemini-3.5-flash-lite choices; availability and free eligibility need reconciliation |
| Course notices | Existing published-course polling and browser storage implementation | No newly published-course/once-per-user behavior tested in this audit; browser-local dismissal is not account-wide persistence |
| Daily Practice | Active daily 03:45 UTC scheduler; deployed version 2; two published 50-exercise batches effective 9 October; screen renders | State: enabled, next_due 9 December, attempts 0, no last_started/last_finished, 0 generated exercises. Future generation is scheduled but not proven. Answers are browser-local |
| Monthly ideas | Workflow, October issue #69 and prior manual demonstration exist; first-of-month schedule | Current source has a newer two-pass review. No fresh model call or next monthly execution tested |
| Owner coding proposals | Draft #95 and three successful independent jobs demonstrate one request | Normal exact-head PR validation remains blocked; mutable checkout reference and no durable stop/attempt budget |
| Offline repair review | Merged code and adversarial local/CI tests; tiny About typography/spacing allowlist; all action-authorization flags remain false | Inputs are assertions; no trusted collector, live approval service, diagnosis, automatic code writes or release capability |
| Admin/release evidence | Locked desk renders; exact-SHA/workflow-path/trusted-Pages evaluator passes local tests | No authenticated dashboard interaction or server-side owner approval bound to a commit |
| Newsletter | Source only; absent from deployed Edge Function list and cron jobs | No delivery operation. Legacy source uses Lovable gateway/Resend, lacks consent/dedup/unsubscribe controls; remains inactive |
| Authenticated regressions | Local backend SQL/PGlite tests cover account isolation and mutation rules | No browser → auth → live persistence → response test or disposable test environment verified |
| Production protection, release stop and rollback | Missing enforcement/integration; design below only | No unattended release readiness |

All seven deployed live-market-data files and all four deployed course-generator files were compared byte-for-byte with baseline repository source and match. Production Supabase reports ACTIVE_HEALTHY, organization Free/tier_free, and database size 17,544,883 bytes. Read-only catalog checks found no public ordinary table with RLS disabled and no public SECURITY DEFINER function executable by anon. These narrow checks do not replace a complete security audit.

## Market-data 429 diagnosis

The deployed live-market-data function produces HTTP 429 when its **local** rate limiter denies a request, before provider calls. Limits: global 100/10s, 300/minute, 10,000/day, plus advisory-IP 25/10s and 90/minute. Upstream failures currently become unavailable/simulated responses rather than forwarding provider HTTP 429.

Read-only counters: global daily bucket has 18,305 attempts for 10 October and 59 for 11 October. Counts include denied attempts, not 18,305 successful quotes. Retained function logs from 10 October 08:00 through 11 October 04:30 UTC show yesterday's sampled GETs returning 429, then today's 59 GETs returning 200. This strongly supports daily local cap exhaustion and midnight recovery. It does not identify who created the earlier demand, prove all earlier 429 causes or measure monthly billed usage. The initial wider end-time query included no future requests; the follow-up fixed-window query corroborated today's counts.

Existing client protections are real: one shared market_prices REST read, 120s quote / 300s candle caches, concurrent promise deduplication, cross-asset cooldown after 429/503, bounded Retry-After and visibility-aware hooks. The older hybrid hook has a direct request path but has **no callers** in current source; do not blame unused code for production demand.

Gaps to investigate without changing financial behavior: concurrent different assets can launch before the first cooldown response; cache/deduplication is per browser instance; traditional provider requests are not protected by a verified shared upstream daily budget. Scheduled refresh considers at most two traditional instruments per five-minute lease, which can mean 576 upstream attempts/day before interactive requests. Alpha Vantage's ordinary free allowance is 25/day; an educational/open-source exception must be verified, not assumed. CoinGecko requests are keyless and share IP-based upstream limits. Polygon plan/key eligibility is unknown. Do not increase limits, polling or switch providers.

## Cost gates

| Service | Verified public allowance / account evidence | Missing proof |
| --- | --- | --- |
| GitHub | Public repository, standard ubuntu-latest jobs; standard public runner usage is free | Actual cache/artifact storage and budget settings; no new schedule or artifact service added |
| Cloudflare | Public Free limits: 500 builds/month; Workers/Pages Functions 100,000 requests/day and 10ms CPU/request | Actual plan, current build usage and account-wide Function usage; static success does not prove headroom |
| Supabase | Account reports Free; public allowance 500,000 function invocations/month, 500MB database, 5GB egress plus 5GB cached egress | Billing-cycle invocation totals, egress, storage/MAU/log usage; bounded logs, including OPTIONS records, do not establish billable invocation totals |
| Gemini | Flash-Lite allowlist, no paid model fallback, bounded JSON retry; pricing lists free Standard Flash-Lite use | Billing disabled and actual model/project RPM/TPM/RPD headroom. Quotas are per project, not per key. free_confirmed is an owner assertion, not provider billing evidence |
| Market data | Keyless CoinGecko paths; configurable Polygon/Alpha Vantage; bounded scheduled batch | Account plans, quotas, licenses and any verified Alpha Vantage exception |
| Vercel | Exact production deployment READY | Actual plan/usage and proven rollback eligibility; still serves apex redirect |

No new model calls, provider changes, schedules, permissions, DNS edits or production writes were performed. Free plans can change. Quota uncertainty blocks expanded automation; reduced scope is the default, never an upgrade.

## Production branch-protection design — owner approval required

**Do not activate as-is.** Public GitHub Free supports branch protection, but two current workflow jobs share the name `build`. Cloudflare offline compatibility is path-filtered and can be absent for a docs-only PR; requiring it globally would block valid PRs.

1. Prepare a separate approved control-change PR: give both validation jobs unique stable names; make required validation report for every main-targeted PR, including documentation-only changes; explicitly fail a final always-running gate unless all necessary jobs actually succeed. Preserve contents:read validation and generation/release credential separation. Do not change token scopes, auto-approve bot runs or use pull_request_target.
2. Prove those check identities on ordinary and bot proposals before configuring protection. A bot token may suppress normal PR events; action_required must stay blocked until the owner approves eligible workflow execution through GitHub. Do not dispatch or approve #95 without separate instruction.
3. Proposed main policy: require a PR, current successful uniquely named Phase 3 gate, current successful Cloudflare compatibility gate and trusted Cloudflare Pages check; require branch up to date and resolved conversations; disallow force push/deletion and apply protections to administrators. Auto-merge remains disabled. Require actual successful conclusions manually as well: GitHub can consider skipped conditional jobs acceptable.
4. This personal repository has one owner. Do not require an approval the PR author cannot provide to their own owner-authored PR. An independent review requirement needs an identified second reviewer and separate approval. Until then owner consent references the exact head SHA in the release record; it is a procedural requirement, not claimed server enforcement. Inspect actual collaborator access before promising exclusive-owner merging.
5. Treat the Worker as a separate unresolved dependency. Do not permanently exclude its failure from the owner's release decision until account bindings/triggers/external callers are checked. Requiring it today would block all releases; omitting its check is not proof of irrelevance.
6. Validate protection with a disposable unmerged draft: missing/failed/pending/action_required/stale checks must block; docs-only and bot PRs must report the right gates; branch changes invalidate evidence. No test merge or production release is authorized.
7. Recovery uses a conventional fix/revert PR through the same gates. Never bypass CI/protection or broaden credentials for convenience. Provider rollback requires separate explicit owner approval and the deployment eligibility checks below.

## Worker dependency and recovery plan — not executed

Repository search found no separate Worker entrypoint, wrangler configuration, workers.dev caller or service binding. The repository's Cloudflare functions belong to Pages; GitHub jobs compile Pages functions and do not deploy the separate Worker. The public bundle contains no workers.dev host. No inspected cron target calls a Worker.

Owner's dashboard observations (no domains/routes, bun frozen-lockfile failure and npx wrangler preview) are relevant historical evidence, not independently verified account state. The repository tracks package-lock.json and Bun lockfiles; a stale Bun lock can explain install failure but was not reproduced here.

Obtain Worker Routes/Custom Domains, Triggers (cron/queues), Bindings, deployed version/entrypoint, workers.dev traffic metrics and build settings; also inspect reverse bindings from other services and external webhook callers. Empty routes alone does not prove zero consumers.

If all consumers are absent, propose owner-approved disconnection of redundant Git auto-build integration first, preserving the Worker/version for recovery and observing traffic before deletion. If required, first correct only the verified installation/build configuration for its actual runtime. Aligning to npm ci may solve this install symptom; it does not make a Vite site into a Worker. Do not use an unverified npx wrangler preview command as a release path. No settings change is included in this draft.

## Evidence, stop, tests and rollback sequence

- First code candidate after a specifically approved control design: an on-demand, GET-only trusted-evidence collector using existing repository access; no model, issue write, schedule or release permission. Bind repository ID, immutable base/head SHA, run ID/attempt, workflow file, report issue ID/update time/body digest and provider deployment ID/SHA. Reject failed source jobs, stale/future data, pagination gaps, edited/mismatched reports and main changes. A local digest alone is not authentication or owner authorization; corroborate records outside generation and never accept AI-provided evidence as authority.
- Durable stop/attempt design: default stopped if missing/unreadable; server-side atomic claim, one open candidate, one attempt per candidate, at most one proposal/24h; explicit owner reset with audit reason. Concurrency alone is not a daily budget. Stop must be rechecked before every side effect. Keep code proposal consent separate from exact-SHA production authorization. Store no credentials or personal telemetry in public issues. A protected policy location and approval design are needed before implementation.
- Auth regressions: use existing offline account-isolation/lease/replay tests now. Propose browser tests only for an owner-designated disposable non-production environment and dedicated accounts. Supabase branching is not included in Free; do not create billed branches. Never reuse real users or production trading data.
- Rollback runbook: record Pages project, current successful **production** deployment ID/SHA/domain mapping, previous eligible production deployment and Vercel apex configuration. A preview is not a Pages rollback target. Rehearse verification against an existing prior deployment without promotion where feasible; a real production rollback/restore drill requires explicit approval specifying target and recovery deployment. Static code rollback does not undo Supabase function/schema/data changes.
- After any approved release: verify exact merged SHA and deployment binding, critical HTTP routes and public rendering, authenticated flow only where authorized, quote observation status and error rates. Stop on regressions or quota uncertainty. No rollback or release drill occurred here.

## Progress rubric and priorities

Evidence stages: 0 absent/unverified; 1 implemented and tested offline; 2 demonstrated externally once; 3 repeatedly demonstrated operationally with relevant limitations acknowledged. Score equal-weight maintenance capabilities, not number of agents or PRs.

| Capability | Stage |
| --- | ---: |
| Public HTTP/browser monitoring | 3 |
| Recurrence reporting | 2 |
| Scheduled portfolio refresh | 3 |
| Course draft/publication pipeline | 2 |
| Daily bank/persistence/regeneration | 1 |
| Monthly ideas | 2 |
| Owner code proposal workflow | 2 |
| Offline repair review | 1 |
| Trusted independent evidence collector | 0 |
| Enforced production protection/approval | 0 |
| Durable repair stop/attempt budget | 0 |
| Authenticated browser regression automation | 0 |
| Eligible demonstrated production rollback | 0 |
| Verified ongoing quota governance | 1 |

17 of 42 evidence-stage points gives a rough **40%** maturity indication under this rubric. It is not a measured percentage of work automated. Reasonable uncertainty is roughly 35–50%, especially around external account evidence and future scheduled cycles; the earlier 45–55% estimate is not independently established. No percentage overrides missing release controls. An 80–90% score by 24 October is not currently substantiated.

Priority 1: approve/review branch-protection prerequisites and immutable validation binding; activate settings only after explicit approval and proven check behavior.
Priority 2: obtain provider usage, Worker dependencies and rollback evidence; finish demand attribution for market limits and verify course model configuration.
Priority 3: implement the GET-only evidence collector after approved design, then durable stop/attempt controls and disposable authenticated regressions. Keep unattended releases and newsletter delivery disabled.

## Local validation and draft status

Baseline tests passed: offline repair/triage, mocked Gemini JSON/no-paid-fallback, AI scope/release evidence, provider quote/refresh/rate-limit/shared-request regressions, course workflow, Daily Practice and backend SQL/PGlite invariants. No test used a real Gemini key or changed production data.

The normal npm build command encountered this executor's tsx IPC EPERM. Equivalent ordered prebuild → Vite → prerender → sitemap → SEO → Cloudflare preparation steps executed successfully through node --import tsx; 349 prerendered routes, 147 indexable, 202 noindex. Cloudflare SEO and course-root tests passed. Existing bundle-size/Browserslist/Tailwind warnings remain. This does not claim the failed npm command passed.

This draft changes this documentation file only. Remote draft-head CI/Pages preview must be recorded in the PR after they finish. Nothing in this draft is merged, released or newly verified in production.

## Primary documentation checked

- https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches
- https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/troubleshooting-required-status-checks
- https://docs.github.com/en/billing/concepts/product-billing/github-actions
- https://developers.cloudflare.com/pages/platform/limits/
- https://developers.cloudflare.com/workers/platform/limits/
- https://developers.cloudflare.com/pages/configuration/rollbacks/
- https://supabase.com/pricing
- https://supabase.com/changelog.md
- https://ai.google.dev/gemini-api/docs/pricing
- https://ai.google.dev/gemini-api/docs/rate-limits
- https://www.alphavantage.co/support/
- https://docs.coingecko.com/docs/errors-and-rate-limits
