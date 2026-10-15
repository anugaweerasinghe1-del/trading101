# Exact collector job-workflow claims — approval required

Current main `00da10459f5e9747ff200cf2657043464b1cacec` is fully released:
canonical Cloudflare `068eecbd-db54-46b4-b570-d33f437e169f`, production/main/success,
native readiness job `116348741808`, run `38712645105`; Vercel active production
`dpl_3ZseCKwNMHxKSUHxHQe2qxJwW8kZ` is READY for that SHA. Main CI and PostgreSQL
`38712644441` passed. Five public routes match immutable Cloudflare HTML and
About/Daily/Learn render in Chromium without exceptions.

The owner-approved #150 timestamp compatibility fix passed real token-time
validation in collector `38710928531`, job `116341807764`, at 09:11:21 UTC on
15 October. The probe then explicitly reported **BLOCKED** at
CLAIM_SCOPE/noReusableWorkflow. GitHub supplied job-workflow claims, and the
released guard rejects their presence regardless of their values. Neither those
values nor any token was exposed. This establishes the failing predicate, not
that the actual values already match the proposed replacement.

GitHub documents `job_workflow_ref` and `job_workflow_sha`. Its public example
contains `job_workflow_ref` without `job_workflow_sha`; no optional claim's
absence should stand in for an exact identity binding. Primary contracts checked
15 October 2026:
https://docs.github.com/en/actions/reference/security/oidc and
https://docs.github.com/en/actions/concepts/security/openid-connect .

This proposal keeps the legacy case with both job claims absent. If a job ref
is present it must equal this repository's exact existing trusted collector:
`anugaweerasinghe1-del/trading101/.github/workflows/tradehq-verified-evidence.yml@refs/heads/main`.
Any supplied job SHA must equal the signed source SHA, already bound to signed
workflow SHA and independently read protected current main. A SHA without a ref,
foreign owner/path/workflow/ref, mismatched SHA or null claim fails closed.
This is not general reusable-workflow trust. All other repository/owner IDs,
signature/issuer/audience, subject, strict 60-second issuance freshness,
workflow/run/attempt/running collector job, pagination and main-reread checks
remain. Every action-authority flag remains false.

The probe adds only claim **types** for these two fields to its existing privacy
diagnostics. Actual RSA-signed tests accept the exact self ref with/without its
matching SHA and deny foreign, incomplete, changed or null bindings. End-to-end
probe fixtures verify the same behavior and private-value omission. The 66-case
adversarial suite preserves every previous denial except the specifically
proposed exact-self optional-claim form. These are isolated fixtures, not real
identity acceptance or an ML outcome. A native VERIFIED report is still required
after an approved release; green workflow/optional-step status alone is invalid.

Specific owner approval of the final tested head is required before merge because
this changes signed-token authentication acceptance. Approval would cover only
this exact collector binding and read-only probe, not production worker
activation, control schema/grants/trust, code writes, owner approval, merge or
release authority. PR #151's replay/claim adapter remains disposable-only and its
SQL stays outside migrations. A read-only production observation at 09:26:16 UTC
confirmed the new receipt table absent, worker stopped/generation0, zero candidates
and approval receipts. Daily attempts2/exercises0, two published banks and the
16:14:33 UTC cooldown remain intact. No generation request was made.

The original rubric remains **32/42**. No genuine identity acceptance, worker
operation, confirmed repair or trained model is claimed by this proposal.
