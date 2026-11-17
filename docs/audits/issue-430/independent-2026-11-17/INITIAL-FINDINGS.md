# Independent AdSense editorial check — pages 008–012
Date: 2026-11-17. Repository baseline main `fa0b70c0d49db541bf5f87fd5305e8bf8f9bb6f1`. Reviewer: separate ChatGPT session; **not Google, Codex, or a human specialist**.

## Scope, evidence and limitations (important)
Selected strict queue entries 008 /learn-trading-guide, 009 /trade, 010 /portfolio, 011 /daily, 012 /ai-mentor to avoid Codex's unfinished Courses entry 007. A read-only fetch of each real public URL supplied the published, JavaScript-free "Learning notes" body, title, canonical, robots, social metadata and link inventory. The React TSX files and relevant feature code were separately read for the five actual UI routes. The available interactive browser-run attempt was blocked *before launch* by its provider wallet; no hydrated browser, account, private data, phone/tablet, interactive state or Cloudflare authenticated deployment view has yet been seen in this independent session. Therefore **none of these five pages earns a 100%-complete strict two-pass/block-level closure from this audit**. This document records an independently useful preliminary source-plus-public-text review without laundering it into the 163-page completion numerator. The original queue and Codex RUN-STATE remain untouched until closure criteria are truly met.

Published URLs:
- https://www.thetradehq.com/learn-trading-guide
- https://www.thetradehq.com/trade
- https://www.thetradehq.com/portfolio
- https://www.thetradehq.com/daily
- https://www.thetradehq.com/ai-mentor

Review policy baseline (official, accessed through fresh public search on 2026-11-17, plus the existing captured 2026-11-15 repository baseline): https://support.google.com/adsense/answer/9724 (original content/eligibility); https://support.google.com/adsense/answer/7299563 (site quality/useful navigation); https://support.google.com/adsense/answer/10502938 (publisher policies and misrepresentation); https://support.google.com/adsense/answer/48182 (AdSense program policies); https://support.google.com/publisherpolicies/answer/11185755 (deceptive practices). Policy applicability to these **clarity defects is precautionary**, not a conclusion that any one wording constitutes a proven Google violation. No numeric word-count rule, approval score or rejection cause was invented.

## Logged BEFORE any edits (append-only finding identifiers)
**IND-P09-001** — /trade, `src/pages/Trade.tsx`, `SEOSection` FAQ "Is ... free to use?". Exact public-facing answer in source: "Yes. TradeHQ gives every user $100,000 in virtual cash with no signup, no credit card, and no hidden fees. (Educational simulation only — not financial advice.)". The *same page's* public note and `src/lib/portfolio.ts` apply a fixed **0.1% virtual fee** per simulated order. **Plausible content-clarity risk, low severity**, not proven AdSense violation: "no hidden fees" can obscure an actual virtual accounting fee even when there are no real-money charges. Remedy: distinguish **no real-money fee** from **0.1% virtual order fee**; preserve zero-cost access and no-signup capabilities.

**IND-P09-002** — /trade, same `SEOSection`, FAQ "How do I start practice trading?". Exact answer ends "Your portfolio updates instantly and is saved to your browser." `src/pages/Trade.tsx` and account portfolio server workflow distinguish guest browser records from signed-in server-recorded trades. **Low editorial accuracy risk** (incomplete scope). Remedy: distinguish guest/browser and signed-in/server records, conditioned on service availability. Do not claim all journals sync.

**IND-P10-001** — /portfolio, `src/pages/Portfolio.tsx`, Available Cash card footnote reads "Ready to deploy". The currency is entirely simulated, but the financial/trading verb may be read as real money in isolation. **Low-quality-risk / subjective interpretation**; not a demonstrated policy violation. Remedy: "Available for virtual orders" (no calculations or functionality changed).

**IND-P11-001** — /daily, `src/pages/Daily.tsx`, `og:description` exactly "One new trading scenario per day. Build your streak. Free." and in-page footer "Come back tomorrow for a new challenge." `src/lib/dailyChallenge.ts` `getTodayChallenge` indexes a **fixed curated bank** using `localCalendarDayNumber(now) % CHALLENGES.length`; the bank repeats. **Confirmed copy-capability mismatch, low severity**: "new" may wrongly imply previously unseen scenarios. Remedy: name the rotating fictional challenge and avoid uniqueness promises; preserve daily availability.

**IND-P11-002** — /daily, metadata `<meta name="description">` starts "A quick daily scenario plus a 8–12 minute case study..." ("a 8" is an objective grammar error). Source has optional longer ten-question session but no measured user time available in the inspected code. **Confirmed grammar / speculative workload clarity**, low severity. Remedy: replace with accurate optional ten-question language without a measured-time claim.

**IND-P12-001** — /ai-mentor, `src/pages/AIMentor.tsx` `SEOSection` FAQ "Is the Learning Mentor free?", exact answer: "Yes — it is included free with every TradeHQ account, no signup or payment required." The same page's input is publicly displayed; saying "with every account" and "no signup" is a self-contradictory description of access, not proof of a broken auth gate. **Low quality risk**. Remedy: explain free guest and account use without suggesting required signup.

## Pages without a safely confirmed copy fix in this limited pass
**P08** `/learn-trading-guide`: inspected published tutorial notes (hypothetical 10×$50 example with 0.1% entry and exit fees, $40.96 loss and $38.96 alternative gain), TSX authored text and seeded fake sentiment label. Arithmetic checked. No confirmed defect from the parts inspected; interactive calculator, image, challenge result and rendered text still not fully verified.

**P09** `/trade`: published practice desk notes reconcile guest vs signed-in storage, limits, quote-source qualifiers, resting-order restrictions. Actual React trading UI interactions remain untested.

**P10** `/portfolio`: published note clarifies locally stored chart history and server-recorded account data; UI embeds many separately authored components. No claim of having read their full user-visible states. Account display cannot be declared complete without auth.

**P11** `/daily`: publicly served note states finite rotating bank, owner-approved private regeneration and unsynced guest history, which makes the conflicting marketing metadata verifiable. Generated future banks and all 30+ challenge variations are not yet fully audited.

**P12** `/ai-mentor`: public note and `getMentorTeachingReply` call in TSX identify deterministic local teaching replies, not an AI provider call. Not claiming every generated reply path is independently checked.

## Validation and release conditions
Only modify these verified copy strings without changing simulation, fees, author attribution, finance guidance, features, user data, admin, account privacy, course publication, ads, or terms. Require exact-PR-head GitHub validation, protected merge, successful native Cloudflare Pages deployment and an actual fresh served-text check before any `FIXED-IN-PRODUCTION` notation. Production status and 163-page strict closure are separate denominators. A failed or inaccessible gate must remain visibly open.
