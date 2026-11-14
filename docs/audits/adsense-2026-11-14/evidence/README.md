# Evidence archive index

`production-audit-evidence.zip` contains dated raw evidence under the paths below, plus `MANIFEST-SHA256.json` hashing every member. Download and unzip before opening gzip JSON or using the CSV's archive-path references. Publisher account verification is retained, but ad serving is disabled.

- `baseline-http-observations.json.gz`: 366 initial HTTP documents and initial HTML link discovery.
- `baseline-browser-observations.json.gz` + `baseline-browser-additional-observations.json.gz`: 473 original browser URLs, including hydrated public directory and asset discovery. Some early profile data was pending; do not count these as settled final observations.
- `historical-content-reconciliation.json`: exact current/baseline main-text hashes against October evidence; 127 indexable matches and 279 broader matches. This is scoped reuse, not an assertion every financial fact was freshly sourced.
- `production/http-observations.json.gz`: all 480 fresh post-repair HTTP observations, including actual main text, metadata, script presence, links and one expected controlled 404.
- `production/browser-observations.json.gz`: all 480 post-repair navigations / 960 widths / six actual Tab steps per URL. Profile H1s were awaited. Text-file paths are relative to `production/`.
- `production/browser-text/`: actual post-repair extracted main text; each JSON observation identifies its SHA-derived filename. Baseline textFile entries are collection paths; baseline main text is retained in the HTTP archive, while final per-page text is retained separately. Public community records concern simulated activity; no private account history was read.
- `production/live-interactions.json`: completed live guest navigation/keyboard and ad-network smoke. Separate More-disclosure follow-up NOT VERIFIED, as stated in report.
- `production/provider-log-extract.txt`, `production/main-jobs.json`, `repair-pr-checks.json`, `repair-preview.json`: exact release/CI/provider evidence and timestamps.
- `production/blocked-public-read-rechecks.json.gz`, `production/workspace-network-503-*`: failed follow-ups after the public-read allowlist correction. These do not invalidate earlier successful HTTP/ad-exclusion measurements and do not establish an origin outage. The original sweep's prevented public POST reads must not be described as verified live feature success.
- `published-course-assessment.json`: anonymous published snapshots, validation, sitemap comparison and exact integer-cent arithmetic checks. No publishing or private draft access.
- `collectors/`: exact working collectors, seed inventory and follow-up paths. Recorded absolute workspace/runtime import paths need adjustment to rerun elsewhere. Tools were Node 24.19, installed Chromium/Playwright and project locked dependencies. No new package/service was purchased or installed.
- `screenshots/`: the two visually inspected baseline Start/Contact captures are separate tracked PNGs next to this archive, indexed by `screenshots-index.json`. Other screenshots were collected but are not assigned visual-review credit.

Initial navigation smoke used secondary links before expanding their More group and timed out; primary Learn navigation was then tested successfully. A separate More follow-up reached a transient loading state and later workspace 503, so its final assertion was not passed. An initial one-off multiplication used binary floating point and failed an exact equality; the retained collector verifies currency examples using integer cents. Neither event was classified as a product defect or concealed as a passing initial test.

Historical source ledgers remain in the repository, linked by MASTER-LEDGER.md. The evidence measures specific dates, guest states and tested source; it is not account approval, comprehensive legal/financial review, proof of all originality or an unbounded inventory of unknown tokenized/private URLs.
