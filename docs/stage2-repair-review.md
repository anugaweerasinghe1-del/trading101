# Stage 2: issue detection, repair risk and owner review

Status: first offline implementation proposed; no production release or unattended merging authorized. Audited 11 October 2026 against main `b027427e9df707b202e702b71e35d8dfaa35bbd8`.

## Current evidence

| Capability | Demonstrated | Remaining limit |
| --- | --- | --- |
| Public monitoring | Existing daily 03:17 UTC route and browser jobs; latest report run `38067464608`, 352 URLs and 12 browser routes, zero reported failures | Report is from 10 October, not a newly executed 11 October scan. No authenticated transactions or full feature coverage |
| Repeated failure reporting | Existing same-run summary checks, recurrence counters and one bounded review issue | Priority is not repair risk; repeated symptoms do not establish root cause |
| Owner-requested AI proposal | Issue #94 created draft #95; exact requested About H1 class change; all three jobs in run `38108465551` succeeded | Demo remains unmerged. Normal PR workflows `38108482504` and `38108482596` concluded `action_required` |
| Pages preview | #95 head `0eac3e02ac2bb486106ebf5a59c037b5730e8253` has trusted Pages success, deployment `bd861811-ea04-44ba-91f9-3b7fea90e0e6` | Deployment success is not feature verification or production approval |
| Independent proposal tests | Separate read-only job without the Gemini secret; existing build/backend/course/Daily checks | Job run metadata uses the triggering base SHA and checkout uses a branch name. Future release proof must bind the actual checked-out proposal SHA and cannot substitute these jobs for missing exact-head PR workflows |
| Current release evidence UI | Existing exact-SHA/workflow-path/latest-run/Pages evaluator; owner reviews on GitHub | No new approval button, GitHub token, merge endpoint or server authorization added |
| Production release protection | No merge command in either current agent workflow | Latest branch response reports `protected: false`, protection disabled and required-status enforcement off; public ruleset list is empty. Enforced protection and rollback drill are not established; no settings changed |
| Separate `thetradehq` Worker | Continues failing while `tradehq-preview` Pages succeeds | Direct build-dashboard inspection redirected to Cloudflare sign-in. Routes, custom domains, bindings, workers.dev usage and dependency traffic remain unverified; do not disable it |

## Three repair risk levels

Incident severity and change risk are different fields. A blank auth screen may be urgent, but urgency never permits an autonomous authentication edit.

| Level | Required handling | First classifier scope |
| --- | --- | --- |
| LOW | Investigate and prepare a bounded proposal under existing owner authorization; owner approval required for production | One modified existing `src/pages/About.tsx`, at most four changed literal `className` attributes and twelve added/removed spacing or typography tokens. Entire remaining source must be byte-identical. Finding must concern that page's heading/readability or layout |
| MEDIUM | Isolated draft proposal, plain-English risks, preview and independent tests; owner approval required for production | Presentation-only About edits above LOW limits, up to sixteen attributes/eighty changed tokens. This is substantial UI scope, not permission to edit functionality |
| HIGH | Read-only investigation and a specific repair plan; owner permission before code changes and separate production authorization | Every other file/edit/route/unknown symptom defaults HIGH. Includes auth, accounts, user data, calculations, persistence, schema, automation controls, dependencies, secrets, DNS, SEO, AdSense and consent |

This intentionally narrow first allowlist does not expand the existing coding agent. Known learning/functionality changes may later receive MEDIUM classification after a specific approved design; until then unfamiliar scope remains HIGH. Copy, imports, hooks, handlers, JSX structure and metadata are outside the mechanical presentation proof. Adding `hidden`, changing arbitrary CSS or removing existing non-allowlisted tokens is not a LOW change.

## First implementation

`scripts/agent-repair-review.mjs` is an offline advisory reader, not an operational approval service. It reuses the existing recurrence parser without modifying the monitor, triage implementation or workflow files.

