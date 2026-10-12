# Phase 7: retained CI jobs after a partial rerun

PR #125 main is `b7a133dc2511aab8dcf47cd25e99d3000f7cfbd9`.
Phase 3 run `38267867290` succeeded on attempt 2 after its release-readiness job was retried. GitHub changed `run_started_at` to `2026-10-12T15:19:40Z`, but retained the three successful required validation jobs from 15:07–15:09 UTC. Trusted-evidence run `38268120705`, attempt 2, still failed at collection.

Replaying authenticated connector responses and producer logs through the original collector reproduced `Required check does not belong to the current CI attempt.` The patched collector accepted the same captured snapshot. This is a local reproduction, not a successful live workflow or release.

The fix reads the complete `filter=latest` jobs collection for the exact successful CI run. Each required check must match one successful job by name, immutable run ID, head SHA and GitHub check-run URL. Creation/start/end times remain bounded and fresh, and check/job times must agree within GitHub's one-second precision. The jobs collection is re-read along with main, reports, producer jobs, checks and CI runs to reject concurrent changes. Existing App identity, suite, workflow, branch, event and outcome gates remain mandatory. Two bounded read-only collection calls are added; request limits, credentials and permissions remain unchanged.

Regression cases cover retained successes, missing/duplicate jobs, wrong runs/SHAs/check links, failed/skipped/incomplete jobs, time mismatches, stale/malformed creation times and collection races. Existing monitor attestation and no-authority tests remain in the normal CI suite.

No Supabase, financial behavior, authentication, model call, schedule, billing or production recovery change is included. No additional maturity point is claimed.

Release remains blocked until current Cloudflare production environment and commit binding can be independently inspected, then the fix passes exact-head CI and previews, is merged, and its own production deployment and trusted-evidence workflow are verified. A successful Cloudflare GitHub check alone is not dashboard production-environment proof. The current dashboard session redirects to sign-in.
