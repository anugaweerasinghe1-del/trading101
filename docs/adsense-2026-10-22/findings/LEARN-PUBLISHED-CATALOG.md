# THQ-008: published courses missing from the Learn hub (P3)

Fresh actual production browser comparison on23October confirms `/learn` lists only four bundled tracks and says20lessons/4fullcourses. `/courses` exposes six tracks and26lessons. The primary learning hub hides both published course cards and gives a stale total. This is a content/navigation inconsistency, not a claimed specific Google Publisher Policy violation.

Root cause: Learn maps the static bundled courseTracks list and hardcodes its counts. Use the existing read-only public useCourseCatalog hook for the displayed cards and counts. Keep all course records, progress storage, recommendation logic, authentication and financial behavior unchanged. Counts describe the available tracks; bundled tracks remain available with an empty published response.

Reproduction: evidence/LEARN-CATALOG-BEFORE.json compares settled actual pages; learn-catalog-before-1280.png was personally inspected. The new compiled-browser regression fails the old app because the two published links are missing. Candidate Cloudflare build, explicit application-project TypeScript and complete phase-six Chromium suite pass. Regression checks published cards and26lessoncount, all5viewportwidths and4bundled/20lesson fallback when no published entries are returned.

Rollback: ordinary reviewed revert of display and regression; no account/progress/data rollback. Draft release remains held for Cloudflare authentication and serial exact-commit production verification. No production release claimed.
