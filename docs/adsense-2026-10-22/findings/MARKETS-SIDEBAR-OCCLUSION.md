# THQ-030 — Markets sidebar obscures later content

P2 usability/readability finding, reproduced24October at360/390/768/1280/1920px. The dashboard reserves64px for its fixed left rail, while the following footer and appended learning notes do not. The rail covers footer text at every reviewed width and reference text at360/390/768, despite zero document overflow. See `evidence/MARKETS-SIDEBAR-BEFORE-BROWSER.json` and the full-page Markets contacts.

PR #229 changes only two product class strings: sidebar becomes a nonshrinking64px sticky flex item within the dashboard; the equal main left margin is removed. Dashboard navigation persists while its parent is visible and leaves before footer/notes. Links, content, filters, data/calculations/order/account/progress/auth/DB/storage/policy/consent/ad/infrastructure behavior are unchanged.

The new compiled regression fails against the unchanged production bundle on footer overlap at360px and passes with the correction across all five widths. Full phase6, build/SEO and TypeScript passed. Exact-candidate required CI and native/provider previews passed; actual preview main/footer/notes are clear at all five widths and selected images were viewed. The ordinary protected squash merge is `b86960a3abac068f38365d09abfce6ae90689d0f`. Production verification is pending until the release ledger records all6main/native/live/guest gates as PASS.

Rollback: reviewed UI-only revert through the same protected serial release cycle. No data action. No specific Google policy violation asserted.

Verified production24October: all6exact-main checks/native providers/15main-footer-notes width states/30guest states/four safe controls PASS at the above merge. Selected footer and reference images360/1280 were personally viewed. The release ledger supersedes the earlier pending status.
