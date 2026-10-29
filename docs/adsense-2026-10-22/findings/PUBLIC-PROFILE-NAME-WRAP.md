# THQ-065 — Long public username exceeds narrow profile viewport

Newly discovered /trader/abdullazeezy72munnissy renders one unbroken heading. Actual settled 360 screenshot clips the final letters; text Range extends left16→right376.0625 despite heading container ending344. Mobile layout viewport expands to376 at requested360; document-overflow comparison to innerWidth can therefore miss this. At390 the text fits the viewport but slightly exceeds the padded heading. Other three widths fit. Two actual raw mobile screenshots personally viewed, plus complete default/light five-width contact sets for this profile.

Evidence: evidence/PROFILE-NAME-BOUNDS-20261028.json; profile-name-before-20261028/360.png and390.png. The five-width capture records requested width separately from actual viewportWidth. This is a reproduced visual failure, not a claim that360 layout passed.

Unapplied proposal adds overflow-wrap:anywhere to the public username h1 only in src/pages/PublicTrader.tsx. No username validation, stored record, private-profile logic, authentication, calculations, data or URLs change. Test all five widths, both themes, actual text Range bounds against requested viewport, long and short real public names, safe breadcrumb/back, native preview and full serial production gates. Rollback ordinary reviewed revert.


29 October local follow-up: implemented in draft PR262 at4cfb4d78c4fb4b6438b546c5acaa4d1c6aa9b40a. Three-file class-only change; Cloudflare build passed. Isolated40-state before/after checks and all80 comparative captures personally reviewed, plus5 settled actual header hover/focus images. Fixture data and fallback-font limitation explicit; complete source tree identical to original testedcb25 commit. Native CI, actual previews and production verification remain pending. No live repair credit. See FOLLOWUP-READABILITY-AFTER/PERSONAL and FOLLOWUP-HOVER-SUPPLEMENT evidence.
