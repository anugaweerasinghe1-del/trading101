# Release evidence

Baseline main: `01f338cfb2140f75dc61db09433e84e9d6d74bf6` (PR #427). [Required branch checks](evidence/baseline-main.json) enforce three checks for everyone. Direct full protection API returns 403, so no assertion about unexposed review settings.

[Exact baseline checks](evidence/baseline-checks.json) pass. Cloudflare Pages deployment `29642090-0653-42c0-978f-21ff466325c6` is reported successful. Job [132328867629](https://github.com/anugaweerasinghe1-del/trading101/actions/runs/43555054797/job/132328867629) contains authenticated provider observation at `2026-11-14T04:18:47.791Z`, confirming canonical production SHA and successful status. Direct API access from this workspace returned 401; use trusted read-only CI observations and distinguish their timestamps from current live behavior.

The following receipt supersedes the initial pre-repair baseline.

## THQ-ADS-001 production release

- Discovery commit `863af5ea` was published before implementation; correction head `64a3b3bf110041e5e48c20acc83ecc86da232d67`.
- PR [#428](https://github.com/anugaweerasinghe1-del/trading101/pull/428), normal protected squash merge `2707aa2dc63eface2122e5e9a766453b48dd4350`, 2026-11-14 08:57:24 UTC. All required checks passed on the exact PR head; branch protections were not bypassed.
- Exact preview `1e30afe5-e6df-449a-8800-ec5d6eb0c2fb`, with 12 actual preview route/status/canonical/exclusion observations.
- Cloudflare native active production `0ef04ca4-9713-4301-9f6c-3479e30156ba`, successful `main` SHA `2707aa2dc63eface2122e5e9a766453b48dd4350`; independently confirmed in hosted job [132399981648](https://github.com/anugaweerasinghe1-del/trading101/actions/runs/43578225186/job/132399981648) at 09:09:18.726 UTC. Direct workspace Cloudflare API had returned 401; the native CI observation is the successful source, not an inferred merge/deployment equivalence.
- Vercel native active `dpl_5RNvVGZeCWPeXHW7pPEqQkbhPrr3`, READY production alias `thetradehq.com`, same merge SHA.
- Live custom-domain 480 URL / 960 viewport measurements, 08:58–09:04 UTC, verify no loader, no uncaught application exceptions and no measured horizontal overflow. Known negative probe 404 is expected; raw crawler's single unexpected-status flag is explicitly adjudicated, not suppressed.
- All raw observations, PR-head checks, preview receipt, provider extracts, matching hashes, source collectors and limitations are in [production-audit-evidence.zip](evidence/production-audit-evidence.zip). The archive manifest hashes each contained member. [audit-summary.json](evidence/audit-summary.json) provides counts without claiming Google approval.

The documentation-only continuation uses the normal protected PR workflow. Its final merge/deployment receipt belongs in that PR's description, linked by the final delivery, rather than inventing a future SHA in this commit. No product code changes are included in that continuation. The repair's exact production SHA above remains the behavior-verification reference.

After workspace access recovered, 81 source-inspected public-data URL follow-ups / 162 additional viewports passed, with 322 observed Supabase HTTP 200 responses, no denied Supabase reads or pending requests, and no runtime/ad-loader/overflow failures. The successful follow-up did not discover another URL. The archive preserves both earlier blocked observations and later success. Keyboard More/About navigation also passed. The application source remained the verified #428 release; this adds evidence, not a product repair.
