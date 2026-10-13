# Authenticated incident feedback and diagnosis

This change extends the existing GET-only trusted evidence cycle. Each cycle
re-collects current monitoring evidence and computes fixed investigation advice.
The existing handoff log durably records verified public symptoms; these are not
verified causes. Native owner feedback may suppress advice but cannot authorize
model calls, patches, draft PRs, merges, releases or production writes.

## Feedback contract

An optional owner-authored issue named `[TradeHQ Agent] Investigation feedback`
holds single-line owner comments in this format:

```text
TRADEHQ_INVESTIGATION_FEEDBACK_V1 {"evidenceRunId":123,"jobId":456,"monitorRunId":789,"candidateId":"repair-v1-<24 hexadecimal characters>","evidenceDigest":"<64 hexadecimal characters>","action":"INSPECT_BROWSER_RENDER_EVIDENCE","outcome":"reported_failed"}
```

The reader authenticates the fixed repository and owner ID using native GitHub
API fields. Each retained comment binds to an actual handoff from the existing
trusted workflow, its current attempt, collector job, main-history commit,
executed handoff step, timestamp and evidence digest. A local digest alone is
never evidence authentication. It rejects edited, future, conflicting,
malformed, excessive or changed evidence. Another author's comments are ignored.
Reported outcomes are `reported_failed`, `reported_rejected` or
`reported_success`; all remain `OWNER_REPORTED_UNVERIFIED`. There is no supported
`verified_success` or root-cause assertion. An owner report of success cannot
promote advice or confirm a repair.

No journal is created automatically. A missing journal means an explicit empty
history; a referenced journal or log that is unavailable fails the cycle. The
reader does not write issues, fetch private user records or accept free text as
instructions. The transport is a public repository: include only the listed
structured fields, with no credentials, customer data or private diagnosis.

## Bounds and behavior

The existing memory engine suppresses failed/rejected advice for the same fixed
category and route for thirty days and applies a twenty-four-hour attempt
cooldown. A report of success receives no ranking boost. Unsupported symptoms
and dynamic routes abstain. All suppressed choices produce abstention.

The journal is bounded to 100 comments, 100 records, 64 KiB of memory and twelve
referenced evidence runs, with a dedicated maximum of 96 read requests. The
collector's default remains 50 requests; history retains the same two-minute
deadline, response limits and complete re-reads. This lets the trainer reach its
ten-distinct-run minimum without lowering that minimum. Exceeding bounds fails
explicitly; it does not silently
drop negative feedback. Native comment and run timestamps control retention.
Full bounded pagination and re-reads detect report edits, reruns and branch
movement during collection. Historical job logs must remain available; repository
log deletion or expiry stops retrieval. This is bounded GitHub-backed history,
not an independent tamper-proof database or a complete forensic audit.

The workflow retains its existing read-only permissions, schedules and timeout.
No dependency, database migration, grant, paid service or additional model request
is introduced. Missing history never grants repair authority. A verified incident
continues to fail the evidence job visibly even when advice is suppressed.

## Verification and current limits

Run `node scripts/verify-incident-feedback.mjs` and
`node scripts/verify-incident-memory.mjs`. The existing AI-agent gate includes
both. Four isolated authenticated-GitHub transport replays repeat zero failed
recommendations, and 33 adversarial cases reject identity, timing, digest,
step/run/attempt, conflict and race failures. The original six memory scenarios
also remain passing. These are synthetic fixtures, not fabricated production
incidents or measurements of model accuracy.

This integration performs no model training. It does not independently reproduce
a root cause or verify a repair outcome. Statistical learning still needs permitted
independently labeled examples, held-out evaluation and a conservative abstention
policy. Durable production repair controls, live owner identity, constrained
patch generation and final merge authorization remain separate work.

The existing 29/42 score is unchanged pending an exact-head external demonstration
and reassessment against the original fourteen-capability rubric. No production
deployment or external demonstration is claimed by this document alone.
