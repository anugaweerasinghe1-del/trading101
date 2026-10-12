# Owner-gated release and recovery

This runbook performs no release, rollback, settings change or database operation. The approved integration sequence is #98, #99, #100, with fresh verification after each merge. Every changed head requires a new explicit owner approval; batch consent does not authorize stale heads or skipped production checks.

## Before requesting approval

Record the exact PR head and current main, changed paths, local tests, production-equivalent build, successful current GitHub Actions run/attempt and all three required check IDs. Record the Cloudflare App's exact-head Pages check and immutable deployment UUID. Independently inspect the provider deployment: correct account, `tradehq-preview` project, preview environment, commit SHA and successful final stage. Inspect home, About, courses, Daily, auth, trade and admin rendering, unknown-route 404, preview noindex and production www canonical. Public previews do not prove authenticated operations.

Resolve Worker routes, service bindings, scheduled/queue triggers, external consumers and traffic separately. A failed Worker build is not a failed Pages deployment, but unresolved dependencies must not be called safe or unused. Keep the Vercel apex redirect. Confirm current Pages build-cycle headroom and account plan; provider documentation limits do not prove account usage. No paid fallback or model call is part of release validation.

Record the current known-good Pages **production** deployment UUID and full SHA, verify it belongs to this account/project and is rollback eligible in Cloudflare, and preserve its tested route behavior. The UUID from a successful preview is never a production rollback target. Capture configuration differences; frontend reversion cannot undo Supabase migrations, provider settings, secrets, bindings or DNS. These three drafts do not install SQL or change those settings.

Approval must identify PR number and full head SHA, tests, preview UUID, unresolved risks and the verified recovery target. A changed base requires compatibility review and fresh checks; a changed head invalidates consent. Do not activate branch protection, SQL controls, new schedules or model access with code-merge consent.

## After a specifically approved merge

Merge only the authorized unchanged head after re-reading main, PR, CI and provider evidence. Record the actual resulting main SHA; it may differ from the PR head under squash/rebase/merge. Wait for a **production** Pages deployment tied to that resulting SHA. Verify provider account/project/environment, deployment UUID, successful stage and live www routes/SEO. Verify relevant functionality with approved isolated test data where available; do not alter real users or balances.

Stop before another merge if deployment identity, environment or live behavior fails or remains unknown. A green PR preview or a Vercel deployment cannot substitute for Cloudflare production success. Existing monitoring may run after approved producer changes; do not interpret skipped/incomplete reports as healthy or release approval.

## Recovery decision

If production fails, preserve the exact failure/deployment evidence and stop further merges. Present the owner with the failing production UUID/SHA, known-good eligible production UUID/SHA, provider-setting compatibility, verification plan and expected effect. Obtain separate rollback approval before the provider operation; this runbook grants no authority to conduct a real drill.

For these offline/CI drafts, a reviewed revert PR is also possible; it needs fresh CI/Pages preview and explicit release approval. Check-name changes require coordinated, separately approved branch-protection changes. Never bypass protection or assume a code revert reverses account settings. After any approved rollback, verify the provider's resulting production identity and live routes before resuming work.

## Current evidence limits

On October 11, 2026, main remains `0a31f949bfcbe6f03becc27d63ee4f688c082ed7`. The drafts have preview evidence; none is released. Current provider-dashboard access, production rollback eligibility, Worker dependency inventory, account build-cycle usage and authenticated regression environment still need verification. No real rollback drill has been performed.
