# Recrawl and manual Search Console work

PR #183 was owner-approved and released as `88c1b41` on 18 October 2026. All 147 supplied URLs returned 200 without redirects with matching canonicals; all seven priority URLs below are included. This verifies serving, not Google’s current index. Verify the current production response again if requesting indexing after a later release. Re-submit the existing sitemaps only if needed; do not request indexing for intentionally excluded routes. A request does not guarantee indexing or AdSense approval.

Prioritize the seven discovered-but-not-indexed URLs from the supplied snapshot:

- https://www.thetradehq.com/compare/apple-vs-microsoft
- https://www.thetradehq.com/compare/ethereum-vs-solana
- https://www.thetradehq.com/courses
- https://www.thetradehq.com/courses/futures-and-derivatives
- https://www.thetradehq.com/courses/futures-and-derivatives/hedging-with-futures
- https://www.thetradehq.com/courses/macro-reading-for-traders/the-fed-and-fomc-cycle
- https://www.thetradehq.com/courses/trading-psychology-mastery/revenge-trading-and-tilt

Then inspect the repaired critical pages, the glossary family, affected article/course references, and the eight database-published course URLs. Use the existing sitemap for discovery; there is no need to manually submit 147 requests.

All seven prioritized URLs returned 200 without redirects in the approved-release crawl. Their Google indexing classification has not been freshly checked. The export placeholder 1970-01-01 is not an actual crawl date.

Confirm Google-selected versus user-declared canonical after the slash repair has been deployed and processed. Do not reinterpret valid alternate/noindex/redirect classifications as automatic policy violations.
