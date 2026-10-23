# THQ-011: sector breadcrumbs covered by fixed navigation (P3)

Actual production screenshot review shows sector breadcrumbs drawn behind the fixed navigation. Normal-TLS browser measurements confirm all seven sector routes at all five widths:35states, overlap32.34–69px. Root cause: shared SectorPillar starts its main content with32px top padding while navigation is fixed above it.

Use112px main top padding, preserving existing bottom spacing and all content, asset prices, metadata and links. This is a reversible interface-only correction; no financial logic, accounts, records, privacy, ads or dependencies change.

New compiled regression fails the old app at the breadcrumb/navigation bounds assertion. Candidate Cloudflare build and complete phase-six suite pass, including seven sectors ×five widths and existing About/legacy/niche checks. An initial helper measured before navigation CSS settled; its failure is preserved separately and is not treated as an app finding. The final guard waits for actual fixed-position CSS/fonts before retaining the exact rectangle assertion.

Evidence: SECTOR-HEADER-BEFORE.json and sector-header-before-1280.png. Fresh actual preview and trusted exact-head CI must be recorded separately before release; no production release claimed. Rollback is an ordinary reviewed revert of padding and regression, no data rollback. Release remains held by Cloudflare native authentication401 and required serial production verification. This is a usability issue, not a claimed specific Google Publisher Policy violation.
