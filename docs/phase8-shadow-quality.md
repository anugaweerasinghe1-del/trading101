# Shadow learning quality gates

The existing logistic learner now evaluates reported-outcome false positives,
Brier score, five-bin calibration error and categorical feature drift alongside
its purged chronological held-out log loss. It still learns only about
**owner-reported unsuccessful investigations**, never independently verified
repair success or actual root causes.

An explicit synthetic probe exposed a gap: changing three held-out outcomes
produced 3 false positives among 11 reported-success examples (27.27%), while
average log loss improved from 0.69315 to 0.66138. The earlier learner accepted
that model. It now returns `ABSTAIN_FALSE_POSITIVE_RATE`, with no learned weights
or model digest. This is a controlled trainer test, not a production statistic.

The maximum observed held-out false-positive rate is 10% at a fixed 0.5 score
threshold. This is a conservative shadow acceptance rule, not a claimed service
error guarantee. Evaluation includes its positive/negative denominators; small,
non-random samples do not establish population rates. Brier and calibration
metrics are descriptive. No prediction is described as calibrated confidence.
Predictions disclose supporting distinct runs and held-out negative-report count.

For category, route and action, the learner compares training versus held-out
empirical distributions using total variation. An unseen held-out value or a
shift above 0.25 causes `ABSTAIN_FEATURE_DRIFT`. Tests cover both unseen routes
and changed proportions of previously observed routes. This detects these fixed
features only, not every possible kind of operational drift.

The existing minimum ten distinct runs, eight training runs, whole-run temporal
holdout, late-label purge, thirty-day retention, deduplication and all authority
denials remain. A rejected shadow model emits no estimates; the existing fixed
investigation advice, suppressions, findings and risk remain identical. The
native monitoring handoff reports the quality policy even while history is
insufficient. No new provider call, dataset source, user telemetry, role, database
change, worker activation or release authority is introduced.

Latest independently retrieved live history before this release contained two
owner-reported inspection outcomes for one incident (collector run 38582020317,
job 115914086435). It correctly returned `ABSTAIN_INSUFFICIENT_HISTORY`, zero
confirmed repair outcomes and no model digest. These inspections are not verified
repairs. This change cannot turn that history into a trained model or earn an
operational rubric point by itself. The original fourteen-row allocation remains
32/42 until separate genuine acceptance evidence exists.

Run the existing incident-learning, incident-feedback and evidence-cycle tests.
The normal AI-agent check includes them; no new schedule or workflow is added.
