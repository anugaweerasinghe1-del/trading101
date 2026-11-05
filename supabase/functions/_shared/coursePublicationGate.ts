/**
 * Publication checks are intentionally independent of the editable admin form.
 * This module never publishes, calls a model, or reads credentials on its own.
 */
export function stableCourseJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return "[" + value.map(stableCourseJson).join(",") + "]";
  const record = value as Record<string, unknown>;
  return "{" + Object.keys(record).filter(key => record[key] !== undefined).sort()
    .map(key => JSON.stringify(key) + ":" + stableCourseJson(record[key])).join(",") + "}";
}

export async function courseReviewDigest(document: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(stableCourseJson(document));
  const hash = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
  return Array.from(hash, b => b.toString(16).padStart(2, "0")).join("");
}

export async function requireExactRevisionReview(
  document: unknown,
  research: unknown,
  independentlyReview: (document: unknown) => Promise<void>,
): Promise<"original_review_verified" | "fresh_review_passed"> {
  const currentDigest = await courseReviewDigest(document);
  const evidence = research && typeof research === "object" && !Array.isArray(research)
    ? research as Record<string, unknown> : null;
  if (evidence?.independentReviewStatus === "PASS" && evidence?.independentReviewDigest === currentDigest)
    return "original_review_verified";
  // Edited, preexisting, or unverifiable research MUST receive new independent
  // critical assessment before publication. Any error or quota outage aborts.
  await independentlyReview(document);
  return "fresh_review_passed";
}

export async function verifyCoursePublicationOwner(
  request: Request,
  expectedOwnerId: string | undefined,
  resolveAuthenticatedUser: (jwt: string) => Promise<string | null>,
): Promise<boolean> {
  if (!expectedOwnerId || !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(expectedOwnerId))
    return false;
  const auth = request.headers.get("authorization") ?? "";
  const match = /^Bearer ([A-Za-z0-9_.-]{20,8192})$/.exec(auth);
  if (!match) return false;
  try {
    // This must call Supabase Auth getUser(jwt) server-side, not decode a token,
    // trust user_metadata, or inspect client-provided display names.
    const identified = await resolveAuthenticatedUser(match[1]);
    return identified === expectedOwnerId;
  } catch { return false; }
}
