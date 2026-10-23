# THQ-018: separate summary and chart snapshots lack an explanation

Severity: P3. Display context on public instrument pages with a practice summary.

On 23 October, an anonymous browser on `/trade/amzn` showed the summary's
negative 1.2% beside a chart quote of positive 3.10%. After a refresh, the
chart showed negative 0.09% while the summary still showed negative 1.2%.
Both said simulated, but the summary did not explain the distinct snapshots.
The dated 22 October capture also showed opposite signed changes.

`AIReadySummary` describes its supplied asset snapshot. The chart reads its
quote independently. This change adds a short explanation of that distinction.
It does not synchronize, recalculate or change either value. It is a display
clarification, not a claim that quote generation or financial execution is wrong.

Affected surface: the summary component on authored instrument pages. Verify
Amazon and representative stock/crypto summaries at mobile and desktop sizes.
Required CI and previews must pass at the final candidate SHA. Release through
the normal protected workflow, then verify native Cloudflare/Vercel production
at the exact merge SHA and check public pages and guest navigation.

No price source, chart series, trading calculation, fee, account/progress record,
auth, database, privacy/consent or ad behavior is changed. Rollback is a reviewed
revert of this paragraph; no data rollback is required. This is not asserted to
be a Google Publisher Policy violation.
