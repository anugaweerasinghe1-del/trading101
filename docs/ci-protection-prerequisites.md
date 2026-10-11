# Immutable CI and production protection prerequisites

Baseline: main `0a31f949bfcbe6f03becc27d63ee4f688c082ed7` on 11 October 2026. This is an implementation proposal, not permission to merge or change repository settings. Audit PR #97 and AI proposal #95 remain separate; #95 is untouched.

## Implemented in this draft

Every main-targeted PR (including documentation and bot proposals) starts Phase 3 with no actor/path filters. Cloudflare compatibility is called once as a reusable read-only workflow. It still performs the existing build, SEO, course-root and Pages Functions compilation checks. No deployment is performed by CI, no secret is inherited and no permissions are expanded. Existing provider integrations produce previews when a draft is opened.

Checks have stable unique names:

| Check | Source |
| --- | --- |
| `TradeHQ Phase 3 tests` | phase3-high-check.yml / phase3 |
| `TradeHQ Cloudflare compatibility / Cloudflare build and SEO` | phase3-high-check.yml calling cloudflare-preview-build.yml |
| `TradeHQ Required validation` | phase3-high-check.yml / validation, always runs after both essential jobs |
| `Cloudflare Pages` | Cloudflare Workers and Pages GitHub App, separately verified |

The final gate requires both upstream results to be exactly `success`, and both checkout outputs to equal the expected full SHA. Missing, skipped, cancelled, pending, unknown, failed or mismatched results fail. It checks its own checkout as well. PR jobs use the immutable PR head; push jobs use the immutable push SHA. The owner's protection policy must require an up-to-date branch because head-only testing does not test a merge against a changed base.

AI proposal generation publishes the base and last written commit SHA. Independent verification checks out that commit, checks HEAD equality and compares scope against the immutable base, which must be its ancestor. A later branch move cannot change what was tested. Proposal verification is not normal PR validation, owner approval or release evidence.

The admin release-evidence evaluator recognizes the new combined workflow, requires all three successful check identities from its current check suite and blocks missing timestamps, older-than-24-hour evidence, mismatches, duplicates and inconclusive outcomes. Trusted Pages success is required separately. Separate Worker status remains visible; missing dependency evidence still blocks an owner's release decision. The evaluator is advisory and does not implement a server-side approval service.

## Validation and limitations

Local adversarial tests execute the real gate CLI and reject malformed needs, every non-success outcome, missing/short/mutable SHAs, wrong checkout and wrong upstream SHA. Parsed YAML tests prove ordinary, docs-only and bot event paths have no filters; they verify least privilege and reusable workflow outputs. Release evaluator tests cover current-suite binding, freshness, reruns, missing checks and trusted Pages independently.

An ordinary live draft proves the configured check names and reusable gate. Full live docs-only and bot-origin tests require the workflow to be on the approved base. They are not claimed complete before that approval. GitHub can suppress built-in-token events or require approval for bot/fork workflows; this draft does not bypass either control and never executes privileged pull_request_target code. #95 is not re-run, approved or modified. No real model call is needed to test gate failures.

No new recurring schedule, API provider or npm dependency is added. Standard public GitHub runners are used. Cloudflare compatibility now runs for docs-only PRs and main pushes, so each such event adds one existing build to GitHub (not an additional provider deployment). Avoid repetitive drafts; account-level Pages build headroom remains unverified. All tests use offline/dummy credentials.

## Exact owner-approved configuration plan

Do not apply settings until the owner approves the exact tested PR head and configuration. Before activation, verify this PR's observed check names against the table, merge only with explicit consent, and complete a new docs-only and disposable bot-origin draft demonstration without invoking Gemini or expanding credentials. A bot workflow requiring approval must remain pending until eligible owner approval; if no safe bot origin is available, report it blocked.

For main: require pull requests; require all three GitHub checks above from GitHub Actions plus Cloudflare Pages from the Cloudflare App; require branch up to date; require resolved conversations; disallow force pushes and deletion; apply enforcement to administrators; keep auto-merge disabled. Choose check sources from observed app identities rather than accepting same-named third-party checks. Inspect collaborator access before claiming exclusive-owner merge rights.

Do not require a self-approval the author cannot provide. Add required independent reviews only after a second reviewer and availability are confirmed. Until a server-side owner approval service exists, record explicit owner release consent against the exact head SHA and re-check current main/head/checks immediately before merging. A changed head invalidates consent. If required evidence is older than 24 hours, obtain fresh validation rather than treating an old green status as release authority.

Worker account routes, triggers, bindings, traffic and reverse/external callers remain unverified. Do not require its known failing check as an unconditional gate before dependency resolution; do not treat its exclusion as proof it is unused. The owner must resolve that dependency before release.

Test settings using an unmerged disposable draft with missing, failed, pending, action_required, stale and changed-head scenarios. Never use a production test merge. Recovery is a reviewed fix/revert PR through the same gates; no bypass, permission expansion or production rollback is authorized here. Reverting code does not automatically revert repository settings, so coordinate any future check-name changes with a separately approved configuration change.

## Evidence ledger

Production remains baseline main. Local gate and release-evidence tests are recorded in the PR. Remote exact-head CI, Pages deployment ID, preview routes/headers and unresolved Worker outcome are recorded in the draft PR body after verification. No production protection or release has been activated. The initial maturity baseline remains 17/42; an unmerged implementation does not establish operational enforcement.

Sources: https://docs.github.com/en/actions/how-tos/reuse-automations/reuse-workflows and https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/troubleshooting-required-status-checks .

## Independent follow-up review

The evaluator now requires numeric GitHub Actions/Cloudflare App IDs, the registered Phase 3 workflow and repository IDs, and checks completing within the current attempt. Pages evidence must identify the exact Cloudflare account, project and deployment UUID. Adversarial fixtures cover same-named impostors, changed account/project/deployment, incomplete identity and checks finishing outside the attempt. This remains a read-only display; it does not verify provider environment, grant owner approval or resolve Worker dependencies. See `docs/release-recovery-runbook.md` for the separate release and recovery gates.
