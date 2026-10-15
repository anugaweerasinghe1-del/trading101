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
