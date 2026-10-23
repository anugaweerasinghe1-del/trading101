> Release update, 23 October 2026: [PR #218](https://github.com/anugaweerasinghe1-del/trading101/pull/218) merged at `9365eaf7e57a6020d70df7fe5637286e8389f11d`. Native production and scoped public verification passed. Any held/unmerged wording in the original preparation note below is historical. See the [release ledger](../RELEASE-LEDGER.json) for exact receipts.

# THQ-009/010: incomplete feedback and ambiguous legacy quiz choice

THQ-009, P2: all six `/learn/1`–`/learn/6` quizzes skip the final question's correction/explanation. Actual UI interaction on23October submits all20questions after opening all24subtopics in a fresh disposable guest. Every final submit jumps straight to Quiz Complete. There were0blocked Supabase mutation attempts and0runtime errors. This omits six authored explanations. Source Quiz returns the summary whenever the current question is last and showResult is true.

Use a separate summary state. Final submission now renders the same correction/explanation as earlier questions, then See Results opens the score summary. Back to Lessons and scoring remain unchanged. The quiz uses transient React state; no account, completion record, achievement or server data is changed.

THQ-010, P3: the portfolio-diversification question asks which option is an example rebalancing rule rather than a universal requirement, but Daily and Weekly can also be example calendar rules alongside the keyed quarterly/drift option. Replace the question/options with one accurate qualified statement and three explicitly false universal claims. Keep correctAnswer index2 and the existing explanation, so no historical answer/score mapping is reassigned.

Validation: new compiled-browser regression fails old UI at the missing final explanation. Candidate complete Cloudflare build, explicit application-project TypeScript and full phase-six suite results are retained separately. It walks all24subtopics/20questions, requires a selection, mixes incorrect/correct responses, checks every explanation and immutable submitted options, and explicitly opens the summary with the correct final score. No new financial calculation, storage, authentication or dependency behavior.

Evidence: LEGACY-QUIZ-BEFORE.json and own lesson1mobile summary screenshot. Full actual collection and human-reading stage remain separate; no exhaustive whole-site or Google approval claim. Rollback is a reviewed revert of the UI/copy/test correction, no data rollback. Release held for current Cloudflare native authentication401 and serial production verification.
