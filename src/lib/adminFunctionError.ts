/** Read only bounded, structured failure metadata; never display raw provider payloads. */
export async function adminFailureDetails(error: unknown, data?: unknown): Promise<{ status?: number; code: string; reason: string }> {
  const context = (error as { context?: Response } | null)?.context;
  let body = data as { code?: unknown; error?: unknown } | null;
  if (context && typeof context.clone === 'function') {
    try {
      const raw = await context.clone().text();
      if (raw.length <= 8192) body = JSON.parse(raw);
    } catch { /* A transport error may have no JSON body. */ }
  }
  return { status: context?.status,
    code: typeof body?.code === 'string' ? body.code : '',
    reason: typeof body?.error === 'string' ? body.error : '' };
}

export async function courseAdminError(error: unknown, data?: unknown): Promise<string> {
  const { status, reason } = await adminFailureDetails(error, data);
  if (status === 401) return 'The admin master key was rejected. Lock this desk and unlock with the current key.';
  if (status === 403) return 'This action requires the registered owner’s current website login alongside the admin key. No publication was authorized.';
  if (status === 429) return 'The service is rate-limited. Wait before trying again; no automatic retry was made.';
  if (status === 409) {
    if (/^(Independent course review|Free AI quota|Too few verified sources)/.test(reason))
      return 'Independent course review did not pass or its free-tier quota is unavailable. Publication is blocked. Keep the draft private and review its sources before retrying.';
    return 'The saved revision changed or did not pass review. Refresh and reopen the latest revision before retrying. Your local edits are preserved.';
  }
  if (status === 400 || status === 413 || status === 422)
    return 'The draft or settings failed validation. Check required fields, sources and answers before retrying.';
  return 'The service could not confirm this request. Refresh to check the saved state before retrying; do not repeat a publication or generation blindly.';
}
