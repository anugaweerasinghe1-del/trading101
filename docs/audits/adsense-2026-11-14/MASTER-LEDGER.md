# TradeHQ AdSense audit — 14 November 2026

This is the current continuation of the established [October URL ledger](../../adsense-2026-10-18/TradeHQ-URL-Remediation-Ledger.json), [October closeout](../../adsense-2026-10-21/Part-1-Final-Closeout.md), and [external account gates](../../adsense-2026-10-31/external-gates-and-contact-activation.md). Historical fixes stay in those records; do not renumber or reopen them without current reproduction. This directory is the authoritative November continuation, not a replacement history.

Google supplied a generic site-readiness rejection, according to the owner's request. No specific Google finding or approval probability is inferred. Work in progress; no completeness or readiness certification.

## THQ-ADS-001 — Global advertising bootstrap bypasses inventory denial

- Discovery: 2026-11-14.
- Fingerprint: `index.html:unconditional-adsbygoogle-bootstrap:eligibility-unused`.
- Affected URLs: shared static, dynamic-course, SPA fallback and error shells; representative current responses in [pre-fix evidence](evidence/ad-loader-before.json).
- Source: `index.html:24`, `src/lib/adInventory.ts`, `scripts/prerender.ts`, `src/lib/courseHtml.ts`.
- Severity: High. Category: advertising suitability/control enforcement.
- Classification: confirmed engineering defect and potential policy risk; **not a confirmed Google violation or rejection reason**. Loading a script is not proof of a displayed advertisement.
- Expected: rejected/unapproved site and excluded screens cannot start ad serving; newly approved course publication alone cannot enable ads; eligibility independent of Search indexability.
- Actual: executable AdSense loader is present on `/auth`, `/admin`, `/portfolio`, `/reviews`, an approved dynamic course and a 404 response. `isEligibleAdScreen` is referenced only by its standalone regression script, not by a runtime caller. `noindex` does not prevent the loader.
- Reproduce: GET each URL in evidence, inspect executable script with id `tradehq-adsense`; search production source references to `isEligibleAdScreen`.
- Evidence: [actual HTTP responses](evidence/ad-loader-before.json); baseline source commit `01f338cfb2140f75dc61db09433e84e9d6d74bf6`; [related PR search](evidence/related-prs.json). Original helper added in PR #180 / `e602e4f3`; no open PR for this bootstrap enforcement change found in current PR list.
- Policy: [publisher content inventory](https://support.google.com/publisherpolicies/answer/11112688?hl=en) applies to actual ad placements on unsuitable screens. [Certified CMP guidance](https://support.google.com/adsense/answer/13554116?hl=en) must be checked separately before applicable future serving.
- Root cause: HTML bootstrap executes before React and never evaluates the unused placement helper. Certificate verification is the sole explicit script-removal exception.
- Planned correction: remove executable ad-serving bootstrap while the site lacks verified approval/consent/placement readiness; retain publisher verification meta and ads.txt. Preserve optional analytics choices independently. Require future advertising release to wire reviewed inventory and applicable CMP before enabling requests. Do not change Google account settings.
- Pre-fix test: actual loader present on five HTTP 200 responses and one HTTP 404; see linked JSON. Focused negative regression will be run before editing.
- Fix: NOT IMPLEMENTED.
- Regression tests: NOT TESTED.
- PR / merge SHA: UNKNOWN / NOT MERGED.
- Cloudflare deployment / active SHA: no remediation release yet. Baseline Pages check reports deployment `29642090-0653-42c0-978f-21ff466325c6` for `01f338cfb2140f75dc61db09433e84e9d6d74bf6`; authenticated CI observation at 04:18 UTC confirms that production binding. Direct local provider API returned 401.
- Post-deployment verification: NOT TESTED.
- Status: RECORDED BEFORE CORRECTION. Account approval, regional consent and actual placements remain external verification gates.
