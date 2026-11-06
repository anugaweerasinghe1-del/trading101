# Phase 5 admin workflow reliability

Scope: #332, #335 and #321. The branch began from freshly fetched main
`5ea8b74782067d57fe547de0c2a6bf05fee69008`. This batch changes the application
and isolated fixtures only; Supabase handlers, migrations and release gates remain
owned by the parallel backend/integration work.

## Existing workflow inventory and this batch

| Surface | Backing service | Reliability coverage |
| --- | --- | --- |
| `/admin` | GitHub reads, `admin-courses`, newsletter services, chat status | Existing freshness, independent failed-feed states, lock fencing and automation inbox retained and browser tested. |
| `/admin/courses` | `admin-courses` | Editing invalidates approval. Known stale/missing/status-changed revisions cannot save, review, reject or publish. Owner JWT accompanies publication; server authorization and independent revision review remain authoritative. Confirmed writes survive inbox read failure. Headers and editor actions wrap on small screens. |
| Course generation settings | `admin-courses` settings/configure/generate | Paused differs from incomplete free-tier setup. Generation still uses saved settings and existing attempt controls. |
| `/admin/daily` | `admin-courses` Daily actions | Edited review resets, stale revisions block editorial actions, structural errors block invalid saves/approval, confirmed writes retain returned revision if refresh fails. Generation/cooldown/cap and model metadata checks retained. Grid columns fit narrow viewports. |
| `/admin/newsletter` | `newsletter-editor`, `newsletter-dispatch` | Review is tied to saved text. Conflicting revisions block save/approval/send. Recent receipts show recorded accepted/delivered/unknown states and independent refresh time. Missing audience is unknown rather than a claim of missing webhook configuration. Confirmed writes and sends retain outcomes if subsequent reads fail. Long buttons wrap. |
| `/admin/ai` | `admin-agent-chat`, code queue and repair controls, GitHub | HTTP error response bodies preserve quota codes; owner/key/permission/provider errors differ. Consumed chat attempt blocks another submit in that component. Configuration refresh never calls the model. Empty/forged responses rejected, suggestions rendered as text, late replies fenced. Existing queue/review/publication/stop fixtures retained. |
| `/admin/reviews` | `admin-reviews` | Existing edit/reply/lock protections exercised with disposable rows. |
| `/admin/validator`, `/admin/editor`, `/admin/seo-audit` | local routes and existing audit UI | Existing mount/redirect checks retained; no production crawl started. |

## Validation and limits

`verify-isolated-auth-browser.mjs` builds the real app against a loopback Supabase
fixture and runs real Chromium. Added cases cover HTTP chat failures, empty replies,
review invalidation, owner-denied course publication with a fixture JWT, remote
revision conflicts, successful private save followed by an inbox outage, newsletter
receipts, and 320px course/Daily/newsletter layouts. The HTTP-error unit cases run
inside `verify-admin-editorial-safety.ts`, which is already part of the build gates.
Existing disposable course-workflow and chat-budget tests cover backend contracts.

Fixture success is not evidence of real Gemini generation, real owner approval or
subscriber delivery. No test sends, production draft edits, approvals/publications,
quota resets, paid fallback, user-data mutation or AdSense actions are required.
Historical Daily HTTP400 and the exhausted cycle require separate authorized
provider acceptance; do not infer a fix from model metadata connectivity.
The registered owner's genuine browser session and full editorial review remain
necessary for live publication acceptance. Issues remain open for those gates.

Use exact-head required CI and a fresh main comparison before merge. Verify the
merged SHA with native Cloudflare deployment evidence and public route behavior;
preview success alone is insufficient. Record final PR/SHA/deployment evidence in
the PR and issue discussions.
