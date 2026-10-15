# One actionable administration queue

The existing dashboard now combines awaiting-review courses and Daily banks,
recorded generation failures/cooldowns/caps, open monitoring findings and open AI
proposals. Missing desks remain unknown rather than zero. Failed refreshes label
older snapshots stale. Links open the existing desks; nothing retries, approves,
publishes, starts a repair worker or changes production from this queue.

Dashboard editorial reads use `summary: true` on the existing `list` and
`daily-list` actions. The server selects metadata only, retaining the existing
200-course/24-bank bounds, master-key check, rate limits and default full editor
responses. No schema, credential, grant or new authorization path is introduced.
An aggregate read of the two current course rows and two Daily rows measured
420,314 bytes of full JSON fields versus851 bytes of projected metadata. These
are serialized database fields, not compressed wire traffic or billing headroom.

One bounded public read adds the latest trusted collector workflow to the existing
15-minute GitHub refresh. Its commit and native run link expose investigation and
learning evidence. Workflow success is explicitly not identity acceptance,
confirmed repair or successful training. Open proposals are not falsely labelled
unapproved when an owner decision may already exist.

The existing compiled Chromium fixture exercises simultaneous pending work,
metadata requests, cap-before-cooldown guidance, GitHub and Daily queue outages,
continued course access, stale refresh warnings and zero mutations. Course admin
tests verify summary reads retain the same key and normal editor response mode.
These fixtures are not genuine owner decisions, provider usage or repair outcomes.
The original rubric remains33/42; this delivers the requested control-centre
functionality without claiming another operational stage.

Later owner-supplied AI Studio screenshots expose the previously clipped daily
limits: matching row order to the earlier model-labelled image, Gemini3.5 Flash
Lite shows6/500 RPD,2/15 RPM and4.21K/250K TPM, and Gemini3.6 Flash1/20 RPD.
The project is Free tier with a Set up billing control. These are seven-day peak
observations, not live remaining counters. Daily's cooldown/attempt budget still
applies, and screenshots do not imply successful content generation.
