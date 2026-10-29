# THQ-067 — Compound calculator input values vanish in light theme

Actual unmodified live values100000/500 compute rgb15,15,15 over a5%white input composited over fixed rgb3,5,6 card: 1.017:1. Values are nearly invisible in personally viewed360/1280 light screenshots; original dark values remain legible. No calculation value or slider changed.

Evidence: evidence/FOLLOWUP-CONTROLS-LIVE-BEFORE-20261028.json;12 actual raw images across three issues, all personally viewed. FAQ receipt includes actual closed/open DOM and accessibility nodes. Source confirmed at live main c24f878. PR261 is a separate pending styling release.

Unapplied proposal: Light-only explicit original dark foreground on the two input elements. Preserve all input values, handlers, arithmetic, sliders, output, persistence and existing dark appearance.

Risk/verification: bounded interface presentation/semantics only. Do not alter protected behavior or real-user data. Validate all five widths, both themes, focus/hover and relevant state before/after; verify source diff excludes arithmetic/handlers. Use exact-head build/trusted CI/native preview and actual browser/personal viewing, ordinary protected merge, six-main/native production and live/guest checks. Rollback is an ordinary reviewed revert. No Google rejection cause or full accessibility certification inferred.


29 October local follow-up: implemented in draft PR262 at4cfb4d78c4fb4b6438b546c5acaa4d1c6aa9b40a. Three-file class-only change; Cloudflare build passed. Isolated40-state before/after checks and all80 comparative captures personally reviewed, plus5 settled actual header hover/focus images. Fixture data and fallback-font limitation explicit; complete source tree identical to original testedcb25 commit. Native CI, actual previews and production verification remain pending. No live repair credit. See FOLLOWUP-READABILITY-AFTER/PERSONAL and FOLLOWUP-HOVER-SUPPLEMENT evidence.
