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
