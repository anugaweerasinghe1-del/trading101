# THQ-062 — Learning introduction mixes dark copy and fixed dark gradient

At 390/1280 in both themes, the intro paragraph computes rgba(15,15,15,0.7) in light mode over an independently fixed dark gradient, compared with rgba(234,236,240,0.7) in dark. Full-scroll all five widths separately viewed.

Proposal scopes original dark foreground/primary variables and a solid dark gradient backing to the existing intro only. Catalogue, learning path, article cards, counts and progress behavior untouched.

Actual evidence: `evidence/LEARNING-LIGHT-BEFORE-20261028.json`, with computed foreground/background-image/opacity chains and thirty-six personally viewed screenshots across three routes, two widths and two themes. Separate full-light scrolls cover all five widths in `FULL-LIGHT-VISUAL-REVIEW-20261028.json`. Positioned gradients and translucent layers make naive ancestor-only exact contrast calculations invalid; no unsupported numeric ratio is claimed.

Reviewable proposal: `remediation/LEARN-INTRO-LIGHT-SURFACE.patch`. Not applied to the application checkout, not a tested release candidate, not deployed. Before publication, inspect full affected page at five widths/two themes; compare unrelated surfaces and hover/focus; exercise safe controls and conditional educational content only in isolated disposable fixtures where records would otherwise change. Build/type/editorial checks and trusted exact-head/native preview, protected merge, exact-main/native production, affected live and guest smoke remain mandatory. PR259's current native Cloudflare failure is an operational hold. No changes to calculations, orders, auth, records, scores, ad delivery, consent, infrastructure or secrets. Revert through ordinary protected review if needed.
