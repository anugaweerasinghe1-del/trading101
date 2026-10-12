# Phase 7: delayed Vercel commit-status verification

Main after PR #126 is `10e3e8a010c6c4d1714eaa6003a3cd573b7a614f`. Required GitHub checks and disposable PostgreSQL passed. Cloudflare's exact-main deployment `8c80d1e0-6fc0-4f98-8bf1-ba587b240a0e` succeeded. The owner's current screenshot establishes Production/main and the www custom domain; the new immutable Pages homepage and www homepage were byte-identical. All nine critical www routes returned 200.

Authenticated Vercel inspection confirms production `dpl_4pkHJhZ68mJrjb6sSg8dCp8jSpkX`, project `prj_PjOhFr0eppPg8hZQhdeBwTniZWOy`, main/that exact SHA, READY. A separate lookup through `thetradehq.com` returns the same deployment. The GitHub commit status remains missing. Readiness job `114901661568` in run `38275765502` failed at 16:18:33 UTC because no Vercel commit status was found; this is not a demonstrated production deployment failure. The email notification references this failed verifier.

## Change

The complete existing readiness gate remains mandatory. Only a missing Vercel status or a pending status on the known Vercel project may wait. Failed, forged, duplicate, wrong-SHA or wrong-provider signals stop immediately. The wait has at most 25 observations, 30-second pauses and a 12-minute deadline inside a 15-minute job. Network/access failures are not retried. Main is checked again during each observation.

When an owner-approved `TRADEHQ_VERCEL_VERIFY_TOKEN` secret is configured, the same protected-main-only job can independently resolve a missing/pending GitHub status through two authenticated GETs to the fixed Vercel apex-alias endpoint. Both observations must match the known project/team, active apex alias, main GitHub repository and exact SHA, production environment, READY state and deployment ID. Changed aliases, stale/imported proof, conflicting source identities, redirects, HTTP errors and oversized responses stop verification. This source never replaces failed required CI, failed Cloudflare or a failing/ambiguous Vercel GitHub signal.

Raw provider JSON and credentials are never output. The API proof is held in process; serialized JSON cannot acquire its trusted marker. The report identifies its evidence source and keeps merge, production release and rollback authorization false. Two management GETs are bounded to 35 seconds. No model, production-data, provider-write, new schedule or paid fallback is added.

Changes to the verification scripts now trigger the existing monitoring producer, so a released verifier change receives current monitoring and trusted-evidence execution. Daily/monthly schedules and existing workflow permissions remain unchanged.

## Owner setup required before live API acceptance

No token was created, retrieved, installed or enabled by this change. Connected Vercel tool authentication cannot be transferred into GitHub Actions. The fallback remains inactive while the secret is absent.

Repairing the existing Vercel-to-GitHub status integration may avoid a new credential. Alternatively, an owner must inspect and approve a minimally scoped, expiring Vercel verification credential and add it directly to GitHub Actions under the name above. Vercel access-token permissions can be broader than read-only: this script's GET-only behavior does not make the credential itself read-only. Do not approve broad account access by assuming its name restricts it. Prefer the smallest available scope for the existing team/project and review any residual permission risk before installation. Never paste tokens into chat or the TradeHQ browser client. No user can enable this fallback through the admin panel or public issue content.

A successful offline test or authenticated connector observation does not demonstrate this GitHub secret-backed adapter operating live. Live workflow acceptance must be recorded after the owner-approved connection is configured. No maturity increment is claimed here.

Primary API contract: https://vercel.com/docs/rest-api/deployments/get-a-deployment-by-id-or-url .
