# On-demand trusted evidence collection

Independent draft based on main 0a31f949bfcbe6f03becc27d63ee4f688c082ed7, 11 October 2026, with no code imports or overlapping edits from CI prerequisite draft #98 or planning draft #97. Operational collection requires the three unique CI gates proposed by #98; legacy ambiguous build names cannot satisfy it. Merge ordering remains owner-controlled; #95 is untouched.

## Implementation

scripts/agent-trusted-evidence.mjs retrieves evidence using GET only. It does not call Gemini, change code, write issues/branches, approve, merge, deploy or access Supabase. No new workflow, schedule, npm dependency, service or permission is added.

Each existing monitor logs one bounded producer record after its existing report operation. It includes repository ID/name, run ID/attempt, immutable checkout SHA, issue ID/number/update time, body digest, observation time and coverage counts. The producer verifies the persisted body and actual checkout. Existing URL checks, Chrome routes, reporting and failure behavior are preserved. No extra provider request or issue write is introduced.

The collector requires:

- Explicit verified main, monitor SHA and run ID. Monitor source must be on main history, on the expected workflow/repository, with a completed current attempt from registered workflow ID `379806172` from push/schedule/manual execution on main.
- Exactly one open bot report per monitor, one completed source job from the attempt-specific jobs endpoint, whose success/failure matches the attested failure count, and one matching attestation in that job's trusted logs.
- Exact body digest, source SHA, repository, run/attempt and issue bindings. Observation/update/attestation times must fall within the source job, with a one-second end tolerance for GitHub timestamp precision. Maximum age is 30 hours; future tolerance is one minute.
- Reviewed coverage: 352 route URLs and 12 Chrome routes, matching the audited inventory. A changed inventory requires deliberate review; reports cannot choose their own threshold.
- Complete bounded pagination: 100/page, at most five pages, unique IDs, consistent totals, consecutive trusted next links. Full array pages without a total or next link are ambiguous and rejected.
- Trusted Pages success on the target SHA, matching Cloudflare App ID/slug and exact account/project/deployment identity. Actions and Worker results are separate records. Worker dependencies remain unverified.
- Normal Phase 3 success from the registered workflow/repository and correct push-main or exact PR context. All three unique GitHub Actions checks must be successful, unambiguous, match its current check suite and fall within its current attempt. CI and Pages must be under 24 hours old. The reusable Cloudflare job needs no separate workflow run; any recognized separate compatibility run is also checked. Output records only the latest recognized runs.
- Re-reading main, source run/attempt/jobs, reports, target CI/check collections and optional PR head/base. Changes block the packet.

Budget: at most 50 HTTP GETs and 120 seconds, 15-second response timeout, bounded body/log sizes. No retries after quota/auth/server failures. Credentials stay in headers for api.github.com and are stripped for the trusted one-time Azure log redirect. Redirect URLs/tokens are never saved or printed.

Output contains IDs, SHAs, counts, digests, normalized public findings and limitations. Raw reports/logs, private messages, IPs, cookies and credentials are not output. Every authorization flag is false. Saved JSON remains an assertion until re-collected/corroborated; it is not signed approval or a release credential.

## Invocation

After independently verifying main and the monitoring run:

    node scripts/agent-trusted-evidence.mjs \
      --run VERIFIED_RUN_ID \
      --monitor-sha VERIFIED_MONITOR_COMMIT_SHA \
      --main VERIFIED_CURRENT_MAIN_SHA

For a same-repository open proposal, also supply --target VERIFIED_PR_HEAD_SHA --pr PR_NUMBER. The collector verifies base against main and re-reads the PR. Do not put a token in arguments or create/expand scopes. Existing connected read access may retrieve logs; if local public API access is insufficient, report it rather than acquiring privileged credentials.

