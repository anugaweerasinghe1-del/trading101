# Confirmed cross-layer Daily metadata mismatch — follow-up to issue #430

Date 2026-11-17 UTC. Source baseline main `5cafdd01bba8aa942a2aa3904a7825153f5577fa` (separately protected merge of #456). Reviewer: independent ChatGPT pass; not Google reviewer.

### Evidence saved before code edit
- Public URL: `https://www.thetradehq.com/daily`.
- Fresh (ttl=0) live `<head>` extraction after prior #455 release showed initial HTML title "Daily Trading Challenge — Build Your Streak | TradeHQ" but **both** the prerendered meta description and Open Graph description still read: **"A quick daily scenario plus 8–12 minute case study with visuals, 10 linked questions and worked answers. Learn from 50 rotating exercises for free."**
- Direct repository source: `scripts/routes.ts`, `routes.push({path:"/daily",description: ...})`, explicitly hard-codes "8–12 minute case study", with dynamic bank question/exercise count. The original hydrated React `src/pages/Daily.tsx` metadata was corrected via #455 to remove "a 8" and a completion-time estimate; the static builder was not updated by that PR.
- There is no measured user completion-time evidence in the examined source. The page is a ten-question optional case study; "8–12 minute" can vary by learner and is not an assured session duration. Keeping dissimilar static vs hydrated descriptors is an actual reproduction of inconsistent metadata under the same URL.
- **Classification:** confirmed site-source mismatch/clarity issue, **not a confirmed breach of a named Google AdSense rule**. Do not falsely describe Google as requiring an estimated duration to be absent. Google Publisher Policies restrict deceptive representations; no account reviewer has determined this phrasing deceptive. The fix is to correct our own inconsistent promise, nothing more.
- Intended narrow fix: rewrite the static description to a factual "optional 10-question case study" with rotating exercises, without a measured duration claim or "new every day" promise. No quiz content, review policy, served advertising, quiz generation, account or private data changes.
- Release gate: exact-head checks -> protected PR merge -> native Cloudflare exact merge commit deployment -> fresh head-meta and hydrated readback. Merely changing React code did not update the pre-rendered HTML, so both layers must be checked.

Owner-required strict completion counts are **unaffected** by this small follow-up.

### CI regression caught after first patch, BEFORE repairing test
- First PR #457 head `34aea4942c238cad95fc9ad4869320be7807953d` failed the required `TradeHQ Cloudflare compatibility / Cloudflare build and SEO` check at GitHub job `134128073168`, recorded 2026-11-17T14:58:13Z.
- Build/prerender succeeded for 357 routes. The later `scripts/verify-sitewide-readiness.ts:101` assertion failed with exactly `AssertionError [ERR_ASSERTION]: Daily count must match the authored bank`.
- Root cause confirmed by reading source: the test previously required **both** the static Daily description and static Daily summary to include the exact phrase `${questionCount} linked questions`. The correctly revised description now states `${questionCount}-question case study`; the summary still includes `linked questions`. Counts are unchanged, but old test is too string-specific for two legitimate phrasings.
- Intended source-based fix to test, not bypass: retain independent uniform question count check; check description for the actual ten-question-case-study phrase AND 50-exercise count; check summary separately for the existing linked-question phrase AND 50-exercise count. No blanket exception, skipped gate or weak unconditional pass. Validate again on exact updated head and record outcome.