- `monitorFindings(snapshot)` reads the two existing bot-authored report summaries from one exact run. It requires one timestamp/run/count per report, a timestamp within 30 hours, valid paths and complete inline failure evidence. Older standalone failure issues cannot fill a current report's evidence gaps. Truncated evidence stops analysis.
- Normalized candidate IDs include source, canonical path and symptom. Duplicate lines and trailing slash aliases deduplicate. Raw failure text is not forwarded into the packet; model instructions or private logs are not accepted as authority.
- `classifyRepairScope(changes)` parses the complete before/after TSX using the existing TypeScript dependency. It removes only literal class values for comparison, verifies that all other bytes match, checks allowed tokens, and classifies the bounded change. This proves source scope, not root cause, visual quality or behavior.
- `buildRepairReview(input)` requires bounded fresh observations, distinct run IDs, base/proposal SHAs and a supplied attempt history. Repeated jobs or reruns within one run count once. Existing, failed or closed attempts for the same candidate block a new attempt. One open repair or another attempt within 24 hours blocks another review candidate. Missing history or an unspecified stop state blocks the assessment.
- An owner-stop input defaults to active. Setting it false enables only offline assessment. It is not yet a live administrator switch or durable frequency enforcement.
- Every packet explicitly returns `codeModificationAllowed: false`, `productionReleaseAllowed: false`, `automaticDiagnosisAllowed: false` and `automaticReleaseEnabled: false`. A LOW label, supplied approval text, successful tests or a caller's quota claim cannot turn these flags on.

The input file is capped at 1 MB and source files at 64 KB. The CLI reads a local regular JSON file and prints a sanitized assessment. It has no network client, model invocation, branch/issue writes, patches, subprocesses or merge/deployment operation. Input metadata remains untrusted assertions; future integration needs an independent collector from trusted GitHub/Cloudflare records. Do not use this output as authorization.

Run the offline tests with:

```sh
node scripts/verify-repair-review.mjs
node scripts/verify-repair-triage.mjs
```

The latter includes the new regression scenarios in the existing credential-free CI step. No workflow permissions or existing assertions are weakened.

Assess an already downloaded snapshot with:

```sh
node scripts/agent-repair-review.mjs --input /absolute/path/snapshot.json
```

For monitor assessment, the JSON envelope is `{ "monitorSnapshot": { "runId": "...", "issues": [...] } }`, with the existing route/browser issue records. No API token is needed. The actual #74/#75 snapshot from run `38067464608` returned zero candidates in the local test; no new scan, model call or GitHub issue was created.

For a proposed repair, pass `finding` (`path`, `source`, normalized `symptom`, `observations` containing `runId` and UTC `observedAt`), `changes` (`path`, `status: "modified"`, complete `before`/`after`), `baseSha`, `headSha`, `ownerStop` and `history` (candidate `id`, attempt `state` and UTC `at`). These are review inputs, not signed owner consent or verified quota evidence. Failure to validate input returns an error and performs no action.

## Approval-gated integration plan — not activated

1. Keep the existing one comprehensive daily schedule and monthly ideas schedule. Do not add hourly scans while provider usage is unverified. Lightweight post-release checks should run once for a successful main/production deployment, deduplicated by commit/deployment ID; workflow wiring needs an approved change plan.
2. Collect immutable run/report, repository/base/head and Pages deployment records outside the generation job. Reject missing pages, truncated API results, stale reports, reused SHAs and duplicate attempts. Store a bounded history with a durable owner reset; do not infer success from an issue title or AI-written body.
3. Reproduce the symptom and confirm cause against the current main before proposing a fix. Two daily observations are useful evidence, not root-cause confirmation. Keep diagnosis disabled unless a meaningful reproducible candidate and actual free quota are verified.
4. Apply the independently maintained allowlist and diff limits before model use and again after generation. Neither model prompts nor an AI-edited policy/test may approve its own patch. The existing generation/verification credential separation must remain intact.
5. Require a draft PR with risk, exact diff, evidence, preview URL, known limitations and rollback reference. Owner approval must refer to that exact head SHA and be invalidated by any subsequent push. HIGH code work needs earlier explicit approval of the specific plan.
6. Require both existing workflow paths, latest completed successful exact-head results, trusted successful Pages preview, read-only preview smoke and relevant feature tests. `action_required`, skipped, neutral, stale, pending, unavailable and partial results stay blocked. Inspect preview environment and exact deployment metadata; a build check alone is insufficient.
7. Prove production branch protection, separation of generation/release credentials and an owner-controlled emergency stop before any release automation. These are high-risk control changes: propose them read-only first. Do not broaden workflow permissions, add a PAT or bypass workflow approval as a convenience.
8. For an eventual opt-in LOW release pilot, propose (but do not enable) a cap of one open repair, one attempt per candidate, one proposal per 24 hours and two production releases per seven days. Stop on any quota uncertainty, failed gate, regression, main/head change or repeated incident. A durable server-side control and audit trail are required; this offline reader does not enforce these limits on existing agents.
9. Record the current successful **production** Pages deployment ID and source SHA before release. Cloudflare permits rollback only to successful production deployments, not previews. The previous known code release `61112c34a147f2986a29530d3ae9d49e80e16829` is an investigation reference, not an automatically executable rollback target. Confirm actual deployed revision and perform an explicitly authorized rollback drill before enabling automatic rollback or release.
10. After any authorized release, verify exact merged SHA and production deployment, read-only critical endpoints, relevant interactions and current monitoring findings. Suspend on failure. Preserve the existing authenticated/user-data workflows; public smoke cannot certify them.

