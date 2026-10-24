# THQ-032 and THQ-033 — Beginner guide readability and course claim

Both findings were reproduced on 24 October at `/learn-trading-guide`. THQ-032 is P2: the first module title has zero available layout width at 360/390px, painting into XP and the Complete action; other long titles also overlap at 360px. THQ-033 is P2: the footer claims “25+ Trading Courses” while the normal public catalog contains six tracks and 26 lessons. Lessons are not separate course tracks. See `evidence/BEGINNER-GUIDE-REPRODUCTION.json` and selected actual images.

PR #231 changes four module class strings to give the icon/title a readable grid and XP/actions a wrapping row. Descriptions can wrap. It changes one static footer value from “25+” to “Guided”. Transformed-source equality confirms that module definitions, completion/unlock handlers, effects, saved values, storage key and sharing behavior are preserved. No real completion, share, order, account, reset or submission action was taken.

Build/SEO, app TypeScript and the complete phase-6 suite pass. The new readability assertion fails against the unchanged baseline. Fifteen disposable local progress/width states cover 90 module rows, saved-state preservation and one isolated local completion/unlock flow. The initial browser receipt did not collect runtime events; it is preserved, and a rerun enabled collection and retained every UI assertion. This is a harness correction, not another site finding.

Candidate `1017daa17cdb83686bda839b0e2cf18dbbfd6c35` passed all four trusted required checks, native Cloudflare preview SUCCESS and native Vercel READY. The actual Cloudflare preview passed five widths, with no captured runtime exceptions; selected module and footer images were personally viewed. Protected squash merge `1e4f03335a17bc08a874e5eda8ea902f96dfa15a` is deployed on both production providers, and all six exact-main checks pass. The actual live guide also passes five widths and selected images were viewed. Guest regression is still running at this receipt's creation; current FINDINGS and RELEASE-LEDGER determine final verification status.

Selected module screenshots use a mid-page scroll position: a first row can sit underneath the fixed global header, which is not evidence of the original intra-row title/XP/action overlap. Bounds assertions inspect all six module rows. These fixes address visitor readability and claim accuracy; no specific Google policy violation or approval guarantee is asserted.

Rollback is a reviewed interface/static-label revert through the protected exact-commit release and live-verification workflow. No data operation is required.

Final verification24October: all30gueststates/four safe controls also PASS with zero captured runtime exceptions. Both findings are PUBLICLY_VERIFIED at the exact merge above. All33currentlyconfirmedsitefindings are publicly repaired; exhaustive audit remains incomplete.
