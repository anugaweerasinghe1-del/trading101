# 033 — Review moderation hash production receipt

Date: 2026-11-22. Issue #519. PR #520 exact head 313c034b0e393f21d663e32c957e3a2845098d2d passed Phase 3 run 44988767666, including exact-head preview and review regression, plus disposable run 44988767695. Protected squash merge 6375830a2ac1c8ee5d095cbf5728aa0393c32d37.

Applied exact tested SQL using authorized Supabase migration tool; success response. Live migration history confirms 20261122053117_restrict_public_review_moderation_hash. This commit records the SQL already applied, not a new production action.

Post-apply catalog verification: anon_hash=false; authenticated_hash=false; moderation_hash=true; moderation_insert=true; public_content=true; authenticated_content=true; rls=true. No review data or user rows read, written, or deleted. Security advisor warning categories unchanged (intentional privileged RPCs require separate assessment; leaked-password protection remains disabled). See https://supabase.com/docs/guides/database/postgres/column-level-security . A separate privacy-policy disclosure update is pending. This verified privacy defect is not an adjudicated Google policy violation.
