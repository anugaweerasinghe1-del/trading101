> Release update, 23 October 2026: [PR #213](https://github.com/anugaweerasinghe1-del/trading101/pull/213) merged at `1517169657ea32c418286a4c235dacd226bb798e`. Native production and scoped public verification passed. Any held/unmerged wording in the original preparation note below is historical. See the [release ledger](../RELEASE-LEDGER.json) for exact receipts.

# THQ-002 — Mobile course cover clips its title and level

Severity: P2. General readability/usability defect; no specific AdSense Publisher Policy violation asserted. All six `/courses/:trackSlug` track pages are affected at 360px. Five headings are also clipped at 390px, while the futures level badge is slightly clipped there. The measured tablet and desktop covers contain their text.

## Evidence and reproduction

Open a track on production `aa216a24c68c30c9251f96a050da098b33364686` in Chromium at 360×800, scroll to the top and wait for hydration and fonts. The cryptocurrency-price-feeds title extends about 116px above the cover; the diversification title extends about 108px above it. `overflow:hidden` hides that text. Even shorter track names lose part of their heading or level badge. The title exists in the DOM, so H1-count and document-overflow checks alone miss this defect.

`../evidence/COURSE-HERO-BEFORE.json` records all six tracks at 360×800, 390×844, 768×1024, 1280×800 and 1920×1080. The cryptocurrency and diversification mobile screenshots show the missing title; desktop screenshots establish the responsive difference. Measurements and screenshots came from the actual public domain, with TLS checks enabled and normal fonts loaded.

## Minimal fix, risk and validation

`src/pages/CourseTrack.tsx` currently fixes the cover aspect ratio and absolutely positions the text. Text cannot increase that height. Keep the text in normal flow with a minimum banner height; position the image and gradient as background layers. The cover then grows with a long title or tagline. Existing copy, images, course links and progress/badge logic are retained.

This is a low-risk interface change shared by six course tracks. It does not change auth, lessons, quiz results, user progress, financial calculations, database, consent, ads, secrets or infrastructure. A real Chromium regression in `scripts/verify-publisher-browser.mjs` checks level/title/tagline bounds on every bundled and recorded published track at all five widths, alongside existing assertions. Course hydration is required before measuring; static prerender markup is a different layout and must not satisfy readiness.

Required release sequence: old-layout regression failure, candidate build/browser success, exact-head required CI, both native previews and real preview rendering, protected merge, exact-SHA Cloudflare SUCCESS/Vercel READY, affected public pages and critical guest regression checks. Preparation does not establish deployment. Record observed final states in RELEASE-LEDGER and the PR.

Rollback is a reviewed revert of these layout/test changes. There is no data or setting reversal. Baseline is main `aa216a24c68c30c9251f96a050da098b33364686`, Cloudflare production `a48650b5-b13e-436f-a097-a3a04111dbba`; this identifies the source/deployment baseline, not an untested provider rollback guarantee.
