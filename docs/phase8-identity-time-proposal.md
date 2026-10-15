# GitHub not-before compatibility — approval required

Current released main is `fc1e42ee09249243c3ae000f30eba73b588e2088`.
Cloudflare canonical production/main/success is
`b5a36d22-45d3-4f46-a9c0-8efc8f9ae7ca`, independently verified by native
readiness job `116203018649`, run `38667370016`. Vercel active production
`dpl_4AmiEKUnPaGwXsG398DmSwyy8vyV` is READY for the same SHA.
Post-release scan `38667658411` checked 352 URLs with zero issues; its twelve
browser routes had zero findings. Ideas generation was skipped.

Collector `38667849392`, job `116203778621`, reported **BLOCKED** with diagnostic
`TOKEN_TIME` at 01:52:27 UTC on 15 October. It found no verified site incident;
learning still reports insufficient history and zero confirmed repair outcomes.
The report deliberately contains no token or time-claim values. It establishes
the rejection stage, not the exact failing time predicate or verified root cause.

An independently reproducible protocol incompatibility exists in that stage:
the released verifier requires `nbf >= iat - 30`. GitHub's current public example
has `nbf=1632492967`, `iat=1632493567`, `exp=1632493867`: not-before is ten
minutes before issuance. Source checked 15 October 2026:
https://docs.github.com/en/actions/concepts/security/openid-connect . These are
published example timestamps, not captured production claims or credentials.

This proposal permits that documented 600-second offset and nothing earlier.
It still requires integer time claims, reached not-before, unexpired token,
issued-at no later than now and less than 60 seconds old, expiry after issuance
and at most 900 seconds afterward. Principal validity still ends at the earlier
of signed expiry and issued-at plus 60 seconds. Fixed predicate-name diagnostics
make any remaining time rejection distinguishable without exposing values.

Disposable RSA-signed tests accept the documented offset and reject 601 seconds,
noninteger/string not-before, future not-before/issuance, stale issuance and
excess lifetime. All signature, issuer/audience, repository/owner, subject,
protected current main, workflow/run/attempt/job and authority checks remain.
The existing credential destinations, output privacy and default-disabled
factory modes remain. No workflow permission, database grant or production
worker is added. No genuine live acceptance is claimed for this proposal.

Release requires the owner's specific approval because Phase 8 explicitly
requires approval for authentication/security changes. The earlier #135 approval
covered its exact head; this change alters a signed-token acceptance condition.
After approval, required exact-head checks and previews must pass, the merged
SHA must be verified on canonical Cloudflare and Vercel, and a fresh real
collector must explicitly report VERIFIED before identity acceptance is claimed.
Any further failure remains blocked. Production repair-worker activation,
control trust/grants and repair/release authority still require separate approval.
The original rubric remains **32/42**.
