/** The Supabase Functions client reports non-2xx responses as an Error
 * with the Response in .context. Reveal only documented, bounded denial codes
 * from a genuine HTTP 4xx. Never expose arbitrary function error bodies.
 */
const permittedCodes: Record<number, readonly string[]> = {
  400: ["invalid_request", "invalid_answers", "invalid_awards"],
  401: ["unauthenticated"],
  404: ["not_found"],
  409: [
    "attempt_expired_or_used", "requires_scored_arena", "requires_first_miss",
    "confirm_account_first", "make_profile_public_first", "award_not_earned",
  ],
  413: ["too_large"],
  429: ["rate_limited"],
};
export async function trophyDeniedStatus(error: unknown): Promise<string | null> {
  if (!error || typeof error !== "object" || !("context" in error) ||
      typeof Response === "undefined") return null;
  const response = (error as { context?: unknown }).context;
  if (!(response instanceof Response) || !Object.prototype.hasOwnProperty.call(permittedCodes,response.status))
    return null;
  try {
    const body: unknown = await response.clone().json();
    if (!body || typeof body !== "object" || Array.isArray(body)) return null;
    const code = (body as Record<string, unknown>).status;
    return typeof code === "string" && permittedCodes[response.status].includes(code) ? code : null;
  } catch {
    return null;
  }
}
