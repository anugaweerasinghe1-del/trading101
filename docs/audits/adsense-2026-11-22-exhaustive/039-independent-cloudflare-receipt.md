# Independent native Cloudflare verification — 22 Nov 2026

The established post-merge release-signals gate remains **unchanged** and intentionally fails when the required Vercel commit status is absent (e.g. push run 45005497031, on main f963b355). This is a real release-evidence blocker; do not weaken, replace or bypass its checks.

A new **read-only, independent** main-only job runs only after the same immutable main SHA has passed the existing required validation. It reuses `scripts/verify-cloudflare-production-main.mjs` (no new provider write calls or secrets): fetches authenticated Cloudflare Pages project/canonical production record, requires exact immutable commit SHA, successful stage, production/main branch, and samples five public pages. Requires a consistent protected GitHub main both before and after.

A passing native Cloudflare job would support only the Cloudflare provider's active production identity for that commit; it **does not** establish Vercel production status, account/ads eligibility, image rights, per-block editorial review, or full 480-URL current crawl. If provider token is missing or Pages deployment lags, the job must fail rather than invent a receipt. Job never runs for PR preview, does not deploy, edit DNS, grant ad serving or submit an AdSense application.
