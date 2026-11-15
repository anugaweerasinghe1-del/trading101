/** Bounded reviewer feedback, never the provider envelope, prompt or credentials. */
export function readCourseReviewFindings(value: unknown): string[] {
  if (!Array.isArray(value) || value.length > 8 || value.some(v => typeof v !== "string" || !v.trim() || v.length > 600)) return [];
  return value.map(v => v.replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/AIza[A-Za-z0-9_-]{30,}|Bearer\s+[A-Za-z0-9_.-]+|eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+|sb_secret_[A-Za-z0-9_-]{8,}/gi, "[credential redacted]")
    .trim()).filter(Boolean);
}

export class CourseReviewBlockedError extends Error {
  readonly findings: string[];
  constructor(findings: string[]) {
    super("Independent course quality review blocked this draft. No publication or approval request was created.");
    this.name = "CourseReviewBlockedError";
    this.findings = readCourseReviewFindings(findings);
  }
}

export const reviewFailureCodes = ["REQUEST_FAILED", "REQUEST_TIMEOUT", "HTTP_ERROR", "READ_FAILED", "INVALID_ENVELOPE", "NO_CANDIDATE", "OUTPUT_TRUNCATED", "PROVIDER_BLOCKED", "INCOMPLETE_RESPONSE", "INVALID_JSON", "MISSING_DECISION", "INVALID_VERDICT", "INVALID_FINDINGS", "PASS_WITH_FINDINGS", "BLOCK_WITHOUT_FINDINGS"] as const;
export interface CourseReviewDiagnostics {
  code: typeof reviewFailureCodes[number];
  httpStatus?: number;
  finishReason?: "STOP" | "MAX_TOKENS" | "SAFETY" | "RECITATION" | "OTHER";
  outputCharacters?: number;
  findingCount?: number;
  inputTokens?: number;
  outputTokens?: number;
}
export function readCourseReviewDiagnostics(value: unknown): CourseReviewDiagnostics | null {
  if (!value || typeof value !== "object") return null;
  const input = value as Record<string, unknown>;
  if (!reviewFailureCodes.includes(input.code as CourseReviewDiagnostics["code"])) return null;
  const result: CourseReviewDiagnostics = { code: input.code as CourseReviewDiagnostics["code"] };
  for (const key of ["httpStatus", "outputCharacters", "findingCount", "inputTokens", "outputTokens"] as const) {
    const n = input[key];
    if (typeof n === "number" && Number.isSafeInteger(n) && n >= 0 && n <= 1e9
      && (key !== "httpStatus" || (n >= 100 && n <= 599))) result[key] = n;
  }
  if (typeof input.finishReason === "string" && ["STOP", "MAX_TOKENS", "SAFETY", "RECITATION", "OTHER"].includes(input.finishReason))
    result.finishReason = input.finishReason as CourseReviewDiagnostics["finishReason"];
  return result;
}
export class CourseReviewResponseError extends Error {
  readonly diagnostics: CourseReviewDiagnostics;
  constructor(diagnostics: CourseReviewDiagnostics) {
    super("Independent course review unavailable. Draft withheld" + (diagnostics.httpStatus ? " (HTTP " + diagnostics.httpStatus + ")" : "") + ".");
    this.name = "CourseReviewResponseError";
    this.diagnostics = readCourseReviewDiagnostics(diagnostics)!;
  }
}
