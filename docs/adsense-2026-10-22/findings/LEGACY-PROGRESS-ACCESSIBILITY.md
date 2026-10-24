# THQ-037 — Lesson completion missing from accessibility tree

All six legacy lessons show a determined initial 0% completion label, while their progress bar is unnamed and indeterminate in the actual Chromium accessibility tree. The deployed reproduction covers all five requested widths on each lesson (30 states), without pressing Continue or changing progress.

The shared Progress wrapper removes `value` from forwarded props and uses it only in the visual transform. The legacy lesson consumer also supplies no accessible name. Forwarding the existing value to the Radix root and naming the legacy indicator repairs those display semantics. The calculation, completion handlers, visual transform and storage stay unchanged.

The orange bar observed during visual review is the track background. Computed styles show the green progress indicator correctly translated offscreen at zero; no separate wrong-percentage visual issue is asserted.

Draft PR #235 is an independent future batch held behind PR #234. A source-component rendered regression fails the old wrapper and passes zero/intermediate/fractional/full values while preserving indeterminate behavior when no value is supplied. Existing editorial/arithmetic/performance tests, build/SEO/editorial checks and app TypeScript passed. Exact-candidate CI/previews and production verification remain pending. Revert the attributes for rollback; no data rollback is involved.
