# Phase 8: genuine GitHub identity observation

The owner approved the read-only probe at PR #135 head
`577c60ed6292074d4dbfa0dd79cb30518590607b`. It was merged as
`7d24c42ec4c9110fac41b3865be3d73593a9abb8` on 15 October 2026.
Native readiness job `116200103369` confirms Cloudflare project
`tradehq-preview`, production/main/success, deployment
`9b2337b5-d9aa-4017-b3ae-bc6c00bf1e0a` for that exact SHA.
Vercel production `dpl_BGCMuQZScJiotSL2ZZib5a9KE4r4` is READY for the same SHA.
Main CI `38666465190`, PostgreSQL `38666465132`, monitoring `38666465134`,
five public/immutable HTML comparisons and three hydrated Chromium routes passed.

The real collector run `38666638368`, job `116199983031`, reported
`TRADEHQ_GITHUB_IDENTITY_PROBE_V1` **BLOCKED** at 01:38:47 UTC. Required
check/run/attempt/workflow/source claims had string types. This proves neither
signature acceptance nor identity acceptance. The collector's overall success,
and the optional step's success conclusion, do not override the explicit report.
The separate handoff reported no verified incident; statistical learning still
abstains on insufficient history, with zero confirmed repair outcomes.

The follow-up adds private, fixed-enumeration rejection diagnostics. Scope
failures expose only hard-coded predicate names; other failures expose only a
hard-coded verification stage. Transport errors cannot supply these values:
only an error branded in the verifier's private WeakMap yields a diagnostic.
No token, claim value, exception, key or credential is returned. Actual signed
fixture tests cover private subject values and attempted error-field injection.
Every existing acceptance predicate and authority denial remains enforced.
There is no workflow/permission change, retry, new credential, production worker,
database installation, replay/action grant, approval, merge or release authority.

The original rubric remains **32/42**. A genuine VERIFIED native observation is
still required before proposing any operational worker/control integration.
Even that observation alone would not demonstrate production worker recovery or
earn repeated-operation credit. The production control plane remains stopped.
