# Prerequisite findings — append-only lifecycle

These are internal application defects, not confirmed Google policy violations. They do not count as fresh editorial review of any queued page. The prior 19-proposal remediation remains 18 verified public remedies plus source synchronization pending authenticated publication and live verification.

## STRICT-PRE-001 — word-number worked example falsely rejected

CONFIRMED BUG. The internal course checker recognized quantities only as dollar-prefixed digits or digit percentages. The existing Price Feeds example explicitly said “ten dollars”, “one thousand units” and “Multiply ... sum ... divide”, but the checker reported a missing quantified example. A human still needs to check the reasoning; recognizing written numbers does not establish correctness.

Before: `reviewCourseQuality` rejected that example as unquantified. Proposed repair: recognize explicit number words followed by units together with the existing operation requirement. Preserve all structural, source, paragraph, missing-example and owner gates. Regression coverage includes word/digit/decimal inputs, hyphenated numbers, vague prose, missing operations and a genuinely deficient lesson. Local tests pass. Protected merge/deployment verification remains pending until a release receipt is appended.

## STRICT-PRE-002 — publication failure message conceals cause

CONFIRMED BUG. The user supplied a screenshot of an actual failed “Approve and publish” action on 15 November. The client translated nearly every HTTP409 into “saved revision changed or did not pass review” and directed refresh. This includes configuration failures that refreshing cannot remedy. The handler's safe-prefix list recognizes “Independent course review” but misses its own generator's “Independent course quality review blocked this draft”, obscuring a real review rejection if one occurs.

Independent read-only checks: drafts8/5/5 remain unpublished; database schema validation and the deployed quality checker pass for all three. The required free-model configuration is present. These checks do not prove the external review service is reachable or has quota, nor identify the exact original409 cause. Do not label that cause confirmed from the screenshot alone.

Repair: return bounded diagnostic codes for changed revision, validation, review rejection, unavailable review, quota, configuration, unavailable sources and unknown write failure. Normalize unexpected review transport/stream failures to a safe review-unavailable category. Log only the code; display fixed, specific client instructions without raw provider text or credentials. Preserve owner verification, revision locking, content validation and exact-revision independent review. Handler-to-client tests reproduce every category and verify unknown sensitive payloads remain hidden. Existing workflow tests exercise owner denial, draft privacy, review failure and optimistic locking. Local tests pass. Protected merge, Supabase function deployment, Cloudflare production verification and one authenticated retry remain pending.

## Publication journal

- Original corrections saved as draft7/4/4; independently checked. Publication was reported by the user but database still showed published6/3/3. No publication was counted.
- Full server-quality checks exposed short internal-gate paragraphs and a written-number false positive. Schema-only validation was insufficient; the assistant acknowledged the premature retry request.
- Added concrete, explicitly hypothetical exercises and arithmetic, preserving lesson URLs and quiz keys. First refinement-save confirmation expired; a smaller guarded save succeeded as draft8/5/5. Stored documents match the prepared candidate and pass schema/quality/renderer checks.
- User supplied an actual publication failure screenshot; read-only logs show409 from function18. Exact original cause remains unresolved. No direct SQL publication, fabricated review attestation, credential extraction or gate bypass was used.
- All480 new audit queue rows remain QUEUED-UNREAD. The policy baseline and technical regression work do not count as new page-level editorial passes.
