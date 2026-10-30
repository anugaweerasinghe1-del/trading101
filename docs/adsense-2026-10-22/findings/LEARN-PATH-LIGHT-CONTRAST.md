# THQ-069 — Learning path light label contrast

Current public /learn at PR261 production1dacd0a has nine12/14px step/tier labels whose foregrounds remain emerald400/blue400/amber400 over light surfaces. Actual mobile/desktop foreground and solid ancestor background layers give1.50–2.37:1 contrast; all four captures personally viewed. This affects the three quick-path cards and tier headings, separate from the fixed dark intro repaired by PR261.

Minimal proposal: preserve existing dark classes and add three local light-only darker foreground variants in LEARNING_PATH. No lesson content, sorting, selection, progress, links, handlers, records, pricing or ads/consent changes. Existing interface contrast4.5:1 reference for normal12/14px text; no claim that this is Google’s rejection reason.

Before evidence: evidence/LEARN-PATH-CONTRAST-LIVE-BEFORE-20261029.json. Require build, five-width/both-theme foreground and actual personal views, trusted exact-head CI/native previews, ordinary protected merge and exact-main/native production/public/guest acceptance. Rollback: reviewed revert of the three class additions.
