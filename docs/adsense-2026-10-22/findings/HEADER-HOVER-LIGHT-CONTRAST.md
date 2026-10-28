# THQ-068 — Shared header hover controls lack light-theme contrast

Actual live hover uses white foreground on opaque rgb145,145,161: 3.102:1 for14px/500 Sign in; mobile menu icon shares the pair. Both360/1280 light hover screenshots personally viewed with dark comparisons. Current PR261 local hover retains this preexisting pair.

Evidence: evidence/FOLLOWUP-CONTROLS-LIVE-BEFORE-20261028.json;12 actual raw images across three issues, all personally viewed. FAQ receipt includes actual closed/open DOM and accessibility nodes. Source confirmed at live main c24f878. PR261 is a separate pending styling release.

Unapplied proposal: Scope a dark accent foreground to light-mode shared nav only; preserve accent background, normal foreground, dark palette, authentication/navigation handlers and portal menu behavior.

Risk/verification: bounded interface presentation/semantics only. Do not alter protected behavior or real-user data. Validate all five widths, both themes, focus/hover and relevant state before/after; verify source diff excludes arithmetic/handlers. Use exact-head build/trusted CI/native preview and actual browser/personal viewing, ordinary protected merge, six-main/native production and live/guest checks. Rollback is an ordinary reviewed revert. No Google rejection cause or full accessibility certification inferred.
