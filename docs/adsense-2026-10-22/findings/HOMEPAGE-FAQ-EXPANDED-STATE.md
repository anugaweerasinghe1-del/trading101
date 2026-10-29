# THQ-066 — Homepage FAQ buttons omit their expanded state

Actual production keyboard Enter opens the answer, but aria-expanded is null before and after and the Chromium accessibility-tree button exposes no expanded property at360/1280 in both themes. All8 current candidate FAQ flows independently reproduce absent state. Keyboard activation itself works.

Evidence: evidence/FOLLOWUP-CONTROLS-LIVE-BEFORE-20261028.json;12 actual raw images across three issues, all personally viewed. FAQ receipt includes actual closed/open DOM and accessibility nodes. Source confirmed at live main c24f878. PR261 is a separate pending styling release.

Unapplied proposal: Add aria-expanded reflecting the existing openIndex expression. Preserve all content, handlers, animation, DOM and accordion state; no new dependency.

Risk/verification: bounded interface presentation/semantics only. Do not alter protected behavior or real-user data. Validate all five widths, both themes, focus/hover and relevant state before/after; verify source diff excludes arithmetic/handlers. Use exact-head build/trusted CI/native preview and actual browser/personal viewing, ordinary protected merge, six-main/native production and live/guest checks. Rollback is an ordinary reviewed revert. No Google rejection cause or full accessibility certification inferred.


29 October independent local candidate: prepared atf52803671f243c9b9488e07d7121dc51c91a3afb on the pending readability candidate. Cloudflare build passed on identical complete source tree. FAQ80 local keyboard/DOM/AX states passed and10 captures personally viewed with explicit analytics-banner visual limitation. All170 configured asset titles/descriptions compared:115 generic Analysis fallback titles become Practice; all custom/short titles and every description remain unchanged. No release/native/public credit; local title browser follow-up still pending.
