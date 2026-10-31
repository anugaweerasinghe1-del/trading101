/** Preserve the actual HTTP cause without echoing secrets, email content or provider payloads. */
export function newsletterAdminError(status: number | undefined, remote?: string | null): string {
  if (status === 401) return "Incorrect TradeHQ admin master key. Use the SAME master key you enter at the main Admin Dashboard (not your website login password).";
  if (status === 403) return "This administrator action is not permitted.";
  if (status === 429) return "Too many unlock attempts. Please try again after a short break.";
  if (status === 503) return "The private newsletter service is temporarily unavailable or its admin key is not configured. Other admin pages should still work.";
  if (status === 404) return "The newsletter service could not be found. Check the deployment.";
  if (status && status >= 500) return "Newsletter service error (HTTP " + status + "). Your draft has not been sent.";
  if (status) return "Newsletter request was rejected (HTTP " + status + ").";
  if (remote === "Unauthorized" || remote === "Incorrect TradeHQ admin master key.") return "Incorrect TradeHQ admin master key. Use the same key as the Admin Dashboard.";
  return "Could not connect to the newsletter service. Check your connection and retry.";
}
