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
  const { status, code, reason } = await adminFailureDetails(error, data);
  if (status === 401) return 'The admin master key was rejected. Lock this desk and unlock with the current key.';
  if (status === 403) return 'This action requires the registered owner’s current website login alongside the admin key. No publication was authorized.';
  if (status === 429) return 'The service is rate-limited. Wait before trying again; no automatic retry was made.';
  if (status === 409) {
    if (code === 'COURSE_REVIEW_CONFIG' || reason.startsWith('Course publication configuration'))
      return 'Publication is blocked because the server’s free review model is not configured. Your draft is preserved; refreshing cannot fix this configuration.';
    if (code === 'COURSE_SOURCES_UNAVAILABLE' || reason.startsWith('Too few verified sources'))
      return 'Publication is blocked because too few reference sources could be read. Your draft is preserved; check source availability before retrying.';
    if (code === 'COURSE_VALIDATION' || reason.startsWith('Course is incomplete'))
      return 'The saved draft failed the server’s content checks. Publication is blocked. Reopen the latest draft and resolve its validation issues before publishing.';
    if (code === 'COURSE_REVIEW_BLOCKED' || reason.startsWith('Independent course quality review'))
      return 'The independent content review rejected this revision. Nothing was published. Keep the draft private and investigate the review before retrying.';
    if (code === 'COURSE_REVIEW_QUOTA' || reason.startsWith('Free AI quota'))
      return 'The free review service has exhausted its quota. Publication is blocked. Keep the draft private and wait for quota recovery; no paid fallback was used.';
    if (code === 'COURSE_REVIEW_UNAVAILABLE' || reason.startsWith('Independent course review')) {
      const httpStatus = reason.match(/\(HTTP ([45]\d{2})\)/)?.[1];
      return 'The independent review service ' + (httpStatus ? 'returned HTTP ' + httpStatus : 'is unavailable or returned an invalid response')
        + '. Publication is blocked. Keep the draft private and check the configured model and service before retrying.';
    }
    if (code === 'COURSE_CHANGED' || reason.startsWith('Course changed'))
      return 'The saved revision changed. Refresh and reopen the latest revision before retrying. Your local edits are preserved.';
    return 'The server could not complete this action. Your local edits are preserved. Check the saved state and server diagnostics before retrying.';
  }
  if (status === 400 || status === 413 || status === 422)
    return 'The draft or settings failed validation. Check required fields, sources and answers before retrying.';
  return 'The service could not confirm this request. Refresh to check the saved state before retrying; do not repeat a publication or generation blindly.';
}
