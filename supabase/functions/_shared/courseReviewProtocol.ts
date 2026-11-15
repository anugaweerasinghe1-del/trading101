import { CourseReviewResponseError, readCourseReviewFindings, type CourseReviewDiagnostics } from "./courseReviewFeedback.ts";
const object = (properties: Record<string, unknown>) => ({ type: "object", properties, required: Object.keys(properties), additionalProperties: false });
const issue = { type: "string", description: "A specific blocking defect, not praise or a completed check. Keep under 600 characters." };
// Gemini documents conditional object schemas using a property-level anyOf.
// The same PASS/empty and BLOCK/nonempty contract is enforced again locally.
export const courseReviewResponseSchema = object({
  decision: {
    description: "PASS has no concerns and an empty findings array. BLOCK contains only specific unresolved concerns.",
    anyOf: [
      object({ verdict: { type: "string", enum: ["PASS"] }, findings: { type: "array", maxItems: 0, items: issue } }),
      object({ verdict: { type: "string", enum: ["BLOCK"] }, findings: { type: "array", minItems: 1, maxItems: 8, items: issue } }),
    ],
  },
});
export function parseCourseReviewResponse(raw: string): { verdict: "PASS" | "BLOCK"; findings: string[] } {
  let envelope: Record<string, unknown>;
  try { const value = JSON.parse(raw); if (!value || typeof value !== "object" || Array.isArray(value)) throw Error(); envelope = value; }
  catch { throw new CourseReviewResponseError({ code: "INVALID_ENVELOPE" }); }
  const usage = envelope.usageMetadata as Record<string, unknown> | undefined;
  const details: Partial<CourseReviewDiagnostics> = {};
  for (const [key, field] of [["inputTokens", "promptTokenCount"], ["outputTokens", "candidatesTokenCount"]] as const)
    if (typeof usage?.[field] === "number" && Number.isSafeInteger(usage[field])) details[key] = usage[field] as number;
  const fail = (code: CourseReviewDiagnostics["code"]): never => { throw new CourseReviewResponseError({ ...details, code }); };
  if (!Array.isArray(envelope.candidates) || !envelope.candidates.length) return fail("NO_CANDIDATE");
  if (envelope.candidates.length !== 1) return fail("INVALID_ENVELOPE");
  const candidate = envelope.candidates[0];
  if (!candidate || typeof candidate !== "object") return fail("NO_CANDIDATE");
  const finish = candidate.finishReason;
  if (["STOP", "MAX_TOKENS", "SAFETY", "RECITATION", "OTHER"].includes(finish)) details.finishReason = finish;
  if (finish === "MAX_TOKENS") return fail("OUTPUT_TRUNCATED");
  if (finish === "SAFETY" || finish === "RECITATION") return fail("PROVIDER_BLOCKED");
  if (finish !== "STOP") return fail("INCOMPLETE_RESPONSE");
  const parts = candidate.content?.parts;
  if (!Array.isArray(parts) || parts.some(p => !p || typeof p !== "object" || (p.text !== undefined && typeof p.text !== "string"))) return fail("INVALID_ENVELOPE");
  const output = parts.filter(p => !p.thought).map(p => p.text ?? "").join("");
  details.outputCharacters = output.length;
  let value: unknown;
  try { value = JSON.parse(output); } catch { return fail("INVALID_JSON"); }
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.keys(value).length !== 1 || !("decision" in value)) return fail("MISSING_DECISION");
  const decision = value.decision;
  if (!decision || typeof decision !== "object" || Array.isArray(decision) || Object.keys(decision).some(k => !["verdict", "findings"].includes(k))) return fail("INVALID_VERDICT");
  const result = decision as { verdict?: unknown; findings?: unknown };
  if (result.verdict !== "PASS" && result.verdict !== "BLOCK") return fail("INVALID_VERDICT");
  if (!Array.isArray(result.findings)) return fail("INVALID_FINDINGS");
  details.findingCount = result.findings.length;
  if (result.verdict === "PASS" && result.findings.length) return fail("PASS_WITH_FINDINGS");
  if (result.verdict === "BLOCK" && !result.findings.length) return fail("BLOCK_WITHOUT_FINDINGS");
  const findings = readCourseReviewFindings(result.findings);
  if (findings.length !== result.findings.length) return fail("INVALID_FINDINGS");
  return { verdict: result.verdict, findings };
}
