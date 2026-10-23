> Release update, 23 October 2026: [PR #219](https://github.com/anugaweerasinghe1-del/trading101/pull/219) merged at `0e72e8ccc10b24f8f8523e97474bb0b6e9f22d57`. Native production and scoped public verification passed. Any held/unmerged wording in the original preparation note below is historical. See the [release ledger](../RELEASE-LEDGER.json) for exact receipts.

# THQ-011: sector breadcrumbs covered by fixed navigation (P3)

Actual production screenshot review shows sector breadcrumbs drawn behind the fixed navigation. Normal-TLS browser measurements confirm all seven sector routes at all five widths:35states, overlap32.34–69px. Root cause: shared SectorPillar starts its main content with32px top padding while navigation is fixed above it.

Use112px main top padding, preserving existing bottom spacing and all content, asset prices, metadata and links. This is a reversible interface-only correction; no financial logic, accounts, records, privacy, ads or dependencies change.

New compiled regression fails the old app at the breadcrumb/navigation bounds assertion. Candidate Cloudflare build and complete phase-six suite pass, including seven sectors ×five widths and existing About/legacy/niche checks. An initial helper measured before navigation CSS settled; its failure is preserved separately and is not treated as an app finding. The final guard waits for actual fixed-position CSS/fonts before retaining the exact rectangle assertion.

Evidence: SECTOR-HEADER-BEFORE.json and sector-header-before-1280.png. Fresh actual preview and trusted exact-head CI must be recorded separately before release; no production release claimed. Rollback is an ordinary reviewed revert of padding and regression, no data rollback. Release remains held by Cloudflare native authentication401 and required serial production verification. This is a usability issue, not a claimed specific Google Publisher Policy violation.
