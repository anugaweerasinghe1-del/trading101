# Daily generation quality and editorial triage

A real code-path defect was reproduced with an isolated provider response: two
new exercises had identical scenarios, distinct IDs/titles/prompts, and still
passed `generatePractice`. Historical-case comparison omitted comparisons within
the same ten-case response. The generator now applies the existing scenario
overlap rule to both history and earlier cases in that response. A rejected part
does not retry the provider or publish content. Existing cooldowns, caps, leases,
five-part persistence, schema and editorial approval remain unchanged.

The Daily desk now shows category/question coverage and navigable findings for
overlapping scenarios, similarly worded questions and reused explanations. Review
jumps open the actual answer/explanation preview and move keyboard focus there.
Banks can be filtered to awaiting review, approved and rejected. These are local
wording checks, not ML, factual verification or mathematical validation. Findings
do not change approval authority or automatically reject existing banks.

The existing Daily verifier covers copied and slightly reworded same-response
scenarios, historical repetition, exactly one fixture provider call on rejection,
read-only triage and precise finding coordinates. The existing compiled Chromium
fixture covers queue filters, review navigation/focus and zero editorial writes
or extra generation requests. Synthetic content stays in isolated tests.

The owner-supplied AI Studio screenshot shows project Thetradehq on Free tier.
Seven-day peak Gemini 3.5 Flash Lite usage is 2/15 RPM and 4.21K/250K TPM. It does
not show RPD or current remaining allowance; configured Gemini 3.5 Flash is not
among the visible rows. No provider call, model/configuration change, budget reset
or unreviewed publication is authorized by that screenshot alone. Successful
genuine generation/persistence/editorial approval/public retrieval remains the
missing Daily external demonstration. Original rubric remains 33/42 at this point.

## Scheduled attempt, 15 October at 16:15 UTC

The later owner screenshot exposed Flash Lite's seven-day peak RPD, 6/500,
alongside the Free tier and RPM/TPM observations above. These are historical
peaks, not live remaining counters. The existing configuration was changed to
the supported `gemini-3.5-flash-lite`; no other settings or budget were reset.

Native cron job 4 ran once (run 2356) and removed itself. The Daily function
claimed attempt 3 at 16:15:09.889860 UTC and finished at 16:15:12.902258 UTC with
`Gemini rejected generation (HTTP 400)`. Its outer HTTP response was 409
(pg_net response 2358), not a successful content response. Zero exercises
persisted; both published banks remained at revision 1. The lease cleared and
the cooldown moved to 16 October 16:15:12 UTC. The three-attempt cap remains
exhausted; no retry, reset, editorial approval or publication followed.

Investigation found that both direct REST generators sent lowercase `low` for
`thinkingConfig.thinkingLevel`. Google's public v1beta discovery document
(revision `20261015`) specifies `LOW` in the ThinkingLevel enum. Both requests
now send that documented value; the existing workflow tests inspect the actual
request bodies, and the Daily check failed on the old lowercase value before
the correction. No SDK, new provider path or additional generation is added.

References: [REST discovery](https://generativelanguage.googleapis.com/$discovery/rest?version=v1beta)
and [ThinkingConfig](https://ai.google.dev/api/generate-content#ThinkingConfig).
The original provider error body was discarded by the existing handler, so this
contract correction does **not** prove the cause of HTTP 400 or establish a
successful provider response. The original Daily row remains Stage 1 and the
score remains 33/42 pending genuine regeneration and editorial/public evidence.
