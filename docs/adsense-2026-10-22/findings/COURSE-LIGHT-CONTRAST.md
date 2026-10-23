# THQ005 — low-contrast course catalog text in light theme

Severity: P2. Accessibility/readability defect on `/courses`; no specific AdSense Publisher Policy violation or whole-site WCAG conformance claim.

## Reproduction and evidence

Use the visible theme toggle to select light theme, reload `/courses`, and wait for hydration, fonts and the published catalog. At360px and1280px the large heading remains a pale white/emerald200/emerald400 gradient against a near-white background. Actual computed stop contrasts against the body background are1.07:1,1.20:1 and1.79:1. The normal-size highlighted `$100,000 virtual practice account` phrase also uses emerald400 at1.79:1. This is a settled theme, not the intermediate transition. Initial exploratory screenshots briefly showed the four bundled tracks while the catalog loaded; settled captures correctly show six tracks and26lessons. No permanent catalog-count regression is alleged.

Evidence: `../evidence/COURSES-LIGHT-CONTRAST-BEFORE.json`, `courses-light-settled-360.png` and `courses-light-settled-1280.png`. The new compiled Chromium regression fails against the old layout with the same measured contrast values.

[W3C Understanding Contrast Minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) describes4.5:1 for normal text and3:1 for large text. These are accessibility benchmarks, not invented AdSense-specific rules. The heading is36px/60px in the measured views; its background gradient fills the text. The atmospheric backdrop can vary the precise rendered background, so the browser check is a baseline color check rather than a complete pixel-level contrast certification.

## Minimal correction and risk

Give the course catalog wrapper/title specific selector hooks. In light theme, use darker emerald900/800/700 gradient stops and emerald700 for the catalog’s existing emerald400 accent text. Keep the dark colors, text, layout, course data and theme-control behavior. The selectors apply only inside this catalog; no homepage positioning/copy, auth, account, price/fee calculation, course progress, database, consent, ad or provider change.

Files: `src/pages/Courses.tsx`, `src/index.css`, `scripts/verify-publisher-browser.mjs`. Low interface risk; existing component/API contracts remain. The regression uses the actual visible theme control, font settlement and computed RGB contrast at all five requested widths in light and dark themes. It also checks the smaller accent phrase against4.5:1. All prior assertions remain. A first candidate run passed the new contrast checks but sampled a niche guide’s missing head tag before Helmet committed it. The fixture now waits for the robots/canonical nodes before retaining the same exact-value assertions; the initial failure is preserved. This changes test readiness only, with no production metadata change.

## Validation and release

Old compiled regression failure is retained. Local candidate Cloudflare build and the full phase-six browser suite pass, including both themes at all five sizes. Exact-head required CI, native previews, actual preview checks and the ordinary protected merge must precede exact-SHA production verification and affected live/guest checks. Current Cloudflare credential401 and earlier prepared release cycles hold merging; preparation is not deployment.

Rollback: reviewed revert of the scoped classes, styles and regression. Baseline main`aa216a24c68c30c9251f96a050da098b33364686`; no data or setting reversal.