Default route inventory is fixed at 352. Do not lower it to make a report pass. Default `--purpose healthy` still rejects any failed monitor run. `--purpose diagnosis` accepts only completed success/failure runs with both complete, attested reports. Every monitor job outcome must match its failure count; the run outcome must match whether any report failed. Cancelled, skipped, timed-out, missing, truncated, contradictory or edited evidence still blocks. Source jobs must fall inside the current run attempt. Target CI and Pages must still be successful: diagnosis is not a bypass for failing release checks.

The diagnosis mode returns normalized symptoms, deterministic categories and a next read-only reproduction check. It distinguishes rate-limit responses, missing titles, delivery, rendering and unknown failures. It protects auth, portfolios, trading, leaderboards, reviews, courses, Daily and admin routes. All current findings remain HIGH risk, root cause unverified and proposalAllowed:false. Current monitors do not establish an eligible low-risk About typography defect; they never trigger a model or patch. Every authorization flag stays false. Use `--purpose diagnosis` with the same verified IDs/SHAs; no issue/branch/PR write, schedule or extra provider request is added.

## Legacy and deployment boundaries

Latest inspected real monitor run 38067464608 predates attestations. Its issue counts/job results are historical observations that cannot satisfy this collector. No digest is manufactured for old reports and no successful production collection is claimed. First accepted live collection needs owner-approved code on main and a subsequent normal monitor run. No scan was dispatched or model called for this draft.

The Pages check proves provider-reported success, not custom-domain mapping, authenticated functionality, account quota headroom or rollback eligibility. Environment is explicitly not_verified_by_provider_dashboard. Worker dependency resolution remains an owner release blocker. The collector cannot authorize release from an Actions summary alone.

Main is currently unprotected. A producer-log digest protects against issue edits, not a compromised workflow/repository writer/provider. Review monitor source/commit and activate separately approved protection before wiring evidence to side effects. Digest binding does not prove root cause.

## Tests and ledger

node scripts/verify-trusted-evidence.mjs executes the real GET reader against intercepted responses. Positive fixtures demonstrate both monitors and same-repository PR binding, with all authorization flags false. Adversarial cases reject malformed/edited/duplicate reports, missing/conflicting attestations, contradictory failures, wrong identities/attempts/SHAs, stale/future timestamps, changed heads/jobs/checks, missing CI, untrusted Pages and pagination gaps. Tests also prove request caps, size limits, no retries on 401/403/429/500, stripped redirect credentials and private-sentinel omission.

Tests run through the existing verify-ai-agents.mjs invocation, not a new schedule/job. Existing repair/triage/monitor tests remain required. Production-equivalent build/SEO and exact draft-head CI/Pages preview evidence are recorded in the PR.

Production main, database, provider settings and AdSense remain unchanged. The baseline stays 17/42 until production evidence justifies a change. This implements a prerequisite, not autonomous repair or 100% operation.

Sources: https://docs.github.com/en/rest/actions/workflow-jobs and https://docs.github.com/en/rest/using-the-rest-api/using-pagination-in-the-rest-api .

## Follow-up validation

Added fixtures prove complete attested route/browser failure collection only in diagnosis mode, default rejection, job/run outcome consistency, registered workflow ID, source-attempt time windows, unchanged false authorization, protected-route escalation and private-data omission. Diagnostic output is constructed in memory immediately after collection. No external JSON file is upgraded to trusted evidence or owner authorization.

Official free-tier documents were checked on October 11: GitHub standard hosted runners are free for public repositories; Pages Free allows 500 builds/month and one concurrent build; Pages Functions share Workers quota; Gemini active rate limits and billing status depend on the actual project. Account-level build-cycle usage and Gemini quota/billing were not verified. This draft adds zero model calls and no paid service or fallback. Sources: https://docs.github.com/en/actions/concepts/billing-and-usage , https://developers.cloudflare.com/pages/platform/limits/ , https://ai.google.dev/gemini-api/docs/rate-limits , https://ai.google.dev/gemini-api/docs/billing .
