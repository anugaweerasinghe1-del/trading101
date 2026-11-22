## Technical public URL re-crawl — PII minimization

This probe uses only read-only GET requests for public educational content and HEAD metadata checks for opted-in trader-profile routes. Public profile names, bios and other user-provided text are deliberately excluded from its persisted evidence; profile path names are represented by SHA-256-derived pseudonyms. The review log also redacts user-generated bodies on review, leaderboard and challenge screens. Those paths get **technical metadata/status coverage only**, not editorial/content coverage.

The script discovers production sitemap URLs, known public route seeds and safe links. The report-only run produces exact HTTP and canonical observations with errors/warnings, without triggering account flows, ad scripts, real or simulated orders, form submissions or provider-side changes. A successful initial-HTML crawl cannot confirm hydrated UX, current code commit, media rights, Google account approval or Google policy compliance.

The PR-triggered workflow `adsense-live-sitemap.yml` uploads the resulting per-URL report. The status denominator is whatever the current tool actually observes, and may differ from the historical 480. Historical observations from 14 November remain distinct. Do not claim all 480 were freshly checked until the new report contains the actually fetched statuses.
