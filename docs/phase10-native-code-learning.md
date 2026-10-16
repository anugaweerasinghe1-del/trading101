# Code-agent learning from native validation

The admin coding queue uses the last 30 days of independently observed GitHub
validation results. This is file-selection memory, not a claim of semantic task
correctness, incident diagnosis, production repair success or model fine-tuning.

For each proposed request, the server independently reads the actual draft PR
files and rechecks its head. For each result, the server reads the native
validation job. Only completed success/failure labels enter the memory; canceled,
skipped, timed-out, unfinished, provider failures and legacy unbound results are
excluded. Request/run IDs are unique, so retries cannot multiply evidence.

The memory counts passes and failures per file. The displayed internal smoothed
failure share uses a Beta(1,1) prior: `(failures+1)/(samples+2)`. It is descriptive
history, not a calibrated prediction. The last three failures for a file pause
that file from automatic selection. A later pass or the 30-day expiry removes
the pause. The agent must decline a request needing a paused file rather than
substitute unrelated work. A multi-file CI failure does not identify which file caused it; pausing both is
a conservative selection rule. Scope restrictions and release requirements remain
in force.

Each worker claim atomically saves its exact learning context, native run and
base SHA before any model call, with an append-only admin event. Admin shows
current counts, paused files and the decision used on each request. With no
real outcomes it explicitly shows that it is collecting results.

Offline fixtures exercise accumulation, three-failure adaptation, exclusion,
expiry and actual engine rejection of a paused file. They do not populate
production or earn operational rubric points. Native PostgreSQL validates
concurrent claims with one committed decision. The compiled browser checks the
actual admin component's empty learning state.
