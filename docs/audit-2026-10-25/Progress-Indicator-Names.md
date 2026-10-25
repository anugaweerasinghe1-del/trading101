# THQ-20261025-001 — unnamed metric indicators

P3 accessibility defect. This is a usability finding, not a claimed specific AdSense violation.

Actual production Chromium at 1363px exposes the guide XP bar with value 0 and no accessible name. The empty guest portfolio similarly exposes three unnamed bars at 100, 100 and 0. Nearby visible labels are not programmatically associated. The populated allocation branch uses the same unnamed component pattern in source.

Add only `aria-label` attributes matching the visible XP, cash reserve, cash share, largest position and per-asset-class allocation labels. Preserve every value expression, calculation, handler, storage key and visual class. No trade, account, database or consent action is part of this correction.

The actual-component server-render regression fails the original source on the missing Experience Points name, then passes on the candidate with empty and invested fixtures and 0/50/100 numeric values. It uses disposable read-only storage and restores test globals. The existing compiled Chromium phase 6 now includes 20 read-only route/width/theme states: both affected routes, light and dark, widths 360/390/768/1280/1440. Existing regressions remain enabled.

Local application TypeScript, editorial/UI regressions and complete `build:cloudflare` pass. Local Chromium cannot start because the managed executor denies its required socket (EPERM); this is explicitly not recorded as a passing local browser test. Exact-head remote required CI, native deployment evidence and production browser verification remain release gates.

Rollback: reviewed revert of five accessibility attributes and their regression coverage. No data or settings reversal is needed. Completion-Ledger.json consolidates the historical PRs and outstanding production-bank/account boundaries; final immutable release details belong in the PR after they are observed.

## THQ-20261025-002 — responsive theme controls disagree

The first exact-head CI run40162306208 passed the four route-matrix phases and existing interactions, then failed the new responsive test at `Progress enters dark theme`. The guide mounted at the mobile breakpoint; its mobile toggle entered light theme. After resizing through1440px, the desktop instance still held dark in its private state and repeated light on the next click. Production About also reproduces the stale label: after switching light, the visible button says Switch to dark theme while its hidden counterpart still says Switch to light theme.

Keep both existing controls synchronized with the actual root class via a cleaned-up MutationObserver. Derive the next action from the actual class, avoiding a stale handler state. Validate stored theme values before applying them. Styles, preference key and supported choices remain the same. The failing theme transition remains asserted, and the test additionally requires both responsive controls to advertise the same next action.

This is an independent P3 interface defect; no consent or account setting is changed. It joins the same accessibility/navigation UI release. Local component regressions, app TypeScript and full build are rerun after the correction. The failed candidate is not mergeable evidence.