## Cost and account gates

No new provider, dependency, schedule, persisted artifact service or model request is introduced by this draft. Existing standard GitHub-hosted Ubuntu runners in this verified public repository are currently free for execution, but larger runners and storage have separate billing rules. Do not change runner class or retain unbounded artifacts.

Cloudflare publishes a Free plan allowance of 500 Pages builds per month and one concurrent build. That does not reveal this account's remaining builds, Functions/Workers request capacity or paid account settings. Preview integrations can build once on branch creation and again on a code push; keep batches small and avoid repeated commits.

Prior read-only observations in the existing ledger remain dated evidence, not current monthly quota: Supabase Free organization, about 17.4 MB database, and 10 October live-market-data totals of 28,064 HTTP 200 plus 8,083 HTTP 429. The current shared client already deduplicates/caches and honors `Retry-After`; these logs alone cannot attribute demand or prove the backoff is absent. Verify the billing cycle, egress, invocation totals and cause before increasing monitoring or changing provider behavior.

Actual Gemini project remaining daily/model quotas, Supabase monthly usage, Cloudflare account build/request usage, GitHub cache/artifact storage remain account-access checks; production branch protection is not enabled in the latest branch response. Read-only connector requests for repository-wide cache/artifact usage were rejected as unsupported endpoints. No attempt was made to change settings or use privileged billing credentials. No automatic diagnosis can be enabled merely because an API key or free-plan label exists.

A fresh read-only check reconfirmed Supabase organization `combjhkdfhagqexyncpw` as `free` / `tier_free`. Aggregate logs for 10 October 16:30 through 11 October 03:30 UTC showed live-market-data 307 HTTP 200 and 206 HTTP 429, plus portfolio refresh 132 HTTP 200. These are HTTP log counts for a bounded window, not monthly billable invocations; preflight OPTIONS requests are excluded from billed invocation usage under the current Supabase documentation. The recurring 429s still warrant a separate read-only diagnosis and an approved specific change plan. No quota increase or provider behavior change was made.

Course/Daily/portfolio schedules and published snapshots are existing capabilities, not newly activated here. Preserve newsletter inactivity, AdSense review, public content, canonical/indexing policy and consent. No authenticated trading, portfolio persistence, review submission or user preference test is claimed by this batch.

Primary references checked 11 October 2026:

- https://docs.github.com/en/billing/concepts/product-billing/github-actions
- https://developers.cloudflare.com/pages/platform/limits/
- https://developers.cloudflare.com/pages/configuration/rollbacks/
- https://docs.github.com/en/actions/how-tos/manage-workflow-runs/approve-runs-from-forks
- https://supabase.com/docs/guides/platform/manage-your-usage/edge-function-invocations

## Progress measurement

The existing route coverage, successful proposal test and new offline regressions are measurable capabilities. They do not establish an overall automation percentage. Stage 2 integration, owner approval binding, durable stops/caps, authenticated regressions, account quota verification and rollback demonstration remain incomplete. October 24 is the target; unattended production release remains disabled.
