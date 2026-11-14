# Release evidence

Baseline main: `01f338cfb2140f75dc61db09433e84e9d6d74bf6` (PR #427). [Required branch checks](evidence/baseline-main.json) enforce three checks for everyone. Direct full protection API returns 403, so no assertion about unexposed review settings.

[Exact baseline checks](evidence/baseline-checks.json) pass. Cloudflare Pages deployment `29642090-0653-42c0-978f-21ff466325c6` is reported successful. Job [132328867629](https://github.com/anugaweerasinghe1-del/trading101/actions/runs/43555054797/job/132328867629) contains authenticated provider observation at `2026-11-14T04:18:47.791Z`, confirming canonical production SHA and successful status. Direct API access from this workspace returned 401; use trusted read-only CI observations and distinguish their timestamps from current live behavior.

No remediation merged or deployed yet.
