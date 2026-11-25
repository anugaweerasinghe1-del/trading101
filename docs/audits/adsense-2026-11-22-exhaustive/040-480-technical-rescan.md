# Historical 480 technical-route re-crawl — 22 November 2026

The earlier initial-HTML live crawl artifact captured 366 URLs (163 current publisher pages and 203 noindex surfaces), based on 357 older HTTP seeds and current anchors. It did not recheck every route from the 14/15 November 480-URL technical inventory.

This audit-only change adds all 480 rows from the original queue as discovery inputs, validates their row identity and uniqueness, and then individually fetches current public HTTP status. Public profile URLs are inspected by HEAD only; member names, bios and profile bodies are not stored in reports. Community user-generated content is redacted. All earlier statuses are historical evidence only. A removed profile or changed path is a dated observation, not an automatic Google policy violation.

The current live report must record the actual observed denominator, which can differ from 480 when additional links are discovered. HTTP checks alone do not establish original authorship, hydrated accessibility, image rights, full block attestations, account approval, or native Cloudflare deployment SHA. No account sessions, simulated orders, ad activation, form submissions or provider writes are authorized.

The first test of the 480-seed branch returned 78 public-profile HTTP HEAD 404 results and one expected probe GET 404; that is not evidence that 78 profiles are missing. Updated the profile check to try a status-only GET when HEAD is non-200, explicitly cancelling its response stream without processing a body, and to record both the HEAD and GET statuses. Remain unable to claim actual public profile content review.

The independently inspected rerun artifact from 45009451513 confirms 480 observations: 479 HTTP 200 and one intentional /missing-adsense-audit-probe HTTP 404. All 78 public-profile GET fallbacks returned HTTP 200 without body capture; HEAD alone returned 404. The intentional missing route is now explicitly classified as a successful negative test, not a site error; a changed unexpected status would become a problem.
