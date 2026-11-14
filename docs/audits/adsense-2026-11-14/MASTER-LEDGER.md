# TradeHQ AdSense audit — 14 November 2026

This is the current continuation of the established [October URL ledger](../../adsense-2026-10-18/TradeHQ-URL-Remediation-Ledger.json), [October closeout](../../adsense-2026-10-21/Part-1-Final-Closeout.md), and [external account gates](../../adsense-2026-10-31/external-gates-and-contact-activation.md). Historical fixes stay in those records; do not renumber or reopen them without current reproduction. This directory is the authoritative November continuation, not a replacement history.

Google supplied a generic site-readiness rejection, according to the owner's request. No specific Google finding or approval probability is inferred. Public URL assessment and THQ-ADS-001 remediation are complete within the evidence below. External account and authenticated owner acceptance gates remain blocked; no AdSense approval or comprehensive professional certification is claimed.

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
- Fix: removed executable global ad loader; publisher meta/ads.txt retained. Updated shared rendered/static privacy copy to explain disabled serving and future approval/consent gates. Added source/compiled HTML and approved dynamic-course serving regressions.
- Regression tests: [pre-fix assertion fails](evidence/ad-bootstrap-failing-test.txt); [prepared HTML shells deny serving](evidence/ad-bootstrap-build-pass.txt); [full Cloudflare build and mandatory postbuild gates pass](evidence/ad-bootstrap-cloudflare-build.txt); [safe disposable course workflow](evidence/course-workflow-pass.txt) and [published-course fixtures](evidence/course-editorial-pass.txt) pass. `tsc --noEmit` exits 0. The separate local Chromium regression passed 636 compiled visits and retained interaction assertions; live verification is recorded below.
- PR / merge SHA: [#428](https://github.com/anugaweerasinghe1-del/trading101/pull/428), merged 2026-11-14 08:57:24 UTC as `2707aa2dc63eface2122e5e9a766453b48dd4350`; tested PR head `64a3b3bf110041e5e48c20acc83ecc86da232d67`. Required checks and exact preview passed; GitHub accepted the normal protected merge without bypass.
- Cloudflare deployment / active SHA: production `0ef04ca4-9713-4301-9f6c-3479e30156ba`, active `2707aa2dc63eface2122e5e9a766453b48dd4350`, success, confirmed by authenticated native CI at `2026-11-14T09:09:18.726Z` in [job 132399981648](https://github.com/anugaweerasinghe1-del/trading101/actions/runs/43578225186/job/132399981648). Provider extract and full checks are in the evidence archive.
- Post-deployment verification: all 480 discovered URLs fetched and navigated; 960 desktop/mobile viewport observations, all without ad loader, uncaught application exceptions or measured horizontal overflow. 479 final HTTP 200 and one expected controlled 404. Six real Tab steps per URL. A separate live smoke passed mobile keyboard menu/primary-link navigation, desktop navigation and zero observed ad-network requests. A later 81-URL / 162-viewport public-data recheck passed with 322 HTTP 200 Supabase responses and no blocked public API reads; authenticated owner acceptance remains THQ-ADS-003.
- Status: VERIFIED FIXED ON PRODUCTION for the advertising bootstrap defect. Discovery was published in commit `863af5ea` before correction. Account approval, regional consent and actual placements remain external verification gates.


## THQ-ADS-002 — External Google account and future serving verification

| Field | Recorded assessment |
| --- | --- |
| Discovery / severity / category | 2026-11-14 / High readiness gate / external account verification |
| Fingerprint / URLs / component | `adsense-account:approval-consent-unobserved`; whole site; Google account/CMP, no source defect asserted |
| Expected / actual | Account holder confirms eligibility, ownership, current site status and exact message; those account screens were not available in this session. The owner's supplied request states only a generic rejection. |
| Reproduction / evidence | No authenticated AdSense session or account tool was available. Compare the owner's mission with the established October external-gates record and current policy mapping; no Google reason inferred. |
| Policy / classification | Eligibility and applicable consent guidance in POLICY-MAPPING.md. BLOCKED verification, not confirmed policy violation. |
| Root cause / related records | External account access and publisher decisions; [existing gates](../../adsense-2026-10-31/external-gates-and-contact-activation.md), not a duplicate site repair. |
| Correction / original failure | Owner reviews actual account state. No account or CMP settings, age assertions or applications changed. Original failure is missing account evidence, not a failed product test. |
| Tests / PR / merge | NOT TESTED in account; N/A site repair PR. THQ-ADS-001 keeps serving disabled while these remain unknown. |
| Deployment / live verification | No account deployment applicable. Global serving exclusion independently verified on `2707aa2d`, Pages `0ef04ca4-9713-4301-9f6c-3479e30156ba`. |
| Final status / limits | BLOCKED: account eligibility/current Google message, traffic and invalid-activity checks unknown. Applicable certified CMP and placement settings must be verified before enabling ads; they are not invented universal prerequisites to requesting site review. |

## THQ-ADS-003 — Authenticated acceptance; public-data coverage gap resolved

| Field | Recorded assessment |
| --- | --- |
| Discovery / severity / category | 2026-11-14 / Medium coverage gate / live feature verification |
| Fingerprint / URLs / component | `audit-public-post-reads:followup-proxy-503`; Daily, Reviews, Leaderboard/public profiles; authenticated admin/account flows |
| Expected / actual | Read-only public POST queries should be allowed by the collector. The original safe collector denied Daily bank/review totals/public trophy reads and observed their fallback behavior. After source inspection the narrow allowlist was corrected; follow-ups first returned 503 before application HTML. On recovery, all 81 affected public URLs were successfully rechecked at both widths with 322 observed Supabase HTTP 200 responses and no pending or denied Supabase reads. |
| Reproduction / evidence | Workspace curl, Node fetch, Chromium and git transport all received proxy `upstream connect error ... remote connection failure`; headers/body and failed follow-up observations are in `production-audit-evidence.zip`. Hosted CI independently confirmed public release routes and production providers at 09:09 UTC. This supports an environment-access limitation; it is not evidence that production is down. |
| Policy / classification | No confirmed violation or new site defect. Public-data follow-up coverage VERIFIED after recovery; authenticated owner acceptance remains UNVERIFIED. Advertising exclusion remains independently verified. |
| Root cause / related records | Initial test allowlist omission, followed by workspace access failure; actual origin root cause UNKNOWN. Existing owner acceptance in issues #406 and #335; course-integrity history #321. Do not manufacture new fixes from those historical reports. |
| Planned correction / pre-fix evidence | Corrected source-inspected collector rerun successfully, paced below the public trophy rate limit. Original blocked requests and 503 statuses retained alongside the success record. Perform owner-led authenticated walkthrough separately; no production patch justified. |
| Tests | Safe isolated course owner/review/database/browser workflows passed. Public course snapshots (3 courses, 9 lessons) validated and matched dynamic sitemap. These do not prove live backend revision or owner workflow acceptance. No account created, course published, email sent or model called. |
| PR / merge / deployment | N/A independent production repair. The verified ad repair is #428 / `2707aa2dc63eface2122e5e9a766453b48dd4350` / Pages `0ef04ca4-9713-4301-9f6c-3479e30156ba`. |
| Post-deployment / final status | PUBLIC-DATA GAP RESOLVED; all 81 follow-ups had clean runtime/layout/ad-exclusion observations and no pending reads. Mobile keyboard More/About navigation also passed. BLOCKED only for live authenticated owner/admin/learning/publication acceptance; fixtures do not establish actual owner sign-off. Both original failures and later success evidence are retained. |

## Reconciliation and evidence use

[all-pages.csv](all-pages.csv) has one record per discovered URL, with source component, category assessments, evidence and explicit limits. [Evidence summary](evidence/audit-summary.json) supplies reproducible counts. Raw captures, text and collectors are packaged in [production-audit-evidence.zip](evidence/production-audit-evidence.zip); archive paths in the CSV locate each observation. Its manifest hashes every member. Dates/timestamps are observations, not newly fabricated editorial review dates.

127 indexable pages have exact main-text matches to the older evidence; 36 changed/new indexable texts were read. 279 matches cover the broader inventory but do not turn short noindex shells into complete financial-content reviews. Of 473 initial browser URLs, 472 contained the loader; certificate verification already excluded it. Final verification covered the entire 480-URL superset.

Old overlapping PRs #3, #7 and #23 remain open. Their changed paths/index patches were inspected; no competing implementation of this advertising-bootstrap fix was found. They are not authorization to merge historical changes, and their entire broad scope was not declared superseded or closed. Existing course/journey/consent fixes and open owner acceptance were linked rather than patched again. No concurrent new main change was observed before this repair merge; scheduled proposal automation remains governed by its own controls.
