# TradeHQ independent audit — remediation and verification log

## 2026-11-21 — Scope and baseline
- Reviewed the actual TradeHQ repository, main commit, open PRs, recent workflows, source-based routes, old audit ledger, and the live production website; limited scope to TradeHQ.
- Retrieved both production sitemaps and deduplicated **163** distinct published URLs. Archived explicit review status per URL.
- Extracted live text and title/canonical/robots metadata on each: first 50 OK; second 50 OK; third batch 40 OK plus 10 rate-limited; follow-up recovered the 10 and the remaining 13 OK. The intermediate failed batch remains archived, not retroactively erased.
- Independently viewed 30 selected page topics in preliminary screen only; explicitly did not stamp them as professionally fact-checked or fully reviewed.
- Reviewed applicable official Google AdSense program/publisher/eligibility and guidance. No new confirmed Google policy violation established.

## 2026-11-21 — THQ-IND-20261121-001 direct-entry route defect
- **Observed** `/learn/trade-review` direct production URL returned 404 while `/auth`, `/portfolio` and other routes returned rendered content; deliberately invalid URL also 404.
- **Reproduced in code**: React route exists and linked by Trade/Portfolio, but is missing from `scripts/routes.ts`, Functions `include`, and client fallback allowlist. The exact missing static route is a credible direct-entry 404 root cause. No account needed to confirm.
- **Challenge and alternative**: Could enlarge Pages Functions allowlist and SPA fallback, but this would unnecessarily broaden a protected runtime surface. Narrow static noindex route generates appropriate direct-entry HTML and keeps personal content out of sitemap.
- **Implemented in branch** `audit/adsense-independent-checkpoint-20261121`: added one scoped `noindex` route manifest entry; regression ensures a built HTML file, noindex robots, canonical and sitemap exclusion.
- **Known test status at creation**: build/PR CI pending. Previous main build/test success does not verify this patch. **Do not close** until live Cloudflare direct-entry checks after actual merge and deployment, plus no regression.
- No trading engine, simulated P&L, user profile, authentication, ad-serving, or database data changed.

## 2026-11-21 — Release and security read-only checks
- GitHub run [44918093531](https://github.com/anugaweerasinghe1-del/trading101/actions/runs/44918093531) confirms provider-derived Cloudflare live commit `1f71e5d...` and deployment `c6e7b48c-d11b-4b2c-b2c9-f94645e31491` for **pre-patch main**.
- GitHub run [44918093574](https://github.com/anugaweerasinghe1-del/trading101/actions/runs/44918093574) has passed required app/Cloudflare CI with failed *read-only Vercel release signal*; missing Vercel status is not a Cloudflare outage. Direct authenticated Vercel API confirmed matching repo/project and no deployment record for main SHA.
- Read-only Supabase security advisor reported leaked-password protection disabled and some privileged function execution WARNs. Inspected function definitions using metadata-only SQL; public trades require two explicit opt-in booleans and cap 20 entries; signed-in exports/snapshots use `auth.uid()`. No direct tables or personal user data were queried. RLS/no-policy INFO is not proof of exposure.
- No Gmail Cloudflare deployment email found in searched recent window; do not use email absence as evidence of failed deployment.
- Owner's actual AdSense account/country/CMP eligibility and production authenticated acceptance remain **BLOCKED**. No account or third-party settings altered.

## Release journal
| Stage | SHA / result | Interpretation |
| --- | --- | --- |
| Starting main | `1f71e5dec8e38ef4346f666ca4ade888b83572de` | Provider-derived Cloudflare production verified; not audit patch |
| Code change to route manifest | `3eb49fa8234ed7862a082b23f24eb1aece804564` | Code only |
| Regression test change | `4468fddd7cb11432978b8b5ce27cc37a2fe195e3` | Test code only |
| Audit docs | Separate commits on same branch | Not a site code deployment |
| PR / merge / deployment for patch | Pending | Never infer success before checks |

## Next checkpoint
Open PR; examine branch checks and required reviews; only merge on green evidence and no conflicting changes. Then verify production direct visit and noindex status for `/learn/trade-review`; update finding status to `VERIFIED_PRODUCTION` only if exact SHA and live behavior correspond. Continue wider audit without claiming historical 480-URL work as independent re-review.
