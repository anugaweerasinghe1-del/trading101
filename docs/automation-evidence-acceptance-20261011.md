# October 11 continuation: evidence acceptance

This dated addendum describes the continuation after PRs #109–#113. Earlier draft ledgers and their approval language describe historical checkpoints. The owner now authorizes routine validated merges and releases, with successful Cloudflare and Vercel verification after each merge. This does not authorize a live rollback, production repair activation, database installation, new model calls or paid fallback.

## Acceptance still requires live evidence

- Daily lifecycle runs against a new disposable PostgreSQL 17 database. The existing SQL and generation lifecycle execute; Gemini, Vault, cron and network dependencies remain mocked. Chromium exercises the built login and Daily UI against a loopback backend, including rejected login, retained session, local sign-out, expired refresh, answer resume and completed-answer locking. No real account or production SQL is changed.
- Recurrence consumes primary reports from the exact monitoring run, binds path and symptom, rejects duplicate or incomplete reports and bounds complete issue pagination. Reruns cannot add observations. It can report a repeated symptom, not establish its cause or authorize a repair.
- The trusted cycle waits boundedly for the three exact-main GitHub Actions validations. Failed or skipped validations, changed main, wrong identities and ambiguous checks stop collection. The independent collector must then revalidate its own complete evidence contract. Waiting does not replace a gate or grant release authority.
- CI validates recovery preflight and rollback/restore observation with synthetic provider fixtures. It checks immutable provider identities, production environments, prior eligibility, configuration fingerprints, fresh plan binding, both active providers and public route samples. No authenticated live Cloudflare adapter is installed. No actual production recovery operation is exercised or authorized; this is Stage 1 offline implementation only, never Stage 2 eligible production rollback evidence.

## Release protocol

Read the current main and PR head. Require exact-head CI, PostgreSQL, Pages and Vercel preview success. Merge with an expected-head guard, record the resulting main commit, and wait for its required CI, PostgreSQL, read-only release-readiness check and both production deployment signals. Inspect critical www routes and the Vercel apex redirect. Do not merge the next capability after a failed or unresolved production release.

## Scoring

Use the original fourteen-capability rubric: 0 absent or unverified; 1 implemented and tested offline; 2 externally demonstrated once; 3 repeatedly demonstrated operationally with relevant limits. Existing verified baseline is 25/42. New code, a synthetic fixture and an in-progress run are not proof of operational acceptance. Record exact runs and release commits before assigning any increment. The ratio measures evidence stages, not the fraction of maintenance performed autonomously.

Production repair activation, automatic merge, automatic rollback, deployed owner approval, provider quota headroom and live recovery drills remain unproven or disabled. No paid service, new schedule, new production credential, model request or financial behavior is added by this continuation.
