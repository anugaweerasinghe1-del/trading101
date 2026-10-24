# THQ-031 — Mobile guided lesson title collapses beside its action

P2 readability/navigation finding, reproduced24October on `/learn`. At360px the suggested title receives14.4px for311px of text; at390px44.4px. The unwrappable231.6px action button consumes most of the262/292px flex row and the minimum-zero text column shrinks to a few letters. `truncate` hides the rest while the explanatory text wraps into narrow fragments. See `evidence/GUIDED-LESSON-BEFORE-BROWSER.json` and selected before images.

The proposed fix stacks the recommendation and action below640px and permits the complete title to wrap. All recommendation, saved-progress and destination logic remains byte-identical; only layout classes change in GuidedNextLesson. New isolated browser fixtures cover new learner, resume-longest-title and next-lesson states at all five widths. These are disposable local fixture records; no real user progress is changed.

The unchanged production bundle fails the new title-visibility assertion at360px. Initial harness import of the source catalog encountered image imports; it now uses the repository's existing loadSiteData image-stub loader, retaining the original title assertion. After incorporating PR229, a local run exposed a pre-merge compiled bundle; a fresh build and complete final suite are required and tracked separately. These are audit-harness/build-state limitations, not additional product findings.

Latest workflow, immutable candidate and production state are authoritative in FINDINGS and RELEASE-LEDGER; no deployment is implied by this prepared fix. Rollback is a reviewed layout-only revert through the protected exact-native/live cycle, with no data operation. No specific Google policy violation asserted.

Verified production24October PR230 exact merge `2d6f22a5044984e2e57fff2b37a0b63634f101a2`: all6main/native providers/5affected widths/30guest states/four safe controls PASS; selected360/390/1280card images personally viewed. Entire recommendation/progress/text unchanged by exact transformed-source equality. See current RELEASE-LEDGER/PR230receipts; prior pending/harness states remain historical.
